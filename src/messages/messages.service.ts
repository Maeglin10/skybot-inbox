import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(params: {
    conversationId: string;
    text: string;
    externalId?: string;
  }) {
    const { conversationId, text, externalId } = params;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        inbox: true,
        contact: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        externalId: externalId ?? null,
        direction: 'OUT',
        from: conversation.inbox.externalId ?? null,
        to: conversation.contact.phone,
        text,
        timestamp: new Date(),
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastActivityAt: message.createdAt,
        status: 'OPEN',
      },
    });

    return message;
  }
}
