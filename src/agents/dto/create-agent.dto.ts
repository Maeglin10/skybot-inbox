import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { AgentType } from '@prisma/client';

export class CreateAgentDto {
  @IsString()
  agentName!: string;

  @IsEnum(AgentType)
  agentType!: AgentType;

  @IsString()
  templatePath!: string; // e.g., "templates/sales/lead-scorer.json"

  @IsObject()
  @IsOptional()
  configJson?: Record<string, any>; // Client-specific configuration
}
