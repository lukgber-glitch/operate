import { ExportStatus } from '../interfaces/export-status.interface';

/**
 * Compliance Export Entity
 * Represents a compliance export record in the database
 *
 * Note: This is a TypeScript entity. Actual database schema
 * should be defined in Prisma schema.
 */
export class ComplianceExport {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Export type (GoBD or SAF-T)
   */
  type: 'gobd' | 'saft';

  /**
   * Current export status
   */
  status: ExportStatus;

  /**
   * Start date of the export period
   */
  startDate: Date;

  /**
   * End date of the export period
   */
  endDate: Date;

  /**
   * Whether documents are included
   */
  includeDocuments: boolean;

  /**
   * Export comment or description
   */
  comment?: string;

  /**
   * Additional export options (JSON)
   */
  options?: Record<string, any>;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Current processing step
   */
  currentStep?: string;

  /**
   * Total number of records
   */
  totalRecords?: number;

  /**
   * Number of processed records
   */
  processedRecords?: number;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * SHA-256 checksum
   */
  checksum?: string;

  /**
   * Storage path or URL
   */
  storagePath?: string;

  /**
   * Error message if failed
   */
  errorMessage?: string;

  /**
   * Error details (JSON)
   */
  errorDetails?: any;

  /**
   * Format version
   */
  version: string;

  /**
   * User who created the export
   */
  createdBy: string;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * Completion timestamp
   */
  completedAt?: Date;

  /**
   * Expiration timestamp for download
   */
  expiresAt?: Date;

  /**
   * Soft delete timestamp
   */
  deletedAt?: Date;

  constructor(partial: Partial<ComplianceExport>) {
    Object.assign(this, partial);
  }
}

/**
 * Scheduled Export Entity
 * Represents a recurring export schedule
 */
export class ScheduledExportEntity {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Export type
   */
  type: 'gobd' | 'saft';

  /**
   * Export frequency
   */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  /**
   * Day of week (0-6) for weekly exports
   */
  dayOfWeek?: number;

  /**
   * Day of month (1-31) for monthly exports
   */
  dayOfMonth?: number;

  /**
   * Timezone
   */
  timezone: string;

  /**
   * Whether the schedule is enabled
   */
  enabled: boolean;

  /**
   * Whether to include documents
   */
  includeDocuments: boolean;

  /**
   * Notification emails (JSON array)
   */
  notifyEmail: string[];

  /**
   * Webhook URL
   */
  webhookUrl?: string;

  /**
   * Last successful run
   */
  lastRun?: Date;

  /**
   * Next scheduled run
   */
  nextRun: Date;

  /**
   * Number of consecutive failures
   */
  failureCount: number;

  /**
   * Maximum retries
   */
  maxRetries: number;

  /**
   * Created by user ID
   */
  createdBy: string;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * Soft delete timestamp
   */
  deletedAt?: Date;

  constructor(partial: Partial<ScheduledExportEntity>) {
    Object.assign(this, partial);
  }
}
