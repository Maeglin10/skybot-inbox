import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string; // Can be email or username

  @IsString()
  password!: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
