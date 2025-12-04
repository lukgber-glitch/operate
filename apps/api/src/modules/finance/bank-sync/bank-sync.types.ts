/**
 * Bank Sync Service Type Definitions
 * Types and interfaces for bank synchronization operations
 */

import { BankProvider, ConnectionStatus } from '@prisma/client';

/**
 * Result of a bank sync operation
 */
export interface SyncResult {
  connectionId: string;
  success: boolean;
  accountsSynced: number;
  transactionsSynced: number;
  newAccounts: number;
  newTransactions: number;
  errors: SyncError[];
  metrics: SyncMetrics;
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds
}

/**
 * Sync error details
 */
export interface SyncError {
  type: 'ACCOUNT' | 'TRANSACTION' | 'AUTHENTICATION' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
  message: string;
  accountId?: string;
  transactionId?: string;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Sync metrics for monitoring
 */
export interface SyncMetrics {
  accountsProcessed: number;
  accountsCreated: number;
  accountsUpdated: number;
  accountsSkipped: number;
  transactionsProcessed: number;
  transactionsCreated: number;
  transactionsDuplicate: number;
  transactionsSkipped: number;
  apiCallsCount: number;
  totalDataSize: number; // bytes
  averageResponseTime: number; // milliseconds
}

/**
 * Connection health status
 */
export interface ConnectionHealth {
  connectionId: string;
  status: ConnectionStatus;
  isHealthy: boolean;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  consentExpiresAt: Date | null;
  consentDaysRemaining: number | null;
  requiresReauth: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    provider: BankProvider;
    institutionName: string;
    accountCount: number;
    lastSuccessfulSync: Date | null;
    consecutiveFailures: number;
  };
}

/**
 * Parameters for creating a new bank connection
 */
export interface CreateConnectionParams {
  orgId: string;
  provider: BankProvider;
  authCode: string;
  state: string;
  institutionId?: string;
  institutionName?: string;
}

/**
 * Parameters for syncing a connection
 */
export interface SyncConnectionParams {
  connectionId: string;
  forceFullSync?: boolean; // Ignore last sync date and fetch all
  accountIds?: string[]; // Sync specific accounts only
  startDate?: Date; // For transaction fetching
  endDate?: Date; // For transaction fetching
}

/**
 * Parameters for batch syncing
 */
export interface BatchSyncParams {
  orgId: string;
  connectionIds?: string[]; // Specific connections, or all if not provided
  concurrency?: number; // Max concurrent sync operations
  continueOnError?: boolean; // Continue if one connection fails
}

/**
 * Result of batch sync operation
 */
export interface BatchSyncResult {
  orgId: string;
  totalConnections: number;
  successfulSyncs: number;
  failedSyncs: number;
  results: SyncResult[];
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

/**
 * Consent refresh result
 */
export interface ConsentRefreshResult {
  connectionId: string;
  success: boolean;
  previousExpiryDate: Date | null;
  newExpiryDate: Date | null;
  error?: string;
}

/**
 * Parameters for refreshing expired consents
 */
export interface RefreshExpiredConsentsParams {
  daysBeforeExpiry?: number; // Start refresh N days before expiry (default: 7)
  batchSize?: number; // Process N connections at a time (default: 10)
}

/**
 * Result of refreshing expired consents
 */
export interface RefreshExpiredConsentsResult {
  totalProcessed: number;
  successfulRefresh: number;
  failedRefresh: number;
  requiresUserAction: number;
  results: ConsentRefreshResult[];
}

/**
 * Transaction sync options
 */
export interface TransactionSyncOptions {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Account sync options
 */
export interface AccountSyncOptions {
  connectionId: string;
  accountIds?: string[];
  updateBalances?: boolean;
}

/**
 * Sync schedule configuration
 */
export interface SyncSchedule {
  connectionId: string;
  enabled: boolean;
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
  nextRunAt: Date;
  lastRunAt: Date | null;
}

/**
 * Sync audit log entry
 */
export interface SyncAuditLog {
  id: string;
  connectionId: string;
  orgId: string;
  operation: 'CREATE' | 'SYNC' | 'REFRESH' | 'DISCONNECT';
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  metrics: SyncMetrics;
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
  duration: number;
  triggeredBy?: string; // User ID
  metadata?: Record<string, unknown>;
}
