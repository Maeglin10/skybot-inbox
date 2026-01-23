import { IsString, IsEnum, IsOptional, IsNumber, MinLength } from 'class-validator';

export enum AlertType {
  PAYMENT = 'PAYMENT',
  HANDOFF = 'HANDOFF',
}

export enum AlertStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  PENDING = 'PENDING',
}

export enum AlertPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class CreateAlertDto {
  @IsEnum(AlertType)
  type!: AlertType;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsEnum(AlertStatus)
  status!: AlertStatus;

  @IsEnum(AlertPriority)
  priority!: AlertPriority;

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
