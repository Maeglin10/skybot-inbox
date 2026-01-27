import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get settings for a client by clientKey
   */
  async getSettings(accountId: string, clientKey: string) {
    try {
      const config = await this.prisma.clientConfig.findUnique({
        where: {
          accountId_clientKey: {
            accountId,
            clientKey,
          },
        },
      });

      if (!config) {
        throw new NotFoundException(
          `Settings not found for clientKey: ${clientKey}`,
        );
      }

      return {
        id: config.id,
        clientKey: config.clientKey,
        name: config.name,
        status: config.status,
        defaultAgentKey: config.defaultAgentKey,
        allowedAgents: config.allowedAgents,
        channels: config.channels,
        externalAccounts: config.externalAccounts,
        n8nOverrides: config.n8nOverrides,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch settings for ${clientKey}:`, error);
      throw error;
    }
  }

  /**
   * Update settings for a client
   */
  async updateSettings(
    accountId: string,
    clientKey: string,
    dto: UpdateSettingsDto,
  ) {
    try {
      // First verify the config exists
      const existing = await this.prisma.clientConfig.findUnique({
        where: {
          accountId_clientKey: {
            accountId,
            clientKey,
          },
        },
      });

      if (!existing) {
        throw new NotFoundException(
          `Settings not found for clientKey: ${clientKey}`,
        );
      }

      const updateData: Record<string, unknown> = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.defaultAgentKey !== undefined)
        updateData.defaultAgentKey = dto.defaultAgentKey;
      if (dto.allowedAgents !== undefined)
        updateData.allowedAgents = dto.allowedAgents;
      if (dto.channels !== undefined) updateData.channels = dto.channels;
      if (dto.externalAccounts !== undefined)
        updateData.externalAccounts = dto.externalAccounts;
      if (dto.n8nOverrides !== undefined)
        updateData.n8nOverrides = dto.n8nOverrides;

      const updated = await this.prisma.clientConfig.update({
        where: {
          accountId_clientKey: {
            accountId,
            clientKey,
          },
        },
        data: updateData,
      });

      return {
        id: updated.id,
        clientKey: updated.clientKey,
        name: updated.name,
        status: updated.status,
        defaultAgentKey: updated.defaultAgentKey,
        allowedAgents: updated.allowedAgents,
        channels: updated.channels,
        externalAccounts: updated.externalAccounts,
        n8nOverrides: updated.n8nOverrides,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to update settings for ${clientKey}:`, error);
      throw error;
    }
  }

  /**
   * List all client configs for an account
   */
  async listAllSettings(accountId: string) {
    try {
      const configs = await this.prisma.clientConfig.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: configs.map((config) => ({
          id: config.id,
          clientKey: config.clientKey,
          name: config.name,
          status: config.status,
          defaultAgentKey: config.defaultAgentKey,
          allowedAgents: config.allowedAgents,
          channels: config.channels,
          externalAccounts: config.externalAccounts,
          n8nOverrides: config.n8nOverrides,
          createdAt: config.createdAt.toISOString(),
          updatedAt: config.updatedAt.toISOString(),
        })),
        total: configs.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to list settings for account ${accountId}:`,
        error,
      );
      throw error;
    }
  }
}
