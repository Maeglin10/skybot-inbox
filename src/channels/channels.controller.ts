import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  Headers,
  Res,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { ChannelsService } from './channels.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Channels API Controller
 * Handles OAuth flows, webhooks, and channel management
 */
@Controller('api/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * Start OAuth flow for a channel (Meta, Google, etc.)
   * POST /api/channels/:channelType/connect
   */
  @Post(':channelType/connect')
  async startAuth(
    @Param('channelType') channelType: string,
    @CurrentUser() user: any,
    @Body('returnUrl') returnUrl?: string,
  ) {
    const { authUrl, state } = await this.channelsService.startAuth(
      user.accountId,
      channelType,
      returnUrl,
    );

    return {
      authUrl,
      state,
      message: `Redirect user to authUrl to authorize ${channelType}`,
    };
  }

  /**
   * OAuth callback handler
   * GET /api/channels/:channelType/callback?code=...&state=...
   */
  @Get(':channelType/callback')
  @Public()
  async handleCallback(
    @Param('channelType') channelType: string,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    if (error) {
      return res.redirect(
        `/settings/channels?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `/settings/channels?error=missing_params&description=Missing code or state parameter`,
      );
    }

    try {
      const connectionId = await this.channelsService.handleCallback(
        channelType,
        code,
        state,
      );

      // Redirect to success page
      return res.redirect(
        `/settings/channels?success=true&connectionId=${connectionId}`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return res.redirect(
        `/settings/channels?error=callback_failed&description=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  /**
   * Get all channel connections for the current user's account
   * GET /api/channels
   */
  @Get()
  async getConnections(@CurrentUser() user: any) {
    return this.channelsService.getConnections(user.accountId);
  }

  /**
   * Get connection status
   * GET /api/channels/:connectionId/status
   */
  @Get(':connectionId/status')
  async getConnectionStatus(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: any,
  ) {
    return this.channelsService.getConnectionStatus(connectionId);
  }

  /**
   * Disconnect a channel
   * DELETE /api/channels/:connectionId
   */
  @Delete(':connectionId')
  async disconnect(
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: any,
  ) {
    return this.channelsService.disconnect(connectionId);
  }

  /**
   * Send a message through a channel
   * POST /api/channels/:connectionId/send
   */
  @Post(':connectionId/send')
  async sendMessage(
    @Param('connectionId') connectionId: string,
    @Body() message: any,
    @CurrentUser() user: any,
  ) {
    const messageId = await this.channelsService.sendMessage(
      connectionId,
      message,
    );
    return { messageId, success: true };
  }
}

/**
 * Webhooks Controller (Public endpoints for channel providers)
 */
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly channelsService: ChannelsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Meta webhook verification (GET)
   * GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
   */
  @Get('meta')
  @Public()
  @HttpCode(HttpStatus.OK)
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const VERIFY_TOKEN =
      process.env.WHATSAPP_VERIFY_TOKEN || 'verify_token_default';

    if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
      return challenge; // Return challenge as plain text
    }

    throw new Error('Webhook verification failed');
  }

  /**
   * Meta webhook receiver (POST)
   * POST /webhooks/meta
   * Receives Instagram DM + Facebook Messenger messages
   */
  @Post('meta')
  @Public()
  @HttpCode(HttpStatus.OK)
  async receiveMetaWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      const messages = await this.channelsService.ingestWebhook(
        'meta',
        payload,
        headers,
      );

      // TODO: Route messages to Master Router (N8N)
      // For now, just log them
      this.logger.info('Meta webhook messages received', {
        count: messages.length,
        provider: 'meta',
      });

      return { success: true, received: messages.length };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Meta webhook error', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { success: false, error: errorMessage };
    }
  }
}
