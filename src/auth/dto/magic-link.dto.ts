import { IsEmail, IsString } from 'class-validator';

export class MagicLinkDto {
  @IsEmail()
  email!: string;
}

export class VerifyMagicLinkDto {
  @IsEmail()
  email!: string;

  @IsString()
  token!: string;
}
