import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for managing conversation participants (read receipts, unread counts)
 * Implements read receipt tracking similar to Slack/WhatsApp
 */
@Injectable()
export class ConversationParticipantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark a user as a participant in a conversation
   */
  async joinConversation(params: {
    conversationId: string;
    userAccountId: string;
    accountId: string; // For validation
  }): Promise<void> {
    // Verify conversation belongs to account
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        inbox: { accountId: params.accountId },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Create or update participant
    await this.prisma.conversationParticipant.upsert({
      where: {
        conversationId_userAccountId: {
          conversationId: params.conversationId,
          userAccountId: params.userAccountId,
        },
      },
      update: {
        leftAt: null, // Rejoin if previously left
      },
      create: {
        conversationId: params.conversationId,
        userAccountId: params.userAccountId,
        joinedAt: new Date(),
      },
    });
  }

  /**
   * Mark a user as having left a conversation
   */
  async leaveConversation(params: {
    conversationId: string;
    userAccountId: string;
  }): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: params.conversationId,
        userAccountId: params.userAccountId,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  /**
   * Mark messages as read up to a specific message
   * Updates lastReadMessageId and recalculates unread count
   */
  async markAsRead(params: {
    conversationId: string;
    userAccountId: string;
    messageId: string;
    accountId: string; // For validation
  }): Promise<{ unreadCount: number }> {
    // Verify user has access to this conversation
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userAccountId: {
          conversationId: params.conversationId,
          userAccountId: params.userAccountId,
        },
      },
      include: {
        conversation: {
          include: {
            inbox: {
              select: { accountId: true },
            },
          },
        },
      },
    });

    if (!participant || participant.conversation.inbox.accountId !== params.accountId) {
      throw new Error('Conversation not found or access denied');
    }

    // Get the message timestamp to calculate unread count
    const message = await this.prisma.message.findUnique({
      where: { id: params.messageId },
      select: { timestamp: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Count unread messages (messages after the one we're marking as read)
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: params.conversationId,
        timestamp: {
          gt: message.timestamp,
        },
        // Don't count messages sent by the user themselves
        direction: 'IN',
      },
    });

    // Update participant read receipt
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userAccountId: {
          conversationId: params.conversationId,
          userAccountId: params.userAccountId,
        },
      },
      data: {
        lastReadMessageId: params.messageId,
        lastReadAt: new Date(),
        unreadCount,
      },
    });

    return { unreadCount };
  }

  /**
   * Get unread count for a user across all conversations
   */
  async getUnreadCounts(params: {
    userAccountId: string;
    accountId: string;
  }): Promise<Array<{ conversationId: string; unreadCount: number }>> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        userAccountId: params.userAccountId,
        unreadCount: {
          gt: 0,
        },
        conversation: {
          inbox: {
            accountId: params.accountId,
          },
        },
      },
      select: {
        conversationId: true,
        unreadCount: true,
      },
    });

    return participants;
  }

  /**
   * Mute/unmute a conversation for a user
   */
  async toggleMute(params: {
    conversationId: string;
    userAccountId: string;
    muted: boolean;
    mutedUntil?: Date;
  }): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: params.conversationId,
        userAccountId: params.userAccountId,
      },
      data: {
        muted: params.muted,
        mutedUntil: params.mutedUntil || null,
      },
    });
  }

  /**
   * Increment unread count when a new message arrives
   * Should be called from message creation hook
   */
  async incrementUnreadCount(params: {
    conversationId: string;
    messageDirection: 'IN' | 'OUT';
  }): Promise<void> {
    // Only increment for incoming messages
    if (params.messageDirection !== 'IN') {
      return;
    }

    // Increment unread count for all participants who haven't read this message yet
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: params.conversationId,
        leftAt: null, // Only active participants
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });
  }
}
