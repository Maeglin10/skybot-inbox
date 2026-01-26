import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { SkybotApiClient } from './skybot-api.client';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { AgentsGateway } from '../websockets/agents.gateway';

@Module({
  imports: [HttpModule, PrismaModule, AuthModule, WebsocketsModule],
  controllers: [AgentsController],
  providers: [AgentsService, SkybotApiClient],
  exports: [AgentsService],
})
export class AgentsModule implements OnModuleInit {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentsGateway: AgentsGateway,
  ) {}

  onModuleInit() {
    // Inject gateway into service to emit WebSocket events
    this.agentsService.setGateway(this.agentsGateway);
  }
}
