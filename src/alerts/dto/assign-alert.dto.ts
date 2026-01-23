import { IsString, MinLength } from 'class-validator';

export class AssignAlertDto {
  @IsString()
  @MinLength(1)
  assignee!: string;
}
