import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(@Query() query: ListConversationsDto) {
    return this.conversationsService.findAll({ status: query.status });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.conversationsService.updateStatus(id, dto.status);
  }
}
