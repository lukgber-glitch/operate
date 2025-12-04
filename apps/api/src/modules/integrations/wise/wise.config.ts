import { registerAs } from '@nestjs/config';
import {
  WiseConfig,
  WiseEnvironment,
  WISE_ENDPOINTS,
} from './wise.types';

/**
 * Wise Configuration Factory
 * Loads configuration from environment variables
 */
export default registerAs('wise', (): WiseConfig => {
  const sandbox = process.env.WISE_SANDBOX === 'true';
  const environment = sandbox
    ? WiseEnvironment.SANDBOX
    : WiseEnvironment.PRODUCTION;

  return {
    apiToken: process.env.WISE_API_TOKEN || '',
    environment,
    webhookSecret: process.env.WISE_WEBHOOK_SECRET || '',
    sandbox,
    profileId: process.env.WISE_PROFILE_ID || undefined,
  };
});

/**
 * Validate Wise configuration
 * @throws Error if configuration is invalid
 */
export function validateWiseConfig(config: WiseConfig): void {
  const errors: string[] = [];

  if (!config.apiToken) {
    errors.push('WISE_API_TOKEN is required');
  }

  if (errors.length > 0) {
    throw new Error(
      `Wise configuration validation failed:\n${errors.join('\n')}`,
    );
  }
}

/**
 * Get Wise environment name (human-readable)
 */
export function getWiseEnvironmentName(
  environment: WiseEnvironment,
): string {
  return environment === WiseEnvironment.SANDBOX
    ? 'Sandbox'
    : 'Production';
}

/**
 * Get Wise API base URL for environment
 */
export function getWiseApiUrl(environment: WiseEnvironment): string {
  return environment === WiseEnvironment.SANDBOX
    ? WISE_ENDPOINTS.SANDBOX.API
    : WISE_ENDPOINTS.PRODUCTION.API;
}
