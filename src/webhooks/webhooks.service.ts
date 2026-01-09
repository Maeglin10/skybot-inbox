import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Channel } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
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

    // DEV: compte Demo. En prod tu résous accountId autrement (host/header/subdomain).
    const account = await this.prisma.account.findFirst({
      where: { name: 'Demo' },
    });
    if (!account) throw new Error('Account Demo missing (run seed)');

    let stored = 0;

    for (const ev of events) {
      // 1) resolve clientKey via ExternalAccount mapping
      const channel = Channel.WHATSAPP;
      const externalAccountId = ev.inboxExternalId ?? 'demo-whatsapp'; // phone_number_id Meta

      const cfg = await this.clients.resolveClient({
        accountId: account.id,
        channel,
        externalAccountId,
      });

      // 2) upsert Inbox (externalId = phone_number_id)
      const inbox = await this.prisma.inbox.upsert({
        where: {
          accountId_externalId: {
            accountId: account.id,
            externalId: externalAccountId,
          },
        },
        update: {
          channel,
          name: `Inbox ${cfg.clientKey} WHATSAPP`,
        },
        create: {
          accountId: account.id,
          externalId: externalAccountId,
          channel,
          name: `Inbox ${cfg.clientKey} WHATSAPP`,
        },
      });

      const didStore = await this.prisma.$transaction(
        async (
          tx: Omit<
            PrismaClient,
            '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
          >,
        ) => {
          // 3) contact upsert
          const contact = await tx.contact.upsert({
            where: { inboxId_phone: { inboxId: inbox.id, phone: ev.phone } },
            update: { name: ev.contactName ?? undefined },
            create: {
              accountId: account.id,
              inboxId: inbox.id,
              phone: ev.phone,
              name: ev.contactName ?? null,
            },
          });

          // 4) conversation find/create (1 thread par contact+inbox)
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

            this.logger.log(
              `conversation:create inbox=${inbox.externalId} contact=${contact.phone}`,
            );
          }

          // 5) message create (idempotent)
          const externalId = ev.providerMessageId ?? null;

          try {
            const message = await tx.message.create({
              data: {
                conversationId: conversation.id,
                channel, // IMPORTANT: toujours set
                externalId,
                direction: 'IN',
                from: ev.phone,
                to: inbox.externalId ?? null,
                text: ev.text ?? null,
                timestamp: ev.sentAt ? new Date(ev.sentAt) : new Date(),
              },
            });

            // 6) update conversation activity (+ reopen)
            await tx.conversation.update({
              where: { id: conversation.id },
              data: {
                lastActivityAt: message.createdAt,
                ...(conversation.status === 'CLOSED' ? { status: 'OPEN' } : {}),
              },
            });

            // 7) trigger master-router (n8n) avec payload canonique minimal (via AgentsService)
            await this.agents.trigger({
              conversationId: conversation.id,
              agentKey: cfg.defaultAgentKey ?? 'master-router',
              inputText: ev.text ?? '',
            });

            return true;
          } catch (e: unknown) {
            if (
              e instanceof Prisma.PrismaClientKnownRequestError &&
              e.code === 'P2002' &&
              externalId
            ) {
              this.logger.debug(
                `dedupe externalId=${externalId} conv=${conversation.id}`,
              );
              return false;
            }
            throw e;
          }
        },
      );

      if (didStore) stored += 1;
    }

    return { ok: true, stored };
  }
}
