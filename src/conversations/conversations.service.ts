import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ConversationStatus, Prisma } from '@prisma/client';

export type ConversationStatusT = ConversationStatus;

function parseCursor(cursor?: string): Date | null {
  if (!cursor) return null;
  const d = new Date(cursor);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseChannel(channel?: string): Channel | undefined {
  if (!channel) return undefined;
  const v = channel.trim().toUpperCase();
  if (
    v === 'WHATSAPP' ||
    v === 'INSTAGRAM' ||
    v === 'FACEBOOK' ||
    v === 'EMAIL' ||
    v === 'WEB'
  ) {
    return v as Channel;
  }
  return undefined;
}

type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    inbox: true;
    contact: true;
    messages: {
      orderBy: { createdAt: 'desc' };
      take: 1;
      select: { text: true; timestamp: true };
    };
  };
}>;

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: ConversationStatus;
    inboxId?: string;
    channel?: string;
    limit?: number;
    cursor?: string;
    lite?: boolean;
  }) {
    const { status, inboxId, limit = 20, cursor, lite, channel } = params;

    const take = Math.min(Math.max(limit, 1), 100);
    const cursorDate = parseCursor(cursor);
    const ch = parseChannel(channel);

    const where: Prisma.ConversationWhereInput = {
      ...(status ? { status } : {}),
      ...(inboxId ? { inboxId } : {}),
      ...(ch ? { channel: ch } : {}),
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    };

    const rows: ConversationWithRelations[] =
      await this.prisma.conversation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        include: {
          inbox: true,
          contact: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { text: true, timestamp: true },
          },
        },
      });

    const hasMore = rows.length > take;
    const slice = hasMore ? rows.slice(0, take) : rows;

    const nextCursor =
      hasMore && slice.length
        ? slice[slice.length - 1]?.createdAt.toISOString()
        : null;

    if (lite) {
      const items = slice.map((c) => {
        const last = c.messages[0] ?? null;
        return {
          id: c.id,
          inboxId: c.inboxId,
          contactId: c.contactId,
          channel: c.channel,
          status: c.status,
          lastActivityAt: c.lastActivityAt,
          createdAt: c.createdAt,
          contact: {
            id: c.contact.id,
            name: c.contact.name,
            phone: c.contact.phone,
          },
          preview: last
            ? { text: last.text ?? '', timestamp: last.timestamp.toISOString() }
            : null,
        };
      });

      return { items, cursor: nextCursor };
    }

    const items = await Promise.all(
      slice.map(async (c) => {
        const messages = await this.prisma.message.findMany({
          where: { conversationId: c.id },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });

        return {
          id: c.id,
          inboxId: c.inboxId,
          contactId: c.contactId,
          channel: c.channel,
          externalId: c.externalId,
          status: c.status,
          lastActivityAt: c.lastActivityAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          inbox: c.inbox,
          contact: c.contact,
          messages,
        };
      }),
    );

    return { items, cursor: nextCursor };
  }

  async findOne(id: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        inbox: true,
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!convo) throw new NotFoundException('Conversation not found');
    return convo;
  }

  async updateStatus(id: string, status: ConversationStatus) {
    const convo = await this.prisma.conversation.update({
      where: { id },
      data: { status },
      include: { inbox: true, contact: true },
    });

    return convo;
  }

  async listMessages(id: string, params: { limit?: number; cursor?: string }) {
    const { limit = 20, cursor } = params;

    const take = Math.min(Math.max(limit, 1), 100);
    const cursorDate = parseCursor(cursor);

    const where: Prisma.MessageWhereInput = {
      conversationId: id,
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    });

    const hasMore = rows.length > take;
    const slice = hasMore ? rows.slice(0, take) : rows;

    const nextCursor =
      hasMore && slice.length
        ? slice[slice.length - 1]?.createdAt.toISOString()
        : null;

    return { items: slice, cursor: nextCursor };
  }
}
