import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { StripeService } from '../stripe.service';
import {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  CreateTransferRequest,
  TransferResponse,
  CreateRefundRequest,
  RefundResponse,
  StripePaymentStatus,
  SUPPORTED_CURRENCIES,
} from '../stripe.types';
import { calculatePlatformFee } from '../stripe.config';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';

/**
 * Stripe Payments Service
 * Handles payment processing, transfers, and refunds with Connect
 *
 * Features:
 * - Payment Intent creation with platform fees
 * - Split payments (platform fee + connected account)
 * - Direct charges to connected accounts
 * - Transfer creation to connected accounts
 * - Refund handling with optional transfer reversal
 * - Multi-currency support
 * - Idempotency key generation for all operations
 */
@Injectable()
export class StripePaymentsService {
  private readonly logger = new Logger(StripePaymentsService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {
    if (this.stripeService.isEnabled()) {
      this.stripe = this.stripeService.getClient();
    } else {
      this.logger.warn('StripePaymentsService disabled - Stripe is not configured');
    }
  }

  /**
   * Get Stripe client or throw if not available
   */
  private getStripeClient(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  /**
   * Create a payment intent with optional platform fee
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest,
  ): Promise<PaymentIntentResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating payment intent for user ${request.userId}, amount: ${request.amount} ${request.currency}`,
      );

      // Validate currency
      this.validateCurrency(request.currency);

      // Calculate platform fee if not provided
      let platformFee = request.platformFeeAmount;
      if (!platformFee && request.platformFeePercent) {
        platformFee = calculatePlatformFee(
          request.amount,
          request.platformFeePercent,
        );
      } else if (!platformFee) {
        const config = this.stripeService.getConfig();
        platformFee = calculatePlatformFee(
          request.amount,
          config.platformFeePercent,
        );
      }

      // Generate idempotency key
      const idempotencyKey = this.generateIdempotencyKey();

      // Build payment intent params
      const params: Stripe.PaymentIntentCreateParams = {
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
        capture_method: request.captureMethod || 'automatic',
        confirmation_method: request.confirmationMethod || 'automatic',
        payment_method_types: request.paymentMethodTypes || ['card'],
      };

      // Add Connect-specific parameters if connected account is provided
      if (request.connectedAccountId) {
        params.application_fee_amount = platformFee;
        params.transfer_data = {
          destination: request.connectedAccountId,
        };
      }

      // Create payment intent
      const paymentIntent = await this.getStripeClient().paymentIntents.create(params, {
        idempotencyKey,
      });

      // Store payment in database
      await this.storePayment(
        request.userId,
        paymentIntent,
        request.connectedAccountId,
        platformFee,
      );

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'PAYMENT_INTENT_CREATED',
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount: request.amount,
          currency: request.currency,
          connectedAccountId: request.connectedAccountId,
          platformFee,
          duration: Date.now() - startTime,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        connectedAccountId: request.connectedAccountId,
        platformFee,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'PAYMENT_INTENT_CREATION_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(
        error,
        'createPaymentIntent',
      );
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentResponse> {
    try {
      this.logger.log(`Fetching payment intent ${paymentIntentId}`);

      const paymentIntent = await this.getStripeClient().paymentIntents.retrieve(
        paymentIntentId,
      );

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to fetch payment intent', error);
      throw this.stripeService.handleStripeError(
        error,
        'retrievePaymentIntent',
      );
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<PaymentIntentResponse> {
    try {
      this.logger.log(`Confirming payment intent ${paymentIntentId}`);

      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.getStripeClient().paymentIntents.confirm(
        paymentIntentId,
        params,
      );

      // Update payment status in database
      await this.updatePaymentStatus(
        paymentIntentId,
        this.mapStripeStatusToEnum(paymentIntent.status),
      );

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to confirm payment intent', error);
      throw this.stripeService.handleStripeError(
        error,
        'confirmPaymentIntent',
      );
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      this.logger.log(`Canceling payment intent ${paymentIntentId}`);

      await this.getStripeClient().paymentIntents.cancel(paymentIntentId);

      // Update payment status in database
      await this.updatePaymentStatus(
        paymentIntentId,
        StripePaymentStatus.CANCELED,
      );
    } catch (error) {
      this.logger.error('Failed to cancel payment intent', error);
      throw this.stripeService.handleStripeError(
        error,
        'cancelPaymentIntent',
      );
    }
  }

  /**
   * Create a transfer to a connected account
   */
  async createTransfer(
    request: CreateTransferRequest,
  ): Promise<TransferResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating transfer for user ${request.userId}, amount: ${request.amount} ${request.currency}`,
      );

      // Validate currency
      this.validateCurrency(request.currency);

      // Generate idempotency key
      const idempotencyKey = this.generateIdempotencyKey();

      // Create transfer
      const transfer = await this.getStripeClient().transfers.create(
        {
          amount: request.amount,
          currency: request.currency.toLowerCase(),
          destination: request.destinationAccountId,
          description: request.description,
          metadata: {
            userId: request.userId,
            ...request.metadata,
          },
          source_transaction: request.sourceTransaction,
        },
        { idempotencyKey },
      );

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TRANSFER_CREATED',
        metadata: {
          transferId: transfer.id,
          amount: request.amount,
          currency: request.currency,
          destinationAccountId: request.destinationAccountId,
          duration: Date.now() - startTime,
        },
      });

      return {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination as string,
        status: 'created',
        created: transfer.created,
        metadata: transfer.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create transfer', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'TRANSFER_CREATION_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'createTransfer');
    }
  }

  /**
   * Create a refund for a payment intent
   */
  async createRefund(request: CreateRefundRequest): Promise<RefundResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating refund for payment intent ${request.paymentIntentId}`,
      );

      // Generate idempotency key
      const idempotencyKey = this.generateIdempotencyKey();

      // Build refund params
      const params: Stripe.RefundCreateParams = {
        payment_intent: request.paymentIntentId,
        reason: request.reason,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
        reverse_transfer: request.reverseTransfer,
        refund_application_fee: request.refundApplicationFee,
      };

      if (request.amount) {
        params.amount = request.amount;
      }

      // Create refund
      const refund = await this.getStripeClient().refunds.create(params, {
        idempotencyKey,
      });

      // Update payment status in database - assume partial if not full refund
      const status = StripePaymentStatus.PARTIALLY_REFUNDED;
      await this.updatePaymentStatus(request.paymentIntentId, status);

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        action: 'REFUND_CREATED',
        metadata: {
          refundId: refund.id,
          paymentIntentId: request.paymentIntentId,
          amount: refund.amount,
          currency: refund.currency,
          reason: request.reason,
          duration: Date.now() - startTime,
        },
      });

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        paymentIntentId: request.paymentIntentId,
        created: refund.created,
        metadata: refund.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create refund', error);
      await this.logAuditEvent({
        userId: request.userId,
        action: 'REFUND_CREATION_FAILED',
        metadata: {
          error: error.message,
          paymentIntentId: request.paymentIntentId,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'createRefund');
    }
  }

  // Private helper methods

  private validateCurrency(currency: string): void {
    const upperCurrency = currency.toUpperCase();
    if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(upperCurrency)) {
      throw new BadRequestException(
        `Currency ${currency} is not supported. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`,
      );
    }
  }

  private generateIdempotencyKey(): string {
    return randomBytes(16).toString('hex');
  }

  private async storePayment(
    userId: string,
    paymentIntent: Stripe.PaymentIntent,
    connectedAccountId?: string,
    platformFee?: number,
  ): Promise<void> {
    const status = this.mapStripeStatusToEnum(paymentIntent.status);

    await this.prisma.$executeRaw`
      INSERT INTO stripe_payments
      (user_id, payment_intent_id, amount, currency, status, connected_account_id,
       platform_fee, metadata, created_at, updated_at)
      VALUES
      (${userId}, ${paymentIntent.id}, ${paymentIntent.amount}, ${paymentIntent.currency},
       ${status}, ${connectedAccountId || null}, ${platformFee || null},
       ${JSON.stringify(paymentIntent.metadata)}::jsonb, NOW(), NOW())
    `;
  }

  private async updatePaymentStatus(
    paymentIntentId: string,
    status: StripePaymentStatus,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE stripe_payments
      SET status = ${status}, updated_at = NOW()
      WHERE payment_intent_id = ${paymentIntentId}
    `;
  }

  private mapStripeStatusToEnum(
    status: Stripe.PaymentIntent.Status,
  ): StripePaymentStatus {
    const statusMap: Record<Stripe.PaymentIntent.Status, StripePaymentStatus> =
      {
        requires_payment_method: StripePaymentStatus.PENDING,
        requires_confirmation: StripePaymentStatus.PENDING,
        requires_action: StripePaymentStatus.PENDING,
        processing: StripePaymentStatus.PROCESSING,
        requires_capture: StripePaymentStatus.PROCESSING,
        succeeded: StripePaymentStatus.SUCCEEDED,
        canceled: StripePaymentStatus.CANCELED,
      };

    return statusMap[status] || StripePaymentStatus.PENDING;
  }

  private async logAuditEvent(event: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
