import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { randomBytes, createHash } from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InvalidRefreshTokenError } from '../common/errors/known-error';

export interface JwtPayload {
  sub: string; // userAccountId
  username: string;
  email?: string; // Optional - for OAuth/magic links
  accountId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // Duration in seconds for frontend cookie management
  user: {
    id: string;
    username: string;
    email?: string | null;
    name: string | null;
    role: string;
    accountId: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists by username
    const existing = await this.prisma.userAccount.findFirst({
      where: {
        username: dto.username,
        accountId: dto.accountId,
      },
    });

    if (existing) {
      throw new ConflictException('User with this username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.userAccount.create({
      data: {
        username: dto.username || dto.email?.split('@')[0] || 'user',
        email: dto.email,
        passwordHash: hashedPassword,
        name: dto.name || 'User',
        accountId: dto.accountId,
        role: 'USER', // Default role
        status: 'ACTIVE',
      },
    });

    // Create default preferences for the user
    await this.prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'EN',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Login with username and password
   */
  async login(dto: LoginDto, request?: any): Promise<AuthResponse> {
    this.logger.info('Login attempt', {
      username: dto.username,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });

    // Find user by username
    const user = await this.prisma.userAccount.findFirst({
      where: { username: dto.username },
    });

    if (!user || !user.passwordHash) {
      this.logger.warn('Login failed: User not found or no password', {
        username: dto.username,
        userExists: !!user,
        ip: request?.ip,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn('Login failed: Invalid password', {
        username: dto.username,
        userId: user.id,
        ip: request?.ip,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      this.logger.warn('Login failed: Account not active', {
        username: dto.username,
        userId: user.id,
        status: user.status,
        ip: request?.ip,
      });
      throw new UnauthorizedException('Account is not active');
    }

    this.logger.info('Login successful', {
      userId: user.id,
      username: user.username,
      accountId: user.accountId,
      ip: request?.ip,
    });

    // Generate tokens with rememberMe setting
    const tokens = await this.generateTokens(user, dto.rememberMe, request);

    // Calculate expiresIn for frontend cookie management
    // - rememberMe = true: 3 days (259200 seconds)
    // - rememberMe = false: undefined (frontend will use session cookie)
    const expiresIn = dto.rememberMe ? 259200 : undefined;

    return {
      ...tokens,
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Refresh access token
   * SECURITY FIX P1: Database checks BEFORE JWT verification to prevent race conditions
   */
  async refresh(
    refreshToken: string,
    request?: any,
  ): Promise<{ accessToken: string }> {
    try {
      // SECURITY: Check database FIRST (before JWT verification)
      // This prevents race conditions where token is revoked during JWT verify
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // Lookup token in database with user details
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: tokenHash },
        include: {
          userAccount: {
            include: {
              account: {
                select: { id: true, status: true },
              },
            },
          },
        },
      });

      // Check token exists
      if (!storedToken) {
        throw new InvalidRefreshTokenError('Token not found');
      }

      // Check if token is revoked (prevents revoked tokens from being used)
      if (storedToken.revokedAt) {
        this.logger.warn('Attempted use of revoked token', {
          tokenId: storedToken.id,
          userId: storedToken.userAccountId,
          revokedReason: storedToken.revokedReason,
        });
        throw new InvalidRefreshTokenError(
          `Token revoked: ${storedToken.revokedReason}`,
        );
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        throw new InvalidRefreshTokenError('Token expired');
      }

      // Check if user account is still active
      if (storedToken.userAccount.status !== 'ACTIVE') {
        this.logger.warn('Token refresh attempt for inactive user', {
          userId: storedToken.userAccountId,
          status: storedToken.userAccount.status,
        });
        throw new InvalidRefreshTokenError('User account is not active');
      }

      // Check if parent account is still active
      if (storedToken.userAccount.account.status !== 'ACTIVE') {
        this.logger.warn('Token refresh attempt for inactive account', {
          accountId: storedToken.userAccount.accountId,
          status: storedToken.userAccount.account.status,
        });
        throw new InvalidRefreshTokenError('Account is not active');
      }

      // NOW verify JWT signature (after all database checks)
      // If JWT is invalid, all the above checks still protect us
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Update last used timestamp
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { lastUsedAt: new Date() },
      });

      // Generate new access token
      const accessToken = this.jwtService.sign(
        {
          sub: storedToken.userAccount.id,
          username: storedToken.userAccount.username,
          email: storedToken.userAccount.email,
          accountId: storedToken.userAccount.accountId,
          role: storedToken.userAccount.role,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        throw error;
      }
      throw new InvalidRefreshTokenError('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke a specific refresh token (logout)
   */
  async revokeToken(
    refreshToken: string,
    reason: string = 'user_logout',
  ): Promise<{ success: boolean }> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!storedToken) {
      // Token doesn't exist - already logged out or invalid
      return { success: true };
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    return { success: true };
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllTokens(
    userAccountId: string,
    reason: string = 'user_logout_all',
  ): Promise<{ count: number }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userAccountId,
        revokedAt: null, // Only revoke active tokens
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    return { count: result.count };
  }

  /**
   * List active sessions for a user
   */
  async listActiveSessions(userAccountId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userAccountId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions;
  }

  /**
   * Request magic link (passwordless login)
   */
  async requestMagicLink(dto: MagicLinkDto): Promise<{ message: string }> {
    const user = await this.prisma.userAccount.findFirst({
      where: { email: dto.email },
    });

    if (!user || !user.email) {
      // Don't reveal if user exists or not (security)
      return {
        message:
          'If an account exists, a magic link has been sent to your email',
      };
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in database
    await this.prisma.magicLink.create({
      data: {
        email: dto.email, // Use dto.email since that's what we searched for
        token,
        expiresAt,
      },
    });

    // TODO: Send email with magic link
    // const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}&email=${user.email}`;
    // await this.emailService.sendMagicLink(user.email, magicLinkUrl);

    this.logger.info('Magic link generated', {
      email: user.email,
      token,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      message: 'If an account exists, a magic link has been sent to your email',
    };
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(email: string, token: string): Promise<AuthResponse> {
    const magicLink = await this.prisma.magicLink.findFirst({
      where: {
        email,
        token,
        used: false,
      },
    });

    if (!magicLink) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new BadRequestException('Magic link has expired');
    }

    // Mark magic link as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    // Find user
    const user = await this.prisma.userAccount.findFirst({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid user');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Validate user by ID (for JWT strategy)
   */
  async validateUserById(id: string): Promise<any> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  /**
   * Validate user by email (for Google OAuth and Magic Links)
   */
  async validateUser(email: string): Promise<any> {
    const user = await this.prisma.userAccount.findFirst({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  /**
   * Google OAuth login
   */
  async validateGoogleUser(profile: any): Promise<AuthResponse> {
    const { email, name, picture } = profile;

    let user = await this.prisma.userAccount.findFirst({
      where: { email },
    });

    if (!user) {
      // Auto-create user from Google OAuth
      // Get demo account for now (in production, you'd want to handle this differently)
      const demoAccount = await this.prisma.account.findFirst({
        where: { isDemo: true },
      });

      if (!demoAccount) {
        throw new BadRequestException('No default account found');
      }

      // Generate username from email (part before @)
      const baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let suffix = 1;

      // Ensure username is unique within account
      while (
        await this.prisma.userAccount.findFirst({
          where: { accountId: demoAccount.id, username },
        })
      ) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = await this.prisma.userAccount.create({
        data: {
          username,
          email,
          name: name || 'User',
          accountId: demoAccount.id,
          role: 'USER',
          status: 'ACTIVE',
          passwordHash: null, // No password for OAuth users
        },
      });

      // Create default preferences
      await this.prisma.userPreference.create({
        data: {
          userAccountId: user.id,
          theme: 'DEFAULT',
          language: 'EN',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Generate JWT access and refresh tokens
   * SECURITY FIX: Now stores refresh tokens in database for revocation support
   */
  private async generateTokens(
    user: any,
    rememberMe?: boolean,
    request?: any,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      accountId: user.accountId,
      role: user.role,
    };

    // Refresh token duration based on rememberMe
    // - rememberMe = true: 3 days (72h) - persistent session
    // - rememberMe = false: 12h - session expires when user closes browser (frontend handles this)
    const refreshTokenExpiry = rememberMe ? '3d' : '12h';
    const refreshTokenExpiryMs = rememberMe
      ? 3 * 24 * 60 * 60 * 1000
      : 12 * 60 * 60 * 1000;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshTokenExpiry,
      }),
    ]);

    // Store refresh token in database (hashed for security)
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Extract device info from user agent
    const userAgent = request?.headers?.['user-agent'] || 'Unknown';
    const deviceInfo = this.parseUserAgent(userAgent);

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userAccountId: user.id,
        accountId: user.accountId,
        ipAddress: request?.ip || request?.socket?.remoteAddress || null,
        userAgent,
        deviceInfo,
        expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Parse user agent string to extract device info
   */
  private parseUserAgent(userAgent: string): any {
    // Simple parser - can be enhanced with a library like ua-parser-js
    const info: any = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
    };

    // Detect browser
    if (userAgent.includes('Chrome')) info.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
    else if (userAgent.includes('Safari')) info.browser = 'Safari';
    else if (userAgent.includes('Edge')) info.browser = 'Edge';

    // Detect OS
    if (userAgent.includes('Windows')) info.os = 'Windows';
    else if (userAgent.includes('Mac')) info.os = 'macOS';
    else if (userAgent.includes('Linux')) info.os = 'Linux';
    else if (userAgent.includes('Android')) info.os = 'Android';
    else if (userAgent.includes('iOS')) info.os = 'iOS';

    // Detect device type
    if (userAgent.includes('Mobile')) info.device = 'Mobile';
    else if (userAgent.includes('Tablet')) info.device = 'Tablet';
    else info.device = 'Desktop';

    return info;
  }
}
