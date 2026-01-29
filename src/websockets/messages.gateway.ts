import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from './presence.service';
import { ConversationParticipantService } from '../conversations/conversation-participant.service';

/**
 * WebSocket Gateway for real-time message updates
 *
 * Events:
 * - Client -> Server:
 *   - 'authenticate': Authenticate with JWT token
 *   - 'join_conversation': Subscribe to conversation updates
 *   - 'leave_conversation': Unsubscribe from conversation
 *
 * - Server -> Client:
 *   - 'message:new': New message in conversation
 *   - 'message:update': Message updated
 *   - 'conversation:update': Conversation status changed
 *   - 'typing': User is typing indicator
 *
 * Authentication:
 * Clients must send 'authenticate' event with JWT token after connecting
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://skybot-inbox-ui.onrender.com',
    ],
    credentials: true,
  },
  namespace: '/ws',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private authenticatedClients = new Map<
    string,
    { accountId: string; userId: string }
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
    private readonly participantService: ConversationParticipantService,
  ) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Client has 10 seconds to authenticate
    setTimeout(() => {
      if (!this.authenticatedClients.has(client.id)) {
        this.logger.warn(`Client ${client.id} failed to authenticate in time`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
      }
    }, 10000);
  }

  /**
   * Handle WebSocket disconnection
   * Marks user as offline in presence system
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const authInfo = this.authenticatedClients.get(client.id);
    if (authInfo) {
      // Mark user as offline
      try {
        await this.presenceService.setOffline({
          userAccountId: authInfo.userId,
        });

        // Broadcast presence update to account
        this.server.to(`account:${authInfo.accountId}`).emit('presence:update', {
          userId: authInfo.userId,
          status: 'offline',
          lastSeenAt: new Date(),
        });
      } catch (error) {
        this.logger.error('Failed to update presence on disconnect:', error);
      }
    }

    this.authenticatedClients.delete(client.id);
  }

  /**
   * Authenticate WebSocket connection with JWT token
   * Marks user as online in presence system
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const payload = this.jwtService.verify(data.token, {
        secret: process.env.JWT_SECRET,
      });

      // Store authenticated client info
      this.authenticatedClients.set(client.id, {
        accountId: payload.accountId,
        userId: payload.sub,
      });

      // Join room for this account (for broadcast messages)
      client.join(`account:${payload.accountId}`);

      // Mark user as online in presence system
      const userAgent = client.handshake.headers['user-agent'];
      await this.presenceService.setOnline({
        userAccountId: payload.sub,
        socketId: client.id,
        deviceInfo: {
          userAgent,
          ip: client.handshake.address,
        },
      });

      // Broadcast presence update to account
      this.server.to(`account:${payload.accountId}`).emit('presence:update', {
        userId: payload.sub,
        status: 'online',
        lastSeenAt: new Date(),
      });

      this.logger.log(
        `Client ${client.id} authenticated as user ${payload.sub}`,
      );

      client.emit('authenticated', { success: true });
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error,
      );
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  /**
   * Subscribe to conversation updates
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Verify user has access to this conversation (accountId check)
    // Get conversation with inbox to verify account ownership
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        inbox: {
          accountId: authInfo.accountId,
        },
      },
    });

    if (!conversation) {
      this.logger.warn(
        `Client ${client.id} (account ${authInfo.accountId}) attempted to join unauthorized conversation ${data.conversationId}`,
      );
      client.emit('error', {
        message: 'Conversation not found or access denied',
      });
      return;
    }

    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} joined conversation ${data.conversationId}`,
    );

    client.emit('joined_conversation', { conversationId: data.conversationId });
  }

  /**
   * Unsubscribe from conversation updates
   */
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} left conversation ${data.conversationId}`,
    );

    client.emit('left_conversation', { conversationId: data.conversationId });
  }

  /**
   * Send typing indicator
   * Updates presence system with typing status
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody()
    data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      return;
    }

    // Update presence typing status
    await this.presenceService.setTyping({
      userAccountId: authInfo.userId,
      conversationId: data.isTyping ? data.conversationId : null,
      isTyping: data.isTyping,
    });

    // Broadcast typing indicator to others in the conversation
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: authInfo.userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Mark messages as read (read receipts)
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody()
    data: { conversationId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const result = await this.participantService.markAsRead({
        conversationId: data.conversationId,
        userAccountId: authInfo.userId,
        messageId: data.messageId,
        accountId: authInfo.accountId,
      });

      // Broadcast read receipt to conversation
      this.server.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId: authInfo.userId,
        readAt: new Date(),
      });

      client.emit('marked_read', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      this.logger.error('Failed to mark message as read:', error);
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  /**
   * Update user presence status (online, away, busy)
   */
  @SubscribeMessage('presence:update_status')
  async handlePresenceUpdate(
    @MessageBody() data: { status: 'online' | 'away' | 'busy' | 'offline' },
    @ConnectedSocket() client: Socket,
  ) {
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      return;
    }

    await this.presenceService.updateStatus({
      userAccountId: authInfo.userId,
      status: data.status,
    });

    // Broadcast presence update to account
    this.server.to(`account:${authInfo.accountId}`).emit('presence:update', {
      userId: authInfo.userId,
      status: data.status,
      lastSeenAt: new Date(),
    });
  }

  /**
   * Heartbeat to keep user online
   * Client should send this every 30 seconds
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      return;
    }

    await this.presenceService.heartbeat(authInfo.userId);
    client.emit('heartbeat:ack', { timestamp: new Date() });
  }

  /**
   * Broadcast new message to conversation subscribers
   * Called from messages.service.ts after creating a message
   */
  broadcastNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId,
      message,
    });

    this.logger.log(`Broadcasted new message to conversation ${conversationId}`);
  }

  /**
   * Broadcast message update to conversation subscribers
   */
  broadcastMessageUpdate(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:update', {
      conversationId,
      message,
    });
  }

  /**
   * Broadcast conversation status change to subscribers
   */
  broadcastConversationUpdate(conversationId: string, update: any) {
    this.server.to(`conversation:${conversationId}`).emit('conversation:update', {
      conversationId,
      update,
    });
  }

  /**
   * Broadcast event to entire account
   */
  broadcastToAccount(accountId: string, event: string, data: any) {
    this.server.to(`account:${accountId}`).emit(event, data);
  }
}
