import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import {
  parseWhatsAppCloudWebhook,
  type ParsedIncomingMessage,
} from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWhatsAppWebhook(body: WhatsAppCloudWebhook) {
    const events = parseWhatsAppCloudWebhook(body);
    if (events.length === 0) return { ok: true, stored: 0 };

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
      const contact = await this.prisma.contact.upsert({
        where: { inboxId_phone: { inboxId: inbox.id, phone: ev.phone } },
        update: { name: ev.contactName ?? null },
        create: {
          inboxId: inbox.id,
          phone: ev.phone,
          name: ev.contactName ?? null,
        },
      });

      const conversation =
        (await this.prisma.conversation.findFirst({
          where: { inboxId: inbox.id, contactId: contact.id },
          orderBy: { createdAt: 'desc' },
        })) ??
        (await this.prisma.conversation.create({
          data: {
            inboxId: inbox.id,
            contactId: contact.id,
            status: 'OPEN',
            lastActivityAt: new Date(),
          },
        }));

      await this.prisma.message.create({
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

      stored += 1;
    }

    return { ok: true, stored };
  }
}
