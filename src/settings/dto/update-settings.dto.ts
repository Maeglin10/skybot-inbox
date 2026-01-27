import {
  IsOptional,
  IsObject,
  IsString,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  defaultAgentKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedAgents?: string[];

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  @IsArray()
  externalAccounts?: string[];

  @IsOptional()
  @IsObject()
  n8nOverrides?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
