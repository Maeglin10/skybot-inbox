import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('auth/test')
export class TestLoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async testLogin(@Body() dto: LoginDto) {
    console.log('[TEST-LOGIN] Received request:', { username: dto.username, hasPassword: !!dto.password });

    try {
      const result = await this.authService.login(dto);
      console.log('[TEST-LOGIN] Success for:', dto.username);
      return { success: true, ...result };
    } catch (error) {
      console.log('[TEST-LOGIN] Failed:', error);
      throw error;
    }
  }

  @Public()
  @SkipThrottle()
  @Get('debug-user')
  async debugUser() {
    const username = 'goodlife.nexxaagents';
    const password = '4qFEZPjc8f';

    const user = await this.prisma.userAccount.findFirst({
      where: { username },
    });

    if (!user) {
      return { error: 'User not found', username };
    }

    const passwordMatch = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    return {
      found: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordMatch,
      status: user.status,
      role: user.role,
    };
  }
}
