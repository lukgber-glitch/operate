import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { BillStatus, PaymentStatus, BillSourceType } from '@prisma/client';

// Define values for validation (Prisma enums undefined at decorator eval on Node 20)
const BillStatusValues = ['DRAFT', 'PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
const PaymentStatusValues = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as const;
const BillSourceTypeValues = ['MANUAL', 'EMAIL', 'SCAN', 'API'] as const;

/**
 * DTO for creating bill line item
 */
export class CreateBillLineItemDto {
  @ApiProperty({
    description: 'Line item description',
    example: 'Office supplies - Paper reams',
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit price (before tax)',
    example: 25.00,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Tax rate (percentage)',
    example: 19,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Expense category',
    example: 'office_supplies',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Product/service code',
    example: 'PAPER-A4',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

/**
 * DTO for creating a new bill
 */
export class CreateBillDto {
  @ApiPropertyOptional({
    description: 'Vendor ID (if vendor exists in system)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiProperty({
    description: 'Vendor name',
    example: 'Office Supplies Inc.',
  })
  @IsString()
  @MaxLength(200)
  vendorName: string;

  @ApiPropertyOptional({
    description: "Vendor's invoice/bill number",
    example: 'INV-2024-12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billNumber?: string;

  @ApiPropertyOptional({
    description: 'Internal reference',
    example: 'PO-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Bill description',
    example: 'Monthly office supplies purchase',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Subtotal amount (before tax)',
    example: 250.00,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax amount',
    example: 47.50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Total amount (including tax)',
    example: 297.50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Bill status',
    enum: BillStatus,
    default: 'DRAFT',
  })
  @IsOptional()
  @IsIn(BillStatusValues)
  status?: BillStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    default: 'PENDING',
  })
  @IsOptional()
  @IsIn(PaymentStatusValues)
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Issue date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'Due date (ISO 8601)',
    example: '2024-02-14',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Source type of the bill',
    enum: BillSourceType,
    default: 'MANUAL',
  })
  @IsOptional()
  @IsIn(BillSourceTypeValues)
  sourceType?: BillSourceType;

  @ApiPropertyOptional({
    description: 'Source email ID (if extracted from email)',
  })
  @IsOptional()
  @IsString()
  sourceEmailId?: string;

  @ApiPropertyOptional({
    description: 'Source attachment ID (if from email attachment)',
  })
  @IsOptional()
  @IsString()
  sourceAttachmentId?: string;

  @ApiPropertyOptional({
    description: 'Extracted data ID (link to AI extraction record)',
  })
  @IsOptional()
  @IsString()
  extractedDataId?: string;

  @ApiPropertyOptional({
    description: 'Expense category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Tax deductible flag',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  taxDeductible?: boolean;

  @ApiPropertyOptional({
    description: 'Tax deduction category',
    example: 'office_expenses',
  })
  @IsOptional()
  @IsString()
  deductionCategory?: string;

  @ApiPropertyOptional({
    description: 'VAT rate (percentage)',
    example: 19,
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
    description: 'Internal notes (not visible externally)',
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    type: [String],
    example: ['https://storage.example.com/bills/invoice.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({
    description: 'Bill line items (optional, for detailed bills)',
    type: [CreateBillLineItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillLineItemDto)
  lineItems?: CreateBillLineItemDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { projectId: 'PRJ-001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
