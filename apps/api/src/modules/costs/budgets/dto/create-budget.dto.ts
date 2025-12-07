import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { BudgetPeriod, CostCategory } from '@prisma/client';

/**
 * DTO for creating a budget
 */
export class CreateBudgetDto {
  @ApiProperty({
    description: 'Budget name',
    example: 'AI Operations Monthly Budget',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Cost category to limit (if null, applies to all categories)',
    enum: CostCategory,
    example: 'AI_CLASSIFICATION',
  })
  @IsOptional()
  category?: CostCategory;

  @ApiProperty({
    description: 'Budget limit amount',
    example: 1000.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  limitAmount: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Budget period',
    enum: BudgetPeriod,
    example: 'MONTHLY',
  })
  period: BudgetPeriod;

  @ApiPropertyOptional({
    description: 'Warning threshold (0.0-1.0, e.g., 0.80 for 80%)',
    example: 0.8,
    minimum: 0,
    maximum: 1,
    default: 0.8,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  warningThreshold?: number;

  @ApiPropertyOptional({
    description: 'Critical threshold (0.0-1.0, e.g., 0.95 for 95%)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
    default: 0.95,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  criticalThreshold?: number;

  @ApiPropertyOptional({
    description: 'Automatically pause operations when budget is exceeded',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoPause?: boolean;

  @ApiProperty({
    description: 'Budget period start date (ISO 8601)',
    example: '2024-12-01T00:00:00Z',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'Budget period end date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  periodEnd: string;
}
