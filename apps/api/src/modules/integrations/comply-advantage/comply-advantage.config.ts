/**
 * ComplyAdvantage Configuration
 */

export interface ComplyAdvantageConfigInterface {
  apiKey: string;
  apiUrl: string;
  webhookSecret?: string;
  environment: 'production' | 'sandbox';
  mockMode: boolean;
  timeout?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_COMPLY_ADVANTAGE_CONFIG = {
  apiUrl: 'https://api.complyadvantage.com',
  environment: 'sandbox' as const,
  mockMode: false,
  timeout: 30000,
};

/**
 * Environment variable keys
 */
export const COMPLY_ADVANTAGE_ENV_KEYS = {
  API_KEY: 'COMPLY_ADVANTAGE_API_KEY',
  API_URL: 'COMPLY_ADVANTAGE_API_URL',
  WEBHOOK_SECRET: 'COMPLY_ADVANTAGE_WEBHOOK_SECRET',
  ENVIRONMENT: 'COMPLY_ADVANTAGE_ENVIRONMENT',
  MOCK_MODE: 'COMPLY_ADVANTAGE_MOCK_MODE',
  ENCRYPTION_KEY: 'COMPLY_ADVANTAGE_ENCRYPTION_KEY',
};

/**
 * Validate ComplyAdvantage configuration
 */
export function validateComplyAdvantageConfig(
  config: Partial<ComplyAdvantageConfigInterface>,
): void {
  if (!config.mockMode && !config.apiKey) {
    throw new Error('COMPLY_ADVANTAGE_API_KEY is required when not in mock mode');
  }

  if (config.environment && !['production', 'sandbox'].includes(config.environment)) {
    throw new Error('COMPLY_ADVANTAGE_ENVIRONMENT must be either "production" or "sandbox"');
  }
}
