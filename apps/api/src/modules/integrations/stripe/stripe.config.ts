import { registerAs } from '@nestjs/config';
import { StripeConfig, StripeEnvironment } from './stripe.types';

/**
 * Stripe Configuration Factory
 * Loads configuration from environment variables
 *
 * Required Environment Variables:
 * - STRIPE_SECRET_KEY: Stripe secret API key (sk_test_... or sk_live_...)
 * - STRIPE_PUBLISHABLE_KEY: Stripe publishable key (pk_test_... or pk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret (whsec_...)
 *
 * Optional Environment Variables:
 * - STRIPE_SANDBOX: Set to 'true' for sandbox mode (default: true)
 * - STRIPE_PLATFORM_FEE_PERCENT: Platform fee percentage (default: 2.5)
 */
export default registerAs('stripe', (): StripeConfig => {
  const sandbox = process.env.STRIPE_SANDBOX !== 'false';
  const environment = sandbox
    ? StripeEnvironment.SANDBOX
    : StripeEnvironment.PRODUCTION;

  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    environment,
    apiVersion: '2024-11-20.acacia', // Latest stable API version
    connectEnabled: true,
    platformFeePercent: parseFloat(
      process.env.STRIPE_PLATFORM_FEE_PERCENT || '2.5',
    ),
  };
});

/**
 * Validate Stripe configuration
 * @throws Error if configuration is invalid
 */
export function validateStripeConfig(config: StripeConfig): void {
  const errors: string[] = [];

  if (!config.secretKey) {
    errors.push('STRIPE_SECRET_KEY is required');
  } else if (!isValidStripeKey(config.secretKey, 'sk')) {
    errors.push('STRIPE_SECRET_KEY has invalid format (should start with sk_)');
  }

  if (!config.publishableKey) {
    errors.push('STRIPE_PUBLISHABLE_KEY is required');
  } else if (!isValidStripeKey(config.publishableKey, 'pk')) {
    errors.push(
      'STRIPE_PUBLISHABLE_KEY has invalid format (should start with pk_)',
    );
  }

  // Webhook secret is optional - only validate format if provided
  if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
    errors.push(
      'STRIPE_WEBHOOK_SECRET has invalid format (should start with whsec_)',
    );
  }

  if (config.platformFeePercent < 0 || config.platformFeePercent > 100) {
    errors.push('STRIPE_PLATFORM_FEE_PERCENT must be between 0 and 100');
  }

  if (errors.length > 0) {
    throw new Error(
      `Stripe configuration validation failed:\n${errors.join('\n')}`,
    );
  }
}

/**
 * Validate Stripe API key format
 */
function isValidStripeKey(key: string, prefix: 'sk' | 'pk'): boolean {
  return key.startsWith(`${prefix}_test_`) || key.startsWith(`${prefix}_live_`);
}

/**
 * Get Stripe environment name (human-readable)
 */
export function getStripeEnvironmentName(
  environment: StripeEnvironment,
): string {
  return environment === StripeEnvironment.SANDBOX ? 'Sandbox' : 'Production';
}

/**
 * Check if Stripe is in test mode based on secret key
 */
export function isTestMode(secretKey: string): boolean {
  return secretKey.startsWith('sk_test_');
}

/**
 * Calculate platform fee amount
 */
export function calculatePlatformFee(
  amount: number,
  feePercent: number,
): number {
  return Math.round((amount * feePercent) / 100);
}
