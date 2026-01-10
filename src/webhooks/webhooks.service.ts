import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AgentsService } from '../agents/agents.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { parseWhatsAppCloudWebhook } from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

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
      // en dev : si pas trouvé, fallback "demo"
      let clientKey = 'demo';
      try {
        const cfg = await this.clients.resolveClient({
          accountId,
          channel,
          externalAccountId,
        });
        clientKey = cfg.clientKey;
      } catch {
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
        const didStore = await this.prisma.$transaction(async (tx) => {
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

            // trigger n8n (hors tx recommandé)
            setImmediate(() => {
              void this.agents.trigger({
                requestId,
                conversationId: conversation.id,
                messageId: message.id,
                agentKey: 'master-router',
                inputText: ev.text ?? '',
              });
            });

            return true;
          } catch (e: unknown) {
            if (
              e instanceof Prisma.PrismaClientKnownRequestError &&
              e.code === 'P2002' &&
              externalId
            ) {
              this.logger.debug(`dedupe externalId=${externalId}`);
              return false;
            }
            throw e;
          }
        });

        if (didStore) stored += 1;

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
    const account = await this.prisma.account.findFirst({
      where: { name: 'Demo' },
    });
    if (!account) throw new Error('Account Demo missing (run seed)');
    return account.id;
  }
}
