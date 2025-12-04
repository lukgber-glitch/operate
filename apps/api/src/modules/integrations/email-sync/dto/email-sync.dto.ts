import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailProvider } from '@prisma/client';

/**
 * Trigger Email Sync DTO
 * Request body for manually triggering an email sync operation
 */
export class TriggerSyncDto {
  @ApiProperty({
    description: 'Email connection ID to sync',
    example: 'clx1234567890',
  })
  @IsString()
  connectionId: string;

  @ApiPropertyOptional({
    description: 'Sync type',
    enum: ['FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED'],
    default: 'MANUAL',
  })
  @IsOptional()
  @IsEnum(['FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED'])
  syncType?: string;

  @ApiPropertyOptional({
    description: 'Start date for sync window (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for sync window (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Search query to filter emails',
    example: 'has:attachment invoice OR receipt',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'Gmail label IDs to filter by',
    example: ['INBOX', 'IMPORTANT'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({
    description: 'Outlook folder IDs to filter by',
    example: ['AAMkADU...'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  folderIds?: string[];
}

/**
 * Sync Status Response DTO
 * Response for sync job status queries
 */
export class SyncStatusDto {
  @ApiProperty({ description: 'Sync job ID' })
  jobId: string;

  @ApiProperty({ description: 'Connection ID' })
  connectionId: string;

  @ApiProperty({
    description: 'Current sync status',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CANCELLED', 'RATE_LIMITED'],
  })
  status: string;

  @ApiProperty({ description: 'Email provider' })
  provider: EmailProvider;

  @ApiPropertyOptional({ description: 'Sync start time' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Sync completion time' })
  completedAt?: Date;

  @ApiProperty({ description: 'Total emails found', default: 0 })
  totalEmails: number;

  @ApiProperty({ description: 'Emails processed', default: 0 })
  processedEmails: number;

  @ApiProperty({ description: 'New emails synced', default: 0 })
  newEmails: number;

  @ApiProperty({ description: 'Updated emails', default: 0 })
  updatedEmails: number;

  @ApiProperty({ description: 'Failed emails', default: 0 })
  failedEmails: number;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Duration in milliseconds' })
  durationMs?: number;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)' })
  progress?: number;
}

/**
 * List Synced Emails DTO
 * Query parameters for listing synced emails
 */
export class ListSyncedEmailsDto {
  @ApiProperty({ description: 'Connection ID' })
  @IsString()
  connectionId: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by processed status' })
  @IsOptional()
  @IsBoolean()
  processed?: boolean;

  @ApiPropertyOptional({ description: 'Filter by invoice flag' })
  @IsOptional()
  @IsBoolean()
  isInvoice?: boolean;

  @ApiPropertyOptional({ description: 'Filter by receipt flag' })
  @IsOptional()
  @IsBoolean()
  isReceipt?: boolean;

  @ApiPropertyOptional({ description: 'Filter by has attachments' })
  @IsOptional()
  @IsBoolean()
  hasAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Start date for received emails' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date for received emails' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search query (subject, from)' })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Synced Email Detail DTO
 * Detailed information about a synced email
 */
export class SyncedEmailDetailDto {
  @ApiProperty({ description: 'Synced email ID' })
  id: string;

  @ApiProperty({ description: 'External email ID (provider-specific)' })
  externalId: string;

  @ApiProperty({ description: 'Email provider' })
  provider: EmailProvider;

  @ApiPropertyOptional({ description: 'Email subject' })
  subject?: string;

  @ApiPropertyOptional({ description: 'Sender email address' })
  from?: string;

  @ApiPropertyOptional({ description: 'Sender name' })
  fromName?: string;

  @ApiProperty({ description: 'Recipient email addresses' })
  to: string[];

  @ApiProperty({ description: 'CC recipients' })
  cc: string[];

  @ApiProperty({ description: 'Received timestamp' })
  receivedAt: Date;

  @ApiPropertyOptional({ description: 'Email snippet/preview' })
  snippet?: string;

  @ApiProperty({ description: 'Has attachments' })
  hasAttachments: boolean;

  @ApiProperty({ description: 'Attachment count' })
  attachmentCount: number;

  @ApiPropertyOptional({ description: 'Attachment filenames' })
  attachmentNames?: string[];

  @ApiProperty({ description: 'Is classified as invoice' })
  isInvoice: boolean;

  @ApiProperty({ description: 'Is classified as receipt' })
  isReceipt: boolean;

  @ApiProperty({ description: 'Is financial document' })
  isFinancial: boolean;

  @ApiPropertyOptional({ description: 'Classification confidence (0-1)' })
  confidence?: number;

  @ApiProperty({ description: 'Has been processed' })
  processed: boolean;

  @ApiPropertyOptional({ description: 'Processing timestamp' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Processing error message' })
  processingError?: string;

  @ApiProperty({ description: 'Labels (Gmail) or categories (Outlook)' })
  labels: string[];

  @ApiProperty({ description: 'Last synced timestamp' })
  lastSyncedAt: Date;
}

/**
 * Sync Statistics DTO
 * Overall statistics for a connection's sync history
 */
export class SyncStatisticsDto {
  @ApiProperty({ description: 'Connection ID' })
  connectionId: string;

  @ApiProperty({ description: 'Email provider' })
  provider: EmailProvider;

  @ApiProperty({ description: 'Total emails synced' })
  totalEmailsSynced: number;

  @ApiProperty({ description: 'Emails with attachments' })
  emailsWithAttachments: number;

  @ApiProperty({ description: 'Classified as invoices' })
  invoiceCount: number;

  @ApiProperty({ description: 'Classified as receipts' })
  receiptCount: number;

  @ApiProperty({ description: 'Financial documents' })
  financialCount: number;

  @ApiProperty({ description: 'Processed emails' })
  processedCount: number;

  @ApiProperty({ description: 'Pending processing' })
  pendingCount: number;

  @ApiProperty({ description: 'Failed processing' })
  failedCount: number;

  @ApiPropertyOptional({ description: 'Last sync timestamp' })
  lastSyncAt?: Date;

  @ApiPropertyOptional({ description: 'Last successful sync' })
  lastSuccessfulSyncAt?: Date;

  @ApiProperty({ description: 'Total sync jobs' })
  totalSyncJobs: number;

  @ApiProperty({ description: 'Successful sync jobs' })
  successfulSyncJobs: number;

  @ApiProperty({ description: 'Failed sync jobs' })
  failedSyncJobs: number;
}

/**
 * Cancel Sync DTO
 * Request to cancel an ongoing sync operation
 */
export class CancelSyncDto {
  @ApiProperty({ description: 'Sync job ID to cancel' })
  @IsString()
  jobId: string;

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Retry Failed Emails DTO
 * Request to retry processing failed emails
 */
export class RetryFailedEmailsDto {
  @ApiProperty({ description: 'Connection ID' })
  @IsString()
  connectionId: string;

  @ApiPropertyOptional({
    description: 'Maximum number of emails to retry',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxEmails?: number;

  @ApiPropertyOptional({
    description: 'Only retry emails with retry count below this number',
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRetryCount?: number;
}
