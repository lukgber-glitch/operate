import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GoCardlessService } from '../gocardless.service';
import { GoCardlessAuthService } from './gocardless-auth.service';
import { GoCardlessMandateService } from './gocardless-mandate.service';
import {
  CreatePaymentRequest,
  CreateSubscriptionRequest,
  GoCardlessPayment,
  GoCardlessSubscription,
  GoCardlessPaymentStatus,
} from '../gocardless.types';
import { validateSchemeCurrency } from '../gocardless.config';

/**
 * GoCardless Payment Service
 * Handles payment collection against mandates
 *
 * Features:
 * - Create one-off payments
 * - Create recurring subscriptions
 * - Retry failed payments
 * - Cancel pending payments
 * - Get payment status and timeline
 * - Idempotency key support
 *
 * Payment Types:
 * - One-off payments: Single payment against a mandate
 * - Subscriptions: Recurring payments on schedule
 *
 * Payment Statuses:
 * - pending_submission: Payment created but not yet submitted
 * - submitted: Payment submitted to bank
 * - confirmed: Bank confirmed payment will be processed
 * - paid_out: Funds paid out to merchant
 * - failed: Payment failed
 * - cancelled: Payment cancelled
 */
@Injectable()
export class GoCardlessPaymentService {
  private readonly logger = new Logger(GoCardlessPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocardlessService: GoCardlessService,
    private readonly authService: GoCardlessAuthService,
    private readonly mandateService: GoCardlessMandateService,
  ) {}

  /**
   * Create a one-off payment
   */
  async createPayment(
    orgId: string,
    request: CreatePaymentRequest,
    userId: string,
  ): Promise<GoCardlessPayment> {
    try {
      // Verify mandate is active
      const isActive = await this.mandateService.isMandateActive(request.mandateId);
      if (!isActive) {
        throw new BadRequestException('Mandate is not active');
      }

      // Get mandate to validate currency
      const mandate = await this.mandateService.getMandate(request.mandateId);
      if (!validateSchemeCurrency(mandate.scheme, request.currency)) {
        throw new BadRequestException(
          `Currency ${request.currency} is not compatible with scheme ${mandate.scheme}`,
        );
      }

      // Generate idempotency key
      const idempotencyKey = `payment_${orgId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create payment with GoCardless
      const client = this.gocardlessService.getClient();
      const payment = await client.payments.create({
        amount: Math.round(request.amount * 100), // Convert to pence/cents
        currency: request.currency,
        charge_date: request.chargeDate,
        reference: request.reference,
        description: request.description,
        metadata: request.metadata || {},
        links: {
          mandate: request.mandateId,
        },
        app_fee: request.appFee ? Math.round(request.appFee * 100) : undefined,
      }, {
        'Idempotency-Key': idempotencyKey,
      } as any);

      // Store payment in database
      await this.prisma.goCardlessPayment.create({
        data: {
          paymentId: payment.id,
          orgId,
          mandateId: request.mandateId,
          amount: request.amount,
          currency: request.currency,
          status: payment.status as any,
          chargeDate: new Date(payment.charge_date),
          reference: payment.reference || '',
          description: payment.description || '',
          createdBy: userId,
        },
      });

      this.logger.log('Created GoCardless payment', {
        paymentId: payment.id,
        amount: request.amount,
        currency: request.currency,
      });

      return payment as unknown as GoCardlessPayment;
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<GoCardlessPayment> {
    try {
      const payment = await this.prisma.goCardlessPayment.findUnique({
        where: { paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Get fresh data from GoCardless
      const client = this.gocardlessService.getClient();
      const gcPayment = await client.payments.find(paymentId);

      // Update local database
      await this.prisma.goCardlessPayment.update({
        where: { paymentId },
        data: {
          status: gcPayment.status as any,
          amountRefunded: gcPayment.amount_refunded ? gcPayment.amount_refunded / 100 : 0,
        },
      });

      return gcPayment as unknown as GoCardlessPayment;
    } catch (error) {
      this.logger.error('Failed to get payment', error);
      throw error;
    }
  }

  /**
   * List payments for a mandate
   */
  async listMandatePayments(mandateId: string): Promise<GoCardlessPayment[]> {
    try {
      const client = this.gocardlessService.getClient();
      const response = await client.payments.list({
        mandate: mandateId,
      });

      return response.payments as unknown as GoCardlessPayment[];
    } catch (error) {
      this.logger.error('Failed to list mandate payments', error);
      throw error;
    }
  }

  /**
   * List payments for an organization
   */
  async listOrganizationPayments(
    orgId: string,
    limit: number = 50,
    status?: GoCardlessPaymentStatus,
  ): Promise<GoCardlessPayment[]> {
    try {
      const where: any = { orgId };
      if (status) {
        where.status = status;
      }

      const payments = await this.prisma.goCardlessPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Get fresh data from GoCardless for each payment
      const updatedPayments: GoCardlessPayment[] = [];
      const client = this.gocardlessService.getClient();

      for (const payment of payments) {
        try {
          const gcPayment = await client.payments.find(payment.paymentId);
          updatedPayments.push(gcPayment as unknown as GoCardlessPayment);

          // Update local database
          await this.prisma.goCardlessPayment.update({
            where: { paymentId: payment.paymentId },
            data: {
              status: gcPayment.status as any,
              amountRefunded: gcPayment.amount_refunded ? gcPayment.amount_refunded / 100 : 0,
            },
          });
        } catch (error) {
          this.logger.warn('Failed to fetch payment from GoCardless', {
            paymentId: payment.paymentId,
            error: error.message,
          });
        }
      }

      return updatedPayments;
    } catch (error) {
      this.logger.error('Failed to list organization payments', error);
      throw error;
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string, userId: string): Promise<void> {
    try {
      const payment = await this.prisma.goCardlessPayment.findUnique({
        where: { paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Cancel with GoCardless
      const client = this.gocardlessService.getClient();
      await client.payments.cancel(paymentId);

      // Update local database
      await this.prisma.goCardlessPayment.update({
        where: { paymentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });

      this.logger.log('Cancelled payment', { paymentId });
    } catch (error) {
      this.logger.error('Failed to cancel payment', error);
      throw error;
    }
  }

  /**
   * Retry a failed payment
   */
  async retryPayment(paymentId: string, userId: string): Promise<GoCardlessPayment> {
    try {
      const payment = await this.prisma.goCardlessPayment.findUnique({
        where: { paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Retry with GoCardless
      const client = this.gocardlessService.getClient();
      const retriedPayment = await client.payments.retry(paymentId);

      // Update local database
      await this.prisma.goCardlessPayment.update({
        where: { paymentId },
        data: {
          status: retriedPayment.status as any,
        },
      });

      this.logger.log('Retried payment', { paymentId });

      return retriedPayment as unknown as GoCardlessPayment;
    } catch (error) {
      this.logger.error('Failed to retry payment', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    orgId: string,
    request: CreateSubscriptionRequest,
    userId: string,
  ): Promise<GoCardlessSubscription> {
    try {
      // Verify mandate is active
      const isActive = await this.mandateService.isMandateActive(request.mandateId);
      if (!isActive) {
        throw new BadRequestException('Mandate is not active');
      }

      // Get mandate to validate currency
      const mandate = await this.mandateService.getMandate(request.mandateId);
      if (!validateSchemeCurrency(mandate.scheme, request.currency)) {
        throw new BadRequestException(
          `Currency ${request.currency} is not compatible with scheme ${mandate.scheme}`,
        );
      }

      // Create subscription with GoCardless
      const client = this.gocardlessService.getClient();
      const subscription = await client.subscriptions.create({
        amount: Math.round(request.amount * 100), // Convert to pence/cents
        currency: request.currency,
        name: request.name,
        interval_unit: request.intervalUnit,
        interval: request.interval || 1,
        day_of_month: request.dayOfMonth,
        month: request.month,
        start_date: request.startDate,
        end_date: request.endDate,
        metadata: request.metadata || {},
        links: {
          mandate: request.mandateId,
        },
      });

      // Store subscription in database
      await this.prisma.goCardlessSubscription.create({
        data: {
          subscriptionId: subscription.id,
          orgId,
          mandateId: request.mandateId,
          amount: request.amount,
          currency: request.currency,
          name: request.name,
          intervalUnit: request.intervalUnit,
          interval: request.interval || 1,
          status: subscription.status as any,
          startDate: new Date(subscription.start_date),
          endDate: subscription.end_date ? new Date(subscription.end_date) : null,
          createdBy: userId,
        },
      });

      this.logger.log('Created GoCardless subscription', {
        subscriptionId: subscription.id,
        amount: request.amount,
        intervalUnit: request.intervalUnit,
      });

      return subscription as unknown as GoCardlessSubscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
    try {
      const subscription = await this.prisma.goCardlessSubscription.findUnique({
        where: { subscriptionId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Cancel with GoCardless
      const client = this.gocardlessService.getClient();
      await client.subscriptions.cancel(subscriptionId);

      // Update local database
      await this.prisma.goCardlessSubscription.update({
        where: { subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });

      this.logger.log('Cancelled subscription', { subscriptionId });
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<GoCardlessPaymentStatus> {
    const payment = await this.getPayment(paymentId);
    return payment.status;
  }
}
