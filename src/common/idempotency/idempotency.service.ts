import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdempotencyKeyConflictError } from '../errors/known-error';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if an idempotency key has been used before
   * If yes, return the cached response
   * If no, return null (caller should process request)
   */
  async checkIdempotency(params: {
    accountId: string;
    key: string;
    endpoint: string;
    method: string;
    requestBody: any;
  }): Promise<{
    statusCode: number;
    responseBody: any;
  } | null> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: params.key },
    });

    if (!existing) {
      return null; // First time seeing this key - process normally
    }

    // Verify accountId matches (prevent cross-account key reuse)
    if (existing.accountId !== params.accountId) {
      throw new IdempotencyKeyConflictError(params.key);
    }

    // Verify endpoint and method match (key can only be reused for same operation)
    if (
      existing.endpoint !== params.endpoint ||
      existing.method !== params.method
    ) {
      throw new IdempotencyKeyConflictError(params.key);
    }

    // Check if key is expired
    if (existing.expiresAt < new Date()) {
      // Key expired - can be reused
      await this.prisma.idempotencyKey.delete({
        where: { id: existing.id },
      });
      return null;
    }

    // Return cached response
    return {
      statusCode: existing.statusCode || 200,
      responseBody: existing.responseBody,
    };
  }

  /**
   * Store the result of an idempotent operation
   */
  async storeResult(params: {
    accountId: string;
    key: string;
    endpoint: string;
    method: string;
    requestBody: any;
    statusCode: number;
    responseBody: any;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.idempotencyKey.create({
      data: {
        key: params.key,
        accountId: params.accountId,
        endpoint: params.endpoint,
        method: params.method,
        requestBody: params.requestBody,
        statusCode: params.statusCode,
        responseBody: params.responseBody,
        expiresAt,
      },
    });
  }

  /**
   * Cleanup expired idempotency keys (should be run as a cron job)
   */
  async cleanupExpired(): Promise<{ deleted: number }> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { deleted: result.count };
  }
}
