import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import {
  CreateAlertDto,
  AlertStatus,
  AlertType,
} from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AssignAlertDto } from './dto/assign-alert.dto';

const ALERTS_TABLE = 'Notifications'; // Using existing Notifications table

interface AlertRecord {
  message: string; // Maps to "title" in frontend
  type: string;
  priority: string;
  leadName?: string; // Maps to "customerName" in frontend
  leadEmail?: string; // Maps to "customerEmail" in frontend
  timestamp?: string; // Maps to "createdAt" in frontend
  read?: boolean; // Maps to "status" (false=OPEN, true=RESOLVED)
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly airtable: AirtableService) {}

  async findAll(clientKey: string, status?: AlertStatus, type?: AlertType) {
    try {
      let filterFormula = '';

      // Map status to read field: OPEN -> read=false, RESOLVED -> read=true
      if (status && type) {
        const readValue = status === AlertStatus.RESOLVED ? 'TRUE()' : 'FALSE()';
        filterFormula = `AND({read} = ${readValue}, {type} = '${type}')`;
      } else if (status) {
        const readValue = status === AlertStatus.RESOLVED ? 'TRUE()' : 'FALSE()';
        filterFormula = `{read} = ${readValue}`;
      } else if (type) {
        filterFormula = `{type} = '${type}'`;
      }

      const records = await this.airtable.query<AlertRecord>(
        ALERTS_TABLE,
        clientKey,
        filterFormula || undefined,
        {
          sort: [{ field: 'timestamp', direction: 'desc' }],
        },
      );

      return {
        items: records.map((r) => ({
          id: r.id,
          title: r.fields.message,
          type: r.fields.type,
          priority: r.fields.priority,
          customerName: r.fields.leadName,
          customerEmail: r.fields.leadEmail,
          createdAt: r.fields.timestamp,
          status: r.fields.read ? AlertStatus.RESOLVED : AlertStatus.OPEN,
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

      const r = records[0];
      return {
        id: r.id,
        title: r.fields.message,
        type: r.fields.type,
        priority: r.fields.priority,
        customerName: r.fields.leadName,
        customerEmail: r.fields.leadEmail,
        createdAt: r.fields.timestamp,
        status: r.fields.read ? AlertStatus.RESOLVED : AlertStatus.OPEN,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch alert ${id}:`, error);
      throw error;
    }
  }

  async create(clientKey: string, dto: CreateAlertDto) {
    try {
      const record = await this.airtable.create<AlertRecord>(ALERTS_TABLE, {
        message: dto.title,
        type: dto.type,
        priority: dto.priority,
        leadName: dto.customerName,
        // leadEmail field not in DTO
        timestamp: new Date().toISOString(),
        read: dto.status === AlertStatus.RESOLVED,
      });

      return {
        id: record.id,
        title: record.fields.message,
        type: record.fields.type,
        priority: record.fields.priority,
        customerName: record.fields.leadName,
        customerEmail: record.fields.leadEmail,
        createdAt: record.fields.timestamp,
        status: record.fields.read ? AlertStatus.RESOLVED : AlertStatus.OPEN,

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
      if (dto.title !== undefined) updateFields.message = dto.title;
      if (dto.status !== undefined)
        updateFields.read = dto.status === AlertStatus.RESOLVED;
      if (dto.priority !== undefined) updateFields.priority = dto.priority;
      if (dto.customerName !== undefined)
        updateFields.leadName = dto.customerName;

      const record = await this.airtable.update<AlertRecord>(
        ALERTS_TABLE,
        id,
        updateFields,
      );

      return {
        id: record.id,
        title: record.fields.message,
        type: record.fields.type,
        priority: record.fields.priority,
        customerName: record.fields.leadName,
        customerEmail: record.fields.leadEmail,
        createdAt: record.fields.timestamp,
        status: record.fields.read ? AlertStatus.RESOLVED : AlertStatus.OPEN,

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
        read: true, // Mark as read = RESOLVED
      });

      return {
        id: record.id,
        title: record.fields.message,
        type: record.fields.type,
        priority: record.fields.priority,
        customerName: record.fields.leadName,
        customerEmail: record.fields.leadEmail,
        createdAt: record.fields.timestamp,
        status: AlertStatus.RESOLVED,

      };
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${id}:`, error);
      throw error;
    }
  }

  async assign(clientKey: string, id: string, dto: AssignAlertDto) {
    try {
      const alert = await this.findOne(clientKey, id);

      // Note: Notifications table doesn't have assignee field
      // This operation will be a no-op for now, but keep the API for future compatibility
      this.logger.warn(
        `Notifications table does not support assignee field. Assignment request ignored for alert ${id}`,
      );

      return alert; // Return unchanged alert
    } catch (error) {
      this.logger.error(`Failed to assign alert ${id}:`, error);
      throw error;
    }
  }
}
