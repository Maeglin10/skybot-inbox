import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';
import { WebhooksService } from './webhooks.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? 'dev-token';
    if (mode === 'subscribe' && token === expected)
      return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  incoming(@Body() body: WhatsAppCloudWebhook) {
    return this.webhooksService.handleWhatsAppWebhook(body);
  }
}
