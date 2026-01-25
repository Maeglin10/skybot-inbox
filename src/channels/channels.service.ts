import { Injectable, NotFoundException } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetaConnector } from './connectors/meta.connector';
import { ChannelConnector, UnifiedMessage } from './interfaces';

/**
 * Central service for managing channel connections
 * Routes requests to the appropriate connector (Meta, WhatsApp, Webchat, etc.)
 */
@Injectable()
export class ChannelsService {
  private connectors: Map<string, ChannelConnector> = new Map();

  constructor(
    private prisma: PrismaService,
    private metaConnector: MetaConnector,
  ) {
    // Register connectors
    this.connectors.set('meta', metaConnector);
    this.connectors.set('instagram', metaConnector);
    this.connectors.set('facebook', metaConnector);
  }

  /**
   * Get connector by channel type
   */
  private getConnector(channelType: string): ChannelConnector {
    const connector = this.connectors.get(channelType.toLowerCase());
    if (!connector) {
      throw new Error(`No connector found for channel type: ${channelType}`);
    }
    return connector;
  }

  /**
   * Start OAuth flow for a channel
   */
  async startAuth(accountId: string, channelType: string, returnUrl?: string) {
    const connector = this.getConnector(channelType);
    return connector.startAuth(accountId, returnUrl);
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(channelType: string, code: string, state: string) {
    const connector = this.getConnector(channelType);
    return connector.handleCallback({ code, state });
  }

  /**
   * Get all connections for an account
   */
  async getConnections(accountId: string) {
    return this.prisma.channelConnection.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(connectionId: string) {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    const connector = this.getConnector(connection.channelType);
    return connector.getStatus(connectionId);
  }

  /**
   * Disconnect a channel
   */
  async disconnect(connectionId: string) {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    const connector = this.getConnector(connection.channelType);
    await connector.disconnect(connectionId);

    return { message: 'Connection disconnected successfully' };
  }

  /**
   * Ingest webhook from a channel
   */
  async ingestWebhook(
    channelType: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<UnifiedMessage[]> {
    const connector = this.getConnector(channelType);
    return connector.ingestWebhook(payload, headers);
  }

  /**
   * Send a message through a channel
   */
  async sendMessage(connectionId: string, message: any) {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    const connector = this.getConnector(connection.channelType);
    return connector.sendMessage(connectionId, message);
  }
}
