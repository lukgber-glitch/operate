/**
 * Scheduled Export Types
 * Proper TypeScript types to replace any types
 */

export interface ScheduledExportData {
  id: string;
  orgId: string;
  name: string;
  exportType: string;
  config: Record<string, unknown>;
  schedule: string;
  timezone: string;
  isActive: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastStatus: string | null;
  notifyEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledExportRunData {
  id: string;
  scheduledExportId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  errorMessage: string | null;
  outputPath: string | null;
  recordCount: number | null;
  fileSize: number | null;
}
