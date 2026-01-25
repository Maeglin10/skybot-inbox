import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BillingService {
  constructor(private jwtService: JwtService) {}

  async generateSsoUrl(user: any): Promise<string> {
    const ssoToken = this.jwtService.sign(
      {
        userId: user.id,
        email: user.email,
        accountId: user.accountId,
        purpose: 'billing_sso',
      },
      {
        secret:
          process.env.BILLING_SSO_SECRET || process.env.JWT_SECRET,
        expiresIn: '5m',
      },
    );

    const billingUrl =
      process.env.BILLING_PORTAL_URL || 'https://billing.skybot.com';
    return `${billingUrl}/sso?token=${ssoToken}&email=${encodeURIComponent(user.email)}`;
  }
}
