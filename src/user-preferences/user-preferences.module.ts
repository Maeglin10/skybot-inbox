import { Module } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController } from './user-preferences.controller';
import { AirtableModule } from '../airtable/airtable.module';

@Module({
  imports: [AirtableModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
