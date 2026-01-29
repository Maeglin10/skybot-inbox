import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAlertDto,
  AlertStatus,
  AlertType,
  AlertPriority,
} from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AssignAlertDto } from './dto/assign-alert.dto';
import {
  AlertType as PrismaAlertType,
  AlertStatus as PrismaAlertStatus,
  AlertPriority as PrismaAlertPriority,
  Channel as PrismaChannel,
} from '@prisma/client';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  subtitle?: string;
  status: AlertStatus;
  priority: AlertPriority;
  amount?: number;
  currency?: string;
  customerName?: string;
  channel?: string;
  conversationId?: string;
  assignee?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getAccountId(clientKey: string): Promise<string> {
    const config = await this.prisma.clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    if (!config) {
      throw new NotFoundException(
        `Client config not found for key: ${clientKey}`,
      );
    }

    return config.accountId;
  }

  async findAllByAccount(
    accountId: string,
    status?: AlertStatus,
    type?: AlertType,
  ): Promise<{ items: AlertItem[]; total: number }> {
    try {
      // Special handling for CORPORATE type: fetch corporate contacts
      if (type === 'CORPORATE') {
        const contacts = await this.prisma.contact.findMany({
          where: {
            accountId,
            isCorporate: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const items: AlertItem[] = contacts.map((contact) => ({
          id: contact.id,
          type: 'CORPORATE' as AlertType,
          title: contact.name || 'Unknown Contact',
          subtitle: contact.phone,
          status: 'OPEN' as AlertStatus,
          priority: 'MEDIUM' as AlertPriority,
          customerName: contact.name || undefined,
          channel: 'WHATSAPP',
          createdAt: contact.createdAt.toISOString(),
        }));

        return {
          items,
          total: items.length,
        };
      }

      // Standard alert handling
      const where: any = { accountId };
      if (status) where.status = status as PrismaAlertStatus;
      if (type) where.type = type as PrismaAlertType;

      const alerts = await this.prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: alerts.map((a) => this.mapToAlertItem(a)),
        total: alerts.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  async findAll(
    clientKey: string,
    status?: AlertStatus,
    type?: AlertType,
  ): Promise<{ items: AlertItem[]; total: number }> {
    const accountId = await this.getAccountId(clientKey);
    return this.findAllByAccount(accountId, status, type);
  }

  async findOne(clientKey: string, id: string): Promise<AlertItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const alert = await this.prisma.alert.findFirst({
        where: { id, accountId },
      });

      if (!alert) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      return this.mapToAlertItem(alert);
    } catch (error) {
      this.logger.error(`Failed to fetch alert ${id}:`, error);
      throw error;
    }
  }

  async create(clientKey: string, dto: CreateAlertDto): Promise<AlertItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const alert = await this.prisma.alert.create({
        data: {
          accountId,
          type: dto.type as PrismaAlertType,
          title: dto.title,
          subtitle: dto.subtitle,
          status: dto.status as PrismaAlertStatus,
          priority: dto.priority as PrismaAlertPriority,
          amount: dto.amount,
          currency: dto.currency,
          customerName: dto.customerName,
          channel: dto.channel as PrismaChannel | undefined,
          conversationId: dto.conversationId,
          assignee: dto.assignee,
        },
      });

      return this.mapToAlertItem(alert);
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  async update(
    clientKey: string,
    id: string,
    dto: UpdateAlertDto,
  ): Promise<AlertItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.alert.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      const alert = await this.prisma.alert.update({
        where: { id },
        data: {
          ...(dto.type !== undefined && { type: dto.type as PrismaAlertType }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
          ...(dto.status !== undefined && {
            status: dto.status as PrismaAlertStatus,
          }),
          ...(dto.priority !== undefined && {
            priority: dto.priority as PrismaAlertPriority,
          }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.currency !== undefined && { currency: dto.currency }),
          ...(dto.customerName !== undefined && {
            customerName: dto.customerName,
          }),
          ...(dto.channel !== undefined && {
            channel: dto.channel as PrismaChannel,
          }),
          ...(dto.conversationId !== undefined && {
            conversationId: dto.conversationId,
          }),
          ...(dto.assignee !== undefined && { assignee: dto.assignee }),
        },
      });

      return this.mapToAlertItem(alert);
    } catch (error) {
      this.logger.error(`Failed to update alert ${id}:`, error);
      throw error;
    }
  }

  async delete(clientKey: string, id: string): Promise<{ success: boolean }> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.alert.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      await this.prisma.alert.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete alert ${id}:`, error);
      throw error;
    }
  }

  async resolve(
    clientKey: string,
    id: string,
    resolvedBy?: string,
  ): Promise<AlertItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.alert.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      const alert = await this.prisma.alert.update({
        where: { id },
        data: {
          status: 'RESOLVED' as PrismaAlertStatus,
          resolvedAt: new Date(),
          resolvedBy,
        },
      });

      return this.mapToAlertItem(alert);
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${id}:`, error);
      throw error;
    }
  }

  async assign(
    clientKey: string,
    id: string,
    dto: AssignAlertDto,
  ): Promise<AlertItem> {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.alert.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      const alert = await this.prisma.alert.update({
        where: { id },
        data: { assignee: dto.assignee },
      });

      return this.mapToAlertItem(alert);
    } catch (error) {
      this.logger.error(`Failed to assign alert ${id}:`, error);
      throw error;
    }
  }

  private mapToAlertItem(alert: any): AlertItem {
    return {
      id: alert.id,
      type: alert.type as AlertType,
      title: alert.title,
      subtitle: alert.subtitle || undefined,
      status: alert.status as AlertStatus,
      priority: alert.priority as AlertPriority,
      amount: alert.amount || undefined,
      currency: alert.currency || undefined,
      customerName: alert.customerName || undefined,
      channel: alert.channel || undefined,
      conversationId: alert.conversationId || undefined,
      assignee: alert.assignee || undefined,
      resolvedAt: alert.resolvedAt?.toISOString(),
      resolvedBy: alert.resolvedBy || undefined,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt?.toISOString(),
    };
  }
}
