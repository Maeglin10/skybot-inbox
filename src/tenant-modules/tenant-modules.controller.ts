import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TenantModulesService } from './tenant-modules.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EnableModuleDto } from './dto/enable-module.dto';
import { UpdateModuleLimitsDto } from './dto/update-module-limits.dto';

@Controller('tenant-modules')
@UseGuards(RolesGuard)
export class TenantModulesController {
  constructor(private readonly tenantModulesService: TenantModulesService) {}

  /**
   * Get all modules for current user's tenant
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AGENT_USER)
  async getModules(@CurrentUser() user: any) {
    return this.tenantModulesService.getModules(user.accountId);
  }

  /**
   * Get specific module for current user's tenant
   */
  @Get(':moduleKey')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AGENT_USER)
  async getModule(@CurrentUser() user: any, @Param('moduleKey') moduleKey: string) {
    return this.tenantModulesService.getModule(user.accountId, moduleKey);
  }

  /**
   * Enable/disable a module (admin only)
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async enableModule(@CurrentUser() user: any, @Body() dto: EnableModuleDto) {
    return this.tenantModulesService.enableModule(user.accountId, dto);
  }

  /**
   * Update module limits (admin only)
   */
  @Put(':moduleKey/limits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async updateModuleLimits(
    @CurrentUser() user: any,
    @Param('moduleKey') moduleKey: string,
    @Body() dto: UpdateModuleLimitsDto,
  ) {
    return this.tenantModulesService.updateModuleLimits(
      user.accountId,
      moduleKey,
      dto,
    );
  }

  /**
   * Disable a module (admin only)
   */
  @Delete(':moduleKey')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async deleteModule(@CurrentUser() user: any, @Param('moduleKey') moduleKey: string) {
    return this.tenantModulesService.deleteModule(user.accountId, moduleKey);
  }
}
