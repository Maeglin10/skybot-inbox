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
  username: string;
  email?: string; // Optional - for OAuth/magic links
  accountId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
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
        username: dto.username,
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
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Find user by username
    const user = await this.prisma.userAccount.findFirst({
      where: { username: dto.username },
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
          username: user.username,
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

    if (!user || !user.email) {
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
        email: user.email,
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
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let suffix = 1;

      // Ensure username is unique within account
      while (await this.prisma.userAccount.findFirst({
        where: { accountId: demoAccount.id, username }
      })) {
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
   */
  private async generateTokens(user: any): Promise<{
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

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
