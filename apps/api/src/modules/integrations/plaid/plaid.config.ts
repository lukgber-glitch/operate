import { registerAs } from '@nestjs/config';
import { PlaidEnvironments } from 'plaid';
import { PlaidConfig } from './plaid.types';

/**
 * Plaid API Configuration
 * Loads configuration from environment variables
 * Supports sandbox, development, and production environments
 */
export default registerAs('plaid', (): PlaidConfig => {
  const envString = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
  const mockMode = process.env.PLAID_MOCK_MODE === 'true';

  // Map string to PlaidEnvironments enum
  let environment: typeof PlaidEnvironments[keyof typeof PlaidEnvironments];
  switch (envString) {
    case 'production':
      environment = PlaidEnvironments.production;
      break;
    case 'development':
      environment = PlaidEnvironments.development;
      break;
    case 'sandbox':
    default:
      environment = PlaidEnvironments.sandbox;
      break;
  }

  return {
    clientId: process.env.PLAID_CLIENT_ID || '',
    secret: process.env.PLAID_SECRET || '',
    environment,
    webhookUrl: process.env.PLAID_WEBHOOK_URL || '',
    redirectUri: process.env.PLAID_REDIRECT_URI || 'http://localhost:3000/integrations/plaid/callback',
    mockMode,
  };
});

/**
 * Plaid Configuration Validation
 * Throws error if required configuration is missing
 */
export function validatePlaidConfig(config: PlaidConfig): void {
  if (!config.mockMode) {
    if (!config.clientId) {
      throw new Error('PLAID_CLIENT_ID is required');
    }
    if (!config.secret) {
      throw new Error('PLAID_SECRET is required');
    }
    if (config.environment === PlaidEnvironments.production && !config.webhookUrl) {
      throw new Error('PLAID_WEBHOOK_URL is required in production environment');
    }
  }
}

/**
 * Get environment name for logging
 */
export function getPlaidEnvironmentName(env: typeof PlaidEnvironments[keyof typeof PlaidEnvironments]): string {
  switch (env) {
    case PlaidEnvironments.production:
      return 'production';
    case PlaidEnvironments.development:
      return 'development';
    case PlaidEnvironments.sandbox:
      return 'sandbox';
    default:
      return 'unknown';
  }
}
