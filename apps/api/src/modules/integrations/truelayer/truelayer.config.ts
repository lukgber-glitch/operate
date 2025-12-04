import { registerAs } from '@nestjs/config';
import {
  TrueLayerConfig,
  TrueLayerEnvironment,
  TRUELAYER_ENDPOINTS,
} from './truelayer.types';

/**
 * TrueLayer Configuration Factory
 * Loads configuration from environment variables
 */
export default registerAs('truelayer', (): TrueLayerConfig => {
  const sandbox = process.env.TRUELAYER_SANDBOX === 'true';
  const environment = sandbox
    ? TrueLayerEnvironment.SANDBOX
    : TrueLayerEnvironment.PRODUCTION;

  return {
    clientId: process.env.TRUELAYER_CLIENT_ID || '',
    clientSecret: process.env.TRUELAYER_CLIENT_SECRET || '',
    environment,
    redirectUri:
      process.env.TRUELAYER_REDIRECT_URI ||
      'http://localhost:3000/integrations/truelayer/callback',
    webhookUrl: process.env.TRUELAYER_WEBHOOK_URL || '',
    sandbox,
  };
});

/**
 * Validate TrueLayer configuration
 * @throws Error if configuration is invalid
 */
export function validateTrueLayerConfig(config: TrueLayerConfig): void {
  const errors: string[] = [];

  if (!config.clientId) {
    errors.push('TRUELAYER_CLIENT_ID is required');
  }

  if (!config.clientSecret) {
    errors.push('TRUELAYER_CLIENT_SECRET is required');
  }

  if (!config.redirectUri) {
    errors.push('TRUELAYER_REDIRECT_URI is required');
  }

  if (errors.length > 0) {
    throw new Error(
      `TrueLayer configuration validation failed:\n${errors.join('\n')}`,
    );
  }
}

/**
 * Get TrueLayer environment name (human-readable)
 */
export function getTrueLayerEnvironmentName(
  environment: TrueLayerEnvironment,
): string {
  return environment === TrueLayerEnvironment.SANDBOX
    ? 'Sandbox'
    : 'Production';
}

/**
 * Get TrueLayer API base URL for environment
 */
export function getTrueLayerApiUrl(environment: TrueLayerEnvironment): string {
  return environment === TrueLayerEnvironment.SANDBOX
    ? TRUELAYER_ENDPOINTS.SANDBOX.API
    : TRUELAYER_ENDPOINTS.PRODUCTION.API;
}

/**
 * Get TrueLayer Auth base URL for environment
 */
export function getTrueLayerAuthUrl(environment: TrueLayerEnvironment): string {
  return environment === TrueLayerEnvironment.SANDBOX
    ? TRUELAYER_ENDPOINTS.SANDBOX.AUTH
    : TRUELAYER_ENDPOINTS.PRODUCTION.AUTH;
}
