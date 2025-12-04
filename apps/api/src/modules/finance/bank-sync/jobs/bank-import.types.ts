/**
 * Bank Import Job Type Definitions
 * Types and interfaces for BullMQ bank import jobs
 */

import { SyncResult, BatchSyncResult, RefreshExpiredConsentsResult } from '../bank-sync.types';

/**
 * Job types supported by the bank import queue
 */
export enum BankImportJobType {
  SYNC_CONNECTION = 'sync-connection',
  SYNC_ALL_ORG = 'sync-all-org',
  REFRESH_CONSENTS = 'refresh-consents',
}

/**
 * Base job data interface
 */
interface BaseBankImportJobData {
  type: BankImportJobType;
  triggeredBy?: string; // User ID if manually triggered
  priority?: number; // 1-10, higher = more urgent
}

/**
 * Job data for syncing a single connection
 */
export interface SyncConnectionJobData extends BaseBankImportJobData {
  type: BankImportJobType.SYNC_CONNECTION;
  connectionId: string;
  forceFullSync?: boolean;
  accountIds?: string[];
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Job data for syncing all connections in an organization
 */
export interface SyncAllOrgJobData extends BaseBankImportJobData {
  type: BankImportJobType.SYNC_ALL_ORG;
  orgId: string;
  connectionIds?: string[]; // Optional: sync specific connections only
  concurrency?: number;
  continueOnError?: boolean;
}

/**
 * Job data for refreshing expiring consents
 */
export interface RefreshConsentsJobData extends BaseBankImportJobData {
  type: BankImportJobType.REFRESH_CONSENTS;
  daysBeforeExpiry?: number;
  batchSize?: number;
}

/**
 * Union type of all job data types
 */
export type BankImportJobData =
  | SyncConnectionJobData
  | SyncAllOrgJobData
  | RefreshConsentsJobData;

/**
 * Base job result interface
 */
interface BaseBankImportJobResult {
  jobId: string;
  type: BankImportJobType;
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds
  errorMessage?: string;
}

/**
 * Result for sync-connection job
 */
export interface SyncConnectionJobResult extends BaseBankImportJobResult {
  type: BankImportJobType.SYNC_CONNECTION;
  syncResult?: SyncResult;
}

/**
 * Result for sync-all-org job
 */
export interface SyncAllOrgJobResult extends BaseBankImportJobResult {
  type: BankImportJobType.SYNC_ALL_ORG;
  batchResult?: BatchSyncResult;
}

/**
 * Result for refresh-consents job
 */
export interface RefreshConsentsJobResult extends BaseBankImportJobResult {
  type: BankImportJobType.REFRESH_CONSENTS;
  refreshResult?: RefreshExpiredConsentsResult;
}

/**
 * Union type of all job result types
 */
export type BankImportJobResult =
  | SyncConnectionJobResult
  | SyncAllOrgJobResult
  | RefreshConsentsJobResult;

/**
 * Job metrics for monitoring
 */
export interface BankImportJobMetrics {
  jobId: string;
  type: BankImportJobType;
  queuedAt: Date;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  attempts: number;
  accountsSynced?: number;
  transactionsSynced?: number;
  connectionsSynced?: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

/**
 * Job progress update
 */
export interface BankImportJobProgress {
  stage: 'starting' | 'syncing_accounts' | 'syncing_transactions' | 'finalizing' | 'completed' | 'failed';
  message: string;
  percent: number; // 0-100
  accountsProcessed?: number;
  transactionsProcessed?: number;
  estimatedTimeRemaining?: number; // milliseconds
}

/**
 * Job retry configuration
 */
export interface BankImportRetryConfig {
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number; // milliseconds
  };
}

/**
 * Default retry configurations by job type
 */
export const DEFAULT_RETRY_CONFIG: Record<BankImportJobType, BankImportRetryConfig> = {
  [BankImportJobType.SYNC_CONNECTION]: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s
    },
  },
  [BankImportJobType.SYNC_ALL_ORG]: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000, // Start with 10s
    },
  },
  [BankImportJobType.REFRESH_CONSENTS]: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 60000, // Fixed 1 minute
    },
  },
};
