import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Status = 'OPEN' | 'PENDING' | 'CLOSED';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: 'OPEN' | 'PENDING' | 'CLOSED';
    inboxId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = params.limit ?? 20;

    const rows = await this.prisma.conversation.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.inboxId ? { inboxId: params.inboxId } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      include: {
        inbox: true,
        contact: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
    });

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

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

  async updateStatus(conversationId: string, status: Status) {
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
