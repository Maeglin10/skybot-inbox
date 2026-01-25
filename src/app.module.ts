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
import { AirtableModule } from './airtable/airtable.module';
import { CrmModule } from './crm/crm.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AlertsModule } from './alerts/alerts.module';
import { SettingsModule } from './settings/settings.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { PreferencesModule } from './preferences/preferences.module';
import { ChannelsModule } from './channels/channels.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),

    PrismaModule,
    EncryptionModule,
    AgentsModule,
    AuthModule,
    AirtableModule,
    CrmModule,
    AnalyticsModule,
    AlertsModule,
    SettingsModule,
    UserPreferencesModule,
    PreferencesModule,
    ChannelsModule,
    AccountsModule,
    InboxesModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WebhooksModule,
    DebugModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
