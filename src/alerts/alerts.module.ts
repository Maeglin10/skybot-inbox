import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import {
  AlertsController,
  CorporateAlertsController,
} from './alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../auth/api-keys/api-keys.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ApiKeysModule, AuthModule],
  controllers: [AlertsController, CorporateAlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
