import { IsString } from 'class-validator';

export class RevokeTokenDto {
  @IsString()
  refreshToken!: string;
}
