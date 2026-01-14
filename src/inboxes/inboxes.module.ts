import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxesService } from './inboxes.service';
import { InboxesController } from './inboxes.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InboxesController],
  providers: [InboxesService],
  exports: [InboxesService],
})
export class InboxesModule {}
