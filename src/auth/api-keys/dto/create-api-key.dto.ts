import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
