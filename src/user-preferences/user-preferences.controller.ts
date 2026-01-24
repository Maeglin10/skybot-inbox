import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { UserPreferencesService } from './user-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('user-preferences')
@UseGuards(ApiKeyGuard)
export class UserPreferencesController {
  private readonly logger = new Logger(UserPreferencesController.name);

  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get(':userId')
  async getPreferences(
    @Headers('x-client-key') clientKey: string,
    @Param('userId') userId: string,
  ) {
    this.logger.log(`GET /user-preferences/${userId} clientKey=${clientKey}`);
    return this.preferencesService.getPreferences(clientKey, userId);
  }

  @Patch(':userId')
  async updatePreferences(
    @Headers('x-client-key') clientKey: string,
    @Param('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    this.logger.log(`PATCH /user-preferences/${userId} clientKey=${clientKey}`);
    return this.preferencesService.updatePreferences(clientKey, userId, dto);
  }

  @Post(':userId/reset')
  async resetPreferences(
    @Headers('x-client-key') clientKey: string,
    @Param('userId') userId: string,
  ) {
    this.logger.log(`POST /user-preferences/${userId}/reset clientKey=${clientKey}`);
    return this.preferencesService.resetPreferences(clientKey, userId);
  }
}
