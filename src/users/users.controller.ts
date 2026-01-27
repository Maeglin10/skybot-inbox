import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.sub);
  }

  @Patch('me')
  async updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @Post('me/change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto);
  }
}
