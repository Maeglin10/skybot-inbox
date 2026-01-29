import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import Stripe from 'stripe';

/**
 * Stripe Webhook Controller
 *
 * Handles incoming webhook events from Stripe with signature verification
 *
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - checkout.session.completed
 *
 * Setup in Stripe Dashboard:
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/stripe
 * 3. Select events to listen to
 * 4. Copy webhook signing secret to env: STRIPE_WEBHOOK_SECRET
 */
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured');
    }

    this.stripe = new Stripe(stripeSecretKey || '', {
      apiVersion: '2026-01-28.clover',
    });
  }

  @Public()
  @Post()
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException(
          'Raw body not available - ensure raw body middleware is configured',
        );
      }

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`Verified Stripe webhook: ${event.type}`);
    } catch (error: any) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }

    // Handle the event
    try {
      await this.handleStripeEvent(event);
      return { received: true };
    } catch (error: any) {
      this.logger.error(`Error processing webhook ${event.type}:`, error);
      return { received: true, error: error.message };
    }
  }

  private async handleStripeEvent(event: Stripe.Event) {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    this.logger.log(
      `Subscription created: ${subscription.id} for customer ${subscription.customer}`,
    );
    // TODO: Update database with subscription details
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(
      `Subscription updated: ${subscription.id} status=${subscription.status}`,
    );
    // TODO: Update subscription in database
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // TODO: Handle subscription cancellation
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // TODO: Record payment
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.error(
      `Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`,
    );
    // TODO: Handle failed payment
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout completed: ${session.id}`);
    // TODO: Complete signup/upgrade flow
  }
}
