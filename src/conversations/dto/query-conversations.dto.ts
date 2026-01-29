import { IsEnum, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ConversationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for querying conversations with proper validation
 * P1 FIX: Replaces manual string parsing with class-validator
 */
export class QueryConversationsDto {
  @IsEnum(ConversationStatus, {
    message: 'status must be one of: OPEN, PENDING, CLOSED',
  })
  @IsOptional()
  status?: ConversationStatus;

  @IsInt()
  @Min(1)
  @Max(50) // Reduced from 100 to prevent N+1 queries
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  cursor?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  lite?: boolean = false;
}
