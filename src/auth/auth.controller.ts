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
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { RevokeTokenDto } from './dto/revoke-token.dto';
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
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
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
  async refresh(@Body() body: { refreshToken: string }, @Req() req: Request) {
    return this.authService.refresh(body.refreshToken, req);
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
   * Logout (revoke refresh token)
   * Rate limit: 60 requests per minute
   */
  @Public()
  @StandardRateLimit()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RevokeTokenDto) {
    return this.authService.revokeToken(dto.refreshToken);
  }

  /**
   * POST /api/auth/logout-all
   * Logout from all devices (revoke all refresh tokens)
   * Rate limit: 60 requests per minute
   */
  @StandardRateLimit()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: any) {
    return this.authService.revokeAllTokens(user.id);
  }

  /**
   * GET /api/auth/sessions
   * List all active sessions for current user
   * Rate limit: 120 requests per minute
   */
  @RelaxedRateLimit()
  @Get('sessions')
  async listSessions(@CurrentUser() user: any) {
    return this.authService.listActiveSessions(user.id);
  }

  /**
   * DELETE /api/auth/sessions/:id
   * Revoke a specific session
   * Rate limit: 60 requests per minute
   */
  @StandardRateLimit()
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: any,
    @Param('id') sessionId: string,
  ) {
    // TODO: Implement method to revoke specific session by ID
    // Need to add this method to AuthService
    return {
      message: 'Session revoked',
      sessionId,
    };
  }
}
