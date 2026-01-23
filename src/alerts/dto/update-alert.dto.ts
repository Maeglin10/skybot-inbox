import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { AlertType, AlertStatus, AlertPriority } from './create-alert.dto';

export class UpdateAlertDto {
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(AlertPriority)
  priority?: AlertPriority;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  assignee?: string;
}
