import { IsOptional, IsEnum } from 'class-validator';
import { AlertStatus, AlertType } from './create-alert.dto';

export class ListAlertsDto {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;
}
