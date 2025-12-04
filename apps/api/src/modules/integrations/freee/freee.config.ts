import { registerAs } from '@nestjs/config';
import {
  FREEE_ENDPOINTS,
  DEFAULT_FREEE_SCOPE,
  FREEE_TOKEN_EXPIRY,
  FREEE_RATE_LIMIT,
  FREEE_ENCRYPTION_CONFIG,
  FREEE_PKCE_CONFIG,
  FREEE_SYNC_CONFIG,
} from './freee.constants';

/**
 * freee Configuration Interface
 */
export interface FreeeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webhookSecret?: string;
}

/**
 * Validate freee configuration
 */
export function validateFreeeConfig(config: FreeeConfig): void {
  if (!config.clientId) {
    throw new Error('FREEE_CLIENT_ID is required');
  }
  if (!config.clientSecret) {
    throw new Error('FREEE_CLIENT_SECRET is required');
  }
  if (!config.redirectUri) {
    throw new Error('FREEE_REDIRECT_URI is required');
  }
}

/**
 * freee Configuration Factory
 */
export default registerAs('freee', () => ({
  clientId: process.env.FREEE_CLIENT_ID || '',
  clientSecret: process.env.FREEE_CLIENT_SECRET || '',
  redirectUri:
    process.env.FREEE_REDIRECT_URI ||
    'http://localhost:3000/api/integrations/freee/callback',
  webhookSecret: process.env.FREEE_WEBHOOK_SECRET,
  scope: DEFAULT_FREEE_SCOPE,
  endpoints: FREEE_ENDPOINTS,
  tokenExpiry: FREEE_TOKEN_EXPIRY,
  rateLimit: FREEE_RATE_LIMIT,
  encryptionConfig: FREEE_ENCRYPTION_CONFIG,
  pkceConfig: FREEE_PKCE_CONFIG,
  syncConfig: FREEE_SYNC_CONFIG,
}));

/**
 * Re-export constants for convenience
 */
export {
  FREEE_ENDPOINTS,
  DEFAULT_FREEE_SCOPE,
  FREEE_TOKEN_EXPIRY,
  FREEE_RATE_LIMIT,
  FREEE_ENCRYPTION_CONFIG,
  FREEE_PKCE_CONFIG,
  FREEE_SYNC_CONFIG,
};
