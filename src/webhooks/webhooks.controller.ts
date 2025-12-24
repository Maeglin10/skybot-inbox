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

@Controller('webhooks/whatsapp')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

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
