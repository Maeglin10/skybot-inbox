import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('auth/test')
export class TestLoginController {
  constructor(private readonly authService: AuthService) {}

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
}
