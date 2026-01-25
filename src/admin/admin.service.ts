import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(accountId: string) {
    return this.prisma.userAccount.findMany({
      where: { accountId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findOne(accountId: string, userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
    });
    if (!user || user.accountId !== accountId) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(accountId: string, dto: CreateUserDto) {
    const existing = await this.prisma.userAccount.findFirst({
      where: { accountId, username: dto.username },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : null;

    const user = await this.prisma.userAccount.create({
      data: {
        accountId,
        username: dto.username,
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role || UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
    });

    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  async update(accountId: string, userId: string, dto: UpdateUserDto) {
    await this.findOne(accountId, userId);

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data,
    });

    const { passwordHash: _, ...sanitized } = updated;
    return sanitized;
  }

  async delete(accountId: string, userId: string) {
    const user = await this.findOne(accountId, userId);

    // Prevent deleting last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.userAccount.count({
        where: {
          accountId,
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin');
      }
    }

    await this.prisma.userAccount.delete({ where: { id: userId } });
    return { message: 'User deleted' };
  }
}
