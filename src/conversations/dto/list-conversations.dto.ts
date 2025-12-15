import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListConversationsDto {
  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'PENDING', 'CLOSED'])
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
}
