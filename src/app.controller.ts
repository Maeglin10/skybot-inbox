import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basic health check endpoint
   * Returns 200 if the application is running
   */
  @Public()
  @SkipThrottle()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'skybot-inbox',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check endpoint
   * Returns 200 only if the database connection is healthy
   * Used by Kubernetes/Render for readiness probes
   */
  @Public()
  @SkipThrottle()
  @Get('ready')
  async readiness() {
    try {
      // Test database connection with a simple query
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        service: 'skybot-inbox',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'not ready',
        service: 'skybot-inbox',
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
