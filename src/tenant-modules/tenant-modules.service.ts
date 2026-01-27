import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnableModuleDto } from './dto/enable-module.dto';
import { UpdateModuleLimitsDto } from './dto/update-module-limits.dto';

@Injectable()
export class TenantModulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all modules for a tenant
   */
  async getModules(tenantId: string) {
    const modules = await this.prisma.tenantModule.findMany({
      where: { tenantId },
      orderBy: { moduleKey: 'asc' },
    });

    // Define available modules
    const availableModules = [
      'inbox',
      'crm',
      'analytics',
      'alerts',
      'calendar',
      'shopify',
      'airtable',
    ];

    // Return all available modules with their status
    return availableModules.map((moduleKey) => {
      const module = modules.find((m) => m.moduleKey === moduleKey);
      return {
        moduleKey,
        enabled: module?.enabled || false,
        limits: module?.limits || null,
        createdAt: module?.createdAt || null,
        updatedAt: module?.updatedAt || null,
      };
    });
  }

  /**
   * Get a specific module for a tenant
   */
  async getModule(tenantId: string, moduleKey: string) {
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    });

    if (!module) {
      return {
        moduleKey,
        enabled: false,
        limits: null,
      };
    }

    return module;
  }

  /**
   * Enable or disable a module for a tenant
   */
  async enableModule(tenantId: string, dto: EnableModuleDto) {
    // Check if tenant exists
    const tenant = await this.prisma.account.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if module already exists
    const existing = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: dto.moduleKey,
        },
      },
    });

    if (existing) {
      // Update existing module
      return this.prisma.tenantModule.update({
        where: {
          tenantId_moduleKey: {
            tenantId,
            moduleKey: dto.moduleKey,
          },
        },
        data: {
          enabled: dto.enabled,
          limits: (dto.limits !== undefined
            ? dto.limits
            : existing.limits) as any,
        },
      });
    }

    // Create new module
    return this.prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: dto.moduleKey,
        enabled: dto.enabled,
        limits: dto.limits,
      },
    });
  }

  /**
   * Update module limits
   */
  async updateModuleLimits(
    tenantId: string,
    moduleKey: string,
    dto: UpdateModuleLimitsDto,
  ) {
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return this.prisma.tenantModule.update({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
      data: {
        limits: dto.limits,
      },
    });
  }

  /**
   * Check if a tenant has access to a module
   */
  async hasModuleAccess(tenantId: string, moduleKey: string): Promise<boolean> {
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    });

    return module?.enabled || false;
  }

  /**
   * Get module limits for a tenant
   */
  async getModuleLimits(tenantId: string, moduleKey: string) {
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    });

    return module?.limits || null;
  }

  /**
   * Delete a module (disable it)
   */
  async deleteModule(tenantId: string, moduleKey: string) {
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Soft delete by setting enabled to false
    return this.prisma.tenantModule.update({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
      data: {
        enabled: false,
      },
    });
  }
}
