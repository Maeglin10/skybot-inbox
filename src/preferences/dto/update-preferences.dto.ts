import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Theme, Language } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  language?: Language;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  timeFormat?: string;
}
