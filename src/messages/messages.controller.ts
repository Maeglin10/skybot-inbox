import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { InvalidAccessTokenError } from '../common/errors/known-error';
import { Idempotent } from '../common/idempotency/idempotent.decorator';

@Controller('messages')
@UseGuards(ApiKeyGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Idempotent() // Prevent duplicate message sending with Idempotency-Key header
  send(@Req() req: Request, @Body() dto: SendMessageDto) {
    // Extract accountId from API key auth
    const accountId = (req as any).accountId;

    if (!accountId) {
      throw new InvalidAccessTokenError(
        'API key must be account-specific (format: sk_accountId_...)',
      );
    }

    return this.messagesService.send({
      accountId, // CRITICAL: Pass accountId for multi-tenancy
      conversationId: dto.conversationId,
      text: dto.text,
      externalId: dto.externalId,
    });
  }
}
