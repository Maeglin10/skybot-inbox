import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { randomBytes } from 'crypto';

export interface JwtPayload {
  sub: string; // userAccountId
  email: string;
  accountId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // Duration in seconds for frontend cookie management
  user: {
    id: string;
    email: string | null; // Email can be null for OAuth users
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
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existing = await this.prisma.userAccount.findFirst({
      where: {
        email: dto.email,
        accountId: dto.accountId,
      },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.userAccount.create({
      data: {
        email: dto.email,
        username: dto.email.split('@')[0], // Use email prefix as username
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
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Login with username (email) and password
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Find user by username (which is email)
    const user = await this.prisma.userAccount.findFirst({
      where: { email: dto.username }, // username maps to email field
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate tokens with rememberMe setting
    const tokens = await this.generateTokens(user, dto.rememberMe);

    // Calculate expiresIn for frontend cookie management
    // - rememberMe = true: 3 days (259200 seconds)
    // - rememberMe = false: undefined (frontend will use session cookie)
    const expiresIn = dto.rememberMe ? 259200 : undefined;

    return {
      ...tokens,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.userAccount.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          accountId: user.accountId,
          role: user.role,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Request magic link (passwordless login)
   */
  async requestMagicLink(dto: MagicLinkDto): Promise<{ message: string }> {
    const user = await this.prisma.userAccount.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      return {
        message: 'If an account exists, a magic link has been sent to your email',
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

    console.log(`🔗 Magic link token for ${user.email}: ${token}`);
    console.log(`🔗 Expires at: ${expiresAt.toISOString()}`);

    return {
      message: 'If an account exists, a magic link has been sent to your email',
    };
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(
    email: string,
    token: string,
  ): Promise<AuthResponse> {
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
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Validate user (for Google OAuth and JWT strategy)
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

      user = await this.prisma.userAccount.create({
        data: {
          email,
          username: email.split('@')[0], // Use email prefix as username
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
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    };
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    user: any,
    rememberMe?: boolean,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      accountId: user.accountId,
      role: user.role,
    };

    // Refresh token duration based on rememberMe
    // - rememberMe = true: 3 days (72h) - persistent session
    // - rememberMe = false: 12h - session expires when user closes browser (frontend handles this)
    const refreshTokenExpiry = rememberMe ? '3d' : '12h';

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

    return {
      accessToken,
      refreshToken,
    };
  }
}
