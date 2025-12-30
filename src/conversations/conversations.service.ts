import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ConversationStatus = 'OPEN' | 'CLOSED';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: ConversationStatus;
    inboxId?: string;
    limit?: number;
    cursor?: string;
    lite?: boolean;
  }) {
    const { status, inboxId, limit = 20, cursor, lite } = params;

    const take = Math.min(Math.max(limit, 1), 100);

    // Cursor: we paginate by createdAt (stable) not by id
    const where: Record<string, unknown> = {
      ...(status ? { status } : {}),
      ...(inboxId ? { inboxId } : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    if (lite) {
      const rows = await this.prisma.conversation.findMany({
        where,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          status: true,
          lastActivityAt: true,
          createdAt: true,
          contact: { select: { name: true, phone: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              text: true,
              timestamp: true,
              createdAt: true,
              direction: true,
            },
          },
        },
      });

      const items = rows.map((c) => {
        const m = c.messages?.[0];
        const ts =
          (m?.timestamp as unknown as Date | null)?.toISOString?.() ??
          (m?.createdAt ? m.createdAt.toISOString() : undefined);

        return {
          id: c.id,
          status: c.status as ConversationStatus,
          lastActivityAt:
            c.lastActivityAt?.toISOString?.() ??
            (typeof c.lastActivityAt === 'string'
              ? c.lastActivityAt
              : undefined),
          contact: c.contact
            ? { name: c.contact.name ?? null, phone: c.contact.phone ?? null }
            : undefined,
          preview: m
            ? {
                text: m.text ?? null,
                timestamp: ts,
                direction:
                  m.direction === 'IN' || m.direction === 'OUT'
                    ? m.direction
                    : undefined,
              }
            : undefined,
        };
      });

      const nextCursor =
        rows.length === take
          ? rows[rows.length - 1].createdAt.toISOString()
          : null;
      return { items, nextCursor };
    }

    const items = await this.prisma.conversation.findMany({
      where,
      take,
      include: {
        inbox: true,
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const nextCursor =
      items.length === take
        ? items[items.length - 1].createdAt.toISOString()
        : null;
    return { items, nextCursor };
  }

  async findOne(conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        inbox: true,
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async updateStatus(conversationId: string, status: ConversationStatus) {
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Conversation not found');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
      include: {
        inbox: true,
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  // REQUIRED by controller: GET /conversations/:id/messages
  async listMessages(
    conversationId: string,
    params: { limit?: number; cursor?: string },
  ) {
    const take = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const cursor = params.cursor;

    const where: Record<string, unknown> = {
      conversationId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        text: true,
        timestamp: true,
        createdAt: true,
        direction: true,
        from: true,
        to: true,
      },
    });

    // return oldest->newest for UI rendering
    const items = rows
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        text: m.text ?? null,
        timestamp:
          (m.timestamp as unknown as Date | null)?.toISOString?.() ??
          m.createdAt.toISOString(),
        direction:
          m.direction === 'IN' || m.direction === 'OUT' ? m.direction : 'IN',
        from: m.from ?? undefined,
        to: m.to ?? undefined,
      }));

    const nextCursor =
      rows.length === take
        ? rows[rows.length - 1].createdAt.toISOString()
        : null;
    return { items, nextCursor };
  }
}
