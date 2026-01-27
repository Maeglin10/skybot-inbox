import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { AgentsService } from '../agents/agents.service';
import { ExecutionStatus } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Webhook endpoints for SkyBot integration
 *
 * These endpoints receive events from the SkyBot project when:
 * - An agent execution starts
 * - An agent execution completes
 * - An agent logs data
 * - An agent status changes
 *
 * All webhooks require the SKYBOT_WEBHOOK_SECRET header for authentication
 */
@Controller('webhooks/skybot')
export class SkybotWebhooksController {
  constructor(
    private readonly agentsService: AgentsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Verify webhook secret
   */
  private verifyWebhookSecret(secret: string | undefined): void {
    const expectedSecret = process.env.SKYBOT_WEBHOOK_SECRET;

    if (!expectedSecret) {
      throw new Error('SKYBOT_WEBHOOK_SECRET not configured');
    }

    if (!secret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  /**
   * Webhook: Agent execution completed
   * Called by SkyBot when an agent finishes executing
   *
   * POST /api/webhooks/skybot/agent-execution
   * Headers: x-skybot-secret: <SKYBOT_WEBHOOK_SECRET>
   * Body: {
   *   agentId: string,
   *   executionStatus: 'SUCCESS' | 'ERROR' | 'TIMEOUT',
   *   inputMessage?: string,
   *   outputMessage?: string,
   *   processingTimeMs: number,
   *   openaiTokensUsed?: number,
   *   errorMessage?: string
   * }
   */
  @Post('agent-execution')
  @Public()
  async handleAgentExecution(
    @Headers('x-skybot-secret') secret: string | undefined,
    @Body()
    payload: {
      agentId: string;
      executionStatus: ExecutionStatus;
      inputMessage?: string;
      outputMessage?: string;
      processingTimeMs: number;
      openaiTokensUsed?: number;
      errorMessage?: string;
    },
  ) {
    this.verifyWebhookSecret(secret);

    // Log execution in database + emit WebSocket events
    await this.agentsService.logExecution(payload.agentId, {
      executionStatus: payload.executionStatus,
      inputMessage: payload.inputMessage,
      outputMessage: payload.outputMessage,
      processingTimeMs: payload.processingTimeMs,
      openaiTokensUsed: payload.openaiTokensUsed,
      errorMessage: payload.errorMessage,
    });

    return { ok: true, message: 'Execution logged successfully' };
  }

  /**
   * Webhook: Agent log entry
   * Generic logging endpoint for any agent activity
   *
   * POST /api/webhooks/skybot/agent-log
   * Headers: x-skybot-secret: <SKYBOT_WEBHOOK_SECRET>
   * Body: {
   *   agentId: string,
   *   level: 'info' | 'warn' | 'error',
   *   message: string,
   *   metadata?: any
   * }
   */
  @Post('agent-log')
  @Public()
  async handleAgentLog(
    @Headers('x-skybot-secret') secret: string | undefined,
    @Body()
    payload: {
      agentId: string;
      level: string;
      message: string;
      metadata?: any;
    },
  ) {
    this.verifyWebhookSecret(secret);

    // For now, just log it
    // In the future, could store logs in a separate table
    this.logger.info('SkyBot agent log received', {
      agentId: payload.agentId,
      level: payload.level,
      message: payload.message,
      metadata: payload.metadata,
    });

    return { ok: true };
  }

  /**
   * Webhook: Agent status changed
   * Called when SkyBot detects an agent status change
   *
   * POST /api/webhooks/skybot/agent-status
   * Headers: x-skybot-secret: <SKYBOT_WEBHOOK_SECRET>
   * Body: {
   *   agentId: string,
   *   status: 'ACTIVE' | 'INACTIVE' | 'ERROR',
   *   message?: string
   * }
   */
  @Post('agent-status')
  @Public()
  async handleAgentStatus(
    @Headers('x-skybot-secret') secret: string | undefined,
    @Body()
    payload: {
      agentId: string;
      status: string;
      message?: string;
    },
  ) {
    this.verifyWebhookSecret(secret);

    // TODO: Update agent status in database if needed
    // For now, just acknowledge
    this.logger.info('SkyBot agent status changed', {
      agentId: payload.agentId,
      status: payload.status,
      message: payload.message,
    });

    return { ok: true };
  }

  /**
   * Health check endpoint
   * Allows SkyBot to verify webhook connectivity
   *
   * GET /api/webhooks/skybot/health
   */
  @Post('health')
  @Public()
  async health(@Headers('x-skybot-secret') secret: string | undefined) {
    this.verifyWebhookSecret(secret);

    return {
      ok: true,
      service: 'skybot-inbox-webhooks',
      timestamp: new Date().toISOString(),
    };
  }
}
