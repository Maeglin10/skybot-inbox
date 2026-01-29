import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IdempotencyKeyConflictError } from '../errors/known-error';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if an idempotency key has been used before
   * If yes, return the cached response
   * If no, atomically create a placeholder to prevent race conditions
   *
   * FIXED: Now uses atomic check-and-create pattern to prevent race conditions
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
    // First, try to find existing key
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: params.key },
    });

    if (existing) {
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
        // Key expired - can be reused, delete it
        await this.prisma.idempotencyKey.delete({
          where: { id: existing.id },
        });
        return null; // Allow processing
      }

      // If response is not yet stored (statusCode null), request is still processing
      // Return a special marker to indicate "in progress"
      if (existing.statusCode === null) {
        // Another request is processing this - return 409 Conflict
        return {
          statusCode: 409,
          responseBody: {
            error: 'Request already in progress',
            message: 'Another request with this idempotency key is currently being processed',
          },
        };
      }

      // Return cached response
      return {
        statusCode: existing.statusCode,
        responseBody: existing.responseBody,
      };
    }

    // ATOMIC: Try to create placeholder (statusCode=null means "processing")
    // If unique constraint fails, another request beat us - they'll handle it
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.prisma.idempotencyKey.create({
        data: {
          key: params.key,
          accountId: params.accountId,
          endpoint: params.endpoint,
          method: params.method,
          requestBody: params.requestBody,
          statusCode: null, // Placeholder - will be updated when request completes
          responseBody: Prisma.JsonNull,
          expiresAt,
        },
      });
      // Successfully created placeholder - we own this request
      return null;
    } catch (error: any) {
      // Unique constraint violation (P2002) - another request created it first
      if (error.code === 'P2002') {
        // Retry the check - the other request either completed or is still processing
        const retry = await this.prisma.idempotencyKey.findUnique({
          where: { key: params.key },
        });

        if (retry && retry.statusCode !== null) {
          // Other request completed - return their result
          return {
            statusCode: retry.statusCode,
            responseBody: retry.responseBody,
          };
        } else {
          // Other request still processing - return conflict
          return {
            statusCode: 409,
            responseBody: {
              error: 'Request already in progress',
              message: 'Another request with this idempotency key is currently being processed',
            },
          };
        }
      }
      throw error; // Re-throw if not a unique constraint error
    }
  }

  /**
   * Store the result of an idempotent operation
   * Updates the placeholder created in checkIdempotency
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
    // Update the placeholder we created earlier
    await this.prisma.idempotencyKey.update({
      where: { key: params.key },
      data: {
        statusCode: params.statusCode,
        responseBody: params.responseBody,
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
