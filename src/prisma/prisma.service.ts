import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is missing');

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);

    // Enable query logging in development or when LOG_LEVEL=debug
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDev = process.env.NODE_ENV === 'development';
    const enableQueryLogging = isDev || logLevel === 'debug';

    super({
      adapter,
      log: enableQueryLogging
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
    });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    // Log slow queries (>100ms)
    this.$on('query' as never, (e: any) => {
      if (e.duration > 100) {
        this.logger.warn('Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params,
          target: e.target,
        });
      } else if (process.env.LOG_LEVEL === 'debug') {
        this.logger.debug('Query executed', {
          query: e.query,
          duration: e.duration,
        });
      }
    });

    // Log errors
    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error', {
        message: e.message,
        target: e.target,
      });
    });

    // Log warnings
    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma warning', {
        message: e.message,
      });
    });

    this.logger.info('Database connection established', {
      connectionPoolSize: this.pool.totalCount,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
