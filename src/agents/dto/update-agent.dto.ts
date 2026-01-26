import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { AgentType, AgentStatus } from '@prisma/client';

export class UpdateAgentDto {
  @IsString()
  @IsOptional()
  agentName?: string;

  @IsEnum(AgentType)
  @IsOptional()
  agentType?: AgentType;

  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @IsObject()
  @IsOptional()
  configJson?: Record<string, any>;
}
