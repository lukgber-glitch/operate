import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { CostCategory } from '@prisma/client';

/**
 * DTO for creating a cost entry
 */
export class CreateCostEntryDto {
  @ApiProperty({
    description: 'Cost category',
    enum: CostCategory,
    example: 'AI_CLASSIFICATION',
  })
  category: CostCategory;

  @ApiProperty({
    description: 'Cost amount (in the smallest currency unit, e.g., cents)',
    example: 0.0025,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
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
    description: 'Human-readable description of the cost',
    example: 'AI classification of invoice #INV-2024-001',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of the automation that triggered this cost',
    example: 'auto-001',
  })
  @IsOptional()
  @IsString()
  automationId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata about the cost entry',
    example: { model: 'gpt-4', tokens: 1500, duration_ms: 250 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
