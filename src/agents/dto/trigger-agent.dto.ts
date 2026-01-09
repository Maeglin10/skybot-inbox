import { IsOptional, IsString, MinLength } from 'class-validator';

export class TriggerAgentDto {
  @IsString()
  @MinLength(1)
  conversationId!: string;

  @IsString()
  @MinLength(1)
  agentKey!: string;

  @IsOptional()
  @IsString()
  inputText?: string;
}
