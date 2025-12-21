import { Injectable, Inject, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { GoCardlessClient } from 'gocardless-nodejs';
import gocardlessConfig, { validateSchemeCurrency } from './gocardless.config';
import { PrismaService } from '../../database/prisma.service';
import {
  GoCardlessConfig,
  CreateRedirectFlowRequest,
  CompleteRedirectFlowRequest,
  GoCardlessRedirectFlowResponse,
  GoCardlessMandate,
} from './gocardless.types';

/**
 * GoCardless Core Service
 * Handles GoCardless API client initialization and core operations
 *
 * Features:
 * - Client initialization with access token
 * - Environment management (sandbox/live)
 * - Redirect flow creation for mandate setup
 * - OAuth2-style authorization flows
 * - Error handling and logging
 *
 * Security:
 * - Access tokens stored encrypted
 * - Webhook signature verification
 * - Rate limiting on all endpoints
 * - Comprehensive audit logging
 *
 * @see https://developer.gocardless.com/api-reference/
 */
@Injectable()
export class GoCardlessService {
  private readonly logger = new Logger(GoCardlessService.name);
  private client: GoCardlessClient | null = null;
  private readonly enabled: boolean;

  constructor(
    @Inject(gocardlessConfig.KEY)
    private readonly config: ConfigType<typeof gocardlessConfig>,
    private readonly prisma: PrismaService,
  ) {
    // Check if configuration is complete
    if (!this.config.mockMode && !this.config.accessToken) {
      this.logger.warn('GoCardless credentials not configured. Set GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY');
      this.enabled = false;
    } else {
      this.enabled = true;
      // Initialize GoCardless client
      this.initializeClient();
    }

    this.logger.log('GoCardless Service initialized');
  }

  /**
   * Check if GoCardless service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Initialize GoCardless API client
   */
  private initializeClient(): void {
    if (this.config.mockMode) {
      this.logger.warn('GoCardless running in MOCK MODE - no real API calls will be made');
      return;
    }

    try {
      this.client = GoCardlessClient(
        this.config.accessToken,
        this.config.environment,
      );

      this.logger.log(`GoCardless client initialized for ${this.config.environment} environment`);
    } catch (error) {
      this.logger.error('Failed to initialize GoCardless client', error);
      throw error;
    }
  }

  /**
   * Get GoCardless client instance
   */
  getClient(): GoCardlessClient {
    if (!this.enabled) {
      throw new BadRequestException('GoCardless is not configured');
    }
    if (this.config.mockMode) {
      throw new Error('Cannot get client in mock mode');
    }
    if (!this.client) {
      throw new BadRequestException('GoCardless client not initialized');
    }
    return this.client;
  }

  /**
   * Create a redirect flow for mandate setup
   * This is the first step in the GoCardless authorization flow
   *
   * @param request - Redirect flow request
   * @returns Redirect flow response with URL to redirect customer to
   */
  async createRedirectFlow(
    request: CreateRedirectFlowRequest,
  ): Promise<GoCardlessRedirectFlowResponse> {
    if (!this.enabled) {
      throw new BadRequestException('GoCardless is not configured');
    }

    if (this.config.mockMode) {
      return this.mockCreateRedirectFlow(request);
    }

    try {
      this.logger.log('Creating GoCardless redirect flow', {
        description: request.description,
        scheme: request.scheme,
      });

      const redirectFlow = await this.getClient().redirectFlows.create({
        description: request.description,
        session_token: request.sessionToken,
        success_redirect_url: request.successRedirectUrl,
        scheme: request.scheme,
        prefilled_customer: request.prefilled_customer,
      });

      this.logger.log('Redirect flow created successfully', {
        redirectFlowId: redirectFlow.id,
      });

      return redirectFlow as unknown as GoCardlessRedirectFlowResponse;
    } catch (error) {
      this.logger.error('Failed to create redirect flow', error);
      throw new BadRequestException('Failed to create redirect flow: ' + error.message);
    }
  }

  /**
   * Complete a redirect flow after customer authorization
   * This exchanges the redirect flow for a mandate
   *
   * @param request - Complete redirect flow request
   * @returns Created mandate
   */
  async completeRedirectFlow(
    request: CompleteRedirectFlowRequest,
  ): Promise<GoCardlessMandate> {
    if (!this.enabled) {
      throw new BadRequestException('GoCardless is not configured');
    }

    if (this.config.mockMode) {
      return this.mockCompleteRedirectFlow(request);
    }

    try {
      this.logger.log('Completing GoCardless redirect flow', {
        redirectFlowId: request.redirectFlowId,
      });

      const client = this.getClient();
      const redirectFlow = await client.redirectFlows.complete(
        request.redirectFlowId,
        {
          session_token: request.sessionToken,
        },
      );

      const mandate = redirectFlow.links.mandate;
      const mandateDetails = await client.mandates.find(mandate);

      this.logger.log('Redirect flow completed successfully', {
        mandateId: mandate,
        status: mandateDetails.status,
      });

      return mandateDetails as unknown as GoCardlessMandate;
    } catch (error) {
      this.logger.error('Failed to complete redirect flow', error);
      throw new BadRequestException('Failed to complete redirect flow: ' + error.message);
    }
  }

  /**
   * Get creditor information
   */
  async getCreditor(creditorId: string): Promise<any> {
    if (!this.enabled) {
      throw new BadRequestException('GoCardless is not configured');
    }

    if (this.config.mockMode) {
      return this.mockGetCreditor(creditorId);
    }

    try {
      return await this.getClient().creditors.find(creditorId);
    } catch (error) {
      this.logger.error('Failed to get creditor', error);
      throw new BadRequestException('Failed to get creditor: ' + error.message);
    }
  }

  /**
   * List all creditors
   */
  async listCreditors(): Promise<any[]> {
    if (!this.enabled) {
      throw new BadRequestException('GoCardless is not configured');
    }

    if (this.config.mockMode) {
      return [this.mockGetCreditor('CR123')];
    }

    try {
      const response = await this.getClient().creditors.list();
      return response.creditors;
    } catch (error) {
      this.logger.error('Failed to list creditors', error);
      throw new BadRequestException('Failed to list creditors: ' + error.message);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(body: string, signature: string): boolean {
    if (!this.enabled) {
      this.logger.warn('Cannot validate webhook - GoCardless is not configured');
      return false;
    }

    if (this.config.mockMode) {
      return true;
    }

    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(body)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error('Failed to validate webhook signature', error);
      return false;
    }
  }

  // Mock methods for testing

  private mockCreateRedirectFlow(
    request: CreateRedirectFlowRequest,
  ): GoCardlessRedirectFlowResponse {
    return {
      id: 'RE' + Math.random().toString(36).substring(7),
      description: request.description,
      session_token: request.sessionToken,
      scheme: request.scheme || 'bacs',
      success_redirect_url: request.successRedirectUrl,
      redirect_url: 'https://pay-sandbox.gocardless.com/flow/RE123',
      created_at: new Date().toISOString(),
      links: {
        creditor: 'CR123',
      },
    };
  }

  private mockCompleteRedirectFlow(
    request: CompleteRedirectFlowRequest,
  ): GoCardlessMandate {
    return {
      id: 'MD' + Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      reference: 'MANDATE-' + Date.now(),
      scheme: 'bacs',
      status: 'pending_submission' as Prisma.InputJsonValue,
      next_possible_charge_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments_require_approval: false,
      metadata: {},
      links: {
        customer_bank_account: 'BA123',
        creditor: 'CR123',
        customer: 'CU123',
      },
    };
  }

  private mockGetCreditor(creditorId: string): any {
    return {
      id: creditorId,
      created_at: new Date().toISOString(),
      name: 'Mock Creditor',
      address_line1: '123 Test Street',
      city: 'London',
      postal_code: 'SW1A 1AA',
      country_code: 'GB',
      links: {
        default_gbp_payout_account: 'BA123',
      },
      verification_status: 'successful',
      can_create_refunds: true,
      fx_payout_currency: 'GBP',
      custom_payment_pages_enabled: true,
      merchant_responsible_for_notifications: false,
      bank_reference_prefix: 'OPERATE',
    };
  }
}
