import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Status = 'OPEN' | 'PENDING' | 'CLOSED';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: Status;
    inboxId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { status, inboxId, limit = 20, cursor } = params;

    const where = {
      ...(status ? { status } : {}),
      ...(inboxId ? { inboxId } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    };

    const items = await this.prisma.conversation.findMany({
      where,
      take: limit,
      include: {
        inbox: true,
        contact: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
    });

    const nextCursor =
      items.length === limit ? items[items.length - 1].id : null;

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
