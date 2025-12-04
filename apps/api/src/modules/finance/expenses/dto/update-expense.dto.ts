import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsObject,
  Min,
  Length,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

/**
 * DTO for updating an expense
 * Can only update expenses in PENDING status
 */
export class UpdateExpenseDto {
  @ApiPropertyOptional({
    description: 'Expense description',
    example: 'Business lunch with client',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Amount (before tax)',
    example: 45.50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Expense date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.MEALS,
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({
    description: 'Subcategory',
    example: 'Client entertainment',
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({
    description: 'Vendor/merchant name',
    example: 'Restaurant Berlin',
  })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({
    description: 'Vendor VAT ID',
    example: 'DE123456789',
  })
  @IsOptional()
  @IsString()
  vendorVatId?: string;

  @ApiPropertyOptional({
    description: 'Receipt image/PDF URL',
    example: 'https://storage.example.com/receipts/abc123.pdf',
  })
  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @ApiPropertyOptional({
    description: 'Receipt number',
    example: 'REC-2024-001',
  })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({
    description: 'VAT amount',
    example: 8.65,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatAmount?: number;

  @ApiPropertyOptional({
    description: 'VAT rate (percentage)',
    example: 19,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @ApiPropertyOptional({
    description: 'Is VAT deductible',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Company Credit Card',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Discussed Q1 project requirements',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { projectId: 'PRJ-001', billable: true },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
