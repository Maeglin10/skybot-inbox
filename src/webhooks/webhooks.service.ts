import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  ) {}

  async handleWhatsAppWebhook(body: WhatsAppCloudWebhook) {
    const events = parseWhatsAppCloudWebhook(body);
    this.logger.log(`events=${events.length}`);

    if (events.length === 0) return { ok: true, stored: 0 };

    const accountId = await this.getDemoAccountId();

    let stored = 0;

    for (const ev of events) {
      // Meta phone_number_id (mapping ExternalAccount.externalId) = inboxExternalId
      const externalAccountId = ev.inboxExternalId ?? 'demo-whatsapp';
      const channel = 'WHATSAPP' as const;

      // resolve clientKey via ExternalAccount -> ClientConfig
      let clientKey = 'demo';
      try {
        const cfg = await this.clients.resolveClient({
          accountId,
          channel,
          externalAccountId,
        });
        clientKey = cfg.clientKey;
      } catch (resolveErr) {
        // Log l'erreur de résolution client - important pour le debug
        this.logger.warn(
          `Client resolution failed for externalAccountId=${externalAccountId}, using fallback 'demo': ${resolveErr instanceof Error ? resolveErr.message : String(resolveErr)}`,
        );
        clientKey = 'demo';
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
              await this.agents.trigger(txResult.triggerData);
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
}
