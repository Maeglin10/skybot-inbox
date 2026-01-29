import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Service for managing user presence (online/offline status)
 * Implements presence tracking similar to Slack/Discord
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update user presence when they connect via WebSocket
   */
  async setOnline(params: {
    userAccountId: string;
    socketId: string;
    deviceInfo?: any;
  }): Promise<void> {
    await this.prisma.presence.upsert({
      where: { userAccountId: params.userAccountId },
      update: {
        status: 'online',
        lastSeenAt: new Date(),
        socketId: params.socketId,
        deviceInfo: params.deviceInfo || null,
      },
      create: {
        userAccountId: params.userAccountId,
        status: 'online',
        lastSeenAt: new Date(),
        socketId: params.socketId,
        deviceInfo: params.deviceInfo || null,
      },
    });

    this.logger.log(`User ${params.userAccountId} is now online`);
  }

  /**
   * Update user presence when they disconnect
   */
  async setOffline(params: {
    userAccountId: string;
  }): Promise<void> {
    await this.prisma.presence.update({
      where: { userAccountId: params.userAccountId },
      data: {
        status: 'offline',
        lastSeenAt: new Date(),
        socketId: null,
        currentConversationId: null,
        isTypingInConversation: null,
      },
    });

    this.logger.log(`User ${params.userAccountId} is now offline`);
  }

  /**
   * Update user status (online, away, busy)
   */
  async updateStatus(params: {
    userAccountId: string;
    status: PresenceStatus;
  }): Promise<void> {
    await this.prisma.presence.update({
      where: { userAccountId: params.userAccountId },
      data: {
        status: params.status,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Set which conversation a user is currently viewing
   */
  async setCurrentConversation(params: {
    userAccountId: string;
    conversationId: string | null;
  }): Promise<void> {
    await this.prisma.presence.update({
      where: { userAccountId: params.userAccountId },
      data: {
        currentConversationId: params.conversationId,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Set typing indicator for a conversation
   */
  async setTyping(params: {
    userAccountId: string;
    conversationId: string | null;
    isTyping: boolean;
  }): Promise<void> {
    await this.prisma.presence.update({
      where: { userAccountId: params.userAccountId },
      data: {
        isTypingInConversation: params.isTyping ? params.conversationId : null,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Get presence for a specific user
   */
  async getPresence(userAccountId: string): Promise<{
    status: string;
    lastSeenAt: Date;
    currentConversationId: string | null;
    isTypingInConversation: string | null;
  } | null> {
    const presence = await this.prisma.presence.findUnique({
      where: { userAccountId },
      select: {
        status: true,
        lastSeenAt: true,
        currentConversationId: true,
        isTypingInConversation: true,
      },
    });

    return presence;
  }

  /**
   * Get presence for multiple users (for showing online status in conversation list)
   */
  async getPresenceForUsers(userAccountIds: string[]): Promise<
    Array<{
      userAccountId: string;
      status: string;
      lastSeenAt: Date;
    }>
  > {
    const presences = await this.prisma.presence.findMany({
      where: {
        userAccountId: {
          in: userAccountIds,
        },
      },
      select: {
        userAccountId: true,
        status: true,
        lastSeenAt: true,
      },
    });

    return presences;
  }

  /**
   * Get all online users for an account (for dashboard)
   */
  async getOnlineUsers(accountId: string): Promise<
    Array<{
      userAccountId: string;
      status: string;
      lastSeenAt: Date;
      currentConversationId: string | null;
    }>
  > {
    const presences = await this.prisma.presence.findMany({
      where: {
        status: 'online',
        userAccount: {
          accountId,
        },
      },
      select: {
        userAccountId: true,
        status: true,
        lastSeenAt: true,
        currentConversationId: true,
      },
    });

    return presences;
  }

  /**
   * Heartbeat to keep user online
   * Should be called periodically (every 30s) from WebSocket
   */
  async heartbeat(userAccountId: string): Promise<void> {
    await this.prisma.presence.update({
      where: { userAccountId },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Cleanup stale presences (mark users offline if no heartbeat in 2 minutes)
   * Should be run as a cron job
   */
  async cleanupStale(): Promise<{ updated: number }> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const result = await this.prisma.presence.updateMany({
      where: {
        status: 'online',
        lastSeenAt: {
          lt: twoMinutesAgo,
        },
      },
      data: {
        status: 'offline',
        socketId: null,
        currentConversationId: null,
        isTypingInConversation: null,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} stale users as offline`);
    }

    return { updated: result.count };
  }
}
