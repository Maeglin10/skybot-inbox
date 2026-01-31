import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { WebhooksService } from './webhooks.service';
import { WhatsAppSignatureGuard } from './whatsapp-signature.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Get('whatsapp')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === expected)
      return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  @Public()
  @Post('whatsapp/debug')
  async debugPost(@Req() req: Request, @Body() body: any) {
    this.logger.log('[WEBHOOK-DEBUG] Received webhook from Meta');
    this.logger.log(`[WEBHOOK-DEBUG] IP: ${req.ip}`);
    this.logger.log(
      `[WEBHOOK-DEBUG] Body: ${JSON.stringify(body).substring(0, 500)}`,
    );

    try {
      await this.webhooksService.handleWhatsAppWebhook(body);
      return { received: true, processed: true };
    } catch (error) {
      this.logger.error('[WEBHOOK-DEBUG] Error:', error);
      return { received: true, processed: false, error: String(error) };
    }
  }

  @Public()
  @Post('whatsapp')
  @UseGuards(WhatsAppSignatureGuard)
  post(@Req() _req: Request, @Body() body: WhatsAppCloudWebhook) {
    void this.webhooksService
      .handleWhatsAppWebhook(body)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? (err.stack ?? err.message) : String(err);
        this.logger.error(msg);
      });

    return { ok: true };
  }

  /**
   * N8N Conversation Update Endpoint
   * Receives conversation data from N8N after processing WhatsApp messages
   * Path: /api/webhooks/n8n/conversation-update
   * Updated: 2026-01-31
   */
  @Public()
  @Post('n8n/conversation-update')
  async n8nConversationUpdate(
    @Headers('x-n8n-secret') secret: string,
    @Body() body: {
      phone: string;
      userName?: string;
      conversationId: string | null;
      requestId: string;
      clientKey: string;
      phoneNumberId?: string;
      incomingMessage: {
        text: string;
        timestamp: string;
        externalId: string;
      };
      outgoingMessage: {
        text: string;
        timestamp: string;
      };
    },
  ) {
    // Verify N8N secret
    const expectedSecret = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!secret || secret !== expectedSecret) {
      this.logger.warn('[N8N] Unauthorized request - invalid secret');
      throw new UnauthorizedException('Invalid x-n8n-secret header');
    }

    this.logger.log('[N8N] Received conversation update', {
      conversationId: body.conversationId,
      requestId: body.requestId,
      clientKey: body.clientKey,
      hasIncoming: !!body.incomingMessage,
      hasOutgoing: !!body.outgoingMessage,
    });

    try {
      await this.webhooksService.handleN8NConversationUpdate(body);

      this.logger.log('[N8N] Conversation update processed successfully', {
        conversationId: body.conversationId,
        requestId: body.requestId,
      });

      return {
        success: true,
        conversationId: body.conversationId,
        requestId: body.requestId,
      };
    } catch (error) {
      this.logger.error('[N8N] Failed to process conversation update', {
        error: error instanceof Error ? error.message : String(error),
        conversationId: body.conversationId,
        requestId: body.requestId,
      });

      throw error;
    }
  }
}
