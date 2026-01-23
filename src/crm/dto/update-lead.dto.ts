import { IsString, IsEmail, IsOptional, IsEnum, IsArray } from 'class-validator';
import { LeadStatus, Temperature } from './create-lead.dto';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(Temperature)
  temperature?: Temperature;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
