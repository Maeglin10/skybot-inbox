import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceNotOwnedError } from '../common/errors/known-error';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * SECURITY: Already secure - filters by tenantId (accountId)
   */
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

  /**
   * CRITICAL P0 FIX: Validate integration ownership before update
   * Previously allowed cross-account access to health check endpoint
   */
  async healthCheck(tenantId: string, integrationId: string) {
    // CRITICAL: Verify the integration belongs to the tenant before updating
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new ResourceNotOwnedError('integration', integrationId);
    }

    if (integration.tenantId !== tenantId) {
      throw new ResourceNotOwnedError('integration', integrationId);
    }

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
