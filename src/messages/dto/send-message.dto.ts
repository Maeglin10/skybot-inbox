import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { SanitizeHtmlBasic } from '../../common/validators/sanitize-html.decorator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  conversationId!: string;

  @SanitizeHtmlBasic() // Allow basic formatting in messages
  @IsString()
  @MinLength(1)
  @MaxLength(10000) // Max message length
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;
}
