/**
 * Compliance-related types for the Operate platform
 */

export enum ExportType {
  GOBD = 'gobd',
  SAFT = 'saft',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  READY = 'ready',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DOWNLOADED = 'downloaded',
}

export interface ExportMetadata {
  totalFiles?: number;
  totalSize?: number;
  transactionCount?: number;
  documentCount?: number;
  archiveHash?: string;
}
