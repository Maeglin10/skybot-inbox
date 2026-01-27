import { Controller, Get, Post, Body } from '@nestjs/common';
import { CorporateNumbersService } from './corporate-numbers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('corporate-numbers')
export class CorporateNumbersController {
  constructor(
    private readonly corporateNumbersService: CorporateNumbersService,
  ) {}

  @Get()
  async listNumbers(@CurrentUser() user: any) {
    return this.corporateNumbersService.listNumbers(user.accountId);
  }

  @Post()
  async addNumber(@CurrentUser() user: any, @Body() dto: any) {
    return this.corporateNumbersService.addNumber(user.accountId, dto);
  }
}
