import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

/**
 * DTO for creating a new expense
 */
export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense description',
    example: 'Business lunch with client',
  })
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'Amount (before tax)',
    example: 45.50,
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
  @Length(3, 3)
  currency?: string;

  @ApiProperty({
    description: 'Expense date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.MEALS,
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

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
    default: true,
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

  @ApiPropertyOptional({
    description: 'User ID who submitted the expense',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  submittedBy?: string;
}
