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
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // TENANT MANAGEMENT (SUPER_ADMIN only)
  // ============================================

  @Get('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  async listTenants() {
    return this.adminService.listTenants();
  }

  @Get('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async getTenant(@Param('tenantId') tenantId: string) {
    return this.adminService.getTenant(tenantId);
  }

  @Post('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Put('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.adminService.updateTenant(tenantId, dto);
  }

  @Delete('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteTenant(@Param('tenantId') tenantId: string) {
    return this.adminService.deleteTenant(tenantId);
  }

  // ============================================
  // USER MANAGEMENT (CLIENT_ADMIN + SUPER_ADMIN)
  // ============================================

  @Get('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async listUsers(@Param('tenantId') tenantId: string) {
    return this.adminService.listUsers(tenantId);
  }

  @Get('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async getUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.getUser(tenantId, userId);
  }

  @Post('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async createUser(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.adminService.createUser(tenantId, dto);
  }

  @Put('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async updateUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(tenantId, userId, dto);
  }

  @Delete('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async deleteUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(tenantId, userId);
  }
}
