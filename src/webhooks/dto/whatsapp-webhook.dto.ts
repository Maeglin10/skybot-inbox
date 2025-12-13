import { IsOptional, IsString } from 'class-validator';

export class WhatsappWebhookVerifyQueryDto {
  @IsOptional()
  @IsString()
  ['hub.mode']?: string;

  @IsOptional()
  @IsString()
  ['hub.verify_token']?: string;

  @IsOptional()
  @IsString()
  ['hub.challenge']?: string;
}
