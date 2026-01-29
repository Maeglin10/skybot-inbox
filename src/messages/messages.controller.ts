import { Body, Controller, Post, Get, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { InvalidAccessTokenError } from '../common/errors/known-error';
import { Idempotent } from '../common/idempotency/idempotent.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
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

  /**
   * Full-text search messages
   * Uses PostgreSQL tsvector for fast, ranked search results
   */
  @Get('search')
  async search(
    @CurrentUser() user: any,
    @Query() dto: SearchMessagesDto,
  ) {
    return this.messagesService.search({
      accountId: user.accountId,
      query: dto.query,
      conversationId: dto.conversationId,
      inboxId: dto.inboxId,
      limit: dto.limit,
      offset: dto.offset,
    });
  }
}
