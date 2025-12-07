import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Length,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '@prisma/client';

/**
 * Scan status enum
 */
export enum ScanStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

/**
 * Confidence level for extracted fields
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * DTO for upload receipt request
 */
export class UploadReceiptDto {
  @ApiPropertyOptional({
    description: 'Optional notes for the receipt',
    example: 'Client lunch meeting',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Auto-approve if confidence is high',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @ApiProperty({
    description: 'Receipt file (image or PDF)',
    type: 'string',
    format: 'binary',
  })
  file: any; // Handled by multer middleware
}

/**
 * Extracted field with confidence score
 * This is an internal type used in responses, not a DTO
 */
export interface ExtractedField<T = any> {
  value: T;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Receipt scan result (Response type)
 */
export interface ReceiptScanResult {
  scanId: string;
  status: ScanStatus;
  receiptUrl: string;
  merchantName?: ExtractedField<string>;
  date?: ExtractedField<string>;
  totalAmount?: ExtractedField<number>;
  taxAmount?: ExtractedField<number>;
  currency?: ExtractedField<string>;
  category?: ExtractedField<ExpenseCategory>;
  subcategory?: ExtractedField<string>;
  receiptNumber?: ExtractedField<string>;
  paymentMethod?: ExtractedField<string>;
  overallConfidence?: number;
  autoApproved?: boolean;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * DTO for confirming and correcting scan result
 */
export class ConfirmScanDto {
  @ApiPropertyOptional({
    description: 'Override merchant name',
    example: 'Restaurant Berlin',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  merchantName?: string;

  @ApiPropertyOptional({
    description: 'Override transaction date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Override total amount',
    example: 45.50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Override tax amount',
    example: 8.65,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Override currency code',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Override expense category',
    enum: ExpenseCategory,
  })
  @IsOptional()
  category?: ExpenseCategory;

  @ApiPropertyOptional({
    description: 'Override subcategory',
    example: 'Client entertainment',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  subcategory?: string;

  @ApiPropertyOptional({
    description: 'Override receipt number',
    example: 'REC-2024-001',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  receiptNumber?: string;

  @ApiPropertyOptional({
    description: 'Override payment method',
    example: 'Company Credit Card',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Discussed Q1 project requirements',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Override auto-approval decision',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @ApiPropertyOptional({
    description: 'Expense description',
    example: 'Business lunch with client',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { projectId: 'PRJ-001', billable: true },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for scan history filters
 */
export class ScanHistoryFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ScanStatus,
  })
  @IsOptional()
  status?: ScanStatus;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

/**
 * Paginated result wrapper (Response type)
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Receipt scan entity for history (Response type)
 */
export interface ReceiptScan {
  id: string;
  organisationId: string;
  uploadedBy: string;
  status: ScanStatus;
  receiptUrl: string;
  expenseId?: string;
  overallConfidence?: number;
  createdAt: string;
  completedAt?: string;
}
