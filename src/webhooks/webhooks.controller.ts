import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    if (
      mode === 'subscribe' &&
      token === process.env.WHATSAPP_VERIFY_TOKEN &&
      challenge
    ) {
      return challenge;
    }
    return 'ok';
  }

  @Post()
  inbound(@Body() body: WhatsAppCloudWebhook) {
    return this.webhooks.handleWhatsAppWebhook(body);
  }
}
