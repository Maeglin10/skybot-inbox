import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

export interface UserItem {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  status: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getAccountId(clientKey: string): Promise<string> {
    const config = await (this.prisma as any).clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    if (!config) {
      throw new NotFoundException(`Client config not found for key: ${clientKey}`);
    }

    return config.accountId;
  }

  async findAllUsers(
    clientKey: string,
    role?: UserRole,
    status?: UserStatus,
  ): Promise<{ items: UserItem[]; total: number }> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const where: any = { accountId };
      if (role) where.role = role;
      if (status) where.status = status;

      const users = await (this.prisma as any).userAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: users.map((u: any) => this.mapToUserItem(u)),
        total: users.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async findOneUser(clientKey: string, id: string): Promise<UserItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const user = await (this.prisma as any).userAccount.findFirst({
        where: { id, accountId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.mapToUserItem(user);
    } catch (error) {
      this.logger.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }

  async createUser(clientKey: string, dto: CreateUserDto): Promise<UserItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      // Check if email already exists
      const existing = await (this.prisma as any).userAccount.findFirst({
        where: { accountId, email: dto.email.toLowerCase() },
      });

      if (existing) {
        throw new ConflictException('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      const user = await (this.prisma as any).userAccount.create({
        data: {
          accountId,
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash,
          role: dto.role || UserRole.USER,
          status: 'ACTIVE',
          phone: dto.phone,
          avatarUrl: dto.avatarUrl,
        },
      });

      return this.mapToUserItem(user);
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(clientKey: string, id: string, dto: UpdateUserDto): Promise<UserItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await (this.prisma as any).userAccount.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const data: any = {};
      if (dto.email !== undefined) data.email = dto.email.toLowerCase();
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.role !== undefined) data.role = dto.role;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.phone !== undefined) data.phone = dto.phone;
      if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
      if (dto.password !== undefined) {
        data.passwordHash = await bcrypt.hash(dto.password, 10);
      }

      const user = await (this.prisma as any).userAccount.update({
        where: { id },
        data,
      });

      return this.mapToUserItem(user);
    } catch (error) {
      this.logger.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(clientKey: string, id: string): Promise<{ success: boolean }> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await (this.prisma as any).userAccount.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await (this.prisma as any).userAccount.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  private mapToUserItem(user: any): UserItem {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.email.split('@')[0],
      role: user.role,
      status: user.status,
      phone: user.phone || undefined,
      avatarUrl: user.avatarUrl || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }
}
