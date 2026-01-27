import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for real-time agent updates
 *
 * Events emitted by server:
 * - agent:created - New agent deployed
 * - agent:status-changed - Agent activated/deactivated
 * - execution:started - Agent execution started
 * - execution:completed - Agent execution finished
 * - execution:failed - Agent execution failed
 * - metrics:updated - Agent metrics refreshed
 *
 * Clients can subscribe to specific agents or all agents for a tenant
 */
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3001', // Frontend dev
      'http://localhost:3000', // Alternative
      /\.onrender\.com$/, // Production
    ],
    credentials: true,
  },
  namespace: '/agents',
})
export class AgentsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AgentsGateway.name);

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized on /agents namespace');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake auth
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Store user info in socket data
      client.data.user = {
        userId: payload.sub,
        accountId: payload.accountId,
        role: payload.role,
      };

      // Auto-join room for tenant
      client.join(`tenant:${payload.accountId}`);

      this.logger.log(
        `Client ${client.id} connected (accountId: ${payload.accountId})`,
      );

      // Send initial connection confirmation
      client.emit('connected', {
        message: 'Connected to agents WebSocket',
        accountId: payload.accountId,
      });
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const accountId = client.data.user?.accountId;
    this.logger.log(
      `Client ${client.id} disconnected${accountId ? ` (accountId: ${accountId})` : ''}`,
    );
  }

  /**
   * Subscribe to a specific agent's updates
   */
  @SubscribeMessage('subscribe:agent')
  handleSubscribeAgent(
    @MessageBody() data: { agentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { agentId } = data;
    const accountId = client.data.user?.accountId;

    if (!accountId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Join room for specific agent
    client.join(`agent:${agentId}`);

    this.logger.log(
      `Client ${client.id} subscribed to agent ${agentId} (tenant: ${accountId})`,
    );

    client.emit('subscribed', { agentId });
  }

  /**
   * Unsubscribe from a specific agent's updates
   */
  @SubscribeMessage('unsubscribe:agent')
  handleUnsubscribeAgent(
    @MessageBody() data: { agentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { agentId } = data;

    client.leave(`agent:${agentId}`);

    this.logger.log(`Client ${client.id} unsubscribed from agent ${agentId}`);

    client.emit('unsubscribed', { agentId });
  }

  /**
   * Emit agent created event to tenant room
   */
  emitAgentCreated(accountId: string, agent: any) {
    this.server.to(`tenant:${accountId}`).emit('agent:created', agent);
    this.logger.log(`Emitted agent:created for agent ${agent.id}`);
  }

  /**
   * Emit agent status changed event
   */
  emitAgentStatusChanged(accountId: string, agentId: string, status: string) {
    this.server
      .to(`tenant:${accountId}`)
      .to(`agent:${agentId}`)
      .emit('agent:status-changed', { agentId, status });
    this.logger.log(`Emitted agent:status-changed for agent ${agentId}`);
  }

  /**
   * Emit execution started event
   */
  emitExecutionStarted(
    accountId: string,
    agentId: string,
    executionId: string,
  ) {
    this.server
      .to(`tenant:${accountId}`)
      .to(`agent:${agentId}`)
      .emit('execution:started', { agentId, executionId });
  }

  /**
   * Emit execution completed event
   */
  emitExecutionCompleted(accountId: string, agentId: string, execution: any) {
    this.server
      .to(`tenant:${accountId}`)
      .to(`agent:${agentId}`)
      .emit('execution:completed', execution);
    this.logger.log(`Emitted execution:completed for agent ${agentId}`);
  }

  /**
   * Emit execution failed event
   */
  emitExecutionFailed(accountId: string, agentId: string, error: string) {
    this.server
      .to(`tenant:${accountId}`)
      .to(`agent:${agentId}`)
      .emit('execution:failed', { agentId, error });
    this.logger.log(`Emitted execution:failed for agent ${agentId}`);
  }

  /**
   * Emit metrics updated event
   */
  emitMetricsUpdated(accountId: string, agentId: string, metrics: any) {
    this.server
      .to(`tenant:${accountId}`)
      .to(`agent:${agentId}`)
      .emit('metrics:updated', { agentId, metrics });
  }
}
