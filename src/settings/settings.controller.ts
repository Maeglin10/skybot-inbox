import {
  Controller,
  Get,
  Patch,
  Body,
  Headers,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(ApiKeyGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(
    @Headers('x-client-key') clientKey: string,
    @Query('accountId') accountId: string,
  ) {
    this.logger.log(
      `GET /settings clientKey=${clientKey} accountId=${accountId}`,
    );
    return this.settingsService.getSettings(accountId, clientKey);
  }

  @Patch()
  async updateSettings(
    @Headers('x-client-key') clientKey: string,
    @Query('accountId') accountId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    this.logger.log(
      `PATCH /settings clientKey=${clientKey} accountId=${accountId}`,
    );
    return this.settingsService.updateSettings(accountId, clientKey, dto);
  }

  @Get('all')
  async listAllSettings(@Query('accountId') accountId: string) {
    this.logger.log(`GET /settings/all accountId=${accountId}`);
    return this.settingsService.listAllSettings(accountId);
  }
}
