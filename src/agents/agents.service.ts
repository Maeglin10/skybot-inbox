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
import { SkybotApiClient } from './skybot-api.client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AgentsService {
  private gateway: any; // AgentsGateway - injected lazily to avoid circular dependency

  constructor(
    private prisma: PrismaService,
    private skybotClient: SkybotApiClient,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    let agent = await this.prisma.agent.create({
      data: {
        accountId,
        agentName: dto.agentName,
        agentType: dto.agentType,
        templatePath: dto.templatePath,
        configJson: dto.configJson as any,
        status: AgentStatus.DEPLOYING,
      },
    });

    // Call SkyBot API to deploy N8N workflow
    try {
      this.logger.info('Deploying agent to SkyBot', {
        agentId: agent.id,
        templatePath: dto.templatePath,
      });

      const deploymentResult = await this.skybotClient.deployAgent({
        templatePath: dto.templatePath,
        clientId: accountId,
        config: dto.configJson,
      });

      if (deploymentResult.success && deploymentResult.workflowId) {
        // Deployment successful - store workflow ID and set status to INACTIVE
        agent = await this.prisma.agent.update({
          where: { id: agent.id },
          data: {
            n8nWorkflowId: deploymentResult.workflowId,
            status: AgentStatus.INACTIVE,
            deployedAt: new Date(),
          },
        });

        this.logger.info('Agent deployed successfully to SkyBot', {
          agentId: agent.id,
          workflowId: deploymentResult.workflowId,
          workflowUrl: deploymentResult.workflowUrl,
        });
      } else {
        // Deployment failed - mark as error
        agent = await this.prisma.agent.update({
          where: { id: agent.id },
          data: {
            status: AgentStatus.ERROR,
          },
        });

        this.logger.error('SkyBot deployment failed', {
          agentId: agent.id,
          error: deploymentResult.error,
        });
      }
    } catch (error) {
      // Handle deployment errors gracefully
      this.logger.error('Error deploying agent to SkyBot', {
        agentId: agent.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark agent as INACTIVE (not ERROR) so user can retry deployment
      agent = await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          status: AgentStatus.INACTIVE,
        },
      });
    }

    this.logger.info('Agent created successfully', {
      agentId: agent.id,
      accountId,
      status: agent.status,
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
   * Manually deploy agent to SkyBot (for re-deployment or retry)
   */
  async deployToSkybot(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    this.logger.info('Manually deploying agent to SkyBot', {
      agentId,
      templatePath: agent.templatePath,
    });

    // Update status to DEPLOYING
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.DEPLOYING },
    });

    try {
      const deploymentResult = await this.skybotClient.deployAgent({
        templatePath: agent.templatePath,
        clientId: accountId,
        config: agent.configJson as Record<string, any>,
      });

      if (deploymentResult.success && deploymentResult.workflowId) {
        // Deployment successful
        const updated = await this.prisma.agent.update({
          where: { id: agentId },
          data: {
            n8nWorkflowId: deploymentResult.workflowId,
            status: AgentStatus.INACTIVE,
            deployedAt: new Date(),
          },
        });

        this.logger.info('Agent deployed successfully to SkyBot', {
          agentId,
          workflowId: deploymentResult.workflowId,
        });

        return {
          success: true,
          agent: updated,
          workflowId: deploymentResult.workflowId,
          workflowUrl: deploymentResult.workflowUrl,
        };
      } else {
        // Deployment failed
        await this.prisma.agent.update({
          where: { id: agentId },
          data: { status: AgentStatus.ERROR },
        });

        this.logger.error('SkyBot deployment failed', {
          agentId,
          error: deploymentResult.error,
        });

        return {
          success: false,
          error: deploymentResult.error || 'Unknown deployment error',
        };
      }
    } catch (error) {
      this.logger.error('Error deploying agent to SkyBot', {
        agentId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark agent as ERROR
      await this.prisma.agent.update({
        where: { id: agentId },
        data: { status: AgentStatus.ERROR },
      });

      throw new BadRequestException(
        `Failed to deploy agent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Activate an agent
   */
  async activate(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    if (agent.status === AgentStatus.ACTIVE) {
      throw new BadRequestException('Agent is already active');
    }

    if (!agent.n8nWorkflowId) {
      throw new BadRequestException(
        'Agent has no deployed workflow to activate',
      );
    }

    this.logger.info('Activating agent', {
      agentId,
      accountId,
      workflowId: agent.n8nWorkflowId,
    });

    // Call SkyBot API to activate N8N workflow
    try {
      const result = await this.skybotClient.activateWorkflow(
        agent.n8nWorkflowId,
      );

      if (!result.success) {
        throw new BadRequestException('Failed to activate workflow on SkyBot');
      }

      const updated = await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          status: AgentStatus.ACTIVE,
          deployedAt: new Date(),
        },
      });

      this.logger.info('Agent activated successfully', {
        agentId,
        workflowId: agent.n8nWorkflowId,
      });

      // Emit WebSocket event
      if (this.gateway) {
        this.gateway.emitAgentStatusChanged(
          accountId,
          agentId,
          AgentStatus.ACTIVE,
        );
      }

      return updated;
    } catch (error) {
      this.logger.error('Failed to activate agent', {
        agentId,
        workflowId: agent.n8nWorkflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Deactivate an agent
   */
  async deactivate(accountId: string, agentId: string) {
    const agent = await this.findOne(accountId, agentId);

    if (agent.status === AgentStatus.INACTIVE) {
      throw new BadRequestException('Agent is already inactive');
    }

    if (!agent.n8nWorkflowId) {
      throw new BadRequestException(
        'Agent has no deployed workflow to deactivate',
      );
    }

    this.logger.info('Deactivating agent', {
      agentId,
      accountId,
      workflowId: agent.n8nWorkflowId,
    });

    // Call SkyBot API to deactivate N8N workflow
    try {
      const result = await this.skybotClient.deactivateWorkflow(
        agent.n8nWorkflowId,
      );

      if (!result.success) {
        throw new BadRequestException(
          'Failed to deactivate workflow on SkyBot',
        );
      }

      const updated = await this.prisma.agent.update({
        where: { id: agentId },
        data: { status: AgentStatus.INACTIVE },
      });

      this.logger.info('Agent deactivated successfully', {
        agentId,
        workflowId: agent.n8nWorkflowId,
      });

      // Emit WebSocket event
      if (this.gateway) {
        this.gateway.emitAgentStatusChanged(
          accountId,
          agentId,
          AgentStatus.INACTIVE,
        );
      }

      return updated;
    } catch (error) {
      this.logger.error('Failed to deactivate agent', {
        agentId,
        workflowId: agent.n8nWorkflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get agent statistics
   * Optimized with database aggregations
   */
  async getStats(accountId: string, agentId: string) {
    // Check cache first
    const cacheKey = `agent-stats:${agentId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug('Agent stats cache hit', { agentId, cacheKey });
      return cached;
    }

    this.logger.debug('Agent stats cache miss', { agentId, cacheKey });

    const agent = await this.findOne(accountId, agentId);

    const last24HoursDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Use database aggregations for better performance
    const [totalCount, successCount, errorCount, aggregations] =
      await Promise.all([
        // Total count of executions in last 24 hours
        this.prisma.agentLog.count({
          where: {
            agentId,
            timestamp: { gte: last24HoursDate },
          },
        }),

        // Success count
        this.prisma.agentLog.count({
          where: {
            agentId,
            timestamp: { gte: last24HoursDate },
            executionStatus: ExecutionStatus.SUCCESS,
          },
        }),

        // Error count
        this.prisma.agentLog.count({
          where: {
            agentId,
            timestamp: { gte: last24HoursDate },
            executionStatus: ExecutionStatus.ERROR,
          },
        }),

        // Aggregate processing time and cost
        this.prisma.agentLog.aggregate({
          where: {
            agentId,
            timestamp: { gte: last24HoursDate },
          },
          _avg: {
            processingTimeMs: true,
          },
          _sum: {
            openaiCostUsd: true,
          },
        }),
      ]);

    const avgProcessingTime = aggregations._avg.processingTimeMs || 0;
    const totalCost = aggregations._sum.openaiCostUsd
      ? parseFloat(aggregations._sum.openaiCostUsd.toString())
      : 0;

    const stats = {
      agentId,
      agentName: agent.agentName,
      status: agent.status,
      totalExecutions: agent.executionCount,
      totalErrors: agent.errorCount,
      lastExecutedAt: agent.lastExecutedAt,
      last24Hours: {
        executions: totalCount,
        successCount,
        errorCount,
        successRate: totalCount > 0 ? successCount / totalCount : 0,
        avgProcessingTimeMs: Math.round(avgProcessingTime),
        totalCostUsd: totalCost.toFixed(4),
      },
    };

    // Cache for 2 minutes (120 seconds)
    await this.cacheManager.set(cacheKey, stats, 120000);

    return stats;
  }

  /**
   * Get agent logs with pagination
   */
  async getLogs(accountId: string, agentId: string, limit = 50, offset = 0) {
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
