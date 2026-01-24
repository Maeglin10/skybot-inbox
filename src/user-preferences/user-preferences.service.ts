import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { UpdatePreferencesDto, Theme, Language } from './dto/update-preferences.dto';

const PREFERENCES_TABLE = 'UserPreferences';

interface PreferencesRecord {
  userId: string;
  theme: string;
  language: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  clientKey: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: Theme;
  language: Language;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: string;
  updatedAt?: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: Theme.DARK,
  language: Language.EN,
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
};

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(private readonly airtable: AirtableService) {}

  async getPreferences(clientKey: string, userId: string): Promise<UserPreferences> {
    try {
      const records = await this.airtable.query<PreferencesRecord>(
        PREFERENCES_TABLE,
        clientKey,
        `{userId} = '${userId}'`,
      );

      if (records.length === 0) {
        // Return default preferences if none exist
        return {
          id: '',
          userId,
          ...DEFAULT_PREFERENCES,
          createdAt: new Date().toISOString(),
        };
      }

      return this.mapRecordToPreferences(records[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch preferences for user ${userId}:`, error);
      // Return defaults on error
      return {
        id: '',
        userId,
        ...DEFAULT_PREFERENCES,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async updatePreferences(
    clientKey: string,
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    try {
      // Check if preferences exist
      const records = await this.airtable.query<PreferencesRecord>(
        PREFERENCES_TABLE,
        clientKey,
        `{userId} = '${userId}'`,
      );

      const now = new Date().toISOString();

      if (records.length === 0) {
        // Create new preferences
        const record = await this.airtable.create<PreferencesRecord>(PREFERENCES_TABLE, {
          userId,
          theme: dto.theme || DEFAULT_PREFERENCES.theme,
          language: dto.language || DEFAULT_PREFERENCES.language,
          timezone: dto.timezone || DEFAULT_PREFERENCES.timezone,
          dateFormat: dto.dateFormat || DEFAULT_PREFERENCES.dateFormat,
          timeFormat: dto.timeFormat || DEFAULT_PREFERENCES.timeFormat,
          clientKey,
          createdAt: now,
          updatedAt: now,
        });

        return this.mapRecordToPreferences(record);
      }

      // Update existing preferences
      const updateFields: Record<string, unknown> = {
        updatedAt: now,
      };

      if (dto.theme !== undefined) updateFields.theme = dto.theme;
      if (dto.language !== undefined) updateFields.language = dto.language;
      if (dto.timezone !== undefined) updateFields.timezone = dto.timezone;
      if (dto.dateFormat !== undefined) updateFields.dateFormat = dto.dateFormat;
      if (dto.timeFormat !== undefined) updateFields.timeFormat = dto.timeFormat;

      const record = await this.airtable.update<PreferencesRecord>(
        PREFERENCES_TABLE,
        records[0].id,
        updateFields,
      );

      return this.mapRecordToPreferences(record);
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}:`, error);
      throw error;
    }
  }

  async resetPreferences(clientKey: string, userId: string): Promise<UserPreferences> {
    try {
      const records = await this.airtable.query<PreferencesRecord>(
        PREFERENCES_TABLE,
        clientKey,
        `{userId} = '${userId}'`,
      );

      if (records.length > 0) {
        await this.airtable.delete(PREFERENCES_TABLE, records[0].id);
      }

      return {
        id: '',
        userId,
        ...DEFAULT_PREFERENCES,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to reset preferences for user ${userId}:`, error);
      throw error;
    }
  }

  private mapRecordToPreferences(record: { id: string; fields: PreferencesRecord }): UserPreferences {
    return {
      id: record.id,
      userId: record.fields.userId,
      theme: (record.fields.theme as Theme) || DEFAULT_PREFERENCES.theme,
      language: (record.fields.language as Language) || DEFAULT_PREFERENCES.language,
      timezone: record.fields.timezone || DEFAULT_PREFERENCES.timezone,
      dateFormat: record.fields.dateFormat || DEFAULT_PREFERENCES.dateFormat,
      timeFormat: record.fields.timeFormat || DEFAULT_PREFERENCES.timeFormat,
      createdAt: record.fields.createdAt || new Date().toISOString(),
      updatedAt: record.fields.updatedAt,
    };
  }
}
