import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class EnableModuleDto {
  @IsString()
  moduleKey!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsObject()
  @IsOptional()
  limits?: Record<string, any>;
}
