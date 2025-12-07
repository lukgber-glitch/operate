/**
 * Receipt Extraction DTOs
 * Data transfer objects for receipt extraction using GPT-4 Vision
 */

import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReceiptType {
  RETAIL = 'RETAIL',
  RESTAURANT = 'RESTAURANT',
  GAS_STATION = 'GAS_STATION',
  HOTEL = 'HOTEL',
  TRANSPORTATION = 'TRANSPORTATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export enum PaymentMethodType {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

export enum ReceiptExtractionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export class ReceiptLineItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this line item' })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Product code or SKU' })
  @IsOptional()
  @IsString()
  productCode?: string;
}

export class ExtractedReceiptDataDto {
  @ApiProperty({ description: 'Merchant/vendor name' })
  @IsString()
  merchantName: string;

  @ApiPropertyOptional({ description: 'Merchant address' })
  @IsOptional()
  @IsString()
  merchantAddress?: string;

  @ApiPropertyOptional({ description: 'Merchant phone number' })
  @IsOptional()
  @IsString()
  merchantPhone?: string;

  @ApiPropertyOptional({ description: 'Merchant VAT ID' })
  @IsOptional()
  @IsString()
  merchantVatId?: string;

  @ApiPropertyOptional({ description: 'Receipt/invoice number' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiProperty({ description: 'Receipt date' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Receipt time' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ description: 'Line items', type: [ReceiptLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineItemDto)
  items: ReceiptLineItemDto[];

  @ApiProperty({ description: 'Subtotal amount (before tax)' })
  @IsNumber()
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber()
  tax: number;

  @ApiPropertyOptional({ description: 'Tip amount' })
  @IsOptional()
  @IsNumber()
  tip?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Tax rate as percentage' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethodType })
  paymentMethod: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Last 4 digits of card' })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @ApiProperty({ description: 'Receipt type', enum: ReceiptType })
  receiptType: ReceiptType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class FieldConfidenceDto {
  @ApiProperty({ description: 'Field name' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiPropertyOptional({ description: 'Notes about extraction quality' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiptExtractionResultDto {
  @ApiProperty({ description: 'Extraction ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Organisation ID' })
  @IsString()
  organisationId: string;

  @ApiProperty({ description: 'User ID who uploaded' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Extraction status', enum: ReceiptExtractionStatus })
  status: ReceiptExtractionStatus;

  @ApiProperty({ description: 'Extracted receipt data', type: ExtractedReceiptDataDto })
  @ValidateNested()
  @Type(() => ExtractedReceiptDataDto)
  extractedData: ExtractedReceiptDataDto;

  @ApiProperty({ description: 'Overall confidence score (0-1)' })
  @IsNumber()
  overallConfidence: number;

  @ApiProperty({ description: 'Field-level confidence scores', type: [FieldConfidenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldConfidenceDto)
  fieldConfidences: FieldConfidenceDto[];

  @ApiPropertyOptional({ description: 'Suggested expense category' })
  @IsOptional()
  @IsString()
  suggestedCategory?: string;

  @ApiPropertyOptional({ description: 'Suggested subcategory' })
  @IsOptional()
  @IsString()
  suggestedSubcategory?: string;

  @ApiPropertyOptional({ description: 'AI categorization confidence' })
  @IsOptional()
  @IsNumber()
  categorizationConfidence?: number;

  @ApiPropertyOptional({ description: 'Tax deductibility analysis' })
  @IsOptional()
  @IsBoolean()
  taxDeductible?: boolean;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  @IsOptional()
  @IsNumber()
  processingTimeMs?: number;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class ExtractReceiptRequestDto {
  @ApiProperty({ description: 'File buffer', type: 'string', format: 'binary' })
  file: Buffer;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Organisation ID' })
  @IsString()
  organisationId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Auto-categorize after extraction' })
  @IsOptional()
  @IsBoolean()
  autoCategorize?: boolean;

  @ApiPropertyOptional({ description: 'Create expense automatically' })
  @IsOptional()
  @IsBoolean()
  autoCreateExpense?: boolean;
}

export class ExtractionHistoryFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ReceiptExtractionStatus })
  @IsOptional()
  status?: ReceiptExtractionStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by receipt type', enum: ReceiptType })
  @IsOptional()
  receiptType?: ReceiptType;

  @ApiPropertyOptional({ description: 'From date (ISO string)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO string)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Minimum confidence threshold' })
  @IsOptional()
  @IsNumber()
  minConfidence?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
