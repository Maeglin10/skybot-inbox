import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { parseWhatsAppCloudWebhook } from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleWhatsAppWebhook(body: WhatsAppCloudWebhook) {
    const events = parseWhatsAppCloudWebhook(body);

    // LOG 1 — nombre d’événements reçus
    this.logger.log(`events=${events.length}`);

    if (events.length === 0) {
      return { ok: true, stored: 0 };
    }

    const account = await this.prisma.account.findFirst({
      where: { name: 'Demo' },
    });
    if (!account) throw new Error('Account Demo missing (run seed)');

    const inboxExternalId = events[0]?.inboxExternalId ?? 'demo-inbox';
    const inbox = await this.prisma.inbox.findFirst({
      where: { accountId: account.id, externalId: inboxExternalId },
    });
    if (!inbox) throw new Error(`Inbox ${inboxExternalId} missing`);

    let stored = 0;

    for (const ev of events) {
      const didStore = await this.prisma.$transaction(async (tx) => {
        // 1) Contact upsert
        const contact = await tx.contact.upsert({
          where: {
            inboxId_phone: {
              inboxId: inbox.id,
              phone: ev.phone,
            },
          },
          update: {
            name: ev.contactName ?? undefined,
          },
          create: {
            accountId: account.id,
            inboxId: inbox.id,
            phone: ev.phone,
            name: ev.contactName ?? null,
          },
        });

        // 2) Conversation find/create
        let conversation = await tx.conversation.findFirst({
          where: { inboxId: inbox.id, contactId: contact.id },
          orderBy: { createdAt: 'desc' },
        });

        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              inboxId: inbox.id,
              contactId: contact.id,
              status: 'OPEN',
              lastActivityAt: new Date(),
            },
          });

          // LOG 2 — conversation créée
          this.logger.log(
            `conversation:create inbox=${inbox.externalId} contact=${contact.phone}`,
          );
        }

        // 3) DEDUPE
        if (ev.providerMessageId) {
          const existing = await tx.message.findFirst({
            where: {
              conversationId: conversation.id,
              externalId: ev.providerMessageId,
            },
            select: { id: true },
          });

          if (existing) {
            // LOG 3 — déduplication
            this.logger.debug(
              `dedupe externalId=${ev.providerMessageId} conv=${conversation.id}`,
            );
            return false;
          }
        }

        // 4) Create message
        const message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            externalId: ev.providerMessageId ?? null,
            direction: 'IN',
            from: ev.phone,
            to: inbox.externalId ?? null,
            text: ev.text ?? null,
            timestamp: ev.sentAt ? new Date(ev.sentAt) : new Date(),
          },
        });

        // 5) Update conversation (reopen si CLOSED)
        if (conversation.status === 'CLOSED') {
          this.logger.log(`conversation:reopen id=${conversation.id}`);
        }

        await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            lastActivityAt: message.createdAt,
            ...(conversation.status === 'CLOSED' ? { status: 'OPEN' } : {}),
          },
        });

        return true;
      });

      if (didStore) stored += 1;
    }

    return { ok: true, stored };
  }
}
