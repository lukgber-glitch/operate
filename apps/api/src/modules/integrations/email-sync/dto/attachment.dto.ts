import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttachmentStorageBackend,
  AttachmentProcessingStatus,
  AttachmentClassificationType,
} from '@prisma/client';

/**
 * Process Email Attachments DTO
 * Trigger processing of all attachments for a specific email
 */
export class ProcessEmailAttachmentsDto {
  @ApiProperty({
    description: 'Email ID to process attachments for',
    example: 'clxxx123',
  })
  @IsString()
  emailId: string;

  @ApiPropertyOptional({
    description: 'Force reprocess even if already processed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceReprocess?: boolean;

  @ApiPropertyOptional({
    description: 'Skip virus scanning (not recommended)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipScanning?: boolean;
}

/**
 * Process Single Attachment DTO
 * Trigger processing of a specific attachment
 */
export class ProcessAttachmentDto {
  @ApiProperty({
    description: 'Attachment ID to process',
    example: 'clxxx456',
  })
  @IsString()
  attachmentId: string;

  @ApiPropertyOptional({
    description: 'Force reprocess even if already processed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceReprocess?: boolean;
}

/**
 * Download Attachment DTO
 * Request to download an attachment
 */
export class DownloadAttachmentDto {
  @ApiProperty({
    description: 'Attachment ID to download',
    example: 'clxxx456',
  })
  @IsString()
  attachmentId: string;

  @ApiPropertyOptional({
    description: 'Return signed URL instead of file content',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  returnUrl?: boolean;

  @ApiPropertyOptional({
    description: 'URL expiration time in seconds (for S3)',
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(604800) // 7 days max
  expiresIn?: number;
}

/**
 * List Attachments DTO
 * Query parameters for listing attachments
 */
export class ListAttachmentsDto {
  @ApiPropertyOptional({
    description: 'Filter by email ID',
  })
  @IsOptional()
  @IsString()
  emailId?: string;

  @ApiPropertyOptional({
    description: 'Filter by processing status',
    enum: AttachmentProcessingStatus,
  })
  @IsOptional()
  status?: AttachmentProcessingStatus;

  @ApiPropertyOptional({
    description: 'Filter by classification type',
    enum: AttachmentClassificationType,
  })
  @IsOptional()
  classifiedType?: AttachmentClassificationType;

  @ApiPropertyOptional({
    description: 'Filter by storage backend',
    enum: AttachmentStorageBackend,
  })
  @IsOptional()
  storageBackend?: AttachmentStorageBackend;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Attachment Response DTO
 * Represents an attachment in API responses
 */
export class AttachmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  emailId: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiPropertyOptional()
  extension?: string;

  @ApiProperty({ enum: AttachmentStorageBackend })
  storageBackend: AttachmentStorageBackend;

  @ApiProperty({ enum: AttachmentProcessingStatus })
  status: AttachmentProcessingStatus;

  @ApiPropertyOptional({ enum: AttachmentClassificationType })
  classifiedType?: AttachmentClassificationType;

  @ApiPropertyOptional()
  classificationConfidence?: number;

  @ApiPropertyOptional()
  downloadUrl?: string; // Signed URL if available

  @ApiProperty()
  isScanned: boolean;

  @ApiPropertyOptional()
  scanResult?: string;

  @ApiPropertyOptional()
  extractedDataId?: string;

  @ApiPropertyOptional()
  extractionStatus?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Storage Quota Response DTO
 * Represents storage quota usage for an organization
 */
export class StorageQuotaResponseDto {
  @ApiProperty()
  orgId: string;

  @ApiProperty()
  totalQuota: bigint;

  @ApiProperty()
  usedSpace: bigint;

  @ApiProperty()
  availableSpace: bigint;

  @ApiProperty()
  usagePercentage: number;

  @ApiProperty()
  attachmentCount: number;

  @ApiProperty()
  invoiceSpace: bigint;

  @ApiProperty()
  receiptSpace: bigint;

  @ApiProperty()
  statementSpace: bigint;

  @ApiProperty()
  otherSpace: bigint;

  @ApiProperty()
  alertThreshold: number;

  @ApiProperty()
  alertSent: boolean;

  @ApiProperty()
  isNearLimit: boolean; // > 80% usage
}

/**
 * Update Storage Quota DTO
 * Update quota settings for an organization
 */
export class UpdateStorageQuotaDto {
  @ApiPropertyOptional({
    description: 'Total quota in bytes',
  })
  @IsOptional()
  @IsNumber()
  @Min(1073741824) // Min 1GB
  totalQuota?: number;

  @ApiPropertyOptional({
    description: 'Enable automatic cleanup',
  })
  @IsOptional()
  @IsBoolean()
  autoCleanupEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Retention period in days',
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3650) // Max 10 years
  retentionDays?: number;

  @ApiPropertyOptional({
    description: 'Alert threshold percentage',
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  alertThreshold?: number;
}

/**
 * Bulk Process Attachments DTO
 * Process multiple attachments at once
 */
export class BulkProcessAttachmentsDto {
  @ApiProperty({
    description: 'Array of attachment IDs to process',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  attachmentIds: string[];

  @ApiPropertyOptional({
    description: 'Force reprocess even if already processed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceReprocess?: boolean;
}

/**
 * Attachment Processing Statistics DTO
 * Statistics about attachment processing
 */
export class AttachmentStatisticsDto {
  @ApiProperty()
  totalAttachments: number;

  @ApiProperty()
  pendingAttachments: number;

  @ApiProperty()
  processedAttachments: number;

  @ApiProperty()
  failedAttachments: number;

  @ApiProperty()
  quarantinedAttachments: number;

  @ApiProperty()
  classificationBreakdown: Record<string, number>;

  @ApiProperty()
  storageBreakdown: Record<string, number>;

  @ApiProperty()
  averageProcessingTime: number; // in milliseconds

  @ApiProperty()
  totalStorageUsed: number; // in bytes
}

/**
 * Retry Failed Attachments DTO
 * Retry processing of failed attachments
 */
export class RetryFailedAttachmentsDto {
  @ApiPropertyOptional({
    description: 'Filter by email ID',
  })
  @IsOptional()
  @IsString()
  emailId?: string;

  @ApiPropertyOptional({
    description: 'Maximum retry count (only retry if retryCount < maxRetries)',
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;
}

/**
 * Delete Attachment DTO
 * Delete an attachment and optionally clean up storage
 */
export class DeleteAttachmentDto {
  @ApiProperty({
    description: 'Attachment ID to delete',
  })
  @IsString()
  attachmentId: string;

  @ApiPropertyOptional({
    description: 'Also delete from storage (S3/local filesystem)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deleteFromStorage?: boolean;
}
