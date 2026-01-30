import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SkybotWebhooksController } from './skybot-webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { AgentsModule } from '../agents/agents.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, ClientsModule, AgentsModule, WhatsAppModule, MessagesModule],
  controllers: [WebhooksController, SkybotWebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
