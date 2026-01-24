import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  // Cache: key = "accountId:channel:externalId", value = clientConfig
  private readonly clientCache = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {}

  async resolveClient(params: {
    accountId: string;
    channel: Channel;
    externalAccountId: string;
  }) {
    const { accountId, channel, externalAccountId } = params;

    // Check cache first
    const cacheKey = `${accountId}:${channel}:${externalAccountId}`;
    const cached = this.clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const ext = await this.prisma.externalAccount.findUnique({
      where: {
        accountId_channel_externalId: {
          accountId,
          channel,
          externalId: externalAccountId,
        },
      },
    });

    if (!ext || !ext.isActive) {
      throw new NotFoundException(
        `Client not found for accountId=${accountId} channel=${channel} externalAccountId=${externalAccountId}`,
      );
    }

    const cfg = await this.prisma.clientConfig.findUnique({
      where: {
        accountId_clientKey: {
          accountId: ext.accountId,
          clientKey: ext.clientKey,
        },
      },
    });

    if (!cfg || cfg.status !== ClientStatus.ACTIVE) {
      throw new NotFoundException(`Client suspended: ${ext.clientKey}`);
    }

    // Cache the result
    this.clientCache.set(cacheKey, cfg);

    return cfg;
  }
}
