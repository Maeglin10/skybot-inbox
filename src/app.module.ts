import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { InboxesModule } from './inboxes/inboxes.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DebugModule } from './debug/debug.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),

    PrismaModule,
    AgentsModule,
    AuthModule,
    AccountsModule,
    InboxesModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WebhooksModule,
    DebugModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
