import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
} from 'class-validator';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
  WON = 'WON',
}

export enum Temperature {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @IsEnum(Temperature)
  temperature!: Temperature;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
