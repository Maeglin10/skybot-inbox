import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async listIntegrations(tenantId: string) {
    return this.prisma.integration.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        status: true,
        lastHealthCheck: true,
        healthStatus: true,
      },
    });
  }

  async healthCheck(tenantId: string, integrationId: string) {
    // TODO: Implement health check logic for each provider
    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastHealthCheck: new Date(), healthStatus: 'healthy' },
    });
    return {
      status: 'healthy',
      message: 'Health check - provider-specific logic needed',
    };
  }
}
