import { Controller, Get, Param, Patch, Query, Body } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

type Status = 'OPEN' | 'CLOSED';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @Query('status') status?: Status,
    @Query('inboxId') inboxId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('lite') lite?: string,
  ) {
    return this.conversationsService.findAll({
      status,
      inboxId,
      limit: limit ? Number(limit) : undefined,
      cursor,
      lite: lite === '1' || lite === 'true',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: Status },
  ) {
    return this.conversationsService.updateStatus(id, body.status);
  }

  @Get(':id/messages')
  async listMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.listMessages(id, {
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
  }
}
