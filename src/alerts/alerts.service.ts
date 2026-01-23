import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import {
  CreateAlertDto,
  AlertStatus,
  AlertType,
} from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AssignAlertDto } from './dto/assign-alert.dto';

const ALERTS_TABLE = 'Alerts';

interface AlertRecord {
  type: string;
  title: string;
  subtitle?: string;
  status: string;
  priority: string;
  amount?: number;
  currency?: string;
  customerName?: string;
  channel?: string;
  conversationId?: string;
  assignee?: string;
  createdAt?: string;
  clientKey: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly airtable: AirtableService) {}

  async findAll(clientKey: string, status?: AlertStatus, type?: AlertType) {
    try {
      let filterFormula = '';

      if (status && type) {
        filterFormula = `AND({status} = '${status}', {type} = '${type}')`;
      } else if (status) {
        filterFormula = `{status} = '${status}'`;
      } else if (type) {
        filterFormula = `{type} = '${type}'`;
      }

      const records = await this.airtable.query<AlertRecord>(
        ALERTS_TABLE,
        clientKey,
        filterFormula || undefined,
        {
          sort: [{ field: 'createdAt', direction: 'desc' }],
        },
      );

      return {
        items: records.map((r) => ({
          id: r.id,
          ...r.fields,
        })),
        total: records.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  async findOne(clientKey: string, id: string) {
    try {
      const records = await this.airtable.query<AlertRecord>(
        ALERTS_TABLE,
        clientKey,
        `RECORD_ID() = '${id}'`,
      );

      if (records.length === 0) {
        throw new NotFoundException(`Alert with ID ${id} not found`);
      }

      return {
        id: records[0].id,
        ...records[0].fields,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch alert ${id}:`, error);
      throw error;
    }
  }

  async create(clientKey: string, dto: CreateAlertDto) {
    try {
      const record = await this.airtable.create<AlertRecord>(ALERTS_TABLE, {
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        status: dto.status,
        priority: dto.priority,
        amount: dto.amount,
        currency: dto.currency,
        customerName: dto.customerName,
        channel: dto.channel,
        conversationId: dto.conversationId,
        assignee: dto.assignee,
        clientKey,
        createdAt: new Date().toISOString(),
      });

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  async update(clientKey: string, id: string, dto: UpdateAlertDto) {
    try {
      // First verify the alert belongs to this client
      await this.findOne(clientKey, id);

      const updateFields: Record<string, unknown> = {};
      if (dto.type !== undefined) updateFields.type = dto.type;
      if (dto.title !== undefined) updateFields.title = dto.title;
      if (dto.subtitle !== undefined) updateFields.subtitle = dto.subtitle;
      if (dto.status !== undefined) updateFields.status = dto.status;
      if (dto.priority !== undefined) updateFields.priority = dto.priority;
      if (dto.amount !== undefined) updateFields.amount = dto.amount;
      if (dto.currency !== undefined) updateFields.currency = dto.currency;
      if (dto.customerName !== undefined)
        updateFields.customerName = dto.customerName;
      if (dto.channel !== undefined) updateFields.channel = dto.channel;
      if (dto.conversationId !== undefined)
        updateFields.conversationId = dto.conversationId;
      if (dto.assignee !== undefined) updateFields.assignee = dto.assignee;

      const record = await this.airtable.update<AlertRecord>(
        ALERTS_TABLE,
        id,
        updateFields,
      );

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to update alert ${id}:`, error);
      throw error;
    }
  }

  async delete(clientKey: string, id: string) {
    try {
      // First verify the alert belongs to this client
      await this.findOne(clientKey, id);

      await this.airtable.delete(ALERTS_TABLE, id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete alert ${id}:`, error);
      throw error;
    }
  }

  async resolve(clientKey: string, id: string) {
    try {
      const alert = await this.findOne(clientKey, id);

      const record = await this.airtable.update<AlertRecord>(ALERTS_TABLE, id, {
        status: AlertStatus.RESOLVED,
      });

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${id}:`, error);
      throw error;
    }
  }

  async assign(clientKey: string, id: string, dto: AssignAlertDto) {
    try {
      const alert = await this.findOne(clientKey, id);

      const record = await this.airtable.update<AlertRecord>(ALERTS_TABLE, id, {
        assignee: dto.assignee,
      });

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to assign alert ${id}:`, error);
      throw error;
    }
  }
}
