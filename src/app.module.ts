import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './common/logger/winston.config';

import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { InboxesModule } from './inboxes/inboxes.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
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
import { LegalModule } from './legal/legal.module';
import { AdminModule } from './admin/admin.module';
import { TenantModulesModule } from './tenant-modules/tenant-modules.module';
import { ShopifyModule } from './shopify/shopify.module';
import { MediaModule } from './media/media.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { BillingModule } from './billing/billing.module';
import { CorporateNumbersModule } from './corporate-numbers/corporate-numbers.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TemplatesModule } from './templates/templates.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { UsersModule } from './users/users.module';
import { StoriesModule } from './stories/stories.module';
import { AppController } from './app.controller';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppCacheModule } from './common/cache/cache.module';
import { CompetitiveAnalysisModule } from './competitive-analysis/competitive-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),

    ScheduleModule.forRoot(),

    WinstonModule.forRoot({
      instance: winstonLogger,
    }),

    AppCacheModule,
    PrismaModule,
    EncryptionModule,
    LegalModule,
    AdminModule,
    TenantModulesModule,
    ShopifyModule,
    MediaModule,
    IntegrationsModule,
    BillingModule,
    CorporateNumbersModule,
    IngestionModule,
    KnowledgeModule,
    AgentsModule,
    TemplatesModule,
    WebsocketsModule,
    StoriesModule,
    AuthModule,
    AirtableModule,
    CrmModule,
    AnalyticsModule,
    AlertsModule,
    SettingsModule,
    UserPreferencesModule,
    PreferencesModule,
    ChannelsModule,
    UsersModule,
    AccountsModule,
    InboxesModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WebhooksModule,
    WhatsAppModule,
    DebugModule,
    CompetitiveAnalysisModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, TenantContextMiddleware).forRoutes('*');
  }
}
