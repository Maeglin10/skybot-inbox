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
import { ListConversationsDto } from './dto/list-conversations.dto';

@Controller('conversations')
@UseGuards(ApiKeyGuard)
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

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'PENDING' | 'CLOSED' },
  ) {
    return this.conversationsService.updateStatus(id, body.status);
  }
}
