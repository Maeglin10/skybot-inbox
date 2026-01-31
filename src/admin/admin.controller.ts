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

  /**
   * ONE-TIME SETUP: Create Demo account with all modules and super admin user
   *
   * Security: Protected by SEED_SECRET_KEY from environment
   *
   * Usage:
   *   POST https://skybot-inbox.onrender.com/api/admin/setup-demo
   *   Header: x-seed-secret: YOUR_SEED_SECRET_KEY
   *
   * This endpoint creates:
   * - Demo Account with all features enabled
   * - All 44 modules enabled (TenantModule records)
   * - Super Admin user for Valentin
   * - Demo client configuration
   *
   * Safe to run multiple times (idempotent).
   */
  @Public()
  @Post('setup-demo')
  @HttpCode(200)
  async setupDemo(@Headers('x-seed-secret') secret: string) {
    const expectedSecret = process.env.SEED_SECRET_KEY;

    if (!expectedSecret) {
      throw new BadRequestException(
        'Setup is disabled (SEED_SECRET_KEY not configured)',
      );
    }

    // Use timing-safe comparison
    try {
      const secretBuffer = Buffer.from(secret, 'utf8');
      const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

      if (secretBuffer.length !== expectedBuffer.length) {
        throw new BadRequestException('Invalid secret');
      }

      if (!timingSafeEqual(secretBuffer, expectedBuffer)) {
        throw new BadRequestException('Invalid secret');
      }
    } catch (error) {
      throw new BadRequestException('Invalid secret');
    }

    const ALL_MODULES = [
      'auth', 'accounts', 'users', 'admin', 'prisma',
      'webhooks', 'whatsapp', 'messages', 'conversations', 'contacts', 'inboxes',
      'common', 'websockets', 'debug',
      'agents', 'clients', 'billing', 'channels', 'instagram', 'facebook', 'email', 'webchat',
      'analytics', 'knowledge', 'crm', 'shopify', 'orders',
      'airtable', 'integrations', 'zapier', 'slack',
      'corporate-numbers', 'alerts', 'stories', 'templates', 'media', 'jobs',
      'legal', 'settings', 'preferences', 'user-preferences',
      'ingestion', 'tenant-modules', 'competitive-analysis',
    ];

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    try {
      // 1. Find or create Demo account
      let demoAccount = await this.prisma.account.findFirst({
        where: { name: 'Demo' }
      });

      if (!demoAccount) {
        demoAccount = await this.prisma.account.create({
          data: {
            name: 'Demo',
            isDemo: true,
            status: 'ACTIVE',
            tier: 'ENTERPRISE',
            features: {
              inbox: true,
              crm: true,
              analytics: true,
              channels: true,
              calendar: true,
              alerts: true,
              settings: true,
              orders: true,
              billing: true,
              knowledge: true,
              integrations: true,
              media: true,
              templates: true,
              reports: true,
              automation: true,
            }
          }
        });
        results.account = { status: 'created', id: demoAccount.id };
      } else {
        // Update to ensure all features enabled
        await this.prisma.account.update({
          where: { id: demoAccount.id },
          data: {
            features: {
              inbox: true,
              crm: true,
              analytics: true,
              channels: true,
              calendar: true,
              alerts: true,
              settings: true,
              orders: true,
              billing: true,
              knowledge: true,
              integrations: true,
              media: true,
              templates: true,
              reports: true,
              automation: true,
            },
            tier: 'ENTERPRISE',
            status: 'ACTIVE',
          }
        });
        results.account = { status: 'already_exists_updated', id: demoAccount.id };
      }

      // 2. Enable all modules
      let modulesEnabled = 0;
      const moduleStatuses: any = {};

      for (const moduleKey of ALL_MODULES) {
        try {
          const existing = await this.prisma.tenantModule.findUnique({
            where: {
              tenantId_moduleKey: {
                tenantId: demoAccount.id,
                moduleKey
              }
            }
          });

          if (!existing) {
            await this.prisma.tenantModule.create({
              data: {
                tenantId: demoAccount.id,
                moduleKey,
                enabled: true,
              }
            });
            moduleStatuses[moduleKey] = 'created';
            modulesEnabled++;
          } else if (!existing.enabled) {
            await this.prisma.tenantModule.update({
              where: { id: existing.id },
              data: { enabled: true }
            });
            moduleStatuses[moduleKey] = 're-enabled';
            modulesEnabled++;
          } else {
            moduleStatuses[moduleKey] = 'already_enabled';
          }
        } catch (e) {
          moduleStatuses[moduleKey] = 'error';
        }
      }

      results.modules = {
        total: ALL_MODULES.length,
        enabled: modulesEnabled,
        statuses: moduleStatuses
      };

      // 3. Create super admin user (Valentin)
      const username = 'valentin';
      const email = 'valentin.milliand@nexxa.global';
      const password = process.env.SEED_VALENTIN_PASSWORD || 'ChangeMeInProduction123!';

      try {
        const bcrypt = require('bcrypt');

        let valentinUser = await this.prisma.userAccount.findFirst({
          where: {
            accountId: demoAccount.id,
            OR: [{ username }, { email }]
          }
        });

        if (!valentinUser) {
          const passwordHash = await bcrypt.hash(password, 10);
          valentinUser = await this.prisma.userAccount.create({
            data: {
              accountId: demoAccount.id,
              username,
              email,
              passwordHash,
              name: 'Valentin Milliand',
              role: UserRole.SUPER_ADMIN,
              status: 'ACTIVE'
            }
          });

          // Create preferences
          try {
            await this.prisma.userPreference.create({
              data: {
                userAccountId: valentinUser.id,
                theme: 'DARK',
                language: 'FR',
                timezone: 'Europe/Paris'
              }
            });
            results.user = { status: 'created_with_preferences', id: valentinUser.id };
          } catch (e) {
            results.user = { status: 'created_no_preferences', id: valentinUser.id };
          }
        } else {
          // Update role to SUPER_ADMIN if not already
          if (valentinUser.role !== UserRole.SUPER_ADMIN) {
            await this.prisma.userAccount.update({
              where: { id: valentinUser.id },
              data: { role: UserRole.SUPER_ADMIN, status: 'ACTIVE' }
            });
            results.user = { status: 'updated_to_super_admin', id: valentinUser.id };
          } else {
            results.user = { status: 'already_exists', id: valentinUser.id };
          }
        }

        results.credentials = {
          username,
          email,
          password: password === process.env.SEED_VALENTIN_PASSWORD ? '[From SEED_VALENTIN_PASSWORD env]' : password
        };
      } catch (userError: any) {
        results.user = { status: 'error', error: userError.message };
      }

      // 4. Create demo client config
      try {
        await this.prisma.clientConfig.upsert({
          where: {
            accountId_clientKey: {
              accountId: demoAccount.id,
              clientKey: 'demo'
            }
          },
          update: {
            status: 'ACTIVE',
            channels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'WEB'],
          },
          create: {
            accountId: demoAccount.id,
            clientKey: 'demo',
            name: 'Demo Client',
            status: 'ACTIVE',
            defaultAgentKey: 'master-router',
            allowedAgents: ['master-router', 'setter', 'closer', 'crm', 'orders', 'aftersale'],
            channels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'WEB'],
            externalAccounts: {},
          }
        });
        results.clientConfig = { status: 'created_or_updated' };
      } catch (e: any) {
        results.clientConfig = { status: 'error', error: e.message };
      }

      results.success = true;
      results.message = 'Demo account setup complete with all modules and super admin user';

      return results;
    } catch (error: any) {
      results.success = false;
      results.error = error.message;
      throw error;
    }
  }

  /**
   * TEMPORARY: Add ALL missing columns to DB
   * Complete migration for Conversation and Message tables
   */
  @Public()
  @Post('migrate-conversation-counts')
  async migrateConversationCounts(@Headers('x-seed-secret') secret: string) {
    const expectedSecret = process.env.SEED_SECRET_KEY;

    if (!secret || !expectedSecret || secret !== expectedSecret) {
      throw new BadRequestException('Invalid seed secret');
    }

    try {
      // 1. Conversation table columns
      await this.prisma.$executeRaw`
        ALTER TABLE "Conversation"
        ADD COLUMN IF NOT EXISTS "messageCount" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "participantCount" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "unreadCount" INTEGER DEFAULT 0
      `;

      // 2. Create all enums if not exist
      await this.prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "MessageStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$
      `;

      await this.prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$
      `;

      // 3. Add ALL Message table columns that might be missing
      await this.prisma.$executeRaw`
        ALTER TABLE "Message"
        ADD COLUMN IF NOT EXISTS "status" "MessageStatus" DEFAULT 'SENT',
        ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "failedReason" TEXT,
        ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "originalText" TEXT,
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
        ADD COLUMN IF NOT EXISTS "replyToMessageId" TEXT,
        ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1
      `;

      return {
        status: 'success',
        message: 'All missing columns added successfully (Conversation + Message complete)',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
