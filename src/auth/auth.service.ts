import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  role: string;
  clientKey: string;
  accountId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  avatarUrl?: string;
  clientKey: string;
  accountId: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, clientKey: string): Promise<AuthUser | null> {
    // First find the account for this client key
    const clientConfig = await (this.prisma as any).clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    if (!clientConfig) {
      this.logger.warn(`No client config found for key: ${clientKey}`);
      return null;
    }

    // Find user in this account
    const user = await (this.prisma as any).userAccount.findFirst({
      where: {
        accountId: clientConfig.accountId,
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      return null;
    }

    if (user.status !== 'ACTIVE') {
      this.logger.warn(`User account not active: ${email}`);
      return null;
    }

    // Check password
    if (!user.passwordHash) {
      this.logger.warn(`User has no password set: ${email}`);
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.email.split('@')[0],
      role: user.role,
      avatarUrl: user.avatarUrl || undefined,
      clientKey,
      accountId: clientConfig.accountId,
    };
  }

  async login(dto: LoginDto, clientKey: string): Promise<LoginResponse> {
    const user = await this.validateUser(dto.email, dto.password, clientKey);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientKey: user.clientKey,
      accountId: user.accountId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async getMe(userId: string, clientKey: string): Promise<AuthUser> {
    const user = await (this.prisma as any).userAccount.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get account ID from client config
    const clientConfig = await (this.prisma as any).clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.email.split('@')[0],
      role: user.role,
      avatarUrl: user.avatarUrl || undefined,
      clientKey,
      accountId: clientConfig?.accountId || user.accountId,
    };
  }

  async validateUserById(userId: string): Promise<AuthUser | null> {
    const user = await (this.prisma as any).userAccount.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Get client config for this account
    const clientConfig = await (this.prisma as any).clientConfig.findFirst({
      where: { accountId: user.accountId },
      select: { clientKey: true },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.email.split('@')[0],
      role: user.role,
      avatarUrl: user.avatarUrl || undefined,
      clientKey: clientConfig?.clientKey || '',
      accountId: user.accountId,
    };
  }

  async validateGoogleUser(googleUser: { email: string; name: string; picture?: string }): Promise<LoginResponse> {
    // Find user by email
    const user = await (this.prisma as any).userAccount.findFirst({
      where: { email: googleUser.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('User not registered. Please contact your administrator.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Get client config for this account
    const clientConfig = await (this.prisma as any).clientConfig.findFirst({
      where: { accountId: user.accountId },
      select: { clientKey: true },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name || googleUser.name,
      username: user.email.split('@')[0],
      role: user.role,
      avatarUrl: googleUser.picture || user.avatarUrl || undefined,
      clientKey: clientConfig?.clientKey || '',
      accountId: user.accountId,
    };

    const payload = {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
      clientKey: authUser.clientKey,
      accountId: authUser.accountId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: authUser,
    };
  }
}
