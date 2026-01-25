import { Controller, Get, Query } from '@nestjs/common';
import { InboxesService } from './inboxes.service';
import { Channel } from '../prisma';

function asString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s === 'null' || s === 'undefined') return undefined;
  return s;
}

function parseChannel(v?: string): Channel | undefined {
  if (!v) return undefined;
  const u = v.trim().toUpperCase();
  if (
    u === 'WHATSAPP' ||
    u === 'INSTAGRAM' ||
    u === 'FACEBOOK' ||
    u === 'EMAIL' ||
    u === 'WEB'
  ) {
    return u as Channel;
  }
  return undefined;
}

@Controller('inboxes')
export class InboxesController {
  constructor(private readonly inboxes: InboxesService) {}

  // GET /inboxes?accountId=...&channel=WHATSAPP
  @Get()
  list(
    @Query('accountId') accountIdQ?: string,
    @Query('channel') channelQ?: string,
  ) {
    const accountId = asString(accountIdQ) ?? 'Demo'; // fallback dev
    const channel = parseChannel(asString(channelQ));
    return this.inboxes.listInboxes({ accountId, channel });
  }
}
