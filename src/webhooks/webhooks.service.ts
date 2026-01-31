import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// GoodLife WhatsApp Integration - Updated 2026-01-30
// Helper to check for Prisma unique constraint violation
function isPrismaUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2002'
  );
}
import { ClientsService } from '../clients/clients.service';
import { AgentsService } from '../agents/agents.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { MessagesService } from '../messages/messages.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { parseWhatsAppCloudWebhook } from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private demoAccountIdCache: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly agents: AgentsService,
    private readonly whatsapp: WhatsAppService,
    private readonly messages: MessagesService,
  ) {}

  async handleWhatsAppWebhook(body: WhatsAppCloudWebhook) {
    this.logger.log(`📥 Webhook payload: ${JSON.stringify(body, null, 2)}`);
    const events = parseWhatsAppCloudWebhook(body);
    this.logger.log(`🚀 GOODLIFE-FIXED-VERSION-2026-01-30-18h30 events=${events.length}`);

    if (events.length === 0) return { ok: true, stored: 0 };

    let stored = 0;

    for (const ev of events) {
      // Meta phone_number_id (mapping ExternalAccount.externalId) = inboxExternalId
      const externalAccountId = ev.inboxExternalId ?? 'demo-whatsapp';
      const channel = 'WHATSAPP' as const;

      // Resolve accountId from ExternalAccount (by phone_number_id)
      let accountId: string;
      let clientKey = 'demo';

      try {
        // Find ExternalAccount by channel + externalId to get the correct accountId
        this.logger.log(
          `🔍 SEARCHING ExternalAccount: channel=${channel} externalId=${externalAccountId}`,
        );
        const externalAccount = await this.prisma.externalAccount.findFirst({
          where: {
            channel,
            externalId: externalAccountId,
            isActive: true,
          },
        });

        if (externalAccount) {
          accountId = externalAccount.accountId;
          clientKey = externalAccount.clientKey;
          this.logger.log(
            `Resolved accountId=${accountId} clientKey=${clientKey} for phone_number_id=${externalAccountId}`,
          );
        } else {
          // Fallback to Demo account
          accountId = await this.getDemoAccountId();
          this.logger.warn(
            `No ExternalAccount found for ${externalAccountId}, using Demo account`,
          );
        }
      } catch (resolveErr) {
        // Fallback to Demo account in case of error
        accountId = await this.getDemoAccountId();
        this.logger.warn(
          `ExternalAccount resolution failed for ${externalAccountId}, using Demo account: ${resolveErr instanceof Error ? resolveErr.message : String(resolveErr)}`,
        );
      }

      const requestId = `wa_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const startedAt = Date.now();

      // RoutingLog: RECEIVED
      const routingLog = await this.prisma.routingLog.create({
        data: {
          account: { connect: { id: accountId } },
          requestId,
          clientKey,
          agentKey: 'master-router',
          channel,
          externalAccountId,
          status: 'RECEIVED',
          source: 'whatsapp_webhook',
        },
      });

      try {
        const txResult = await this.prisma.$transaction(async (tx) => {
          // 1) inbox (externalId = phone_number_id)
          const inbox = await tx.inbox.upsert({
            where: {
              accountId_externalId: {
                accountId,
                externalId: externalAccountId,
              },
            },
            update: { channel, name: `WhatsApp ${externalAccountId}` },
            create: {
              accountId,
              externalId: externalAccountId,
              name: `WhatsApp ${externalAccountId}`,
              channel,
            },
          });

          // 2) contact upsert
          const contact = await tx.contact.upsert({
            where: { inboxId_phone: { inboxId: inbox.id, phone: ev.phone } },
            update: { name: ev.contactName ?? undefined },
            create: {
              accountId,
              inboxId: inbox.id,
              phone: ev.phone,
              name: ev.contactName ?? null,
            },
          });

          // 3) conversation find/create (simple: 1 conversation active par contact+inbox)
          let conversation = await tx.conversation.findFirst({
            where: { inboxId: inbox.id, contactId: contact.id },
            orderBy: { createdAt: 'desc' },
          });

          if (!conversation) {
            conversation = await tx.conversation.create({
              data: {
                inboxId: inbox.id,
                contactId: contact.id,
                channel,
                status: 'OPEN',
                lastActivityAt: new Date(),
              },
            });
          }

          // 4) message create idempotent (dedupe sur providerMessageId)
          const externalId = ev.providerMessageId ?? null;

          try {
            const message = await tx.message.create({
              data: {
                conversationId: conversation.id,
                channel,
                externalId,
                direction: 'IN',
                from: ev.phone,
                to: inbox.externalId,
                text: ev.text ?? null,
                timestamp: ev.sentAt ? new Date(ev.sentAt) : new Date(),
              },
            });

            // update conv
            await tx.conversation.update({
              where: { id: conversation.id },
              data: {
                lastActivityAt: message.createdAt,
                status: 'OPEN',
              },
            });

            // routinglog conversationId
            await tx.routingLog.update({
              where: { id: routingLog.id },
              data: { conversationId: conversation.id },
            });

            // Retourne les données nécessaires pour trigger n8n après la transaction
            return {
              stored: true,
              triggerData: {
                requestId,
                conversationId: conversation.id,
                messageId: message.id,
                agentKey: 'master-router',
                inputText: ev.text ?? '',
                userPhone: ev.phone,
                userName: ev.contactName ?? '',
              },
            };
          } catch (e: unknown) {
            if (isPrismaUniqueConstraintError(e) && externalId) {
              this.logger.debug(`dedupe externalId=${externalId}`);
              return { stored: false, triggerData: null };
            }
            throw e;
          }
        });

        if (txResult.stored) {
          stored += 1;

          // Trigger n8n APRÈS la transaction (synchrone, pas fire-and-forget)
          if (txResult.triggerData) {
            try {
              const n8nResponse = await this.agents.trigger(txResult.triggerData);

              // Extract message text from N8N response (supports multiple formats)
              const responseText = n8nResponse?.message || n8nResponse?.replyText;

              // Si N8N renvoie une réponse à envoyer
              if (responseText) {
                this.logger.log('N8N returned response, sending via WhatsApp', {
                  conversationId: txResult.triggerData.conversationId,
                  messageId: txResult.triggerData.messageId,
                  responseLength: responseText.length,
                  format: n8nResponse?.message ? 'message' : 'replyText',
                });

                // 1. Envoyer via WhatsApp API
                const whatsappResult = await this.whatsapp.sendTextMessage({
                  to: ev.phone,
                  text: responseText,
                  conversationId: txResult.triggerData.conversationId,
                  messageId: txResult.triggerData.messageId,
                });

                // 2. Stocker le message sortant dans DB
                if (whatsappResult.success) {
                  await this.messages.send({
                    accountId,
                    conversationId: txResult.triggerData.conversationId,
                    text: responseText,
                    externalId: whatsappResult.messageId,
                  });

                  this.logger.log('Response sent and stored successfully', {
                    conversationId: txResult.triggerData.conversationId,
                    whatsappMessageId: whatsappResult.messageId,
                  });
                } else {
                  this.logger.error('Failed to send WhatsApp message', {
                    conversationId: txResult.triggerData.conversationId,
                    error: whatsappResult.error,
                  });
                }
              } else {
                this.logger.log('N8N did not return a message to send', {
                  n8nResponseKeys: Object.keys(n8nResponse || {}),
                });
              }
            } catch (triggerErr) {
              // Log l'erreur mais ne fait pas échouer le webhook
              // Le message est déjà stocké, n8n sera retry plus tard si besoin
              this.logger.error(
                `n8n trigger failed for message ${txResult.triggerData.messageId}: ${triggerErr instanceof Error ? triggerErr.message : String(triggerErr)}`,
              );
            }
          }
        }

        await this.prisma.routingLog.update({
          where: { id: routingLog.id },
          data: {
            status: 'FORWARDED',
            latencyMs: Date.now() - startedAt,
          },
        });
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);

        await this.prisma.routingLog.update({
          where: { id: routingLog.id },
          data: {
            status: 'FAILED',
            latencyMs: Date.now() - startedAt,
            error: msg.slice(0, 1000),
          },
        });

        this.logger.error(msg);
      }
    }

    return { ok: true, stored };
  }

  private async getDemoAccountId() {
    // Return cached value if available
    if (this.demoAccountIdCache) {
      return this.demoAccountIdCache;
    }

    // Query DB and cache result
    const account = await this.prisma.account.findFirst({
      where: { name: 'Demo' },
    });
    if (!account) throw new Error('Account Demo missing (run seed)');

    this.demoAccountIdCache = account.id;
    return account.id;
  }

  /**
   * Handle conversation update from N8N
   * N8N sends both incoming and outgoing messages after processing
   */
  async handleN8NConversationUpdate(body: {
    phone: string;
    userName?: string;
    conversationId: string | null;
    requestId: string;
    clientKey: string;
    phoneNumberId?: string;
    incomingMessage: {
      text: string;
      timestamp: string;
      externalId: string;
    };
    outgoingMessage: {
      text: string;
      timestamp: string;
    };
  }) {
    this.logger.log('[N8N-UPDATE] Processing conversation update', {
      conversationId: body.conversationId,
      requestId: body.requestId,
      clientKey: body.clientKey,
    });

    // Get or create conversation
    let conversation;

    if (body.conversationId) {
      // Try to find existing conversation
      conversation = await this.prisma.conversation.findUnique({
        where: { id: body.conversationId },
        include: {
          inbox: true,
          contact: true,
        },
      });
    }

    if (!conversation) {
      // Create conversation if not exists
      this.logger.log('[N8N-UPDATE] Creating new conversation', {
        phone: body.phone,
        clientKey: body.clientKey,
      });

      // Get or create account
      const accountId = await this.getDemoAccountId(); // For now, use Demo account

      // Get or create inbox (by phoneNumberId or default)
      const phoneNumberId = body.phoneNumberId || 'n8n-whatsapp';
      const inbox = await this.prisma.inbox.upsert({
        where: {
          accountId_externalId: {
            accountId,
            externalId: phoneNumberId,
          },
        },
        update: {},
        create: {
          accountId,
          externalId: phoneNumberId,
          name: `WhatsApp ${phoneNumberId}`,
          channel: 'WHATSAPP',
        },
      });

      // Get or create contact
      const contact = await this.prisma.contact.upsert({
        where: { inboxId_phone: { inboxId: inbox.id, phone: body.phone } },
        update: { name: body.userName || undefined },
        create: {
          accountId,
          inboxId: inbox.id,
          phone: body.phone,
          name: body.userName || null,
        },
      });

      // Create conversation
      conversation = await this.prisma.conversation.create({
        data: {
          inboxId: inbox.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
        include: {
          inbox: true,
          contact: true,
        },
      });

      this.logger.log('[N8N-UPDATE] Conversation created', {
        conversationId: conversation.id,
      });
    }

    const channel = conversation!.channel ?? conversation!.inbox.channel ?? 'WHATSAPP';

    // Create incoming message (if not already created by webhook)
    // Note: Check if message with this externalId already exists
    const existingIncoming = await this.prisma.message.findFirst({
      where: {
        externalId: body.incomingMessage.externalId,
        channel
      },
    });

    if (!existingIncoming) {
      this.logger.log('[N8N-UPDATE] Creating incoming message', {
        externalId: body.incomingMessage.externalId,
      });

      await this.prisma.message.create({
        data: {
          conversationId: conversation!.id,
          channel,
          externalId: body.incomingMessage.externalId,
          direction: 'IN',
          from: body.phone,
          to: conversation!.inbox.externalId ?? null,
          text: body.incomingMessage.text,
          timestamp: new Date(body.incomingMessage.timestamp),
        },
      });
    } else {
      this.logger.debug('[N8N-UPDATE] Incoming message already exists', {
        externalId: body.incomingMessage.externalId,
      });
    }

    // Create outgoing message
    this.logger.log('[N8N-UPDATE] Creating outgoing message', {
      conversationId: body.conversationId,
      textLength: body.outgoingMessage.text.length,
    });

    const outgoingMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation!.id,
        channel,
        externalId: null, // N8N should provide WhatsApp message ID later
        direction: 'OUT',
        from: conversation!.inbox.externalId ?? null,
        to: body.phone,
        text: body.outgoingMessage.text,
        timestamp: new Date(body.outgoingMessage.timestamp),
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation!.id },
      data: {
        lastActivityAt: outgoingMessage.createdAt,
        status: 'OPEN',
      },
    });

    this.logger.log('[N8N-UPDATE] Conversation update complete', {
      conversationId: conversation!.id,
      incomingMessageId: existingIncoming?.id,
      outgoingMessageId: outgoingMessage.id,
    });

    return {
      success: true,
      incomingMessageId: existingIncoming?.id,
      outgoingMessageId: outgoingMessage.id,
    };
  }
}
