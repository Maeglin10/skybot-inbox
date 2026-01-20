import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
