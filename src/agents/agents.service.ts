import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentStatus, ExecutionStatus } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AgentsService {
  private gateway: any; // AgentsGateway - injected lazily to avoid circular dependency

  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // Lazy injection to avoid circular dependency
  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  /**
   * Create a new agent from template
   * Deploys to SkyBot/N8N if templatePath is valid
   */
  async create(accountId: string, dto: CreateAgentDto) {
    this.logger.info('Creating agent', {
      accountId,
      agentName: dto.agentName,
      templatePath: dto.templatePath,
    });

    // Create agent in database with DEPLOYING status
    const agent = await this.prisma.agent.create({
      data: {
        accountId,
        agentName: dto.agentName,
        agentType: dto.agentType,
        templatePath: dto.templatePath,
        configJson: dto.configJson as any,
        status: AgentStatus.DEPLOYING,
      },
    });

    // TODO: Call SkyBot API to deploy N8N workflow
    // For now, we'll mark it as INACTIVE and return
    // In Phase 2, we'll implement the actual deployment via HTTP call to SkyBot

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: AgentStatus.INACTIVE,
      },
    });

    this.logger.info('Agent created successfully', {
      agentId: agent.id,
      accountId,
    });

    // Emit WebSocket event
    if (this.gateway) {
      this.gateway.emitAgentCreated(accountId, agent);
    }

    return agent;
  }

  /**
   * List all agents for a tenant
   */
  async findAll(accountId: string) {
    return this.prisma.agent.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single agent by ID (with tenant isolation)
   */
  async findOne(accountId: string, agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.accountId !== accountId) {
      throw new ForbiddenException('Access denied to this agent');
    }

    return agent;
  }

  /**
   * Update agent configuration
   */
  async update(accountId: string, agentId: string, dto: UpdateAgentDto) {
    // Verify ownership
    await this.findOne(accountId, agentId);

    this.logger.info('Updating agent', { agentId, accountId, dto });

    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        agentName: dto.agentName,
        agentType: dto.agentType,
        status: dto.status,
        configJson: dto.configJson as any,
      },
    });
  }

  /**
   * Delete agent (soft delete by setting status to SUSPENDED)
   */
  async remove(accountId: string, agentId: string) {
    await this.findOne(accountId, agentId);

    this.logger.info('Deleting agent', { agentId, accountId });

    // Soft delete: set status to SUSPENDED
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.SUSPENDED },
    });

    return { message: 'Agent deleted successfully' };
  }

  /**
   * Activate an agent
   */
  async activate(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    if (agent.status === AgentStatus.ACTIVE) {
      throw new BadRequestException('Agent is already active');
    }

    this.logger.info('Activating agent', { agentId, accountId });

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.ACTIVE,
        deployedAt: new Date(),
      },
    });

    // Emit WebSocket event
    if (this.gateway) {
      this.gateway.emitAgentStatusChanged(accountId, agentId, AgentStatus.ACTIVE);
    }

    return updated;
  }

  /**
   * Deactivate an agent
   */
  async deactivate(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    if (agent.status === AgentStatus.INACTIVE) {
      throw new BadRequestException('Agent is already inactive');
    }

    this.logger.info('Deactivating agent', { agentId, accountId });

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.INACTIVE },
    });

    // Emit WebSocket event
    if (this.gateway) {
      this.gateway.emitAgentStatusChanged(accountId, agentId, AgentStatus.INACTIVE);
    }

    return updated;
  }

  /**
   * Get agent statistics
   */
  async getStats(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    // Get recent logs (last 100)
    const recentLogs = await this.prisma.agentLog.findMany({
      where: {
        agentId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const successCount = recentLogs.filter(
      (l) => l.executionStatus === ExecutionStatus.SUCCESS,
    ).length;

    const errorCount = recentLogs.filter(
      (l) => l.executionStatus === ExecutionStatus.ERROR,
    ).length;

    const avgProcessingTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + l.processingTimeMs, 0) /
          recentLogs.length
        : 0;

    const totalCost = recentLogs.reduce((sum, l) => {
      const cost = l.openaiCostUsd
        ? parseFloat(l.openaiCostUsd.toString())
        : 0;
      return sum + cost;
    }, 0);

    return {
      agentId,
      agentName: agent.agentName,
      status: agent.status,
      totalExecutions: agent.executionCount,
      totalErrors: agent.errorCount,
      lastExecutedAt: agent.lastExecutedAt,
      last24Hours: {
        executions: recentLogs.length,
        successCount,
        errorCount,
        successRate:
          recentLogs.length > 0 ? successCount / recentLogs.length : 0,
        avgProcessingTimeMs: Math.round(avgProcessingTime),
        totalCostUsd: totalCost.toFixed(4),
      },
    };
  }

  /**
   * Get agent logs with pagination
   */
  async getLogs(
    accountId: string,
    agentId: string,
    limit = 50,
    offset = 0,
  ) {
    await this.findOne(accountId, agentId);

    const logs = await this.prisma.agentLog.findMany({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.agentLog.count({
      where: { agentId },
    });

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Log an agent execution (called by webhooks)
   */
  async logExecution(
    agentId: string,
    data: {
      executionStatus: ExecutionStatus;
      inputMessage?: string;
      outputMessage?: string;
      processingTimeMs: number;
      openaiTokensUsed?: number;
      errorMessage?: string;
    },
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Calculate OpenAI cost (approximation: $0.02 per 1K tokens)
    const openaiCostUsd =
      data.openaiTokensUsed && data.openaiTokensUsed > 0
        ? (data.openaiTokensUsed / 1000) * 0.02
        : null;

    // Create log entry
    await this.prisma.agentLog.create({
      data: {
        agentId,
        accountId: agent.accountId,
        executionStatus: data.executionStatus,
        inputMessage: data.inputMessage,
        outputMessage: data.outputMessage,
        processingTimeMs: data.processingTimeMs,
        openaiTokensUsed: data.openaiTokensUsed,
        openaiCostUsd: openaiCostUsd,
        errorMessage: data.errorMessage,
      },
    });

    // Update agent metrics
    const updateData: any = {
      executionCount: { increment: 1 },
      lastExecutedAt: new Date(),
    };

    if (data.executionStatus === ExecutionStatus.ERROR) {
      updateData.errorCount = { increment: 1 };
    }

    await this.prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    // Update usage tracking for billing
    await this.prisma.usageTracking.upsert({
      where: {
        tenantId_metric_period: {
          tenantId: agent.accountId,
          metric: 'agent_executions',
          period: new Date().toISOString().slice(0, 7), // YYYY-MM
        },
      },
      update: {
        value: { increment: 1 },
      },
      create: {
        tenantId: agent.accountId,
        metric: 'agent_executions',
        value: 1,
        period: new Date().toISOString().slice(0, 7),
      },
    });

    this.logger.info('Agent execution logged', {
      agentId,
      accountId: agent.accountId,
      status: data.executionStatus,
      processingTimeMs: data.processingTimeMs,
    });

    // Emit WebSocket events
    if (this.gateway) {
      if (data.executionStatus === ExecutionStatus.SUCCESS) {
        this.gateway.emitExecutionCompleted(agent.accountId, agentId, {
          agentId,
          executionStatus: data.executionStatus,
          processingTimeMs: data.processingTimeMs,
          openaiTokensUsed: data.openaiTokensUsed,
          openaiCostUsd,
        });
      } else if (data.executionStatus === ExecutionStatus.ERROR) {
        this.gateway.emitExecutionFailed(
          agent.accountId,
          agentId,
          data.errorMessage || 'Unknown error',
        );
      }
    }
  }
}
