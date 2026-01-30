import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('debug')
@UseGuards(JwtAuthGuard)
export class DebugController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('system-health')
  async getSystemHealth(@CurrentUser() user: any) {
    const accountId = user.accountId;

    const [
      totalContacts,
      corporateContacts,
      totalConversations,
      openConversations,
      totalMessages,
      messagesLast24h,
      messagesLastHour,
      failedMessages,
      inboxes,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { accountId } }),
      this.prisma.contact.count({ where: { accountId, isCorporate: true } }),
      this.prisma.conversation.count({ where: { inbox: { accountId } } }),
      this.prisma.conversation.count({
        where: { inbox: { accountId }, status: 'OPEN' },
      }),
      this.prisma.message.count({
        where: { conversation: { inbox: { accountId } } },
      }),
      this.prisma.message.count({
        where: {
          conversation: { inbox: { accountId } },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { inbox: { accountId } },
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
      this.prisma.message.count({
        where: { conversation: { inbox: { accountId } }, status: 'FAILED' },
      }),
      this.prisma.inbox.findMany({ where: { accountId } }),
    ]);

    return {
      accountId,
      timestamp: new Date().toISOString(),
      contacts: {
        total: totalContacts,
        corporate: corporateContacts,
      },
      conversations: {
        total: totalConversations,
        open: openConversations,
        closed: totalConversations - openConversations,
      },
      messages: {
        total: totalMessages,
        last24h: messagesLast24h,
        lastHour: messagesLastHour,
        failed: failedMessages,
      },
      inboxes: inboxes.map((i) => ({
        id: i.id,
        name: i.name,
        channel: i.channel,
        externalId: i.externalId,
      })),
    };
  }

  @Get('recent-activity')
  async getRecentActivity(
    @CurrentUser() user: any,
    @Query('hours') hours?: string,
  ) {
    const accountId = user.accountId;
    const hoursNum = hours ? parseInt(hours) : 24;
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    const messages = await this.prisma.message.findMany({
      where: {
        conversation: { inbox: { accountId } },
        createdAt: { gte: since },
      },
      include: {
        conversation: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      hours: hoursNum,
      total: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        text: m.text?.substring(0, 100),
        direction: m.direction,
        status: m.status,
        contact: {
          name: m.conversation.contact.name,
          phone: m.conversation.contact.phone,
          isCorporate: m.conversation.contact.isCorporate,
        },
        createdAt: m.createdAt,
      })),
    };
  }

  @Get('webhook-test')
  async testWebhookActivity(@CurrentUser() user: any) {
    const accountId = user.accountId;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentMessages = await this.prisma.message.findMany({
      where: {
        conversation: { inbox: { accountId } },
        createdAt: { gte: oneHourAgo },
      },
      include: {
        conversation: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const inboxes = await this.prisma.inbox.findMany({
      where: { accountId },
    });

    return {
      inboxes: inboxes.map((i) => ({
        name: i.name,
        channel: i.channel,
        externalId: i.externalId,
        createdAt: i.createdAt,
      })),
      recentActivity: {
        messagesLastHour: recentMessages.length,
        webhooksWorking: recentMessages.length > 0,
        messages: recentMessages.map((m) => ({
          text: m.text?.substring(0, 50),
          direction: m.direction,
          contact: m.conversation.contact.name,
          createdAt: m.createdAt,
        })),
      },
    };
  }
}
