import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  async getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.accountId);
  }

  @Get('portal')
  async redirectToBilling(@CurrentUser() user: any, @Res() res: Response) {
    const ssoUrl = await this.billingService.generatePortalUrl(user);
    res.redirect(ssoUrl);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(@Body() event: any) {
    return this.billingService.handleStripeWebhook(event);
  }
}
