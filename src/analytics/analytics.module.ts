import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AirtableModule } from '../airtable/airtable.module';

@Module({
  imports: [PrismaModule, AirtableModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
