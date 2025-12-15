import { IsIn, IsString } from 'class-validator';

export class UpdateConversationStatusDto {
  @IsString()
  @IsIn(['OPEN', 'PENDING', 'CLOSED'])
  status!: 'OPEN' | 'PENDING' | 'CLOSED';
}
