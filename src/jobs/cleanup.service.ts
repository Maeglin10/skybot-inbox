import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

/**
 * Background job service for periodic cleanup tasks
 *
 * Cron jobs:
 * - Every hour: Clean up expired idempotency keys
 * - Every hour: Clean up expired refresh tokens
 * - Every day at 2 AM: Clean up expired magic links
 * - Every day at 3 AM: Archive old audit logs (if implemented)
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Clean up expired idempotency keys
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredIdempotencyKeys() {
    this.logger.log('Starting idempotency keys cleanup...');

    try {
      const result = await this.idempotencyService.cleanupExpired();
      this.logger.log(
        `Cleaned up ${result.deleted} expired idempotency keys`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup idempotency keys:', error);
    }
  }

  /**
   * Clean up expired refresh tokens
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredRefreshTokens() {
    this.logger.log('Starting refresh tokens cleanup...');

    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup refresh tokens:', error);
    }
  }

  /**
   * Clean up expired and used magic links
   * Runs every day at 2 AM
   */
  @Cron('0 2 * * *')
  async cleanupMagicLinks() {
    this.logger.log('Starting magic links cleanup...');

    try {
      const result = await this.prisma.magicLink.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired
            { used: true }, // Already used
          ],
        },
      });

      this.logger.log(`Cleaned up ${result.count} magic links`);
    } catch (error) {
      this.logger.error('Failed to cleanup magic links:', error);
    }
  }

  /**
   * Clean up old revoked refresh tokens (keep for audit for 90 days)
   * Runs every day at 3 AM
   */
  @Cron('0 3 * * *')
  async archiveOldRevokedTokens() {
    this.logger.log('Starting old revoked tokens cleanup...');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          revokedAt: { lt: ninetyDaysAgo },
        },
      });

      this.logger.log(
        `Archived ${result.count} old revoked tokens (>90 days)`,
      );
    } catch (error) {
      this.logger.error('Failed to archive old revoked tokens:', error);
    }
  }

  /**
   * Health metrics collection (example)
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectHealthMetrics() {
    // Example: Could collect metrics like active sessions, messages/hour, etc.
    // For now, just a placeholder

    try {
      const activeSessionsCount = await this.prisma.refreshToken.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      this.logger.debug(`Active sessions: ${activeSessionsCount}`);
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }
}
