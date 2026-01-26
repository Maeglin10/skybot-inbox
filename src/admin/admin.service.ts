import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // TENANT MANAGEMENT (SUPER_ADMIN only)
  // ============================================

  /**
   * List all tenants
   */
  async listTenants() {
    return this.prisma.account.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            userAccounts: true,
            modules: true,
            integrations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string) {
    const tenant = await this.prisma.account.findUnique({
      where: { id: tenantId },
      include: {
        modules: true,
        integrations: {
          select: {
            id: true,
            provider: true,
            status: true,
            lastHealthCheck: true,
            healthStatus: true,
          },
        },
        subscription: true,
        _count: {
          select: {
            userAccounts: true,
            leads: true,
            alerts: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Create new tenant with admin user
   */
  async createTenant(dto: CreateTenantDto) {
    // Check if tenant with this name already exists
    const existing = await this.prisma.account.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Tenant with name "${dto.name}" already exists`);
    }

    // Create tenant account
    const tenant = await this.prisma.account.create({
      data: {
        name: dto.name,
        tier: dto.tier || 'STARTER',
        status: dto.status || 'TRIAL',
        trialEndsAt: dto.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        isDemo: dto.isDemo || false,
      },
    });

    // Create default modules for tenant
    const defaultModules = ['inbox', 'crm', 'alerts'];
    for (const moduleKey of defaultModules) {
      await this.prisma.tenantModule.create({
        data: {
          tenantId: tenant.id,
          moduleKey,
          enabled: true,
        },
      });
    }

    // Create admin user if provided
    if (dto.adminEmail && dto.adminPassword && dto.adminName) {
      const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

      await this.prisma.userAccount.create({
        data: {
          accountId: tenant.id,
          username: dto.adminEmail.split('@')[0],
          email: dto.adminEmail,
          passwordHash,
          name: dto.adminName,
          role: UserRole.CLIENT_ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });

      // Create default preferences for admin user
      const adminUser = await this.prisma.userAccount.findFirst({
        where: { accountId: tenant.id, role: UserRole.CLIENT_ADMIN },
      });

      if (adminUser) {
        await this.prisma.userPreference.create({
          data: {
            userAccountId: adminUser.id,
            theme: 'DEFAULT',
            language: 'EN',
            timezone: 'UTC',
          },
        });
      }
    }

    return this.getTenant(tenant.id);
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.account.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.account.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        tier: dto.tier,
        status: dto.status,
        trialEndsAt: dto.trialEndsAt,
      },
    });
  }

  /**
   * Delete tenant (soft delete by setting status to CANCELLED)
   */
  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.account.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete by setting status to CANCELLED
    await this.prisma.account.update({
      where: { id: tenantId },
      data: {
        status: 'CANCELLED',
      },
    });

    return { message: 'Tenant cancelled successfully' };
  }

  // ============================================
  // USER MANAGEMENT (within tenant)
  // ============================================

  /**
   * List all users in a tenant
   */
  async listUsers(tenantId: string) {
    return this.prisma.userAccount.findMany({
      where: { accountId: tenantId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user by ID
   */
  async getUser(tenantId: string, userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user || user.accountId !== tenantId) {
      throw new NotFoundException('User not found');
    }

    // Don't return password hash
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Create user in tenant
   */
  async createUser(tenantId: string, dto: CreateUserDto) {
    // Check if user already exists
    const existing = await this.prisma.userAccount.findFirst({
      where: {
        accountId: tenantId,
        username: dto.username,
      },
    });

    if (existing) {
      throw new ConflictException('User with this username already exists');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const user = await this.prisma.userAccount.create({
      data: {
        accountId: tenantId,
        username: dto.username,
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role || UserRole.AGENT_USER,
        status: AccountStatus.ACTIVE,
      },
    });

    // Create default preferences
    await this.prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'EN',
        timezone: 'UTC',
      },
    });

    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Update user
   */
  async updateUser(tenantId: string, userId: string, dto: UpdateUserDto) {
    await this.getUser(tenantId, userId); // Verify user exists

    const data: any = {};
    if (dto.username) data.username = dto.username;
    if (dto.email) data.email = dto.email;
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data,
    });

    const { passwordHash, ...sanitized } = updated;
    return sanitized;
  }

  /**
   * Delete user
   */
  async deleteUser(tenantId: string, userId: string) {
    const user = await this.getUser(tenantId, userId);

    // Prevent deleting last admin
    if (user.role === UserRole.CLIENT_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      const adminCount = await this.prisma.userAccount.count({
        where: {
          accountId: tenantId,
          role: { in: [UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN] },
          status: AccountStatus.ACTIVE,
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin user');
      }
    }

    await this.prisma.userAccount.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }
}
