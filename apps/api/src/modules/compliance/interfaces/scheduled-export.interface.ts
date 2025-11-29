/**
 * Scheduled Export Frequency
 */
export enum ExportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Scheduled Export Configuration
 * Defines recurring export schedules
 */
export interface ScheduledExport {
  /**
   * Unique identifier for the scheduled export
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
   * Export frequency
   */
  frequency: ExportFrequency;

  /**
   * Day of week (0-6, Sunday-Saturday) for weekly exports
   */
  dayOfWeek?: number;

  /**
   * Day of month (1-31) for monthly exports
   */
  dayOfMonth?: number;

  /**
   * Timezone for scheduling (IANA timezone name)
   */
  timezone: string;

  /**
   * Whether the schedule is currently enabled
   */
  enabled: boolean;

  /**
   * Whether to include documents in the export
   */
  includeDocuments: boolean;

  /**
   * Email addresses to notify on completion
   */
  notifyEmail: string[];

  /**
   * Webhook URL to call on completion
   */
  webhookUrl?: string;

  /**
   * Last successful run timestamp
   */
  lastRun?: Date;

  /**
   * Next scheduled run timestamp
   */
  nextRun: Date;

  /**
   * Number of consecutive failures
   */
  failureCount: number;

  /**
   * Maximum number of retries before disabling
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
}

/**
 * Schedule execution result
 */
export interface ScheduleExecutionResult {
  /**
   * Schedule ID
   */
  scheduleId: string;

  /**
   * Export ID that was created
   */
  exportId?: string;

  /**
   * Execution timestamp
   */
  executedAt: Date;

  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Error message if failed
   */
  errorMessage?: string;

  /**
   * Next run timestamp
   */
  nextRun: Date;
}
