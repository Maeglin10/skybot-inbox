import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('conversations')
@UseGuards(ApiKeyGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @Query('status') status?: 'OPEN' | 'PENDING' | 'CLOSED',
    @Query('inboxId') inboxId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.findAll({
      status,
      inboxId,
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'PENDING' | 'CLOSED' },
  ) {
    return this.conversationsService.updateStatus(id, body.status);
  }
}
