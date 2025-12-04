import { registerAs } from '@nestjs/config';
import {
  PersonaConfig,
  PersonaEnvironment,
  PERSONA_API_BASE_URL,
  PERSONA_API_VERSION,
} from './types/persona.types';

/**
 * Persona Integration Configuration
 * Loads configuration from environment variables
 *
 * Required Environment Variables:
 * - PERSONA_API_KEY: API key for Persona
 * - PERSONA_WEBHOOK_SECRET: Secret for webhook signature verification
 * - PERSONA_ENVIRONMENT: 'sandbox' or 'production' (default: sandbox)
 */

export default registerAs('persona', (): PersonaConfig => {
  const environment =
    (process.env.PERSONA_ENVIRONMENT as PersonaEnvironment) ||
    PersonaEnvironment.SANDBOX;

  return {
    apiKey: process.env.PERSONA_API_KEY || '',
    webhookSecret: process.env.PERSONA_WEBHOOK_SECRET || '',
    environment,
    apiVersion: PERSONA_API_VERSION,
    baseUrl: PERSONA_API_BASE_URL[environment],
  };
});

/**
 * Validate Persona configuration
 * Throws error if required configuration is missing
 */
export function validatePersonaConfig(config: PersonaConfig): void {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('PERSONA_API_KEY is required');
  }

  if (!config.webhookSecret) {
    errors.push('PERSONA_WEBHOOK_SECRET is required');
  }

  if (
    config.environment !== PersonaEnvironment.SANDBOX &&
    config.environment !== PersonaEnvironment.PRODUCTION
  ) {
    errors.push(
      'PERSONA_ENVIRONMENT must be either "sandbox" or "production"',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Persona configuration validation failed:\n${errors.join('\n')}`,
    );
  }
}

/**
 * Get environment name for logging
 */
export function getPersonaEnvironmentName(
  environment: PersonaEnvironment,
): string {
  return environment === PersonaEnvironment.PRODUCTION
    ? 'Production'
    : 'Sandbox';
}

/**
 * Check if running in test mode
 */
export function isTestMode(apiKey: string): boolean {
  // Persona test API keys typically start with 'key_TEST_' or similar
  return apiKey.includes('TEST') || apiKey.includes('test');
}
