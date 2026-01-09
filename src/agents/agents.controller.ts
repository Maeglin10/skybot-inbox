import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AgentsService } from './agents.service';
import { TriggerAgentDto } from './dto/trigger-agent.dto';

@Controller('agents')
@UseGuards(ApiKeyGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('trigger')
  trigger(@Body() dto: TriggerAgentDto) {
    return this.agentsService.trigger({
      conversationId: dto.conversationId,
      agentKey: dto.agentKey,
      inputText: dto.inputText,
    });
  }
}
