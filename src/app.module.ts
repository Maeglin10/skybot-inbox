import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { InboxesModule } from './inboxes/inboxes.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, AccountsModule, InboxesModule, ContactsModule, ConversationsModule, MessagesModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
