import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
@UseGuards(ApiKeyGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@Body() dto: SendMessageDto) {
    return this.messagesService.send({
      conversationId: dto.conversationId,
      text: dto.text,
      externalId: dto.externalId,
    });
  }
}
