/**
 * Tax Deductions DTOs
 * Export all deduction-related DTOs
 */

// Existing DTOs
export * from './deduction-suggestion.dto';
export * from './confirm-deduction.dto';
export * from './deduction-summary.dto';

// New AI-powered DTOs
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

/**
 * Analyze Expenses DTO
 */
export class AnalyzeExpensesDto {
  @ApiProperty({
    description: 'Array of expense IDs to analyze',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsString({ each: true })
  expenseIds!: string[];

  @ApiPropertyOptional({
    description: 'Tax bracket for calculating savings (default: 42%)',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxBracket?: number;
}

/**
 * Deduction Category DTO
 */
export class DeductionCategoryDto {
  @ApiProperty({
    description: 'Category code',
    example: 'WERBUNGSKOSTEN',
  })
  code!: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Werbungskosten',
  })
  name!: string;

  @ApiProperty({
    description: 'Category description',
    example:
      'Income-related expenses (work equipment, professional development, commute)',
  })
  description!: string;

  @ApiProperty({
    description: 'Legal reference (EStG paragraph)',
    example: '§ 9 EStG',
  })
  legalReference!: string;
}

/**
 * Apply Deduction DTO
 */
export class ApplyDeductionDto {
  @ApiPropertyOptional({
    description: 'Modified deductible amount (if user wants to change it)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductibleAmount?: number;

  @ApiPropertyOptional({
    description: 'Notes or comments for the application',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
