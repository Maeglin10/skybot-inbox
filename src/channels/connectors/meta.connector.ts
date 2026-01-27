import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Channel } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import {
  ChannelConnector,
  OAuthStartResponse,
  OAuthCallbackData,
  AssetSelection,
  ConnectionStatus,
  UnifiedMessage,
  OutgoingMessage,
} from '../interfaces';

interface MetaOAuthState {
  accountId: string;
  returnUrl?: string;
  timestamp: number;
}

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

interface MetaInstagramAccount {
  id: string;
  username: string;
}

/**
 * Meta Connector for Instagram DM + Facebook Messenger
 * Handles OAuth, webhooks, and message normalization for both platforms
 */
@Injectable()
export class MetaConnector implements ChannelConnector {
  readonly channelType = 'meta';
  private readonly logger = new Logger(MetaConnector.name);

  private readonly META_GRAPH_API = 'https://graph.facebook.com/v21.0';
  private readonly META_APP_ID =
    process.env.META_APP_ID || 'placeholder-app-id';
  private readonly META_APP_SECRET =
    process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
  private readonly CALLBACK_URL = `${process.env.RENDER_APP_URL || 'http://localhost:3001'}/api/channels/meta/callback`;
  private readonly VERIFY_TOKEN =
    process.env.WHATSAPP_VERIFY_TOKEN || 'verify_token_default';

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private jwtService: JwtService,
  ) {
    if (!this.META_APP_ID || this.META_APP_ID === 'placeholder-app-id') {
      this.logger.warn(
        '⚠️  META_APP_ID not configured. OAuth flow will not work.',
      );
    }
  }

  /**
   * Start OAuth authorization flow
   */
  async startAuth(
    accountId: string,
    returnUrl?: string,
  ): Promise<OAuthStartResponse> {
    // Create state JWT with accountId and returnUrl
    const state: MetaOAuthState = {
      accountId,
      returnUrl,
      timestamp: Date.now(),
    };

    const stateToken = this.jwtService.sign(state, {
      expiresIn: '10m',
      secret: process.env.JWT_SECRET,
    });

    // Meta OAuth URL with required permissions
    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    authUrl.searchParams.set('client_id', this.META_APP_ID);
    authUrl.searchParams.set('redirect_uri', this.CALLBACK_URL);
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set(
      'scope',
      [
        'pages_show_list', // List Pages
        'pages_messaging', // Send/receive Page messages
        'pages_manage_metadata', // Manage Page webhooks
        'instagram_basic', // Instagram basic info
        'instagram_manage_messages', // Instagram DM
      ].join(','),
    );

    return {
      authUrl: authUrl.toString(),
      state: stateToken,
    };
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(callbackData: OAuthCallbackData): Promise<string> {
    const { code, state, error, error_description } = callbackData;

    if (error) {
      throw new Error(`OAuth error: ${error} - ${error_description}`);
    }

    // Verify and decode state
    let stateData: MetaOAuthState;
    try {
      stateData = this.jwtService.verify(state, {
        secret: process.env.JWT_SECRET,
      });
    } catch (err) {
      throw new Error('Invalid state token');
    }

    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(code);

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedToken = await this.getLongLivedToken(
      tokenResponse.access_token,
    );

    // Get user's Pages
    const pages = await this.getUserPages(longLivedToken.access_token);

    if (pages.length === 0) {
      throw new Error(
        'No Facebook Pages found. User must have at least one Page.',
      );
    }

    // For now, auto-select the first page (later we can add UI for selection)
    const selectedPage = pages[0];

    // Get Instagram account linked to the page (if any)
    const igAccount = await this.getPageInstagramAccount(
      selectedPage.id,
      selectedPage.access_token,
    );

    // Store the connection with encrypted token
    const { encrypted, iv, authTag } = this.encryption.encrypt(
      selectedPage.access_token,
    );

    const metadata: any = {
      pageName: selectedPage.name,
      pageId: selectedPage.id,
      category: selectedPage.category,
    };

    if (igAccount) {
      metadata.instagramUsername = igAccount.username;
      metadata.instagramAccountId = igAccount.id;
    }

    const connection = await this.prisma.channelConnection.create({
      data: {
        accountId: stateData.accountId,
        channelType: Channel.FACEBOOK, // Default to Facebook
        channelIdentifier: selectedPage.id,
        encryptedToken: encrypted,
        iv,
        authTag,
        metadata,
        status: 'ACTIVE',
        lastSync: new Date(),
      },
    });

    // If Instagram account exists, create a separate connection for it
    if (igAccount) {
      const {
        encrypted: igEncrypted,
        iv: igIv,
        authTag: igAuthTag,
      } = this.encryption.encrypt(selectedPage.access_token);

      await this.prisma.channelConnection.create({
        data: {
          accountId: stateData.accountId,
          channelType: Channel.INSTAGRAM,
          channelIdentifier: igAccount.id,
          encryptedToken: igEncrypted,
          iv: igIv,
          authTag: igAuthTag,
          metadata: {
            username: igAccount.username,
            pageId: selectedPage.id,
            pageName: selectedPage.name,
          },
          status: 'ACTIVE',
          lastSync: new Date(),
        },
      });
    }

    this.logger.log(
      `✅ Meta connection created for account ${stateData.accountId} (Page: ${selectedPage.name})`,
    );

    return connection.id;
  }

  /**
   * Get connection status
   */
  async getStatus(connectionId: string): Promise<ConnectionStatus> {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Decrypt token and test it
    const token = this.encryption.decrypt(
      connection.encryptedToken,
      connection.iv,
      connection.authTag,
    );

    let isTokenValid = false;
    try {
      // Test token by fetching Page/IG info
      const url = `${this.META_GRAPH_API}/${connection.channelIdentifier}?access_token=${token}`;
      await axios.get(url);
      isTokenValid = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token validation failed: ${errorMessage}`);
    }

    return {
      connectionId: connection.id,
      channelType: connection.channelType,
      status: connection.status.toLowerCase() as any,
      isTokenValid,
      lastSync: connection.lastSync || undefined,
      lastError: connection.lastError || undefined,
      metadata: connection.metadata as any,
    };
  }

  /**
   * Ingest webhook payload from Meta (Instagram + Facebook)
   */
  async ingestWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<UnifiedMessage[]> {
    // Verify webhook signature
    this.verifyWebhookSignature(payload, headers['x-hub-signature-256']);

    const messages: UnifiedMessage[] = [];

    // Meta sends webhook data in 'entry' array
    if (!payload.entry || !Array.isArray(payload.entry)) {
      return messages;
    }

    for (const entry of payload.entry) {
      // Instagram messaging
      if (entry.messaging) {
        for (const event of entry.messaging) {
          const message = this.normalizeInstagramMessage(event);
          if (message) {
            messages.push(message);
          }
        }
      }

      // Facebook Messenger
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value?.messages) {
            for (const msg of change.value.messages) {
              const message = this.normalizeFacebookMessage(msg, entry.id);
              if (message) {
                messages.push(message);
              }
            }
          }
        }
      }
    }

    return messages;
  }

  /**
   * Send a message through Meta (Instagram or Facebook)
   */
  async sendMessage(
    connectionId: string,
    message: OutgoingMessage,
  ): Promise<string> {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const token = this.encryption.decrypt(
      connection.encryptedToken,
      connection.iv,
      connection.authTag,
    );

    // Send via Graph API
    const url = `${this.META_GRAPH_API}/${connection.channelIdentifier}/messages`;

    const body: any = {
      recipient: { id: message.to },
      message: {},
    };

    if (message.text) {
      body.message.text = message.text;
    }

    if (message.mediaUrl) {
      body.message.attachment = {
        type: this.getAttachmentType(message.mediaType),
        payload: {
          url: message.mediaUrl,
          is_reusable: true,
        },
      };
    }

    const response = await axios.post(url, body, {
      params: { access_token: token },
    });

    return response.data.message_id;
  }

  /**
   * Disconnect a connection
   */
  async disconnect(connectionId: string): Promise<void> {
    await this.prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        status: 'INACTIVE',
        lastSync: new Date(),
      },
    });

    this.logger.log(`Disconnected connection ${connectionId}`);
  }

  // ===========================
  // PRIVATE HELPER METHODS
  // ===========================

  private async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    const url = `${this.META_GRAPH_API}/oauth/access_token`;
    const response = await axios.get(url, {
      params: {
        client_id: this.META_APP_ID,
        client_secret: this.META_APP_SECRET,
        redirect_uri: this.CALLBACK_URL,
        code,
      },
    });

    return response.data;
  }

  private async getLongLivedToken(
    shortToken: string,
  ): Promise<MetaLongLivedTokenResponse> {
    const url = `${this.META_GRAPH_API}/oauth/access_token`;
    const response = await axios.get(url, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.META_APP_ID,
        client_secret: this.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    return response.data;
  }

  private async getUserPages(token: string): Promise<MetaPage[]> {
    const url = `${this.META_GRAPH_API}/me/accounts`;
    const response = await axios.get(url, {
      params: {
        access_token: token,
        fields: 'id,name,access_token,category',
      },
    });

    return response.data.data || [];
  }

  private async getPageInstagramAccount(
    pageId: string,
    pageToken: string,
  ): Promise<MetaInstagramAccount | null> {
    try {
      const url = `${this.META_GRAPH_API}/${pageId}`;
      const response = await axios.get(url, {
        params: {
          access_token: pageToken,
          fields: 'instagram_business_account{id,username}',
        },
      });

      return response.data.instagram_business_account || null;
    } catch (error) {
      this.logger.warn(`No Instagram account linked to page ${pageId}`);
      return null;
    }
  }

  private verifyWebhookSignature(payload: any, signature: string): void {
    if (!signature) {
      throw new Error('Missing x-hub-signature-256 header');
    }

    if (!this.META_APP_SECRET) {
      throw new Error('META_APP_SECRET not configured');
    }

    const expectedSignature =
      'sha256=' +
      crypto
        .createHmac('sha256', this.META_APP_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }
  }

  private normalizeInstagramMessage(event: any): UnifiedMessage | null {
    if (!event.message) return null;

    return {
      externalId: event.message.mid,
      channelType: Channel.INSTAGRAM,
      channelIdentifier: event.recipient.id,
      direction: 'inbound',
      from: event.sender.id,
      to: event.recipient.id,
      text: event.message.text,
      mediaUrl: event.message.attachments?.[0]?.payload?.url,
      mediaType: event.message.attachments?.[0]?.type,
      timestamp: new Date(event.timestamp),
      metadata: {
        isEcho: event.message.is_echo || false,
        replyTo: event.message.reply_to?.mid,
      },
    };
  }

  private normalizeFacebookMessage(
    msg: any,
    pageId: string,
  ): UnifiedMessage | null {
    return {
      externalId: msg.mid,
      channelType: Channel.FACEBOOK,
      channelIdentifier: pageId,
      direction: 'inbound',
      from: msg.from.id,
      to: pageId,
      text: msg.message,
      timestamp: new Date(msg.created_time),
      metadata: {
        isDeleted: msg.is_deleted || false,
      },
    };
  }

  private getAttachmentType(mediaType?: string): string {
    if (!mediaType) return 'file';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'file';
  }
}
