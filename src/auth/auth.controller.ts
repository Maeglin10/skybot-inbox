import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Request, Response } from 'express';
import {
  AuthRateLimit,
  StandardRateLimit,
  RelaxedRateLimit,
  PasswordResetRateLimit,
} from '../common/rate-limit/rate-limit.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * DISABLED: Registration is invitation-only
   * Only admins can create users via /api/admin/users
   */
  // @Public()
  // @Post('register')
  // async register(@Body() dto: RegisterDto) {
  //   return this.authService.register(dto);
  // }

  /**
   * POST /api/auth/login
   * Login with email and password
   * Rate limit: 5 requests per minute (prevent brute force)
   */
  @Public()
  @AuthRateLimit()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * Rate limit: 60 requests per minute
   */
  @Public()
  @StandardRateLimit()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  /**
   * POST /api/auth/magic-link
   * Request a magic link for passwordless login
   * Rate limit: 3 requests per 5 minutes (prevent abuse)
   */
  @Public()
  @PasswordResetRateLimit()
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.requestMagicLink(dto);
  }

  /**
   * GET /api/auth/magic-link/verify
   * Verify magic link token
   * Rate limit: 5 requests per minute
   */
  @Public()
  @AuthRateLimit()
  @Get('magic-link/verify')
  async verifyMagicLink(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return this.authService.verifyMagicLink(email, token);
  }

  /**
   * GET /api/auth/google
   * Initiate Google OAuth flow
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * GET /api/auth/google/callback
   * Google OAuth callback
   * Rate limit: 60 requests per minute
   */
  @Public()
  @StandardRateLimit()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // User is authenticated via Google OAuth
    const authResponse = req.user as any;

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;

    res.redirect(redirectUrl);
  }

  /**
   * GET /api/auth/me
   * Get current user info (protected route example)
   * Rate limit: 120 requests per minute (read-only)
   */
  @RelaxedRateLimit()
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      accountId: user.accountId,
      role: user.role,
    };
  }

  /**
   * POST /api/auth/logout
   * Logout (invalidate tokens - client-side for JWT)
   * Rate limit: 60 requests per minute
   */
  @StandardRateLimit()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return {
      message: 'Logged out successfully',
    };
  }
}
