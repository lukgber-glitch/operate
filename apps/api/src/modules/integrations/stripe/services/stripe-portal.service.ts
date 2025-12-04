import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../stripe.service';
import { CreatePortalSessionDto } from '../dto/subscription.dto';
import Stripe from 'stripe';

/**
 * Stripe Portal Service
 * Manages Stripe Customer Portal sessions for self-service subscription management
 *
 * Features:
 * - Create customer portal sessions
 * - Allow customers to:
 *   - Update payment methods
 *   - Change subscription plans
 *   - Cancel subscriptions
 *   - View billing history
 *   - Download invoices
 *   - Update billing information
 *
 * Security:
 * - Portal sessions are time-limited (expires after 30 minutes)
 * - Customer authentication required via returnUrl validation
 */
@Injectable()
export class StripePortalService {
  private readonly logger = new Logger(StripePortalService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = this.stripeService.getClient();
  }

  /**
   * Create a customer portal session
   * Returns a URL where the customer can manage their subscription
   */
  async createPortalSession(
    dto: CreatePortalSessionDto,
  ): Promise<{ url: string; expiresAt: number }> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Creating customer portal session for customer ${dto.customerId}`,
      );

      // Verify customer exists
      await this.verifyCustomer(dto.customerId);

      // Create portal session
      const session = await this.stripe.billingPortal.sessions.create({
        customer: dto.customerId,
        return_url: dto.returnUrl,
      });

      // Log audit event
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'PORTAL_SESSION_CREATED',
        metadata: {
          customerId: dto.customerId,
          sessionId: session.id,
          returnUrl: dto.returnUrl,
          duration: Date.now() - startTime,
        },
      });

      // Portal sessions expire after 30 minutes
      const expiresAt = Date.now() + 30 * 60 * 1000;

      return {
        url: session.url,
        expiresAt: Math.floor(expiresAt / 1000),
      };
    } catch (error) {
      this.logger.error('Failed to create portal session', error);
      await this.logAuditEvent({
        userId: dto.userId,
        action: 'PORTAL_SESSION_CREATION_FAILED',
        metadata: {
          customerId: dto.customerId,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });
      throw this.stripeService.handleStripeError(error, 'createPortalSession');
    }
  }

  /**
   * Configure the customer portal settings
   * This should be called once during setup to configure portal features
   */
  async configurePortal(config: {
    businessName: string;
    supportEmail: string;
    accentColor?: string;
    features?: {
      subscriptionCancel?: boolean;
      subscriptionPause?: boolean;
      subscriptionUpdate?: boolean;
      paymentMethodUpdate?: boolean;
      invoiceHistory?: boolean;
    };
  }): Promise<Stripe.BillingPortal.Configuration> {
    try {
      this.logger.log('Configuring customer portal');

      const configParams: Stripe.BillingPortal.ConfigurationCreateParams = {
        business_profile: {
          headline: config.businessName,
        },
        features: {
          subscription_cancel: {
            enabled: config.features?.subscriptionCancel ?? true,
            mode: 'at_period_end',
            cancellation_reason: {
              enabled: true,
              options: [
                'too_expensive',
                'missing_features',
                'switched_service',
                'unused',
                'customer_service',
                'too_complex',
                'low_quality',
                'other',
              ],
            },
          },
          subscription_pause: {
            enabled: config.features?.subscriptionPause ?? false,
          },
          subscription_update: {
            enabled: config.features?.subscriptionUpdate ?? true,
            default_allowed_updates: ['price', 'quantity', 'promotion_code'],
            proration_behavior: 'create_prorations',
          },
          payment_method_update: {
            enabled: config.features?.paymentMethodUpdate ?? true,
          },
          invoice_history: {
            enabled: config.features?.invoiceHistory ?? true,
          },
        },
      };

      // Add accent color if provided
      if (config.accentColor) {
        configParams.business_profile!.primary_button_color = config.accentColor;
      }

      const portalConfig = await this.stripe.billingPortal.configurations.create(
        configParams,
      );

      this.logger.log(`Portal configured: ${portalConfig.id}`);

      return portalConfig;
    } catch (error) {
      this.logger.error('Failed to configure portal', error);
      throw this.stripeService.handleStripeError(error, 'configurePortal');
    }
  }

  /**
   * Get the current portal configuration
   */
  async getPortalConfiguration(
    configurationId?: string,
  ): Promise<Stripe.BillingPortal.Configuration> {
    try {
      if (configurationId) {
        return await this.stripe.billingPortal.configurations.retrieve(
          configurationId,
        );
      }

      // Get the default (first) configuration
      const configs = await this.stripe.billingPortal.configurations.list({
        limit: 1,
      });

      if (configs.data.length === 0) {
        throw new NotFoundException('No portal configuration found');
      }

      return configs.data[0];
    } catch (error) {
      this.logger.error('Failed to get portal configuration', error);
      throw this.stripeService.handleStripeError(error, 'getPortalConfiguration');
    }
  }

  /**
   * Update portal configuration
   */
  async updatePortalConfiguration(
    configurationId: string,
    updates: Partial<Stripe.BillingPortal.ConfigurationUpdateParams>,
  ): Promise<Stripe.BillingPortal.Configuration> {
    try {
      this.logger.log(`Updating portal configuration ${configurationId}`);

      const config = await this.stripe.billingPortal.configurations.update(
        configurationId,
        updates,
      );

      this.logger.log(`Portal configuration updated: ${config.id}`);

      return config;
    } catch (error) {
      this.logger.error('Failed to update portal configuration', error);
      throw this.stripeService.handleStripeError(error, 'updatePortalConfiguration');
    }
  }

  /**
   * List all portal configurations
   */
  async listPortalConfigurations(): Promise<Stripe.BillingPortal.Configuration[]> {
    try {
      const configs = await this.stripe.billingPortal.configurations.list();
      return configs.data;
    } catch (error) {
      this.logger.error('Failed to list portal configurations', error);
      throw this.stripeService.handleStripeError(error, 'listPortalConfigurations');
    }
  }

  /**
   * Set the default portal configuration
   * This will be used when creating portal sessions without specifying a config
   */
  async setDefaultPortalConfiguration(
    configurationId: string,
  ): Promise<Stripe.BillingPortal.Configuration> {
    try {
      this.logger.log(`Setting default portal configuration to ${configurationId}`);

      const config = await this.stripe.billingPortal.configurations.update(
        configurationId,
        {
          is_default: true,
        },
      );

      this.logger.log(`Default portal configuration set: ${config.id}`);

      return config;
    } catch (error) {
      this.logger.error('Failed to set default portal configuration', error);
      throw this.stripeService.handleStripeError(error, 'setDefaultPortalConfiguration');
    }
  }

  // Helper Methods

  private async verifyCustomer(customerId: string): Promise<void> {
    try {
      await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
  }

  private async logAuditEvent(data: {
    userId: string;
    action: string;
    metadata: any;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stripe_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${data.userId}, ${data.action}, ${JSON.stringify(data.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
