import { Module } from '@nestjs/common';
import { InboxesService } from './inboxes.service';

@Module({
  providers: [InboxesService]
})
export class InboxesModule {}
