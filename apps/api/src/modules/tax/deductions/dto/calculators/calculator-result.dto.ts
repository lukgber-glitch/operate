import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

/**
 * Breakdown of calculation steps
 */
export class CalculationBreakdown {
  @ApiProperty({
    description: 'Step description',
    example: 'Base daily rate',
  })
  @IsString()
  step!: string;

  @ApiProperty({
    description: 'Calculated value for this step',
    example: 15.5,
  })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for this step',
    example: 'Based on 2024 rates',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Tax deduction calculation result
 */
export class DeductionResultDto {
  @ApiProperty({
    description: 'Original amount before deduction calculation',
    example: 1500.0,
  })
  @IsNumber()
  originalAmount!: number;

  @ApiProperty({
    description: 'Amount that can be deducted from taxes',
    example: 1200.0,
  })
  @IsNumber()
  deductibleAmount!: number;

  @ApiProperty({
    description: 'Percentage of original amount that is deductible',
    example: 80,
  })
  @IsNumber()
  deductiblePercentage!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  @IsString()
  currency!: string;

  @ApiProperty({
    description: 'Estimated tax savings (based on assumed tax rate)',
    example: 480.0,
  })
  @IsNumber()
  taxSavingsEstimate!: number;

  @ApiPropertyOptional({
    description: 'Tax rate used for savings calculation',
    example: 40,
  })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiProperty({
    description: 'Step-by-step breakdown of the calculation',
    type: [CalculationBreakdown],
  })
  @IsArray()
  breakdown!: CalculationBreakdown[];

  @ApiProperty({
    description: 'Legal reference for this deduction',
    example: '§ 9 Abs. 1 Satz 3 Nr. 4 EStG (Germany)',
  })
  @IsString()
  legalReference!: string;

  @ApiPropertyOptional({
    description: 'Requirements to claim this deduction',
    example: ['Keep receipts', 'Document business purpose', 'Maintain logbook'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({
    description: 'Warnings or limitations',
    example: ['Maximum €1,230 per year', 'Requires employer confirmation'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata about the calculation',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
