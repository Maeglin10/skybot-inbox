import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConversationsService } from './conversations.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

@Controller('conversations')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@Query() query: ListConversationsDto) {
    return this.conversationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string, @Query() q: ListMessagesDto) {
    return this.conversationsService.listMessages(id, q);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateConversationStatusDto,
  ) {
    return this.conversationsService.updateStatus(id, body.status);
  }
}
