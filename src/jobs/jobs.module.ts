import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    PrismaModule,
  ],
  providers: [CleanupService, IdempotencyService],
  exports: [CleanupService],
})
export class JobsModule {}
