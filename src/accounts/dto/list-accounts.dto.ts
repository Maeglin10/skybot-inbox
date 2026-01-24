import { IsOptional, IsEnum } from 'class-validator';
import { AccountRole, AccountStatus } from './create-account.dto';

export class ListAccountsDto {
  @IsOptional()
  @IsEnum(AccountRole)
  role?: AccountRole;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
