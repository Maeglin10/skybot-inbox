import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(1)
  snippet!: string;

  @IsString()
  @MinLength(1)
  fullText!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  linkedLeadId?: string;
}
