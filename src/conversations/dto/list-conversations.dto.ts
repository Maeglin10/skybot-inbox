import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListConversationsDto {
  @IsOptional()
  @IsIn(['OPEN', 'PENDING', 'CLOSED'])
  status?: 'OPEN' | 'PENDING' | 'CLOSED';

  @IsOptional()
  @IsString()
  inboxId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string; // Conversation.id
}
