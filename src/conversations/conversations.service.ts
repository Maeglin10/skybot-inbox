import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ConversationStatus, Prisma } from '@prisma/client';
import {
  ConversationNotFoundError,
  ResourceNotOwnedError,
} from '../common/errors/known-error';

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
    accountId: string; // REQUIRED for multi-tenancy
    status?: ConversationStatus;
    inboxId?: string;
    channel?: string;
    limit?: number;
    cursor?: string;
    lite?: boolean;
    corporate?: boolean; // P1: Filter for corporate contacts
  }) {
    const {
      accountId,
      status,
      inboxId,
      limit = 20,
      cursor,
      lite,
      channel,
      corporate,
    } = params;

    const take = Math.min(Math.max(limit, 1), 100);
    const cursorDate = parseCursor(cursor);
    const ch = parseChannel(channel);

    const where: Prisma.ConversationWhereInput = {
      accountId, // CRITICAL: Filter by account to prevent cross-account data leaks
      ...(status ? { status } : {}),
      ...(inboxId ? { inboxId } : {}),
      ...(ch ? { channel: ch } : {}),
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      ...(corporate !== undefined
        ? { contact: { isCorporate: corporate } }
        : {}),
    };

    const rows: ConversationWithRelations[] =
      await this.prisma.conversation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        include: {
          inbox: true,
          contact: true,
          messages: lite
            ? {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { text: true, timestamp: true },
              }
            : {
                orderBy: { createdAt: 'asc' },
                take: 50,
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
            isCorporate: c.contact.isCorporate,
          },
          preview: last
            ? { text: last.text ?? '', timestamp: last.timestamp.toISOString() }
            : null,
        };
      });

      return { items, cursor: nextCursor };
    }

    // Full mode: messages already loaded via include
    const items = slice.map((c) => ({
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
      messages: c.messages,
    }));

    return { items, cursor: nextCursor };
  }

  async findOne(accountId: string, id: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        inbox: true,
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!convo) {
      throw new ConversationNotFoundError(id);
    }

    // CRITICAL: Verify the conversation belongs to the user's account
    if (convo.accountId !== accountId) {
      throw new ResourceNotOwnedError('conversation', id);
    }

    return convo;
  }

  async updateStatus(
    accountId: string,
    id: string,
    status: ConversationStatus,
  ) {
    // First verify ownership
    await this.findOne(accountId, id);

    const convo = await this.prisma.conversation.update({
      where: { id },
      data: { status },
      include: { inbox: true, contact: true },
    });

    return convo;
  }

  async listMessages(
    accountId: string,
    id: string,
    params: { limit?: number; cursor?: string },
  ) {
    // First verify ownership
    await this.findOne(accountId, id);

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
