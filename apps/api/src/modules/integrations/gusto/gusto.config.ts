import { registerAs } from '@nestjs/config';
import { GustoConfig, GustoEnvironment } from './gusto.types';

export default registerAs('gusto', (): GustoConfig => {
  const environment =
    process.env.GUSTO_ENVIRONMENT === 'production'
      ? GustoEnvironment.PRODUCTION
      : GustoEnvironment.SANDBOX;

  return {
    clientId: process.env.GUSTO_CLIENT_ID || '',
    clientSecret: process.env.GUSTO_CLIENT_SECRET || '',
    redirectUri: process.env.GUSTO_REDIRECT_URI || 'http://localhost:3000/api/integrations/gusto/callback',
    environment,
    apiVersion: 'v1',
    webhookSecret: process.env.GUSTO_WEBHOOK_SECRET || '',
    scopes: [
      'company:read',
      'company:write',
      'employee:read',
      'employee:write',
      'payroll:read',
      'payroll:write',
    ],
  };
});

/**
 * Get Gusto API base URL based on environment
 */
export function getGustoApiUrl(environment: GustoEnvironment): string {
  return environment === GustoEnvironment.PRODUCTION
    ? 'https://api.gusto.com'
    : 'https://api.gusto-demo.com';
}

/**
 * Get Gusto OAuth authorization URL
 */
export function getGustoAuthUrl(environment: GustoEnvironment): string {
  return environment === GustoEnvironment.PRODUCTION
    ? 'https://api.gusto.com/oauth/authorize'
    : 'https://api.gusto-demo.com/oauth/authorize';
}

/**
 * Get Gusto OAuth token URL
 */
export function getGustoTokenUrl(environment: GustoEnvironment): string {
  return environment === GustoEnvironment.PRODUCTION
    ? 'https://api.gusto.com/oauth/token'
    : 'https://api.gusto-demo.com/oauth/token';
}

/**
 * Validate Gusto configuration
 */
export function validateGustoConfig(config: GustoConfig): void {
  const required = [
    'clientId',
    'clientSecret',
    'redirectUri',
    'webhookSecret',
  ];

  const missing = required.filter(
    (key) => !config[key as keyof GustoConfig],
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required Gusto configuration: ${missing.join(', ')}. ` +
      `Please set GUSTO_CLIENT_ID, GUSTO_CLIENT_SECRET, GUSTO_REDIRECT_URI, and GUSTO_WEBHOOK_SECRET environment variables.`,
    );
  }

  // Validate redirect URI format
  try {
    new URL(config.redirectUri);
  } catch {
    throw new Error(
      `Invalid GUSTO_REDIRECT_URI: ${config.redirectUri}. Must be a valid URL.`,
    );
  }
}

/**
 * Get environment display name
 */
export function getEnvironmentName(environment: GustoEnvironment): string {
  return environment === GustoEnvironment.PRODUCTION ? 'Production' : 'Sandbox';
}

/**
 * Check if running in sandbox mode
 */
export function isSandboxMode(config: GustoConfig): boolean {
  return config.environment === GustoEnvironment.SANDBOX;
}
