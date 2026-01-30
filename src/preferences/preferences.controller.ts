import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /**
   * GET /preferences/:userAccountId
   * Get user preferences
   */
  @Get(':userAccountId')
  async getPreferences(
    @CurrentUser() user: any,
    @Param('userAccountId') userAccountId: string,
  ) {
    const targetId = userAccountId === 'me' ? user.userAccountId || user.accountId : userAccountId;
    return this.preferencesService.getPreferences(targetId);
  }

  /**
   * PATCH /api/preferences/:userAccountId
   * Update user preferences
   */
  @Patch(':userAccountId')
  async updatePreferences(
    @CurrentUser() user: any,
    @Param('userAccountId') userAccountId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const targetId = userAccountId === 'me' ? user.userAccountId || user.accountId : userAccountId;
    return this.preferencesService.updatePreferences(targetId, dto);
  }
}
