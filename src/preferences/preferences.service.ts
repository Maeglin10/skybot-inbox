import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get preferences for a user
   */
  async getPreferences(userAccountId: string) {
    const preferences = await this.prisma.userPreference.findUnique({
      where: { userAccountId },
    });

    if (!preferences) {
      throw new NotFoundException(
        `Preferences not found for user: ${userAccountId}`,
      );
    }

    return {
      id: preferences.id,
      theme: preferences.theme,
      language: preferences.language,
      timezone: preferences.timezone,
      dateFormat: preferences.dateFormat,
      timeFormat: preferences.timeFormat,
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }

  /**
   * Update preferences for a user
   */
  async updatePreferences(
    userAccountId: string,
    dto: UpdatePreferencesDto,
  ) {
    // Check if preferences exist, create if not
    const existing = await this.prisma.userPreference.findUnique({
      where: { userAccountId },
    });

    if (!existing) {
      // Create new preferences with defaults
      const created = await this.prisma.userPreference.create({
        data: {
          userAccountId,
          theme: dto.theme || 'DARK',
          language: dto.language || 'EN',
          timezone: dto.timezone || 'UTC',
          dateFormat: dto.dateFormat || 'YYYY-MM-DD',
          timeFormat: dto.timeFormat || '24h',
        },
      });

      return {
        id: created.id,
        theme: created.theme,
        language: created.language,
        timezone: created.timezone,
        dateFormat: created.dateFormat,
        timeFormat: created.timeFormat,
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    // Update existing preferences
    const updateData: Record<string, unknown> = {};
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) updateData.dateFormat = dto.dateFormat;
    if (dto.timeFormat !== undefined) updateData.timeFormat = dto.timeFormat;

    const updated = await this.prisma.userPreference.update({
      where: { userAccountId },
      data: updateData,
    });

    return {
      id: updated.id,
      theme: updated.theme,
      language: updated.language,
      timezone: updated.timezone,
      dateFormat: updated.dateFormat,
      timeFormat: updated.timeFormat,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
