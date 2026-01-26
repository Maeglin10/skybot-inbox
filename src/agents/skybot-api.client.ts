import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface SkybotDeploymentRequest {
  templatePath: string; // e.g., "templates/sales/lead-scorer.json"
  clientId: string; // Tenant/account ID
  config?: Record<string, any>; // Client-specific configuration
}

export interface SkybotDeploymentResponse {
  success: boolean;
  workflowId?: string; // N8N workflow ID
  workflowUrl?: string; // URL to view workflow in N8N
  error?: string;
  message?: string;
}

export interface SkybotAgentStatusResponse {
  agentId: string;
  workflowId: string;
  status: 'active' | 'inactive' | 'error';
  lastExecution?: Date;
  errorMessage?: string;
}

/**
 * HTTP Client for SkyBot API
 *
 * Communicates with the SkyBot project (separate Node.js app with N8N)
 * to deploy agent templates as N8N workflows
 *
 * Base URL: process.env.SKYBOT_API_URL (default: http://localhost:8080)
 * Auth: x-api-key header with process.env.SKYBOT_API_KEY
 */
@Injectable()
export class SkybotApiClient {
  private readonly logger = new Logger(SkybotApiClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('SKYBOT_API_URL') ||
      'http://localhost:8080';
    this.apiKey =
      this.configService.get<string>('SKYBOT_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn(
        'SKYBOT_API_KEY not configured - SkyBot API calls will fail',
      );
    }
  }

  /**
   * Deploy an agent template to N8N
   *
   * POST /api/agents/deploy
   * Body: { templatePath, clientId, config }
   * Returns: { workflowId, workflowUrl }
   */
  async deployAgent(
    request: SkybotDeploymentRequest,
  ): Promise<SkybotDeploymentResponse> {
    try {
      this.logger.log(
        `Deploying agent template: ${request.templatePath} for client: ${request.clientId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<SkybotDeploymentResponse>(
          `${this.baseUrl}/api/agents/deploy`,
          request,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
            },
            timeout: 30000, // 30s timeout
          },
        ),
      );

      if (response.data.success) {
        this.logger.log(
          `Agent deployed successfully: workflow ID ${response.data.workflowId}`,
        );
      } else {
        this.logger.error(
          `Agent deployment failed: ${response.data.error || 'Unknown error'}`,
        );
      }

      return response.data;
    } catch (error) {
      return this.handleError(error, 'deployAgent');
    }
  }

  /**
   * Activate an N8N workflow
   *
   * POST /api/agents/:workflowId/activate
   */
  async activateWorkflow(workflowId: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Activating N8N workflow: ${workflowId}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/agents/${workflowId}/activate`,
          {},
          {
            headers: { 'x-api-key': this.apiKey },
            timeout: 10000,
          },
        ),
      );

      this.logger.log(`Workflow activated: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'activateWorkflow');
    }
  }

  /**
   * Deactivate an N8N workflow
   *
   * POST /api/agents/:workflowId/deactivate
   */
  async deactivateWorkflow(workflowId: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deactivating N8N workflow: ${workflowId}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/agents/${workflowId}/deactivate`,
          {},
          {
            headers: { 'x-api-key': this.apiKey },
            timeout: 10000,
          },
        ),
      );

      this.logger.log(`Workflow deactivated: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'deactivateWorkflow');
    }
  }

  /**
   * Delete an N8N workflow
   *
   * DELETE /api/agents/:workflowId
   */
  async deleteWorkflow(workflowId: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting N8N workflow: ${workflowId}`);

      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/api/agents/${workflowId}`, {
          headers: { 'x-api-key': this.apiKey },
          timeout: 10000,
        }),
      );

      this.logger.log(`Workflow deleted: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'deleteWorkflow');
    }
  }

  /**
   * Get agent status from SkyBot
   *
   * GET /api/agents/:workflowId/status
   */
  async getAgentStatus(
    workflowId: string,
  ): Promise<SkybotAgentStatusResponse | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SkybotAgentStatusResponse>(
          `${this.baseUrl}/api/agents/${workflowId}/status`,
          {
            headers: { 'x-api-key': this.apiKey },
            timeout: 10000,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get agent status: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Health check for SkyBot API
   *
   * GET /health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          timeout: 5000,
        }),
      );

      this.logger.log('SkyBot API health check: OK');
      return true;
    } catch (error) {
      this.logger.error(
        `SkyBot API health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: unknown, operation: string): any {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      this.logger.error(
        `SkyBot API error in ${operation}: ${status} - ${message}`,
      );

      return {
        success: false,
        error: message,
        statusCode: status,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : String(error);
    this.logger.error(`SkyBot API error in ${operation}: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
