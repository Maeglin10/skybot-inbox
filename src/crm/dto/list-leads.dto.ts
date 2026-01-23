import { IsOptional, IsEnum } from 'class-validator';
import { LeadStatus } from './create-lead.dto';

export class ListLeadsDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
