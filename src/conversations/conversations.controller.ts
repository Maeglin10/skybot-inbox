import { Controller, Get, Param, Patch, Query, Body } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

function asInt(v: unknown, fallback: number) {
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return fallback;
}
function asBool(v: unknown) {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v !== 'string') return false;
  return v === '1' || v.toLowerCase() === 'true';
}
function asString(v: unknown) {
  return typeof v === 'string' ? v : undefined;
}

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(@Query() q: Record<string, unknown>) {
    const limit = asInt(q.limit, 20);
    const lite = asBool(q.lite);
    const cursor = asString(q.cursor);
    const status = asString(q.status) as
      | 'OPEN'
      | 'PENDING'
      | 'CLOSED'
      | undefined;
    const inboxId = asString(q.inboxId);

    return this.conversationsService.findAll({
      limit,
      lite,
      cursor,
      status,
      inboxId,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  async patchStatus(
    @Param('id') id: string,
    @Body() body: { status?: 'OPEN' | 'PENDING' | 'CLOSED' },
  ) {
    const next = body?.status;
    return this.conversationsService.updateStatus(
      id,
      next === 'OPEN' || next === 'PENDING' || next === 'CLOSED'
        ? next
        : 'OPEN',
    );
  }

  // ✅ route messages (si déjà déclarée ici chez toi)
  @Get(':id/messages')
  async listMessages(
    @Param('id') id: string,
    @Query() q: Record<string, unknown>,
  ) {
    const limit = asInt(q.limit, 20);
    const cursor = asString(q.cursor);
    return this.conversationsService.listMessages(id, { limit, cursor });
  }
}
