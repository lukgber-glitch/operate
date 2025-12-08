/**
 * Data Tools Type Definitions
 * Types for data export, deletion, and anonymization operations
 */

/**
 * Export Format
 * Supported formats for data export
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  ZIP = 'zip',
}

/**
 * Export Status
 * Lifecycle states of an export job
 */
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Deletion Mode
 * How data should be deleted
 */
export enum DeletionMode {
  SOFT = 'soft', // Mark as deleted but keep in database
  HARD = 'hard', // Permanently remove from database
  ANONYMIZE = 'anonymize', // Replace with anonymized data
}

/**
 * Deletion Status
 * Lifecycle states of a deletion job
 */
export enum DeletionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Data Category
 * Categories of data that can be exported/deleted
 */
export enum DataCategory {
  PROFILE = 'profile',
  FINANCIAL = 'financial',
  TAX = 'tax',
  HR = 'hr',
  DOCUMENTS = 'documents',
  ACTIVITY = 'activity',
  SETTINGS = 'settings',
  ALL = 'all',
}

/**
 * Export Job
 * Represents a data export job
 */
export interface ExportJob {
  id: string;
  userId: string;
  organisationId?: string;
  format: ExportFormat;
  categories: DataCategory[];
  status: ExportStatus;
  fileUrl?: string;
  fileSize?: number;
  encrypted: boolean;
  encryptionKey?: string;
  expiresAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deletion Job
 * Represents a data deletion job
 */
export interface DeletionJob {
  id: string;
  userId: string;
  organisationId?: string;
  mode: DeletionMode;
  categories: DataCategory[];
  status: DeletionStatus;
  recordsDeleted: number;
  tablesAffected: string[];
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  confirmed: boolean;
  confirmationToken?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Export Result
 * Result of a data export operation
 */
export interface ExportResult {
  jobId: string;
  status: ExportStatus;
  fileUrl?: string;
  fileSize?: number;
  downloadToken?: string;
  expiresAt?: Date;
  recordsExported: number;
  categoriesExported: DataCategory[];
  error?: string;
}

/**
 * Deletion Result
 * Result of a data deletion operation
 */
export interface DeletionResult {
  jobId: string;
  status: DeletionStatus;
  recordsDeleted: number;
  tablesAffected: string[];
  categories: DataCategory[];
  error?: string;
}

/**
 * Deletion Preview
 * Preview of what would be deleted
 */
export interface DeletionPreview {
  userId: string;
  categories: {
    category: DataCategory;
    recordCount: number;
    tables: string[];
    impact: string;
  }[];
  totalRecords: number;
  totalTables: number;
  warnings: string[];
}

/**
 * Anonymization Result
 */
export interface AnonymizationResult {
  userId: string;
  anonymizedAt: Date;
  recordsAnonymized: number;
  tablesAffected: string[];
  fieldsAnonymized: string[];
  success: boolean;
  errors?: string[];
}

/**
 * Bulk Operation Result
 */
export interface BulkOperationResult {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  jobIds: string[];
  errors: Record<string, string>;
}

/**
 * Data Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  categories: DataCategory[];
  encrypted?: boolean;
  includeDeleted?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  compress?: boolean;
}

/**
 * Data Deletion Options
 */
export interface DeletionOptions {
  mode: DeletionMode;
  categories: DataCategory[];
  scheduledFor?: Date;
  cascade?: boolean;
  confirmationRequired?: boolean;
}

/**
 * File Metadata
 */
export interface FileMetadata {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  checksum: string;
  encrypted: boolean;
  createdAt: Date;
}
