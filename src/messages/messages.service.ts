import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, MessageDirection } from '@prisma/client';
import {
  ConversationNotFoundError,
  ResourceNotOwnedError,
} from '../common/errors/known-error';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(params: {
    accountId: string; // REQUIRED for multi-tenancy
    conversationId: string;
    text: string;
    externalId?: string;
  }) {
    const { accountId, conversationId, text, externalId } = params;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { inbox: true, contact: true },
    });

    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    // CRITICAL: Verify the conversation belongs to the user's account
    if (conversation.accountId !== accountId) {
      throw new ResourceNotOwnedError('conversation', conversationId);
    }

    const channel =
      conversation.channel ?? conversation.inbox.channel ?? Channel.WHATSAPP;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        channel,
        externalId: externalId ?? null,
        direction: MessageDirection.OUT,
        from: conversation.inbox.externalId ?? null,
        to: conversation.contact.phone ?? null,
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
