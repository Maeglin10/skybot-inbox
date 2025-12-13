import { Body, Controller, Get, HttpCode, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappWebhookVerifyQueryDto } from './dto/whatsapp-webhook.dto';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly config: ConfigService) {}

  @Get()
  verify(@Query() q: WhatsappWebhookVerifyQueryDto) {
    const mode = q['hub.mode'];
    const token = q['hub.verify_token'];
    const challenge = q['hub.challenge'];

    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (!expected) return 'Missing WHATSAPP_VERIFY_TOKEN';

    if (mode === 'subscribe' && token === expected) {
      return challenge ?? '';
    }
    return 'Forbidden';
  }

  @Post()
  @HttpCode(200)
  receive(@Body() body: unknown) {
    // v1: on accepte, on log, on ne casse pas le webhook.
    this.logger.log(`Inbound webhook received`);
    this.logger.debug(JSON.stringify(body));
    return { ok: true };
  }
}
