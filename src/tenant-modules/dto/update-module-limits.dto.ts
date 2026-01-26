import { IsObject } from 'class-validator';

export class UpdateModuleLimitsDto {
  @IsObject()
  limits!: Record<string, any>;
}
