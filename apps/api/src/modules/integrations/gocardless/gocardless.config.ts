import { registerAs } from '@nestjs/config';
import { GoCardlessConfig } from './gocardless.types';

/**
 * GoCardless API Configuration
 * Loads configuration from environment variables
 * Supports sandbox and live environments
 */
export default registerAs('gocardless', (): GoCardlessConfig => {
  const environment = (process.env.GOCARDLESS_ENV || 'sandbox').toLowerCase() as 'sandbox' | 'live';
  const mockMode = process.env.GOCARDLESS_MOCK_MODE === 'true';

  return {
    accessToken: process.env.GOCARDLESS_ACCESS_TOKEN || '',
    environment,
    webhookSecret: process.env.GOCARDLESS_WEBHOOK_SECRET || '',
    webhookUrl: process.env.GOCARDLESS_WEBHOOK_URL || '',
    redirectUri: process.env.GOCARDLESS_REDIRECT_URI || 'http://localhost:3000/integrations/gocardless/callback',
    mockMode,
  };
});

/**
 * GoCardless Configuration Validation
 * Throws error if required configuration is missing
 */
export function validateGoCardlessConfig(config: GoCardlessConfig): void {
  if (!config.mockMode) {
    if (!config.accessToken) {
      throw new Error('GOCARDLESS_ACCESS_TOKEN is required');
    }
    if (!config.webhookSecret) {
      throw new Error('GOCARDLESS_WEBHOOK_SECRET is required');
    }
    if (config.environment === 'live' && !config.webhookUrl) {
      throw new Error('GOCARDLESS_WEBHOOK_URL is required in live environment');
    }
  }
}

/**
 * Get GoCardless API base URL
 */
export function getGoCardlessApiUrl(environment: 'sandbox' | 'live'): string {
  return environment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';
}

/**
 * Get scheme-specific payment cycle
 */
export function getPaymentCycleDays(scheme: string): number {
  switch (scheme) {
    case 'bacs':
      return 3; // 3 working days
    case 'sepa_core':
      return 2; // 2 working days
    case 'sepa_cor1':
      return 1; // 1 working day
    case 'autogiro':
      return 2; // 2 working days
    case 'betalingsservice':
      return 1; // 1 working day
    case 'pad':
      return 2; // 2 working days
    default:
      return 3; // Default to BACS
  }
}

/**
 * Get scheme-specific currency
 */
export function getSchemeCurrency(scheme: string): string {
  switch (scheme) {
    case 'bacs':
      return 'GBP';
    case 'sepa_core':
    case 'sepa_cor1':
      return 'EUR';
    case 'autogiro':
      return 'SEK';
    case 'betalingsservice':
      return 'DKK';
    case 'pad':
      return 'CAD';
    default:
      return 'GBP';
  }
}

/**
 * Validate scheme and currency compatibility
 */
export function validateSchemeCurrency(scheme: string, currency: string): boolean {
  const expectedCurrency = getSchemeCurrency(scheme);
  return currency === expectedCurrency;
}
