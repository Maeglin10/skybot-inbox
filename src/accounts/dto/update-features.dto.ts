import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFeaturesDto {
  @IsOptional()
  @IsBoolean()
  inbox?: boolean;

  @IsOptional()
  @IsBoolean()
  crm?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @IsOptional()
  @IsBoolean()
  alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  settings?: boolean;

  @IsOptional()
  @IsBoolean()
  orders?: boolean;
}
