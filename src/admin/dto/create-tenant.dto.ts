import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Tier, TenantStatus } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsEnum(Tier)
  @IsOptional()
  tier?: Tier;

  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @IsDateString()
  @IsOptional()
  trialEndsAt?: Date;

  @IsBoolean()
  @IsOptional()
  isDemo?: boolean;

  // Admin user creation (optional)
  @IsString()
  @IsOptional()
  adminEmail?: string;

  @IsString()
  @IsOptional()
  adminPassword?: string;

  @IsString()
  @IsOptional()
  adminName?: string;
}
