/**
 * Invoice Extraction DTOs
 * Data transfer objects for AI-powered invoice extraction
 */

import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceExtractionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class InvoiceLineItemDto {
  @ApiProperty({ description: 'Line item description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiProperty({ description: 'Total line amount' })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Tax rate for this line (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Tax amount for this line' })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;
}

export class ExtractedInvoiceDataDto {
  @ApiPropertyOptional({ description: 'Vendor/supplier name' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({ description: 'Vendor address' })
  @IsOptional()
  @IsString()
  vendorAddress?: string;

  @ApiPropertyOptional({ description: 'Vendor VAT/Tax ID' })
  @IsOptional()
  @IsString()
  vendorVatId?: string;

  @ApiPropertyOptional({ description: 'Vendor phone number' })
  @IsOptional()
  @IsString()
  vendorPhone?: string;

  @ApiPropertyOptional({ description: 'Vendor email' })
  @IsOptional()
  @IsString()
  vendorEmail?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Invoice date' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Purchase order number' })
  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Customer/buyer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ description: 'Line items', type: [InvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ description: 'Subtotal amount (before tax)' })
  @IsNumber()
  subtotal: number;

  @ApiPropertyOptional({ description: 'Total tax amount' })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Tax rate (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiProperty({ description: 'Total amount (including tax)' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', default: 'EUR' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Bank account IBAN' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'Bank account BIC/SWIFT' })
  @IsOptional()
  @IsString()
  bic?: string;
}

export class FieldConfidenceDto {
  @ApiProperty({ description: 'Field name' })
  field: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ description: 'Whether the field was extracted' })
  extracted: boolean;
}

export class InvoiceExtractionResultDto {
  @ApiProperty({ description: 'Extraction ID' })
  id: string;

  @ApiProperty({ description: 'Organisation ID' })
  organisationId: string;

  @ApiProperty({ description: 'Extraction status' })
  @IsEnum(InvoiceExtractionStatus)
  status: InvoiceExtractionStatus;

  @ApiProperty({ description: 'Extracted invoice data' })
  @ValidateNested()
  @Type(() => ExtractedInvoiceDataDto)
  data: ExtractedInvoiceDataDto;

  @ApiProperty({ description: 'Overall confidence score (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  overallConfidence: number;

  @ApiProperty({ description: 'Field-level confidence scores', type: [FieldConfidenceDto] })
  @IsArray()
  fieldConfidences: FieldConfidenceDto[];

  @ApiPropertyOptional({ description: 'Number of pages processed' })
  @IsOptional()
  @IsNumber()
  pageCount?: number;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @ApiPropertyOptional({ description: 'Error message if extraction failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class ExtractInvoiceRequestDto {
  @ApiProperty({ description: 'File buffer or URL' })
  file: Buffer | string;

  @ApiProperty({ description: 'MIME type (application/pdf, image/png, image/jpeg)' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'User ID who initiated the extraction' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Enable async processing via queue', default: false })
  @IsOptional()
  async?: boolean;
}

export class InvoiceExtractionJobDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'Organisation ID' })
  organisationId: string;

  @ApiProperty({ description: 'Job status' })
  status: string;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiPropertyOptional({ description: 'Result data' })
  @IsOptional()
  result?: InvoiceExtractionResultDto;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
}
