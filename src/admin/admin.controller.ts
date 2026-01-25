import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(
    @Request() req: any,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    this.logger.log(`GET /admin/users clientKey=${req.user.clientKey}`);
    return this.adminService.findAllUsers(req.user.clientKey, role, status);
  }

  @Get('users/:id')
  async getUser(@Request() req: any, @Param('id') id: string) {
    this.logger.log(`GET /admin/users/${id} clientKey=${req.user.clientKey}`);
    return this.adminService.findOneUser(req.user.clientKey, id);
  }

  @Post('users')
  async createUser(@Request() req: any, @Body() dto: CreateUserDto) {
    this.logger.log(`POST /admin/users clientKey=${req.user.clientKey}`);
    return this.adminService.createUser(req.user.clientKey, dto);
  }

  @Patch('users/:id')
  async updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    this.logger.log(`PATCH /admin/users/${id} clientKey=${req.user.clientKey}`);
    return this.adminService.updateUser(req.user.clientKey, id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    this.logger.log(`DELETE /admin/users/${id} clientKey=${req.user.clientKey}`);
    return this.adminService.deleteUser(req.user.clientKey, id);
  }
}
