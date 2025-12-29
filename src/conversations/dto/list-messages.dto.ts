import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListMessagesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  limit?: number;

  // cursor = ISO date string (Message.createdAt / timestamp)
  @IsOptional()
  @IsString()
  cursor?: string;
}
