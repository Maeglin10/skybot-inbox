import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Channel } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { parseWhatsAppCloudWebhook } from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleWhatsAppWebhook(body: WhatsAppCloudWebhook) {
    const events = parseWhatsAppCloudWebhook(body);
    this.logger.log(`events=${events.length}`);

    if (events.length === 0) return { ok: true, stored: 0 };

    const account = await this.prisma.account.findFirst({
      where: { name: 'Demo' },
    });
    if (!account) throw new Error('Account Demo missing (run seed)');

    const inboxExternalId = events[0]?.inboxExternalId ?? 'demo-whatsapp';

    const inbox = await this.prisma.inbox.findFirst({
      where: { accountId: account.id, externalId: inboxExternalId },
    });
    if (!inbox) throw new Error(`Inbox ${inboxExternalId} missing`);

    // règle: canal = inbox.channel
    const inboxChannel = inbox.channel ?? Channel.WHATSAPP;

    let stored = 0;

    for (const ev of events) {
      const didStore = await this.prisma.$transaction(
        async (
          tx: Omit<
            PrismaClient,
            '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
          >,
        ) => {
          // 1) contact upsert
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

          // 2) conversation find/create
          let conversation = await tx.conversation.findFirst({
            where: { inboxId: inbox.id, contactId: contact.id },
            orderBy: { createdAt: 'desc' },
          });

          if (!conversation) {
            conversation = await tx.conversation.create({
              data: {
                inboxId: inbox.id,
                contactId: contact.id,
                channel: inboxChannel,
                status: 'OPEN',
                lastActivityAt: new Date(),
              },
            });

            this.logger.log(
              `conversation:create inbox=${inbox.externalId} contact=${contact.phone}`,
            );
          }

          // 3) message create (idempotent)
          const externalId = ev.providerMessageId ?? null;

          try {
            const message = await tx.message.create({
              data: {
                conversationId: conversation.id,
                channel: conversation.channel, // REQUIRED
                externalId,
                direction: 'IN',
                from: ev.phone,
                to: inbox.externalId ?? null,
                text: ev.text ?? null,
                timestamp: ev.sentAt ? new Date(ev.sentAt) : new Date(),
              },
            });

            // 4) update conversation
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
