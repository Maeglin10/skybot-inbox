import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';
import { LeadStatus, Temperature } from './create-lead.dto';
import { SanitizeHtml } from '../../common/validators/sanitize-html.decorator';

export class UpdateLeadDto {
  @SanitizeHtml()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

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

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(Temperature)
  temperature?: Temperature;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string;

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
