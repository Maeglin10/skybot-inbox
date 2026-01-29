import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { PresenceService } from './presence.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    PrismaModule,
    ConversationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [MessagesGateway, PresenceService],
  exports: [MessagesGateway, PresenceService],
})
export class WebsocketsModule {}
