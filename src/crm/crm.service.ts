import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, LeadStatus } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import {
  LeadStatus as PrismaLeadStatus,
  Temperature as PrismaTemperature,
  FeedbackType as PrismaFeedbackType,
  FeedbackStatus as PrismaFeedbackStatus,
} from '@prisma/client';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getAccountId(clientKey: string): Promise<string> {
    const config = await this.prisma.clientConfig.findFirst({
      where: { clientKey },
      select: { accountId: true },
    });

    if (!config) {
      throw new NotFoundException(`Client config not found for key: ${clientKey}`);
    }

    return config.accountId;
  }

  // ==================== LEADS ====================

  async findAllLeads(clientKey: string, status?: LeadStatus) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const where: any = { accountId };
      if (status) where.status = status as PrismaLeadStatus;

      const leads = await this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: leads.map((l) => this.mapLead(l)),
        total: leads.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch leads:', error);
      throw error;
    }
  }

  async findOneLead(clientKey: string, id: string) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const lead = await this.prisma.lead.findFirst({
        where: { id, accountId },
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }

      return this.mapLead(lead);
    } catch (error) {
      this.logger.error(`Failed to fetch lead ${id}:`, error);
      throw error;
    }
  }

  async createLead(clientKey: string, dto: CreateLeadDto) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const lead = await this.prisma.lead.create({
        data: {
          accountId,
          name: dto.name,
          company: dto.company,
          email: dto.email,
          phone: dto.phone,
          status: dto.status as PrismaLeadStatus,
          temperature: dto.temperature as PrismaTemperature,
          channel: dto.channel,
          assignedTo: dto.assignedTo,
          tags: dto.tags || [],
        },
      });

      return this.mapLead(lead);
    } catch (error) {
      this.logger.error('Failed to create lead:', error);
      throw error;
    }
  }

  async updateLead(clientKey: string, id: string, dto: UpdateLeadDto) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.lead.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }

      const lead = await this.prisma.lead.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.company !== undefined && { company: dto.company }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.status !== undefined && { status: dto.status as PrismaLeadStatus }),
          ...(dto.temperature !== undefined && { temperature: dto.temperature as PrismaTemperature }),
          ...(dto.channel !== undefined && { channel: dto.channel }),
          ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
          ...(dto.tags !== undefined && { tags: dto.tags }),
        },
      });

      return this.mapLead(lead);
    } catch (error) {
      this.logger.error(`Failed to update lead ${id}:`, error);
      throw error;
    }
  }

  async deleteLead(clientKey: string, id: string) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.lead.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }

      await this.prisma.lead.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete lead ${id}:`, error);
      throw error;
    }
  }

  // ==================== FEEDBACKS ====================

  async findAllFeedbacks(clientKey: string) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const feedbacks = await this.prisma.feedback.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: feedbacks.map((f) => this.mapFeedback(f)),
        total: feedbacks.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch feedbacks:', error);
      throw error;
    }
  }

  async findOneFeedback(clientKey: string, id: string) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const feedback = await this.prisma.feedback.findFirst({
        where: { id, accountId },
      });

      if (!feedback) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      return this.mapFeedback(feedback);
    } catch (error) {
      this.logger.error(`Failed to fetch feedback ${id}:`, error);
      throw error;
    }
  }

  async createFeedback(clientKey: string, dto: CreateFeedbackDto) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const feedback = await this.prisma.feedback.create({
        data: {
          accountId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          rating: dto.rating,
          message: dto.fullText || dto.snippet,
          channel: dto.channel,
          type: PrismaFeedbackType.GENERAL,
          status: PrismaFeedbackStatus.PENDING,
        },
      });

      return this.mapFeedback(feedback);
    } catch (error) {
      this.logger.error('Failed to create feedback:', error);
      throw error;
    }
  }

  async updateFeedback(clientKey: string, id: string, dto: UpdateFeedbackDto) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.feedback.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      const feedback = await this.prisma.feedback.update({
        where: { id },
        data: {
          ...(dto.customerName !== undefined && { customerName: dto.customerName }),
          ...(dto.customerEmail !== undefined && { customerEmail: dto.customerEmail }),
          ...(dto.rating !== undefined && { rating: dto.rating }),
          ...((dto.fullText !== undefined || dto.snippet !== undefined) && {
            message: dto.fullText || dto.snippet || existing.message
          }),
          ...(dto.channel !== undefined && { channel: dto.channel }),
        },
      });

      return this.mapFeedback(feedback);
    } catch (error) {
      this.logger.error(`Failed to update feedback ${id}:`, error);
      throw error;
    }
  }

  async deleteFeedback(clientKey: string, id: string) {
    try {
      const accountId = await this.getAccountId(clientKey);

      const existing = await this.prisma.feedback.findFirst({
        where: { id, accountId },
      });

      if (!existing) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      await this.prisma.feedback.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete feedback ${id}:`, error);
      throw error;
    }
  }

  private mapLead(lead: any) {
    return {
      id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      temperature: lead.temperature,
      channel: lead.channel,
      assignedTo: lead.assignedTo,
      tags: lead.tags,
      value: lead.value,
      currency: lead.currency,
      notes: lead.notes,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt?.toISOString(),
    };
  }

  private mapFeedback(feedback: any) {
    return {
      id: feedback.id,
      customerName: feedback.customerName,
      customerEmail: feedback.customerEmail,
      customerPhone: feedback.customerPhone,
      type: feedback.type,
      status: feedback.status,
      rating: feedback.rating,
      message: feedback.message,
      snippet: feedback.message?.substring(0, 100),
      fullText: feedback.message,
      channel: feedback.channel,
      response: feedback.response,
      respondedAt: feedback.respondedAt?.toISOString(),
      respondedBy: feedback.respondedBy,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt?.toISOString(),
    };
  }
}
