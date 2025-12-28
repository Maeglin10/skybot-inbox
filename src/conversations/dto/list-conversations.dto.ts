import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ConversationStatus } from '@prisma/client';

export class ListConversationsDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsString()
  inboxId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  lite?: boolean;
}
