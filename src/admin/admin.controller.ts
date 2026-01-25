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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@CurrentUser() admin: any) {
    return this.adminService.findAll(admin.accountId);
  }

  @Get('users/:id')
  async getUser(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.adminService.findOne(admin.accountId, id);
  }

  @Post('users')
  async createUser(@CurrentUser() admin: any, @Body() dto: CreateUserDto) {
    return this.adminService.create(admin.accountId, dto);
  }

  @Put('users/:id')
  async updateUser(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.update(admin.accountId, id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.adminService.delete(admin.accountId, id);
  }
}
