import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { timingSafeEqual } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // TENANT MANAGEMENT (SUPER_ADMIN only)
  // ============================================

  @Get('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  async listTenants() {
    return this.adminService.listTenants();
  }

  @Get('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async getTenant(@Param('tenantId') tenantId: string) {
    return this.adminService.getTenant(tenantId);
  }

  @Post('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Put('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.adminService.updateTenant(tenantId, dto);
  }

  @Delete('tenants/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteTenant(@Param('tenantId') tenantId: string) {
    return this.adminService.deleteTenant(tenantId);
  }

  // ============================================
  // USER MANAGEMENT (CLIENT_ADMIN + SUPER_ADMIN)
  // ============================================

  @Get('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async listUsers(@Param('tenantId') tenantId: string) {
    return this.adminService.listUsers(tenantId);
  }

  @Get('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async getUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.getUser(tenantId, userId);
  }

  @Post('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async createUser(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.adminService.createUser(tenantId, dto);
  }

  @Put('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async updateUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(tenantId, userId, dto);
  }

  @Delete('tenants/:tenantId/users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
  async deleteUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(tenantId, userId);
  }

  // ============================================
  // ONE-TIME SEEDING (Protected by secret)
  // ============================================

  /**
   * ONE-TIME SETUP: Seed GoodLife WhatsApp configuration
   *
   * Security: Protected by SEED_SECRET_KEY from environment
   *
   * Usage:
   *   POST https://skybot-inbox.onrender.com/api/admin/seed-goodlife
   *   Header: x-seed-secret: YOUR_SEED_SECRET_KEY
   *
   * This endpoint should be called ONCE after deployment to create:
   * - GoodLife Account
   * - ExternalAccount (phone_number_id mapping)
   * - ClientConfig (N8N routing)
   * - Inbox (WhatsApp inbox)
   *
   * After running once, data persists in database forever.
   */
  @Public()
  @Post('seed-goodlife')
  @HttpCode(200)
  async seedGoodLife(@Headers('x-seed-secret') secret: string) {
    const expectedSecret = process.env.SEED_SECRET_KEY;

    if (!expectedSecret) {
      throw new BadRequestException(
        'Seeding is disabled (SEED_SECRET_KEY not configured)',
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
      const secretBuffer = Buffer.from(secret, 'utf8');
      const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

      // Ensure buffers are same length for timingSafeEqual
      if (secretBuffer.length !== expectedBuffer.length) {
        throw new BadRequestException('Invalid seed secret');
      }

      if (!timingSafeEqual(secretBuffer, expectedBuffer)) {
        throw new BadRequestException('Invalid seed secret');
      }
    } catch (error) {
      throw new BadRequestException('Invalid seed secret');
    }

    const GOODLIFE_CONFIG = {
      phoneNumberId: '958241240707717',
      businessNumber: '50660216358',
      displayName: 'Goodlife Costa Rica',
      accountName: 'Goodlife Costa Rica',
      clientKey: 'goodlife',
    };

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    try {
      // 1. Find or create GoodLife account
      let account = await this.prisma.account.findFirst({
        where: {
          OR: [
            { name: GOODLIFE_CONFIG.accountName },
            { name: { contains: 'GoodLife', mode: 'insensitive' } },
            { name: { contains: 'Goodlife', mode: 'insensitive' } },
          ],
        },
      });

      if (!account) {
        account = await this.prisma.account.create({
          data: {
            name: GOODLIFE_CONFIG.accountName,
            isDemo: false,
            tier: 'PRO',
            status: 'ACTIVE',
            features: {
              inbox: true,
              crm: true,
              analytics: true,
              channels: true,
              calendar: true,
              alerts: true,
            },
          },
        });
        results.account = { status: 'created', id: account.id };
      } else {
        results.account = { status: 'already_exists', id: account.id };
      }

      // 2. Create or update ExternalAccount
      let externalAccount = await this.prisma.externalAccount.findFirst({
        where: {
          accountId: account.id,
          channel: 'WHATSAPP',
          externalId: GOODLIFE_CONFIG.phoneNumberId,
        },
      });

      if (!externalAccount) {
        externalAccount = await this.prisma.externalAccount.create({
          data: {
            accountId: account.id,
            channel: 'WHATSAPP',
            externalId: GOODLIFE_CONFIG.phoneNumberId,
            clientKey: GOODLIFE_CONFIG.clientKey,
            name: `${GOODLIFE_CONFIG.displayName} WhatsApp`,
            isActive: true,
          },
        });
        results.externalAccount = { status: 'created', id: externalAccount.id };
      } else {
        externalAccount = await this.prisma.externalAccount.update({
          where: { id: externalAccount.id },
          data: {
            clientKey: GOODLIFE_CONFIG.clientKey,
            name: `${GOODLIFE_CONFIG.displayName} WhatsApp`,
            isActive: true,
          },
        });
        results.externalAccount = { status: 'updated', id: externalAccount.id };
      }

      // 3. Create or update ClientConfig
      let clientConfig = await this.prisma.clientConfig.findUnique({
        where: {
          accountId_clientKey: {
            accountId: account.id,
            clientKey: GOODLIFE_CONFIG.clientKey,
          },
        },
      });

      if (!clientConfig) {
        clientConfig = await this.prisma.clientConfig.create({
          data: {
            accountId: account.id,
            clientKey: GOODLIFE_CONFIG.clientKey,
            status: 'ACTIVE',
            name: GOODLIFE_CONFIG.displayName,
            defaultAgentKey: 'master-router',
            allowedAgents: [
              'master-router',
              'setter',
              'closer',
              'crm',
              'orders',
              'aftersale',
            ],
            channels: {
              whatsapp: {
                enabled: true,
                phoneNumberId: GOODLIFE_CONFIG.phoneNumberId,
                businessNumber: GOODLIFE_CONFIG.businessNumber,
              },
            },
            externalAccounts: {
              whatsapp: GOODLIFE_CONFIG.phoneNumberId,
            },
            // n8nOverrides omitted - uses default N8N configuration
          },
        });
        results.clientConfig = { status: 'created', id: clientConfig.id };
      } else {
        clientConfig = await this.prisma.clientConfig.update({
          where: { id: clientConfig.id },
          data: {
            status: 'ACTIVE',
            name: GOODLIFE_CONFIG.displayName,
            defaultAgentKey: 'master-router',
            allowedAgents: [
              'master-router',
              'setter',
              'closer',
              'crm',
              'orders',
              'aftersale',
            ],
            channels: {
              whatsapp: {
                enabled: true,
                phoneNumberId: GOODLIFE_CONFIG.phoneNumberId,
                businessNumber: GOODLIFE_CONFIG.businessNumber,
              },
            },
            externalAccounts: {
              whatsapp: GOODLIFE_CONFIG.phoneNumberId,
            },
          },
        });
        results.clientConfig = { status: 'updated', id: clientConfig.id };
      }

      // 4. Create or update Inbox
      let inbox = await this.prisma.inbox.findFirst({
        where: {
          accountId: account.id,
          externalId: GOODLIFE_CONFIG.phoneNumberId,
          channel: 'WHATSAPP',
        },
      });

      if (!inbox) {
        inbox = await this.prisma.inbox.create({
          data: {
            accountId: account.id,
            externalId: GOODLIFE_CONFIG.phoneNumberId,
            name: `WhatsApp ${GOODLIFE_CONFIG.displayName}`,
            channel: 'WHATSAPP',
          },
        });
        results.inbox = { status: 'created', id: inbox.id };
      } else {
        inbox = await this.prisma.inbox.update({
          where: { id: inbox.id },
          data: {
            name: `WhatsApp ${GOODLIFE_CONFIG.displayName}`,
          },
        });
        results.inbox = { status: 'updated', id: inbox.id };
      }

      results.success = true;
      results.message =
        'GoodLife WhatsApp configuration created/updated successfully';
      results.config = {
        accountName: GOODLIFE_CONFIG.accountName,
        phoneNumberId: GOODLIFE_CONFIG.phoneNumberId,
        businessNumber: GOODLIFE_CONFIG.businessNumber,
        clientKey: GOODLIFE_CONFIG.clientKey,
      };

      return results;
    } catch (error) {
      results.success = false;
      results.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Check if GoodLife is configured (public endpoint for health check)
   */
  @Public()
  @Get('check-goodlife')
  async checkGoodLife() {
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [
          { name: 'Goodlife Costa Rica' },
          { name: { contains: 'GoodLife', mode: 'insensitive' } },
        ],
      },
    });

    if (!account) {
      return {
        configured: false,
        message:
          'GoodLife account not found. Run POST /api/admin/seed-goodlife to configure.',
      };
    }

    const externalAccount = await this.prisma.externalAccount.findFirst({
      where: {
        accountId: account.id,
        channel: 'WHATSAPP',
        isActive: true,
      },
    });

    const clientConfig = await this.prisma.clientConfig.findFirst({
      where: {
        accountId: account.id,
        clientKey: 'goodlife',
      },
    });

    const inbox = await this.prisma.inbox.findFirst({
      where: {
        accountId: account.id,
        channel: 'WHATSAPP',
      },
    });

    return {
      configured: true,
      account: {
        id: account.id,
        name: account.name,
        tier: account.tier,
        status: account.status,
      },
      externalAccount: externalAccount
        ? {
            id: externalAccount.id,
            phoneNumberId: externalAccount.externalId,
            clientKey: externalAccount.clientKey,
            isActive: externalAccount.isActive,
          }
        : null,
      clientConfig: clientConfig
        ? {
            id: clientConfig.id,
            status: clientConfig.status,
            defaultAgentKey: clientConfig.defaultAgentKey,
          }
        : null,
      inbox: inbox ? { id: inbox.id, name: inbox.name } : null,
    };
  }
}
