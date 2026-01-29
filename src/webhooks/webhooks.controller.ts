import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { WebhooksService } from './webhooks.service';
import { WhatsAppSignatureGuard } from './whatsapp-signature.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Get()
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
  @Post('debug')
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
  @Post()
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
}
