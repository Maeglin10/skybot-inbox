// src/conversations/conversations.module.ts
import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationParticipantService } from './conversation-participant.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationParticipantService],
  exports: [ConversationsService, ConversationParticipantService],
})
export class ConversationsModule {}
