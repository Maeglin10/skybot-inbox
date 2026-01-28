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

  @Public()
  @SkipThrottle()
  @Post('create-goodlife')
  async createGoodLife() {
    try {
      // Check if GoodLife account exists
      let account = await this.prisma.account.findFirst({
        where: {
          OR: [
            { name: { contains: 'Goodlife', mode: 'insensitive' } },
            { name: { contains: 'GoodLife', mode: 'insensitive' } },
          ],
        },
      });

      if (!account) {
        account = await this.prisma.account.create({
          data: {
            name: 'Goodlife Costa Rica',
            isDemo: false,
            tier: 'STARTER',
            status: 'ACTIVE',
          },
        });
      }

      // Check if user exists
      let user = await this.prisma.userAccount.findFirst({
        where: { username: 'goodlife.nexxaagents' },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        user = await this.prisma.userAccount.create({
          data: {
            accountId: account.id,
            username: 'goodlife.nexxaagents',
            email: 'ventas@goodlifecr.com',
            passwordHash,
            name: 'GoodLife Agent',
            role: 'USER',
            status: 'ACTIVE',
          },
        });
      }

      return {
        success: true,
        accountId: account.id,
        userId: user.id,
        message: 'GoodLife created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
