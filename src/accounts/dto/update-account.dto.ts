import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
