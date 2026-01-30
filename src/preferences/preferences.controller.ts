import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /**
   * GET /api/preferences/:userAccountId
   * Get user preferences
   */
  @Get(':userAccountId')
  async getPreferences(@Param('userAccountId') userAccountId: string) {
    return this.preferencesService.getPreferences(userAccountId);
  }

  /**
   * PATCH /api/preferences/:userAccountId
   * Update user preferences
   */
  @Patch(':userAccountId')
  async updatePreferences(
    @Param('userAccountId') userAccountId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(userAccountId, dto);
  }
}
