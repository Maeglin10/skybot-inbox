import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ApiKeysModule } from '../auth/api-keys/api-keys.module';

@Module({
  imports: [PrismaModule, ApiKeysModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
