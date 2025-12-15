import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  ListPaymentsRequest,
  ListPaymentsResponse,
  CancelPaymentRequest,
  TrueLayerPaymentRequest,
  TrueLayerPaymentResponse,
  TrueLayerPaymentDetailsResponse,
  TrueLayerPaymentStatus,
  PaymentInitiationStatus,
  PaymentSourceType,
  PAYMENT_LIMITS,
  PAYMENT_AUTH_TIMEOUT_MINUTES,
} from '../truelayer-pis.types';
import { getTrueLayerApiUrl } from '../truelayer.config';
import { TrueLayerConfig } from '../truelayer.types';

/**
 * TrueLayer Payment Initiation Service (PIS)
 * Enables secure payment initiation via Open Banking
 *
 * Features:
 * - Single immediate payments
 * - Payment status tracking
 * - Webhook handling for payment lifecycle
 * - Link payments to bills/expenses/invoices
 * - Sandbox mode for testing
 *
 * Security:
 * - OAuth2 authorization flow
 * - Amount validation
 * - Audit logging
 * - IP and user-agent tracking
 *
 * @see https://docs.truelayer.com/docs/single-immediate-payments
 */
@Injectable()
export class TrueLayerPISService {
  private readonly logger = new Logger(TrueLayerPISService.name);
  private readonly apiClient: AxiosInstance;
  private readonly config: TrueLayerConfig;
  private readonly isSandbox: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    const envMode =
      this.configService.get<string>('TRUELAYER_ENV') ||
      (this.configService.get<string>('TRUELAYER_SANDBOX') === 'true'
        ? 'sandbox'
        : 'production');

    this.isSandbox = envMode === 'sandbox';

    this.config = {
      clientId: this.configService.get<string>('TRUELAYER_CLIENT_ID') || '',
      clientSecret:
        this.configService.get<string>('TRUELAYER_CLIENT_SECRET') || '',
      environment: this.isSandbox ? 'sandbox' : 'production',
      redirectUri:
        this.configService.get<string>('TRUELAYER_REDIRECT_URI') ||
        'http://localhost:3000/integrations/truelayer/callback',
      webhookUrl:
        this.configService.get<string>('TRUELAYER_WEBHOOK_URL') || '',
      sandbox: this.isSandbox,
    };

    // Initialize API client
    const apiBaseUrl = getTrueLayerApiUrl(this.config.environment as any);

    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger.log(
      `TrueLayer PIS Service initialized (${this.isSandbox ? 'Sandbox' : 'Production'} mode)`,
    );
  }

  /**
   * Create a new payment initiation
   */
  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating payment for user ${request.userId}: ${request.amount} ${request.currency}`,
      );

      // Validate amount
      this.validateAmount(request.amount, request.currency);

      // Validate beneficiary details
      this.validateBeneficiary(request);

      // In sandbox mode, use mock data
      if (this.isSandbox) {
        return this.createMockPayment(request);
      }

      // Get access token (payment-specific token)
      const accessToken = await this.getPaymentAccessToken();

      // Convert amount to minor units (cents/pence)
      const amountInMinor = Math.round(request.amount * 100);

      // Build TrueLayer payment request
      const trueLayerRequest: TrueLayerPaymentRequest = {
        amount_in_minor: amountInMinor,
        currency: request.currency.toUpperCase(),
        payment_method: {
          type: 'bank_transfer',
          provider_selection: {
            type: 'user_selected',
            filter: {
              countries: [this.getCountryCode(request.currency)],
            },
          },
          beneficiary: this.buildBeneficiary(request),
        },
        user: {
          id: request.userId,
        },
        metadata: {
          orgId: request.orgId,
          sourceType: request.sourceType || PaymentSourceType.MANUAL,
          billId: request.billId,
          expenseId: request.expenseId,
          invoiceId: request.invoiceId,
          reference: request.reference,
          description: request.description,
        },
      };

      // Create payment via TrueLayer API
      const response = await this.apiClient.post<TrueLayerPaymentResponse>(
        '/payments',
        trueLayerRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const trueLayerPayment = response.data;

      // Store payment in database
      const payment = await this.prisma.paymentInitiation.create({
        data: {
          orgId: request.orgId,
          userId: request.userId,
          amount: request.amount,
          currency: request.currency.toUpperCase(),
          beneficiaryName: request.beneficiaryName,
          beneficiaryIban: request.beneficiaryIban,
          beneficiarySortCode: request.beneficiarySortCode,
          beneficiaryAccountNumber: request.beneficiaryAccountNumber,
          reference: request.reference,
          description: request.description,
          status: this.mapTrueLayerStatus(trueLayerPayment.status),
          truelayerPaymentId: trueLayerPayment.id,
          redirectUri: request.redirectUri || this.config.redirectUri,
          authorizationUri:
            trueLayerPayment.authorization_flow?.actions?.next?.uri,
          sourceType: request.sourceType || PaymentSourceType.MANUAL,
          billId: request.billId,
          expenseId: request.expenseId,
          invoiceId: request.invoiceId,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        },
      });

      // Log audit event
      await this.logAuditEvent({
        userId: request.userId,
        orgId: request.orgId,
        action: 'PAYMENT_CREATED',
        metadata: {
          paymentId: payment.id,
          truelayerPaymentId: trueLayerPayment.id,
          amount: request.amount,
          currency: request.currency,
          duration: Date.now() - startTime,
        },
      });

      return {
        paymentId: payment.id,
        truelayerPaymentId: trueLayerPayment.id,
        authorizationUri:
          trueLayerPayment.authorization_flow?.actions?.next?.uri || '',
        status: this.mapTrueLayerStatus(trueLayerPayment.status),
        expiresAt: new Date(
          Date.now() + PAYMENT_AUTH_TIMEOUT_MINUTES * 60 * 1000,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      await this.logAuditEvent({
        userId: request.userId,
        orgId: request.orgId,
        action: 'PAYMENT_CREATION_FAILED',
        metadata: {
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw new ServiceUnavailableException('Failed to create payment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string,
    userId: string,
    orgId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      this.logger.log(`Getting payment status for ${paymentId}`);

      const payment = await this.prisma.paymentInitiation.findFirst({
        where: {
          id: paymentId,
          userId,
          orgId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // In sandbox mode, return stored data
      if (this.isSandbox) {
        return this.mapToPaymentStatusResponse(payment);
      }

      // Fetch latest status from TrueLayer
      if (payment.truelayerPaymentId) {
        await this.syncPaymentStatus(payment.id, payment.truelayerPaymentId);

        // Refetch updated payment
        const updatedPayment = await this.prisma.paymentInitiation.findUnique({
          where: { id: paymentId },
        });

        return this.mapToPaymentStatusResponse(updatedPayment);
      }

      return this.mapToPaymentStatusResponse(payment);
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      throw error;
    }
  }

  /**
   * List payments for organization
   */
  async listPayments(
    request: ListPaymentsRequest,
  ): Promise<ListPaymentsResponse> {
    try {
      const limit = request.limit || 50;
      const offset = request.offset || 0;

      const where: any = {
        orgId: request.orgId,
        userId: request.userId,
      };

      if (request.status) {
        where.status = request.status;
      }

      if (request.sourceType) {
        where.sourceType = request.sourceType;
      }

      const [payments, total] = await Promise.all([
        this.prisma.paymentInitiation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.paymentInitiation.count({ where }),
      ]);

      return {
        payments: payments.map((p) => this.mapToPaymentStatusResponse(p)),
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to list payments', error);
      throw new ServiceUnavailableException('Failed to list payments');
    }
  }

  /**
   * Cancel a payment (if still pending)
   */
  async cancelPayment(request: CancelPaymentRequest): Promise<void> {
    try {
      this.logger.log(`Cancelling payment ${request.paymentId}`);

      const payment = await this.prisma.paymentInitiation.findFirst({
        where: {
          id: request.paymentId,
          userId: request.userId,
          orgId: request.orgId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Can only cancel pending payments
      if (
        payment.status !== PaymentInitiationStatus.PENDING &&
        payment.status !== PaymentInitiationStatus.AUTHORIZATION_REQUIRED
      ) {
        throw new BadRequestException(
          `Cannot cancel payment with status ${payment.status}`,
        );
      }

      await this.prisma.paymentInitiation.update({
        where: { id: request.paymentId },
        data: {
          status: PaymentInitiationStatus.CANCELLED,
        },
      });

      await this.logAuditEvent({
        userId: request.userId,
        orgId: request.orgId,
        action: 'PAYMENT_CANCELLED',
        metadata: {
          paymentId: request.paymentId,
          reason: request.reason,
        },
      });
    } catch (error) {
      this.logger.error('Failed to cancel payment', error);
      throw error;
    }
  }

  /**
   * Sync payment status from TrueLayer
   */
  async syncPaymentStatus(
    paymentId: string,
    truelayerPaymentId: string,
  ): Promise<void> {
    try {
      const accessToken = await this.getPaymentAccessToken();

      const response =
        await this.apiClient.get<TrueLayerPaymentDetailsResponse>(
          `/payments/${truelayerPaymentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

      const details = response.data;

      const updateData: any = {
        status: this.mapTrueLayerStatus(details.status),
      };

      if (details.executed_at) {
        updateData.executedAt = new Date(details.executed_at);
      }

      if (details.settled_at) {
        updateData.settledAt = new Date(details.settled_at);
      }

      await this.prisma.paymentInitiation.update({
        where: { id: paymentId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error('Failed to sync payment status', error);
      // Don't throw - this is a background operation
    }
  }

  // Private helper methods

  private validateAmount(amount: number, currency: string): void {
    const amountInMinor = Math.round(amount * 100);

    if (amountInMinor < PAYMENT_LIMITS.MIN_AMOUNT_MINOR) {
      throw new BadRequestException(
        `Amount too small. Minimum is ${PAYMENT_LIMITS.MIN_AMOUNT_MINOR / 100} ${currency}`,
      );
    }

    if (amountInMinor > PAYMENT_LIMITS.MAX_AMOUNT_MINOR) {
      throw new BadRequestException(
        `Amount too large. Maximum is ${PAYMENT_LIMITS.MAX_AMOUNT_MINOR / 100} ${currency}`,
      );
    }
  }

  private validateBeneficiary(request: CreatePaymentRequest): void {
    if (!request.beneficiaryName) {
      throw new BadRequestException('Beneficiary name is required');
    }

    // Must have either IBAN or UK account details
    const hasIban = !!request.beneficiaryIban;
    const hasUkDetails =
      !!request.beneficiarySortCode && !!request.beneficiaryAccountNumber;

    if (!hasIban && !hasUkDetails) {
      throw new BadRequestException(
        'Either IBAN or UK account details (sort code + account number) required',
      );
    }
  }

  private buildBeneficiary(request: CreatePaymentRequest): any {
    const beneficiary: any = {
      type: 'external_account',
      name: request.beneficiaryName,
      account_holder_name: request.beneficiaryName,
    };

    if (request.beneficiaryIban) {
      beneficiary.account_identifier = {
        type: 'iban',
        iban: request.beneficiaryIban,
      };
    } else if (
      request.beneficiarySortCode &&
      request.beneficiaryAccountNumber
    ) {
      beneficiary.account_identifier = {
        type: 'sort_code_account_number',
        sort_code: request.beneficiarySortCode,
        account_number: request.beneficiaryAccountNumber,
      };
    }

    return beneficiary;
  }

  private getCountryCode(currency: string): string {
    const countryMap: Record<string, string> = {
      GBP: 'GB',
      EUR: 'DE', // Can also support other EU countries
      USD: 'US',
    };

    return countryMap[currency.toUpperCase()] || 'GB';
  }

  private mapTrueLayerStatus(
    status: TrueLayerPaymentStatus,
  ): PaymentInitiationStatus {
    const statusMap: Record<TrueLayerPaymentStatus, PaymentInitiationStatus> =
      {
        [TrueLayerPaymentStatus.AUTHORIZATION_REQUIRED]:
          PaymentInitiationStatus.AUTHORIZATION_REQUIRED,
        [TrueLayerPaymentStatus.AUTHORIZING]:
          PaymentInitiationStatus.AUTHORIZING,
        [TrueLayerPaymentStatus.AUTHORIZED]:
          PaymentInitiationStatus.AUTHORIZED,
        [TrueLayerPaymentStatus.EXECUTED]: PaymentInitiationStatus.EXECUTED,
        [TrueLayerPaymentStatus.SETTLED]: PaymentInitiationStatus.SETTLED,
        [TrueLayerPaymentStatus.FAILED]: PaymentInitiationStatus.FAILED,
      };

    return statusMap[status] || PaymentInitiationStatus.PENDING;
  }

  private mapToPaymentStatusResponse(payment: any): PaymentStatusResponse {
    return {
      paymentId: payment.id,
      truelayerPaymentId: payment.truelayerPaymentId,
      status: payment.status,
      amount: parseFloat(payment.amount.toString()),
      currency: payment.currency,
      beneficiaryName: payment.beneficiaryName,
      reference: payment.reference,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      authorizedAt: payment.authorizedAt,
      executedAt: payment.executedAt,
      settledAt: payment.settledAt,
    };
  }

  private async getPaymentAccessToken(): Promise<string> {
    // In production, get OAuth2 token for payments scope
    // For sandbox, use client credentials
    const response = await axios.post(
      `${this.isSandbox ? 'https://auth.truelayer-sandbox.com' : 'https://auth.truelayer.com'}/connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'payments',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  private async createMockPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    // Create mock payment for sandbox testing
    const mockTruelayerPaymentId = `mock-payment-${Date.now()}`;

    const payment = await this.prisma.paymentInitiation.create({
      data: {
        orgId: request.orgId,
        userId: request.userId,
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        beneficiaryName: request.beneficiaryName,
        beneficiaryIban: request.beneficiaryIban,
        beneficiarySortCode: request.beneficiarySortCode,
        beneficiaryAccountNumber: request.beneficiaryAccountNumber,
        reference: request.reference,
        description: request.description,
        status: PaymentInitiationStatus.AUTHORIZATION_REQUIRED,
        truelayerPaymentId: mockTruelayerPaymentId,
        redirectUri: request.redirectUri || this.config.redirectUri,
        authorizationUri: `http://localhost:3000/mock-auth/${mockTruelayerPaymentId}`,
        sourceType: request.sourceType || PaymentSourceType.MANUAL,
        billId: request.billId,
        expenseId: request.expenseId,
        invoiceId: request.invoiceId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      },
    });

    return {
      paymentId: payment.id,
      truelayerPaymentId: mockTruelayerPaymentId,
      authorizationUri: `http://localhost:3000/mock-auth/${mockTruelayerPaymentId}`,
      status: PaymentInitiationStatus.AUTHORIZATION_REQUIRED,
      expiresAt: new Date(
        Date.now() + PAYMENT_AUTH_TIMEOUT_MINUTES * 60 * 1000,
      ),
    };
  }

  private async logAuditEvent(event: {
    userId: string;
    orgId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Log to audit table (if exists)
      this.logger.log(
        `Audit: ${event.action} by ${event.userId} in org ${event.orgId}`,
      );
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
