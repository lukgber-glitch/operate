/**
 * ELSTER Filing Status Tracking Types
 * Status management and event tracking for ELSTER submissions
 */

import { ElsterFilingStatus } from './elster-vat.types';

/**
 * Status details for a filing update
 */
export interface StatusDetails {
  message?: string;
  timestamp: Date;
  source: StatusSource;
  rawData?: any;
  errorCode?: string;
  errorDetails?: string;
}

/**
 * Source of status update
 */
export enum StatusSource {
  WEBHOOK = 'WEBHOOK',
  POLLING = 'POLLING',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
}

/**
 * Status event for timeline
 */
export interface StatusEvent {
  id: string;
  filingId: string;
  fromStatus: ElsterFilingStatus | null;
  toStatus: ElsterFilingStatus;
  details?: StatusDetails;
  createdAt: Date;
}

/**
 * Webhook payload from tigerVAT
 */
export interface WebhookPayload {
  filingId?: string;
  submissionId?: string;
  transferTicket?: string;
  status: string;
  timestamp: string;
  message?: string;
  errors?: string[];
  warnings?: string[];
  data?: any;
}

/**
 * Status check job data
 */
export interface StatusCheckJobData {
  filingId: string;
  organisationId: string;
  submissionId?: string;
  transferTicket?: string;
  retryCount?: number;
}

/**
 * Status update result
 */
export interface StatusUpdateResult {
  success: boolean;
  filing: any; // ElsterFiling from Prisma
  statusChanged: boolean;
  previousStatus?: ElsterFilingStatus;
  newStatus: ElsterFilingStatus;
  notificationSent: boolean;
}

/**
 * Notification template data
 */
export interface NotificationTemplateData {
  organisationName: string;
  filingType: string;
  period: string;
  status: ElsterFilingStatus;
  timestamp: Date;
  message?: string;
  errors?: string[];
  transferTicket?: string;
}

/**
 * Poll options
 */
export interface PollOptions {
  force?: boolean; // Force polling even if recently checked
  timeout?: number; // Request timeout in ms
}

/**
 * Status statistics
 */
export interface StatusStatistics {
  total: number;
  byStatus: Record<ElsterFilingStatus, number>;
  pending: number;
  needsAttention: number;
  lastUpdated: Date;
}

/**
 * Error types for status operations
 */
export class ElsterStatusError extends Error {
  constructor(
    message: string,
    public readonly code: ElsterStatusErrorCode,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ElsterStatusError';
  }
}

export enum ElsterStatusErrorCode {
  FILING_NOT_FOUND = 'FILING_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  POLL_FAILED = 'POLL_FAILED',
  WEBHOOK_VALIDATION_FAILED = 'WEBHOOK_VALIDATION_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  JOB_SCHEDULING_FAILED = 'JOB_SCHEDULING_FAILED',
}

/**
 * Status transition validation
 */
export interface StatusTransition {
  from: ElsterFilingStatus;
  to: ElsterFilingStatus;
  allowed: boolean;
  reason?: string;
}

/**
 * Valid status transitions
 * Defines which status changes are allowed
 */
export const VALID_STATUS_TRANSITIONS: Record<
  ElsterFilingStatus,
  ElsterFilingStatus[]
> = {
  [ElsterFilingStatus.DRAFT]: [
    ElsterFilingStatus.SUBMITTED,
    ElsterFilingStatus.ERROR,
  ],
  [ElsterFilingStatus.SUBMITTED]: [
    ElsterFilingStatus.PENDING,
    ElsterFilingStatus.ACCEPTED,
    ElsterFilingStatus.REJECTED,
    ElsterFilingStatus.ERROR,
  ],
  [ElsterFilingStatus.PENDING]: [
    ElsterFilingStatus.ACCEPTED,
    ElsterFilingStatus.REJECTED,
    ElsterFilingStatus.ERROR,
  ],
  [ElsterFilingStatus.ACCEPTED]: [], // Terminal state
  [ElsterFilingStatus.REJECTED]: [
    ElsterFilingStatus.SUBMITTED, // Can resubmit after fixing
  ],
  [ElsterFilingStatus.ERROR]: [
    ElsterFilingStatus.SUBMITTED, // Can retry after error
  ],
};

/**
 * Status priority for notifications
 * Higher number = higher priority
 */
export const STATUS_PRIORITY: Record<ElsterFilingStatus, number> = {
  [ElsterFilingStatus.REJECTED]: 5,
  [ElsterFilingStatus.ERROR]: 4,
  [ElsterFilingStatus.ACCEPTED]: 3,
  [ElsterFilingStatus.PENDING]: 2,
  [ElsterFilingStatus.SUBMITTED]: 1,
  [ElsterFilingStatus.DRAFT]: 0,
};

/**
 * Polling configuration
 */
export interface PollingConfig {
  enabled: boolean;
  intervalMs: number; // Default polling interval
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  enabled: true,
  intervalMs: 5 * 60 * 1000, // 5 minutes
  maxRetries: 20, // 20 retries over ~100 minutes
  retryDelayMs: 5 * 60 * 1000, // 5 minutes
  backoffMultiplier: 1.0, // No backoff by default
};
