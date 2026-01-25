import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDirection } from '../prisma';
import { TriggerAgentDto } from './dto/trigger-agent.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly agentsService: AgentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('trigger')
  @UseGuards(ApiKeyGuard)
  async trigger(@Body() dto: TriggerAgentDto) {
    this.logger.log(
      `trigger in conversationId=${dto.conversationId} agentKey=${dto.agentKey}`,
    );

    const lastIn = await this.prisma.message.findFirst({
      where: {
        conversationId: dto.conversationId,
        direction: MessageDirection.IN,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const lastAny =
      lastIn ??
      (await this.prisma.message.findFirst({
        where: { conversationId: dto.conversationId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      }));

    if (!lastAny) {
      // pas de message -> on refuse proprement plutôt qu'envoyer une connerie
      // (sinon tu logs des routing vides + debug horrible)
      throw new Error(
        `No message found for conversationId=${dto.conversationId}`,
      );
    }

    return this.agentsService.trigger({
      conversationId: dto.conversationId,
      messageId: lastAny.id,
      agentKey: dto.agentKey,
      inputText: dto.inputText,
    });
  }
}
