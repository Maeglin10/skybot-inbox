import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto, Theme, Language } from './dto/update-preferences.dto';
import {
  Theme as PrismaTheme,
  Language as PrismaLanguage,
} from '@prisma/client';

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

const DEFAULT_PREFERENCES = {
  theme: Theme.DARK,
  language: Language.EN,
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
};

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(clientKey: string, userId: string): Promise<UserPreferences> {
    try {
      const prefs = await this.prisma.userPreference.findUnique({
        where: { userAccountId: userId },
      });

      if (!prefs) {
        return {
          id: '',
          userId,
          ...DEFAULT_PREFERENCES,
          createdAt: new Date().toISOString(),
        };
      }

      return this.mapToUserPreferences(prefs, userId);
    } catch (error) {
      this.logger.error(`Failed to fetch preferences for user ${userId}:`, error);
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
      const existing = await this.prisma.userPreference.findUnique({
        where: { userAccountId: userId },
      });

      if (!existing) {
        // Create new preferences
        const prefs = await this.prisma.userPreference.create({
          data: {
            userAccountId: userId,
            theme: (dto.theme || DEFAULT_PREFERENCES.theme) as PrismaTheme,
            language: (dto.language || DEFAULT_PREFERENCES.language) as PrismaLanguage,
            timezone: dto.timezone || DEFAULT_PREFERENCES.timezone,
            dateFormat: dto.dateFormat || DEFAULT_PREFERENCES.dateFormat,
            timeFormat: dto.timeFormat || DEFAULT_PREFERENCES.timeFormat,
          },
        });

        return this.mapToUserPreferences(prefs, userId);
      }

      // Update existing
      const prefs = await this.prisma.userPreference.update({
        where: { userAccountId: userId },
        data: {
          ...(dto.theme !== undefined && { theme: dto.theme as PrismaTheme }),
          ...(dto.language !== undefined && { language: dto.language as PrismaLanguage }),
          ...(dto.timezone !== undefined && { timezone: dto.timezone }),
          ...(dto.dateFormat !== undefined && { dateFormat: dto.dateFormat }),
          ...(dto.timeFormat !== undefined && { timeFormat: dto.timeFormat }),
        },
      });

      return this.mapToUserPreferences(prefs, userId);
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}:`, error);
      throw error;
    }
  }

  async resetPreferences(clientKey: string, userId: string): Promise<UserPreferences> {
    try {
      await this.prisma.userPreference.deleteMany({
        where: { userAccountId: userId },
      });

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

  private mapToUserPreferences(prefs: any, userId: string): UserPreferences {
    return {
      id: prefs.id,
      userId,
      theme: prefs.theme as Theme,
      language: prefs.language as Language,
      timezone: prefs.timezone,
      dateFormat: prefs.dateFormat,
      timeFormat: prefs.timeFormat,
      createdAt: prefs.createdAt.toISOString(),
      updatedAt: prefs.updatedAt?.toISOString(),
    };
  }
}
