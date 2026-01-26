import { Controller, Get, Post, Param } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async listIntegrations(@CurrentUser() user: any) {
    return this.integrationsService.listIntegrations(user.accountId);
  }

  @Post(':id/health-check')
  async healthCheck(@CurrentUser() user: any, @Param('id') id: string) {
    return this.integrationsService.healthCheck(user.accountId, id);
  }
}
