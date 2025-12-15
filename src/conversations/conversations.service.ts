import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Status = 'OPEN' | 'PENDING' | 'CLOSED';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { status?: Status }) {
    const { status } = params;

    return this.prisma.conversation.findMany({
      where: {
        ...(status ? { status } : {}),
      },
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
