import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@prisma/client';
import { CreateInvoiceItemDto } from './create-invoice.dto';

/**
 * DTO for updating an invoice
 * Can only update invoices in DRAFT status
 */
export class UpdateInvoiceDto {
  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'ACME Corp GmbH',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  customerName?: string;

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

  @ApiPropertyOptional({
    description: 'Issue date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Due date (ISO 8601)',
    example: '2024-02-14',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

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

  @ApiPropertyOptional({
    description: 'Invoice line items (replaces all existing items)',
    type: [CreateInvoiceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { projectId: 'PRJ-001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
