import { IsString, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  accountId!: string;

  @IsString()
  inboxId!: string;

  @IsString()
  phone!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
