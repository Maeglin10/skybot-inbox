import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireModuleGuard } from '../auth/guards/require-module.guard';
import { UserRole } from '@prisma/client';

@Controller('agents')
@UseGuards(RolesGuard, RequireModuleGuard)
@RequireModule('agents') // Agents module must be enabled for tenant
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * Create a new agent from template
   * Only admins can create agents
   */
  @Post()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async create(@CurrentUser() user: any, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(user.accountId, dto);
  }

  /**
   * List all agents for current tenant
   * All authenticated users can view agents
   */
  @Get()
  @Roles(UserRole.AGENT_USER, UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.agentsService.findAll(user.accountId);
  }

  /**
   * Get a single agent by ID
   */
  @Get(':id')
  @Roles(UserRole.AGENT_USER, UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.agentsService.findOne(user.accountId, id);
  }

  /**
   * Update agent configuration
   * Only admins can update agents
   */
  @Put(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.update(user.accountId, id, dto);
  }

  /**
   * Delete agent (soft delete)
   * Only admins can delete agents
   */
  @Delete(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.agentsService.remove(user.accountId, id);
  }

  /**
   * Activate an agent
   */
  @Put(':id/activate')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.agentsService.activate(user.accountId, id);
  }

  /**
   * Deactivate an agent
   */
  @Put(':id/deactivate')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.agentsService.deactivate(user.accountId, id);
  }

  /**
   * Get agent statistics
   * Returns execution metrics, success rate, costs, etc.
   */
  @Get(':id/stats')
  @Roles(UserRole.AGENT_USER, UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.agentsService.getStats(user.accountId, id);
  }

  /**
   * Get agent execution logs
   * Supports pagination via query params
   */
  @Get(':id/logs')
  @Roles(UserRole.AGENT_USER, UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getLogs(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.agentsService.getLogs(
      user.accountId,
      id,
      parsedLimit,
      parsedOffset,
    );
  }
}
