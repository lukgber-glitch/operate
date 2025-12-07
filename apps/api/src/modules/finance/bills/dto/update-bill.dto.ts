import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsObject,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillStatus, PaymentStatus } from '@prisma/client';

import { CreateBillLineItemDto } from './create-bill.dto';

// Define values for validation (Prisma enums undefined at decorator eval on Node 20)
const BillStatusValues = ['DRAFT', 'PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
const PaymentStatusValues = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as const;

/**
 * DTO for updating an existing bill
 */
export class UpdateBillDto {
  @ApiPropertyOptional({
    description: 'Vendor ID',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Vendor name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendorName?: string;

  @ApiPropertyOptional({
    description: "Vendor's invoice/bill number",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billNumber?: string;

  @ApiPropertyOptional({
    description: 'Internal reference',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Bill description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Subtotal amount (before tax)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax amount',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Total amount (including tax)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Bill status',
    enum: BillStatus,
  })
  @IsOptional()
  @IsIn(BillStatusValues)
  status?: BillStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsIn(PaymentStatusValues)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Issue date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Due date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Expense category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Tax deductible flag',
  })
  @IsOptional()
  @IsBoolean()
  taxDeductible?: boolean;

  @ApiPropertyOptional({
    description: 'Tax deduction category',
  })
  @IsOptional()
  @IsString()
  deductionCategory?: string;

  @ApiPropertyOptional({
    description: 'VAT rate (percentage)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @ApiPropertyOptional({
    description: 'Customer-facing notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Internal notes',
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({
    description: 'Bill line items',
    type: [CreateBillLineItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillLineItemDto)
  lineItems?: CreateBillLineItemDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
