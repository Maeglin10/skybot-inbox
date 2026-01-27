import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { SanitizeHtml } from '../../common/validators/sanitize-html.decorator';

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
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @SanitizeHtml()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @IsEnum(Temperature)
  temperature!: Temperature;

  @IsString()
  @MaxLength(50)
  channel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
