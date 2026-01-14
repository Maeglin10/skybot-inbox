import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  conversationId!: string;

  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}
