import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for full-text search of messages
 */
export class SearchMessagesDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  query!: string;

  @IsOptional()
  conversationId?: string;

  @IsOptional()
  inboxId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
