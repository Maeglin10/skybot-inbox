import { Controller, Get, Res } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('portal')
  async redirectToBilling(@CurrentUser() user: any, @Res() res: Response) {
    const ssoUrl = await this.billingService.generateSsoUrl(user);
    res.redirect(ssoUrl);
  }
}
