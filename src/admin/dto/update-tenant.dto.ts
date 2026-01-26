import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Tier, TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Tier)
  @IsOptional()
  tier?: Tier;

  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @IsDateString()
  @IsOptional()
  trialEndsAt?: Date;
}
