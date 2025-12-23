/**
 * Receipt Scanner DTOs
 * Data transfer objects for receipt scanning operations
 */

import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Scan receipt request DTO
 */
export class ScanReceiptDto {
  @ApiProperty({ description: 'Organisation ID' })
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'File buffer' })
  file: Buffer;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'User ID who uploaded the receipt' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Auto-approve if conditions met' })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;
}

/**
 * Receipt scan result
 */
export interface ReceiptScanResult {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'needs_review';

  // OCR data from Mindee
  ocrData: ReceiptParseResult;

  // AI classification
  classification: {
    category: string;
    subcategory?: string;
    taxDeductible: boolean;
    taxDeductionPercentage?: number;
    suggestedAccount?: string;
    confidence: number;
  };

  // Auto-approval decision
  autoApproval: {
    eligible: boolean;
    approved: boolean;
    reason: string;
  };

  // Created expense (if auto-approved or confirmed)
  expenseId?: string;

  // Timestamps
  scannedAt: Date;
  processedAt?: Date;
}

/**
 * Receipt parse result from OCR
 */
export interface ReceiptParseResult {
  // Vendor info
  merchantName?: string;
  merchantAddress?: string;
  merchantVatId?: string;
  merchantPhone?: string;

  // Receipt details
  receiptNumber?: string;
  date?: Date;
  time?: string;

  // Amounts
  totalAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  tipAmount?: number;
  currency?: string;

  // Tax details
  taxRate?: number;
  taxLines?: Array<{
    description: string;
    rate: number;
    amount: number;
  }>;

  // Line items
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;

  // Payment info
  paymentMethod?: string;
  cardLast4?: string;

  // Metadata
  confidence: number;
  rawText?: string;
  ocrProvider: 'mindee';
}

/**
 * Create expense from scan request
 */
export class CreateExpenseFromScanDto {
  @ApiProperty({ description: 'Organisation ID' })
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'Scan result ID' })
  @IsString()
  scanResultId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Auto-approve expense' })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;
}

/**
 * Scan history filters
 */
export class ScanHistoryFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed', 'needs_review'])
  status?: 'pending' | 'completed' | 'failed' | 'needs_review';

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  toDate?: Date;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

/**
 * Receipt scan entity (database model interface)
 */
export interface ReceiptScan {
  id: string;
  orgId: string;

  // File info
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;

  // OCR results
  ocrData: any; // JSON
  ocrConfidence: number;

  // Classification
  category?: string;
  subcategory?: string;
  taxDeductible: boolean;

  // Status
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED';
  errorMessage?: string;

  // Related expense
  expenseId?: string;

  // User
  userId: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classification result for receipts
 */
export interface ReceiptClassificationResult {
  category: string;
  subcategory?: string;
  taxDeductible: boolean;
  taxDeductionPercentage?: number;
  suggestedAccount?: string;
  confidence: number;
  reasoning: string;
}
