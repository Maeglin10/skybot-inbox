
import { Controller, Get, Param, Patch, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import type { ConversationStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryConversationsDto } from './dto/query-conversations.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * List conversations with proper pagination and validation
   * P1 FIX: Now uses DTO with class-validator for type-safe query params
   */
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() query: QueryConversationsDto,
    @Query('inboxId') inboxId?: string,
    @Query('channel') channel?: string,
    @Query('corporate') corporate?: string,
  ) {
    if (!user || !user.accountId) {
      throw new UnauthorizedException('User account context missing');
    }

    // Parse optional filters (not in main DTO to keep it simple)
    const corporateFilter =
      corporate === '1' || corporate === 'true'
        ? true
        : corporate === '0' || corporate === 'false'
          ? false
          : undefined;

    return this.conversationsService.findAll({
      accountId: user.accountId, // CRITICAL: Filter by authenticated user's account
      status: query.status,
      inboxId,
      channel,
      limit: query.limit,
      cursor: query.cursor,
      lite: query.lite,
      corporate: corporateFilter,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.findOne(user.accountId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: ConversationStatus },
  ) {
    return this.conversationsService.updateStatus(
      user.accountId,
      id,
      body.status,
    );
  }

  // GET /conversations/:id/messages?limit=20&cursor=...
  @Get(':id/messages')
  listMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('limit') limitQ?: string,
    @Query('cursor') cursorQ?: string,
  ) {
    const limit = limitQ ? parseInt(limitQ, 10) : 20;
    const cursor = cursorQ || undefined;

    return this.conversationsService.listMessages(user.accountId, id, {
      limit,
      cursor,
    });
  }
}
