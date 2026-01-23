import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { AirtableModule } from '../airtable/airtable.module';

@Module({
  imports: [AirtableModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
