import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CreateLeadDto, LeadStatus } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

const LEADS_TABLE = 'Leads';
const FEEDBACKS_TABLE = 'Feedbacks';

interface LeadRecord {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: string;
  temperature: string;
  channel: string;
  assignedTo?: string;
  tags?: string[];
  lastInteractionAt?: string;
  createdAt?: string;
  clientKey: string;
}

interface FeedbackRecord {
  customerName: string;
  customerEmail?: string;
  rating: number;
  snippet: string;
  fullText: string;
  channel: string;
  linkedLeadId?: string;
  createdAt?: string;
  clientKey: string;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly airtable: AirtableService) {}

  // ==================== LEADS ====================

  async findAllLeads(clientKey: string, status?: LeadStatus) {
    try {
      const filterFormula = status ? `{status} = '${status}'` : undefined;

      const records = await this.airtable.query<LeadRecord>(
        LEADS_TABLE,
        clientKey,
        filterFormula,
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
      this.logger.error('Failed to fetch leads:', error);
      throw error;
    }
  }

  async findOneLead(clientKey: string, id: string) {
    try {
      const records = await this.airtable.query<LeadRecord>(
        LEADS_TABLE,
        clientKey,
        `RECORD_ID() = '${id}'`,
      );

      if (records.length === 0) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }

      return {
        id: records[0].id,
        ...records[0].fields,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch lead ${id}:`, error);
      throw error;
    }
  }

  async createLead(clientKey: string, dto: CreateLeadDto) {
    try {
      const record = await this.airtable.create<LeadRecord>(LEADS_TABLE, {
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        status: dto.status,
        temperature: dto.temperature,
        channel: dto.channel,
        assignedTo: dto.assignedTo,
        tags: dto.tags || [],
        clientKey,
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error('Failed to create lead:', error);
      throw error;
    }
  }

  async updateLead(clientKey: string, id: string, dto: UpdateLeadDto) {
    try {
      // First verify the lead belongs to this client
      await this.findOneLead(clientKey, id);

      const updateFields: Record<string, unknown> = {};
      if (dto.name !== undefined) updateFields.name = dto.name;
      if (dto.company !== undefined) updateFields.company = dto.company;
      if (dto.email !== undefined) updateFields.email = dto.email;
      if (dto.phone !== undefined) updateFields.phone = dto.phone;
      if (dto.status !== undefined) updateFields.status = dto.status;
      if (dto.temperature !== undefined)
        updateFields.temperature = dto.temperature;
      if (dto.channel !== undefined) updateFields.channel = dto.channel;
      if (dto.assignedTo !== undefined) updateFields.assignedTo = dto.assignedTo;
      if (dto.tags !== undefined) updateFields.tags = dto.tags;

      updateFields.lastInteractionAt = new Date().toISOString();

      const record = await this.airtable.update<LeadRecord>(
        LEADS_TABLE,
        id,
        updateFields,
      );

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to update lead ${id}:`, error);
      throw error;
    }
  }

  async deleteLead(clientKey: string, id: string) {
    try {
      // First verify the lead belongs to this client
      await this.findOneLead(clientKey, id);

      await this.airtable.delete(LEADS_TABLE, id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete lead ${id}:`, error);
      throw error;
    }
  }

  // ==================== FEEDBACKS ====================

  async findAllFeedbacks(clientKey: string) {
    try {
      const records = await this.airtable.query<FeedbackRecord>(
        FEEDBACKS_TABLE,
        clientKey,
        undefined,
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
      this.logger.error('Failed to fetch feedbacks:', error);
      throw error;
    }
  }

  async findOneFeedback(clientKey: string, id: string) {
    try {
      const records = await this.airtable.query<FeedbackRecord>(
        FEEDBACKS_TABLE,
        clientKey,
        `RECORD_ID() = '${id}'`,
      );

      if (records.length === 0) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      return {
        id: records[0].id,
        ...records[0].fields,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch feedback ${id}:`, error);
      throw error;
    }
  }

  async createFeedback(clientKey: string, dto: CreateFeedbackDto) {
    try {
      const record = await this.airtable.create<FeedbackRecord>(
        FEEDBACKS_TABLE,
        {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          rating: dto.rating,
          snippet: dto.snippet,
          fullText: dto.fullText,
          channel: dto.channel,
          linkedLeadId: dto.linkedLeadId,
          clientKey,
          createdAt: new Date().toISOString(),
        },
      );

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error('Failed to create feedback:', error);
      throw error;
    }
  }

  async updateFeedback(clientKey: string, id: string, dto: UpdateFeedbackDto) {
    try {
      // First verify the feedback belongs to this client
      await this.findOneFeedback(clientKey, id);

      const updateFields: Record<string, unknown> = {};
      if (dto.customerName !== undefined)
        updateFields.customerName = dto.customerName;
      if (dto.customerEmail !== undefined)
        updateFields.customerEmail = dto.customerEmail;
      if (dto.rating !== undefined) updateFields.rating = dto.rating;
      if (dto.snippet !== undefined) updateFields.snippet = dto.snippet;
      if (dto.fullText !== undefined) updateFields.fullText = dto.fullText;
      if (dto.channel !== undefined) updateFields.channel = dto.channel;
      if (dto.linkedLeadId !== undefined)
        updateFields.linkedLeadId = dto.linkedLeadId;

      const record = await this.airtable.update<FeedbackRecord>(
        FEEDBACKS_TABLE,
        id,
        updateFields,
      );

      return {
        id: record.id,
        ...record.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to update feedback ${id}:`, error);
      throw error;
    }
  }

  async deleteFeedback(clientKey: string, id: string) {
    try {
      // First verify the feedback belongs to this client
      await this.findOneFeedback(clientKey, id);

      await this.airtable.delete(FEEDBACKS_TABLE, id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete feedback ${id}:`, error);
      throw error;
    }
  }
}
