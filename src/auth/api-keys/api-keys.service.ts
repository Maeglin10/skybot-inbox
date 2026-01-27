import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Generate a new API key for an account
   * Format: sk_{accountId}_{randomHex}
   */
  async generateApiKey(
    accountId: string,
    name: string,
    expiresAt?: Date,
  ): Promise<{ id: string; key: string; name: string; createdAt: Date }> {
    // Generate secure random key
    const randomHex = randomBytes(32).toString('hex');
    const key = `sk_${accountId}_${randomHex}`;

    this.logger.info('Generating new API key', {
      accountId,
      name,
      expiresAt,
    });

    const apiKey = await this.prisma.apiKey.create({
      data: {
        accountId,
        name,
        key,
        expiresAt,
        isActive: true,
      },
    });

    this.logger.info('API key generated successfully', {
      keyId: apiKey.id,
      accountId,
      name,
    });

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * List all API keys for an account (without exposing the actual key)
   */
  async listApiKeys(accountId: string) {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { accountId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude the actual key for security
        key: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys;
  }

  /**
   * Get a specific API key by ID (without exposing the actual key)
   */
  async getApiKey(accountId: string, keyId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        key: false,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.accountId !== accountId) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Rotate an API key (deactivate old, create new)
   */
  async rotateApiKey(accountId: string, keyId: string) {
    const oldKey = await this.getApiKey(accountId, keyId);

    if (!oldKey.isActive) {
      throw new BadRequestException('Cannot rotate an inactive key');
    }

    this.logger.info('Rotating API key', {
      keyId,
      accountId,
      oldKeyName: oldKey.name,
    });

    // Deactivate old key
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Generate new key with rotated name
    const newKey = await this.generateApiKey(
      accountId,
      `${oldKey.name} (rotated)`,
      oldKey.expiresAt ?? undefined,
    );

    this.logger.info('API key rotated successfully', {
      oldKeyId: keyId,
      newKeyId: newKey.id,
      accountId,
    });

    return newKey;
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(accountId: string, keyId: string) {
    const apiKey = await this.getApiKey(accountId, keyId);

    if (!apiKey.isActive) {
      throw new BadRequestException('API key is already inactive');
    }

    this.logger.info('Revoking API key', {
      keyId,
      accountId,
      keyName: apiKey.name,
    });

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    this.logger.info('API key revoked successfully', {
      keyId,
      accountId,
    });

    return { message: 'API key revoked successfully' };
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(accountId: string, keyId: string) {
    const apiKey = await this.getApiKey(accountId, keyId);

    this.logger.warn('Deleting API key permanently', {
      keyId,
      accountId,
      keyName: apiKey.name,
    });

    await this.prisma.apiKey.delete({
      where: { id: keyId },
    });

    this.logger.info('API key deleted successfully', {
      keyId,
      accountId,
    });

    return { message: 'API key deleted successfully' };
  }

  /**
   * Validate an API key and return account information
   * Used by ApiKeyGuard
   */
  async validateApiKey(key: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            status: true,
            tier: true,
          },
        },
      },
    });

    if (!apiKey) {
      this.logger.debug('API key validation failed: key not found', { key });
      return null;
    }

    if (!apiKey.isActive) {
      this.logger.debug('API key validation failed: key inactive', {
        keyId: apiKey.id,
      });
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      this.logger.debug('API key validation failed: key expired', {
        keyId: apiKey.id,
        expiresAt: apiKey.expiresAt,
      });
      return null;
    }

    // Update last used timestamp (fire and forget)
    void this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    this.logger.debug('API key validated successfully', {
      keyId: apiKey.id,
      accountId: apiKey.accountId,
    });

    return {
      keyId: apiKey.id,
      accountId: apiKey.accountId,
      account: apiKey.account,
    };
  }
}
