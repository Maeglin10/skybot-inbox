import { IsString, IsOptional, IsUrl, IsEnum, IsDateString } from 'class-validator';

export enum StoryMediaType {
  IMAGE = 'image/jpeg',
  VIDEO = 'video/mp4',
}

export class CreateStoryDto {
  @IsUrl()
  mediaUrl!: string;

  @IsEnum(StoryMediaType)
  mediaType!: StoryMediaType;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsUrl()
  @IsOptional()
  link?: string;

  @IsString()
  phoneNumberId!: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
