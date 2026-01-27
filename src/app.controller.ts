import { Controller, Get, Post, Query, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/decorators/public.decorator';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  /**
   * TEMPORARY: Seed demo data endpoint
   * Protected by secret key, to be removed after initial setup
   */
  @Public()
  @SkipThrottle()
  @Post('seed-demo')
  async seedDemo(@Query('key') key: string) {
    const secretKey = process.env.SEED_SECRET_KEY || 'demo-seed-2024';

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid seed key');
    }

    try {
      const { stdout, stderr } = await execAsync('npm run seed:demo');

      return {
        status: 'success',
        message: 'Demo data seeded successfully',
        output: stdout,
        errors: stderr || undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to seed demo data',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * TEMPORARY: List demo accounts
   * Protected by secret key
   */
  @Public()
  @SkipThrottle()
  @Get('list-demo-accounts')
  async listDemoAccounts(@Query('key') key: string) {
    const secretKey = process.env.SEED_SECRET_KEY || 'demo-seed-2024';

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid seed key');
    }

    try {
      const { stdout } = await execAsync('npx ts-node scripts/fix-demo-account.ts');
      return {
        status: 'success',
        output: stdout,
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

  /**
   * TEMPORARY: Reset and reseed demo account
   * Protected by secret key
   */
  @Public()
  @SkipThrottle()
  @Post('reset-and-seed-demo')
  async resetAndSeedDemo(@Query('key') key: string) {
    const secretKey = process.env.SEED_SECRET_KEY || 'demo-seed-2024';

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid seed key');
    }

    try {
      // Reset demo account data
      const { stdout: resetOutput } = await execAsync('npx ts-node scripts/reset-demo-account.ts');

      // Seed fresh data
      const { stdout: seedOutput } = await execAsync('npm run seed:demo');

      return {
        status: 'success',
        message: 'Demo account reset and reseeded successfully',
        resetOutput,
        seedOutput,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to reset and seed demo',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
