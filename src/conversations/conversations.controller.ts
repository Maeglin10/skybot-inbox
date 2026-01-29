import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import type { ConversationStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

function asString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s === 'null' || s === 'undefined') return undefined;
  return s;
}

function asInt(v: unknown, fallback: number): number {
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  return fallback;
}

function asStatus(v: unknown): ConversationStatus | undefined {
  const s = asString(v);
  if (s === 'OPEN' || s === 'PENDING' || s === 'CLOSED') return s;
  return undefined;
}

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') statusQ?: string,
    @Query('inboxId') inboxIdQ?: string,
    @Query('channel') channelQ?: string,
    @Query('limit') limitQ?: string,
    @Query('cursor') cursorQ?: string,
    @Query('lite') liteQ?: string,
    @Query('corporate') corporateQ?: string, // P1: Corporate filter
  ) {
    const status = asStatus(statusQ);
    const inboxId = asString(inboxIdQ);
    const channel = asString(channelQ); // 'WHATSAPP' | 'EMAIL' | ...
    const limit = asInt(limitQ, 20);
    const cursor = asString(cursorQ);
    const lite = liteQ === '1' || liteQ === 'true';
    const corporate =
      corporateQ === '1' || corporateQ === 'true'
        ? true
        : corporateQ === '0' || corporateQ === 'false'
          ? false
          : undefined;

    return this.conversationsService.findAll({
      accountId: user.accountId, // CRITICAL: Filter by authenticated user's account
      status,
      inboxId,
      channel,
      limit,
      cursor,
      lite,
      corporate,
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
    const limit = asInt(limitQ, 20);
    const cursor = asString(cursorQ);

    return this.conversationsService.listMessages(user.accountId, id, {
      limit,
      cursor,
    });
  }
}
