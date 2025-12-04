import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GoCardlessService } from './gocardless.service';
import { PrismaService } from '../../database/prisma.service';
import { GoCardlessWebhookPayload, GoCardlessWebhookEvent } from './gocardless.types';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * GoCardless Webhook Controller
 * Handles webhook events from GoCardless
 *
 * Events:
 * - Mandates: created, submitted, active, failed, cancelled, expired
 * - Payments: created, submitted, confirmed, paid_out, failed, charged_back
 * - Payouts: paid
 * - Subscriptions: created, payment_created, cancelled
 * - Refunds: created, paid, failed
 *
 * Security:
 * - Webhook signature verification (HMAC-SHA256)
 * - Idempotency handling
 * - Rate limiting
 *
 * @see https://developer.gocardless.com/api-reference/#webhooks
 */
@ApiTags('GoCardless Webhooks')
@Controller('integrations/gocardless/webhooks')
export class GoCardlessWebhookController {
  private readonly logger = new Logger(GoCardlessWebhookController.name);

  constructor(
    private readonly gocardlessService: GoCardlessService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handle GoCardless webhook events
   */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({ summary: 'Handle GoCardless webhook events' })
  @ApiResponse({ status: 204, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Body() payload: GoCardlessWebhookPayload,
    @Headers('webhook-signature') signature: string,
    @Body() rawBody: string,
  ): Promise<void> {
    try {
      // Verify webhook signature
      const isValid = this.gocardlessService.validateWebhookSignature(
        JSON.stringify(rawBody),
        signature,
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature', { signature });
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log('Received GoCardless webhook', {
        eventCount: payload.events.length,
      });

      // Process each event
      for (const event of payload.events) {
        await this.processWebhookEvent(event);
      }
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      throw error;
    }
  }

  /**
   * Process individual webhook event
   */
  private async processWebhookEvent(event: GoCardlessWebhookEvent): Promise<void> {
    try {
      this.logger.log('Processing webhook event', {
        eventId: event.id,
        resourceType: event.resource_type,
        action: event.action,
      });

      // Check for duplicate event
      const existingEvent = await this.prisma.goCardlessWebhookEvent.findUnique({
        where: { eventId: event.id },
      });

      if (existingEvent) {
        this.logger.log('Duplicate webhook event, skipping', { eventId: event.id });
        return;
      }

      // Store webhook event
      await this.prisma.goCardlessWebhookEvent.create({
        data: {
          eventId: event.id,
          resourceType: event.resource_type,
          action: event.action,
          payload: event as any,
          processedAt: new Date(),
        },
      });

      // Route to appropriate handler
      switch (event.resource_type) {
        case 'mandates':
          await this.handleMandateEvent(event);
          break;
        case 'payments':
          await this.handlePaymentEvent(event);
          break;
        case 'payouts':
          await this.handlePayoutEvent(event);
          break;
        case 'subscriptions':
          await this.handleSubscriptionEvent(event);
          break;
        case 'refunds':
          await this.handleRefundEvent(event);
          break;
        default:
          this.logger.log('Unhandled resource type', {
            resourceType: event.resource_type,
          });
      }

      // Emit event for other parts of the system to react to
      this.eventEmitter.emit(`gocardless.${event.resource_type}.${event.action}`, event);
    } catch (error) {
      this.logger.error('Failed to process webhook event', {
        eventId: event.id,
        error,
      });
      throw error;
    }
  }

  /**
   * Handle mandate events
   */
  private async handleMandateEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const mandateId = event.links.mandate;

    switch (event.action) {
      case 'created':
      case 'submitted':
      case 'active':
        await this.prisma.goCardlessMandate.update({
          where: { mandateId },
          data: {
            status: event.action.toUpperCase() as any,
          },
        });
        this.logger.log('Mandate status updated', {
          mandateId,
          status: event.action,
        });
        break;

      case 'failed':
      case 'cancelled':
      case 'expired':
        await this.prisma.goCardlessMandate.update({
          where: { mandateId },
          data: {
            status: event.action.toUpperCase() as any,
            failureReason: event.details.description,
          },
        });
        this.logger.log('Mandate failed/cancelled/expired', {
          mandateId,
          status: event.action,
          reason: event.details.description,
        });
        break;

      case 'reinstated':
        await this.prisma.goCardlessMandate.update({
          where: { mandateId },
          data: {
            status: 'ACTIVE',
            failureReason: null,
          },
        });
        this.logger.log('Mandate reinstated', { mandateId });
        break;

      default:
        this.logger.log('Unhandled mandate action', {
          action: event.action,
        });
    }
  }

  /**
   * Handle payment events
   */
  private async handlePaymentEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const paymentId = event.links.payment;

    switch (event.action) {
      case 'created':
      case 'submitted':
      case 'confirmed':
      case 'paid_out':
        await this.prisma.goCardlessPayment.update({
          where: { paymentId },
          data: {
            status: event.action.toUpperCase().replace('_', '_') as any,
          },
        });
        this.logger.log('Payment status updated', {
          paymentId,
          status: event.action,
        });
        break;

      case 'failed':
      case 'cancelled':
      case 'charged_back':
        await this.prisma.goCardlessPayment.update({
          where: { paymentId },
          data: {
            status: event.action.toUpperCase().replace('_', '_') as any,
            failureReason: event.details.description,
          },
        });
        this.logger.log('Payment failed/cancelled/charged_back', {
          paymentId,
          status: event.action,
          reason: event.details.description,
        });
        break;

      case 'customer_approval_granted':
      case 'customer_approval_denied':
        await this.prisma.goCardlessPayment.update({
          where: { paymentId },
          data: {
            status: event.action === 'customer_approval_granted' ? 'PENDING_SUBMISSION' : 'CUSTOMER_APPROVAL_DENIED' as any,
          },
        });
        this.logger.log('Payment customer approval', {
          paymentId,
          approved: event.action === 'customer_approval_granted',
        });
        break;

      default:
        this.logger.log('Unhandled payment action', {
          action: event.action,
        });
    }
  }

  /**
   * Handle payout events
   */
  private async handlePayoutEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const payoutId = event.links.payout;

    this.logger.log('Payout event received', {
      payoutId,
      action: event.action,
    });

    // Store payout event
    await this.prisma.goCardlessPayout.upsert({
      where: { payoutId },
      create: {
        payoutId,
        status: event.action.toUpperCase() as any,
        paidAt: event.action === 'paid' ? new Date() : null,
      },
      update: {
        status: event.action.toUpperCase() as any,
        paidAt: event.action === 'paid' ? new Date() : null,
      },
    });
  }

  /**
   * Handle subscription events
   */
  private async handleSubscriptionEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const subscriptionId = event.links.subscription;

    switch (event.action) {
      case 'created':
      case 'payment_created':
        // Payment created events are handled separately
        this.logger.log('Subscription event', {
          subscriptionId,
          action: event.action,
        });
        break;

      case 'cancelled':
      case 'finished':
        await this.prisma.goCardlessSubscription.update({
          where: { subscriptionId },
          data: {
            status: event.action.toUpperCase() as any,
          },
        });
        this.logger.log('Subscription cancelled/finished', {
          subscriptionId,
          status: event.action,
        });
        break;

      default:
        this.logger.log('Unhandled subscription action', {
          action: event.action,
        });
    }
  }

  /**
   * Handle refund events
   */
  private async handleRefundEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const refundId = event.links.refund;

    this.logger.log('Refund event received', {
      refundId,
      action: event.action,
    });

    // Store refund event
    await this.prisma.goCardlessRefund.upsert({
      where: { refundId },
      create: {
        refundId,
        paymentId: event.links.payment,
        status: event.action.toUpperCase() as any,
      },
      update: {
        status: event.action.toUpperCase() as any,
      },
    });
  }
}
