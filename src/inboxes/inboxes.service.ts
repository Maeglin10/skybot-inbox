import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Channel } from '../prisma';

interface Inbox {
  id: string;
  accountId: string;
  externalId: string;
  name: string;
  channel: Channel;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InboxesService {
  constructor(private readonly prisma: PrismaService) {}

  async listInboxes(params: { accountId: string; channel?: Channel }) {
    const { accountId, channel } = params;
    return this.prisma.inbox.findMany({
      where: {
        accountId,
        ...(channel ? { channel } : {}),
      },
      orderBy: [{ channel: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getDefaultInbox(params: { accountId: string; channel: Channel }) {
    const { accountId, channel } = params;

    const inbox = await this.prisma.inbox.findFirst({
      where: { accountId, channel },
      orderBy: { createdAt: 'asc' },
    });

    if (!inbox) {
      throw new NotFoundException(
        `No inbox for account=${accountId} channel=${channel}`,
      );
    }

    return inbox;
  }

  async resolveInbox(params: {
    accountId: string;
    channel: Channel;
    inboxExternalId?: string;
    inboxId?: string;
  }): Promise<Inbox> {
    const { accountId, channel, inboxExternalId, inboxId } = params;

    if (inboxId) {
      const inbox = await this.prisma.inbox.findFirst({
        where: { id: inboxId, accountId },
      });
      if (!inbox) throw new NotFoundException('Inbox not found');
      return inbox;
    }

    if (inboxExternalId) {
      const inbox = await this.prisma.inbox.findFirst({
        where: {
          accountId,
          channel,
          externalId: inboxExternalId,
        },
      });
      if (inbox) return inbox;
    }

    return this.getDefaultInbox({ accountId, channel });
  }
}
