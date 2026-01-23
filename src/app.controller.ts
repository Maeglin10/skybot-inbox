import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { ApiKeyGuard } from './auth/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @SkipThrottle()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
