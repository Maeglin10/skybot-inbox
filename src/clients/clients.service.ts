import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ClientStatus } from '../prisma';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveClient(params: {
    accountId: string;
    channel: Channel;
    externalAccountId: string;
  }) {
    const { accountId, channel, externalAccountId } = params;

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

    return cfg;
  }
}
