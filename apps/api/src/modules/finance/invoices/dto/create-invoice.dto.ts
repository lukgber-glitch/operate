import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Length,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, InvoiceStatus } from '@prisma/client';

/**
 * DTO for creating invoice line item
 */
export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'Item description',
    example: 'Web Development Services - January 2024',
  })
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 40,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit price (before tax)',
    example: 120.00,
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
    description: 'Product/service code',
    example: 'SRV-001',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: 'hours',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

/**
 * DTO for creating a new invoice
 */
export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Invoice type',
    enum: InvoiceType,
    example: 'STANDARD',
  })
  @IsNotEmpty()
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiPropertyOptional({
    description: 'Customer ID (if customer exists in system)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'ACME Corp GmbH',
  })
  @IsString()
  @Length(1, 200)
  customerName: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'billing@acme.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Customer billing address',
    example: 'Hauptstraße 123, 10115 Berlin, Germany',
  })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({
    description: 'Customer VAT ID',
    example: 'DE123456789',
  })
  @IsOptional()
  @IsString()
  customerVatId?: string;

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
    description: 'Currency code (ISO 4217). If not provided, defaults to organization currency from onboarding.',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Default VAT rate for all items (percentage)',
    example: 19,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @ApiPropertyOptional({
    description: 'Reverse charge applies (EU B2B)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @ApiPropertyOptional({
    description: 'Payment terms description',
    example: 'Net 30 days',
  })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Bank Transfer',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Bank reference/IBAN for payment',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  bankReference?: string;

  @ApiPropertyOptional({
    description: 'Customer-facing notes',
    example: 'Thank you for your business!',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to customer)',
    example: 'Follow up if not paid by due date',
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({
    description: 'Invoice line items',
    type: [CreateInvoiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { projectId: 'PRJ-001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
