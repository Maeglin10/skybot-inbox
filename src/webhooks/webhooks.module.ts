import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SkybotWebhooksController } from './skybot-webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [PrismaModule, ClientsModule, AgentsModule],
  controllers: [WebhooksController, SkybotWebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
