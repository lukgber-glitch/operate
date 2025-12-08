import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeConfig, StripeEnvironment } from './stripe.types';
import {
  validateStripeConfig,
  getStripeEnvironmentName,
  isTestMode,
} from './stripe.config';

/**
 * Stripe Core Service
 * Provides low-level Stripe SDK wrapper with configuration and logging
 *
 * This service initializes the Stripe client and provides access to the SDK
 * for other services to use.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly config: StripeConfig;
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    // Load configuration
    this.config = {
      secretKey: this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      publishableKey:
        this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '',
      webhookSecret:
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '',
      environment:
        this.configService.get<string>('STRIPE_SANDBOX') !== 'false'
          ? StripeEnvironment.SANDBOX
          : StripeEnvironment.PRODUCTION,
      apiVersion: '2024-11-20.acacia',
      connectEnabled: true,
      platformFeePercent: parseFloat(
        this.configService.get<string>('STRIPE_PLATFORM_FEE_PERCENT') || '2.5',
      ),
    };

    // Validate configuration
    validateStripeConfig(this.config);

    // Initialize Stripe client
    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: this.config.apiVersion as Prisma.InputJsonValue,
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000,
      telemetry: false, // Disable telemetry for security
      appInfo: {
        name: 'Operate/CoachOS',
        version: '0.1.0',
        url: 'https://operate.coach',
      },
    });

    const testMode = isTestMode(this.config.secretKey);
    this.logger.log(
      `Stripe Service initialized (${getStripeEnvironmentName(this.config.environment)} mode, Test: ${testMode})`,
    );
  }

  /**
   * Get Stripe client instance
   */
  getClient(): Stripe {
    return this.stripe;
  }

  /**
   * Get Stripe configuration
   */
  getConfig(): StripeConfig {
    return { ...this.config };
  }

  /**
   * Get webhook secret for signature verification
   */
  getWebhookSecret(): string {
    return this.config.webhookSecret;
  }

  /**
   * Get publishable key for client-side usage
   */
  getPublishableKey(): string {
    return this.config.publishableKey;
  }

  /**
   * Check if running in test mode
   */
  isTestMode(): boolean {
    return isTestMode(this.config.secretKey);
  }

  /**
   * Verify webhook signature
   * @throws Error if signature is invalid
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new InternalServerErrorException(
        'Webhook signature verification failed',
      );
    }
  }

  /**
   * Handle Stripe API errors with proper logging
   */
  handleStripeError(error: any, operation: string): never {
    this.logger.error(`Stripe ${operation} failed`, {
      type: error.type,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    if (error instanceof Stripe.errors.StripeCardError) {
      throw new InternalServerErrorException(
        `Card error: ${error.message}`,
      );
    } else if (error instanceof Stripe.errors.StripeRateLimitError) {
      throw new InternalServerErrorException(
        'Too many requests to Stripe, please try again later',
      );
    } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new InternalServerErrorException(
        `Invalid request: ${error.message}`,
      );
    } else if (error instanceof Stripe.errors.StripeAPIError) {
      throw new InternalServerErrorException(
        'Stripe API error, please try again later',
      );
    } else if (error instanceof Stripe.errors.StripeConnectionError) {
      throw new InternalServerErrorException(
        'Network error connecting to Stripe',
      );
    } else if (error instanceof Stripe.errors.StripeAuthenticationError) {
      throw new InternalServerErrorException(
        'Stripe authentication failed',
      );
    }

    throw new InternalServerErrorException(
      `Stripe operation failed: ${error.message}`,
    );
  }
}
