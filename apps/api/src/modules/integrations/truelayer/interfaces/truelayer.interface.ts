/**
 * TrueLayer Service Interfaces
 * Defines contracts for TrueLayer integration services
 */

import {
  TrueLayerAccount,
  TrueLayerBalance,
  TrueLayerTransaction,
  TrueLayerAuthResponse,
  TrueLayerTokenExchangeResponse,
} from '../truelayer.types';

/**
 * TrueLayer Auth Service Interface
 */
export interface ITrueLayerAuthService {
  /**
   * Generate authorization URL for OAuth2 flow
   */
  generateAuthUrl(
    userId: string,
    scopes: string[],
    redirectUri?: string,
    providerId?: string,
  ): Promise<TrueLayerAuthResponse>;

  /**
   * Exchange authorization code for access token
   */
  exchangeToken(
    code: string,
    userId: string,
    redirectUri?: string,
  ): Promise<TrueLayerTokenExchangeResponse>;

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(userId: string, connectionId: string): Promise<void>;

  /**
   * Revoke access token
   */
  revokeToken(userId: string, connectionId: string): Promise<void>;
}

/**
 * TrueLayer Data Service Interface
 */
export interface ITrueLayerDataService {
  /**
   * Get user's bank accounts
   */
  getAccounts(userId: string, connectionId: string): Promise<TrueLayerAccount[]>;

  /**
   * Get account balance
   */
  getBalance(
    userId: string,
    connectionId: string,
    accountId: string,
  ): Promise<TrueLayerBalance>;

  /**
   * Get account transactions
   */
  getTransactions(
    userId: string,
    connectionId: string,
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<TrueLayerTransaction[]>;
}

/**
 * TrueLayer Webhook Service Interface
 */
export interface ITrueLayerWebhookService {
  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean;

  /**
   * Process webhook event
   */
  processWebhook(event: any): Promise<void>;
}

/**
 * TrueLayer Connection Manager Interface
 */
export interface ITrueLayerConnectionManager {
  /**
   * Create new connection
   */
  createConnection(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    scopes: string[],
  ): Promise<string>;

  /**
   * Get connection by ID
   */
  getConnection(userId: string, connectionId: string): Promise<any>;

  /**
   * Get all connections for user
   */
  getConnections(userId: string): Promise<any[]>;

  /**
   * Update connection status
   */
  updateConnectionStatus(
    connectionId: string,
    status: string,
  ): Promise<void>;

  /**
   * Delete connection
   */
  deleteConnection(userId: string, connectionId: string): Promise<void>;
}
