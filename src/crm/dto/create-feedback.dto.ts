import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  SanitizeHtml,
  SanitizeHtmlBasic,
} from '../../common/validators/sanitize-html.decorator';

export class CreateFeedbackDto {
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  customerName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  customerEmail?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @SanitizeHtmlBasic() // Allow basic formatting for feedback snippet
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  snippet!: string;

  @SanitizeHtmlBasic() // Allow basic formatting for full feedback text
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  fullText!: string;

  @IsString()
  @MaxLength(50)
  channel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  linkedLeadId?: string;
}
