import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Recurring frequency enum (matches Prisma schema)
 */
export enum RecurringFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

/**
 * DTO for recurring invoice line item
 */
export class RecurringInvoiceLineItemDto {
  @ApiProperty({
    description: 'Item description',
    example: 'Monthly subscription fee',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit price (before tax)',
    example: 99.99,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Product/service code',
    example: 'SUB-001',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: 'month',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

/**
 * DTO for creating a recurring invoice
 */
export class CreateRecurringInvoiceDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurringFrequency,
    example: 'MONTHLY',
  })
  frequency: RecurringFrequency;

  @ApiPropertyOptional({
    description: 'Interval for recurrence (e.g., every 2 months)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly/quarterly recurrence (1-28)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Day of week for weekly/biweekly recurrence (0=Sunday, 6=Saturday)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({
    description: 'Start date for recurring invoices (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date for recurring invoices (ISO 8601). Null for no end.',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Invoice line items',
    type: [RecurringInvoiceLineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringInvoiceLineItemDto)
  lineItems: RecurringInvoiceLineItemDto[];

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Tax rate (percentage)',
    example: 19,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @ApiPropertyOptional({
    description: 'Notes for invoice',
    example: 'Thank you for your continued business!',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment terms in days',
    example: 14,
    default: 14,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermsDays?: number;
}

/**
 * DTO for updating a recurring invoice
 */
export class UpdateRecurringInvoiceDto extends PartialType(
  CreateRecurringInvoiceDto,
) {}

/**
 * DTO for filtering recurring invoices
 */
export class RecurringInvoiceFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by frequency',
    enum: RecurringFrequency,
  })
  @IsOptional()
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({
    description: 'Search by customer name',
    example: 'ACME Corp',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'nextRunDate',
    default: 'nextRunDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
