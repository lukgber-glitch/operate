import {
  ScheduleFrequency,
  ScheduleStatus,
  ReportType,
  ExportFormat,
  DeliveryMethod,
  ExecutionStatus,
  DeliveryStatus,
} from '../dto';

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  timeOfDay: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  catchUpMissed?: boolean;
}

export interface ReportParams {
  reportType: ReportType;
  dateRange: {
    type: string;
    startDate?: string;
    endDate?: string;
  };
  format: ExportFormat;
  filters?: Record<string, any>;
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeComparison?: boolean;
  templateId?: string;
  customParams?: Record<string, any>;
}

export interface DeliveryConfig {
  method: DeliveryMethod;
  email?: {
    recipients: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body?: string;
    replyTo?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
    includeFile?: boolean;
  };
  maxFileSizeMb?: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface Schedule {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  status: ScheduleStatus;
  schedule: ScheduleConfig;
  reportParams: ReportParams;
  deliveryConfig: DeliveryConfig;
  nextRunAt?: Date;
  lastRunAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  status: ExecutionStatus;
  reportId?: string;
  deliveryStatus?: DeliveryStatus;
  error?: string;
  errorStack?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  fileSizeBytes?: number;
  deliveryAttempts?: number;
  deliveredTo?: string[];
  failedRecipients?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleExecutionResult {
  success: boolean;
  executionId: string;
  reportId?: string;
  error?: string;
  deliveryStatus?: DeliveryStatus;
  deliveredTo?: string[];
  failedRecipients?: string[];
}

export interface EmailTemplateVariables {
  reportType: string;
  period: string;
  generatedAt: string;
  organizationName: string;
  scheduleNname: string;
  [key: string]: string;
}

export interface ReportGenerationResult {
  reportId: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  format: string;
  metadata: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  deliveredTo: string[];
  failedRecipients: string[];
  error?: string;
  attempts: number;
}
