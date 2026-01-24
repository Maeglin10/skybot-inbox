import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountDto,
  AccountRole,
  AccountStatus,
} from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as crypto from 'crypto';
import {
  UserRole as PrismaUserRole,
  AccountStatus as PrismaAccountStatus,
} from '@prisma/client';

export interface AccountItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AccountRole;
  status: AccountStatus;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getAccountId(clientKey: string): Promise<string> {
    const config = await this.prisma.clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    if (!config) {
      throw new NotFoundException(`Client config not found for key: ${clientKey}`);
    }

    return config.accountId;
  }

  async findAll(
    clientKey: string,
    role?: AccountRole,
    status?: AccountStatus,
  ): Promise<{ items: AccountItem[]; total: number }> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const where: any = { accountId };
      if (role) where.role = role as PrismaUserRole;
      if (status) where.status = status as PrismaAccountStatus;

      const users = await this.prisma.userAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: users.map((u) => this.mapToAccountItem(u)),
        total: users.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch accounts:', error);
      throw error;
    }
  }

  async findOne(clientKey: string, id: string): Promise<AccountItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const user = await this.prisma.userAccount.findFirst({
        where: { id, accountId },
      });

      if (!user) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      return this.mapToAccountItem(user);
    } catch (error) {
      this.logger.error(`Failed to fetch account ${id}:`, error);
      throw error;
    }
  }

  async findByEmail(clientKey: string, email: string): Promise<AccountItem | null> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const user = await this.prisma.userAccount.findFirst({
        where: { accountId, email },
      });

      if (!user) {
        return null;
      }

      return this.mapToAccountItem(user);
    } catch (error) {
      this.logger.error(`Failed to fetch account by email ${email}:`, error);
      throw error;
    }
  }

  async create(clientKey: string, dto: CreateAccountDto): Promise<AccountItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.userAccount.findFirst({
        where: { accountId, email: dto.email },
      });

      if (existing) {
        throw new ConflictException(`Account with email ${dto.email} already exists`);
      }

      const user = await this.prisma.userAccount.create({
        data: {
          accountId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role as PrismaUserRole,
          status: (dto.status || AccountStatus.ACTIVE) as PrismaAccountStatus,
          notes: dto.notes,
          avatarUrl: dto.avatarUrl,
        },
      });

      return this.mapToAccountItem(user);
    } catch (error) {
      this.logger.error('Failed to create account:', error);
      throw error;
    }
  }

  async update(
    clientKey: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<AccountItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.userAccount.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      if (dto.email && dto.email !== existing.email) {
        const emailExists = await this.prisma.userAccount.findFirst({
          where: { accountId, email: dto.email, NOT: { id } },
        });
        if (emailExists) {
          throw new ConflictException(`Account with email ${dto.email} already exists`);
        }
      }

      const user = await this.prisma.userAccount.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.role !== undefined && { role: dto.role as PrismaUserRole }),
          ...(dto.status !== undefined && { status: dto.status as PrismaAccountStatus }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        },
      });

      return this.mapToAccountItem(user);
    } catch (error) {
      this.logger.error(`Failed to update account ${id}:`, error);
      throw error;
    }
  }

  async delete(clientKey: string, id: string): Promise<{ success: boolean }> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.userAccount.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      await this.prisma.userAccount.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete account ${id}:`, error);
      throw error;
    }
  }

  async suspend(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { status: AccountStatus.SUSPENDED });
  }

  async activate(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { status: AccountStatus.ACTIVE });
  }

  async promoteToAdmin(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { role: AccountRole.ADMIN });
  }

  async demoteToUser(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { role: AccountRole.USER });
  }

  async changePassword(
    clientKey: string,
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('New password and confirmation do not match');
      }

      const accountId = await this.getAccountId(clientKey);

      const user = await this.prisma.userAccount.findFirst({
        where: { id, accountId },
      });

      if (!user) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      if (user.passwordHash) {
        const currentHash = this.hashPassword(dto.currentPassword);
        if (currentHash !== user.passwordHash) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      }

      const newPasswordHash = this.hashPassword(dto.newPassword);

      await this.prisma.userAccount.update({
        where: { id },
        data: { passwordHash: newPasswordHash },
      });

      this.logger.log(`Password changed successfully for account ${id}`);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error(`Failed to change password for account ${id}:`, error);
      throw error;
    }
  }

  async setInitialPassword(
    clientKey: string,
    id: string,
    password: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.findOne(clientKey, id);

      const passwordHash = this.hashPassword(password);

      await this.prisma.userAccount.update({
        where: { id },
        data: { passwordHash },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to set initial password for account ${id}:`, error);
      throw error;
    }
  }

  async verifyPassword(
    clientKey: string,
    email: string,
    password: string,
  ): Promise<AccountItem | null> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const user = await this.prisma.userAccount.findFirst({
        where: { accountId, email },
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      const passwordHash = this.hashPassword(password);

      if (user.passwordHash !== passwordHash) {
        return null;
      }

      return this.mapToAccountItem(user);
    } catch (error) {
      this.logger.error(`Failed to verify password for ${email}:`, error);
      return null;
    }
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private mapToAccountItem(user: any): AccountItem {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role as AccountRole,
      status: user.status as AccountStatus,
      notes: user.notes || undefined,
      avatarUrl: user.avatarUrl || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }
}
