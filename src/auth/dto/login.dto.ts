import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
