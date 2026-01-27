import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } });
  }

  async generatePortalUrl(user: any) {
    const ssoToken = this.jwtService.sign(
      {
        userId: user.id,
        email: user.email,
        accountId: user.accountId,
        purpose: 'billing_sso',
      },
      {
        secret: process.env.BILLING_SSO_SECRET || process.env.JWT_SECRET,
        expiresIn: '5m',
      },
    );
    const billingUrl =
      process.env.BILLING_PORTAL_URL || 'https://billing.skybot.com';
    const encodedEmail = encodeURIComponent(user.email);
    return `${billingUrl}/sso?token=${ssoToken}&email=${encodedEmail}`;
  }

  async handleStripeWebhook(event: any) {
    // TODO: Handle Stripe webhook events (checkout.session.completed, invoice.paid, etc.)
    return { received: true, type: event.type };
  }
}
