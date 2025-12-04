import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Matches,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UVAPeriodType, UVAKennzahlen } from '../finanzonline-uva.types';

/**
 * UVA Submission Request DTO
 * Request body for submitting Austrian VAT advance return
 */
export class UVASubmissionDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organizationId!: string;

  @ApiProperty({
    description: 'Tax year',
    example: 2024,
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear!: number;

  @ApiProperty({
    description: 'Tax period (Q1, Q2, Q3, Q4 for quarterly or 01-12 for monthly)',
    example: 'Q1',
  })
  @IsString()
  @Matches(/^(Q[1-4]|0[1-9]|1[0-2])$/, {
    message: 'Tax period must be Q1-Q4 for quarterly or 01-12 for monthly',
  })
  taxPeriod!: string;

  @ApiProperty({
    description: 'Period type',
    enum: UVAPeriodType,
    example: UVAPeriodType.QUARTERLY,
  })
  @IsEnum(UVAPeriodType)
  periodType!: UVAPeriodType;

  @ApiProperty({
    description: 'Participant ID (Teilnehmer-ID) for FinanzOnline',
    example: '123456789',
  })
  @IsString()
  teilnehmerId!: string;

  @ApiProperty({
    description: 'Tax number (Steuernummer)',
    example: '12-345/6789',
  })
  @IsString()
  taxNumber!: string;

  @ApiPropertyOptional({
    description: 'VAT ID (UID-Nummer)',
    example: 'ATU12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^ATU\d{8}$/, {
    message: 'VAT ID must be in format ATU12345678',
  })
  vatId?: string;

  @ApiProperty({
    description: 'UVA Kennzahlen (form field values)',
    type: 'object',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UVAKennzahlenDto)
  kennzahlen!: UVAKennzahlenDto;

  @ApiProperty({
    description: 'Total VAT payable (positive) or refundable (negative)',
    example: 5000.0,
  })
  @IsNumber()
  totalVAT!: number;

  @ApiPropertyOptional({
    description: 'Special circumstances note (max 500 characters)',
    example: 'First UVA for newly registered business',
  })
  @IsOptional()
  @IsString()
  specialCircumstances?: string;

  @ApiProperty({
    description: 'Test submission flag',
    example: false,
    default: false,
  })
  @IsBoolean()
  testSubmission!: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * UVA Kennzahlen DTO
 * Austrian VAT form field values
 */
export class UVAKennzahlenDto implements Partial<UVAKennzahlen> {
  // Sales at 20%
  @ApiPropertyOptional({ description: 'KZ 022: Sales at 20% (tax base)', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz022?: number;

  @ApiPropertyOptional({ description: 'KZ 029: VAT at 20%', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz029?: number;

  // Sales at 13%
  @ApiPropertyOptional({ description: 'KZ 006: Sales at 13% (tax base)', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz006?: number;

  @ApiPropertyOptional({ description: 'KZ 037: VAT at 13%', example: 6500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz037?: number;

  // Sales at 10%
  @ApiPropertyOptional({ description: 'KZ 007: Sales at 10% (tax base)', example: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz007?: number;

  @ApiPropertyOptional({ description: 'KZ 008: VAT at 10%', example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz008?: number;

  // Tax-free deliveries
  @ApiPropertyOptional({ description: 'KZ 020: Exports (tax-free)', example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz020?: number;

  @ApiPropertyOptional({ description: 'KZ 021: Intra-community deliveries', example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz021?: number;

  // Intra-community acquisitions at 20%
  @ApiPropertyOptional({ description: 'KZ 070: IC acquisitions at 20% (tax base)', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz070?: number;

  @ApiPropertyOptional({ description: 'KZ 071: VAT on IC acquisitions at 20%', example: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz071?: number;

  // Intra-community acquisitions at 13%
  @ApiPropertyOptional({ description: 'KZ 072: IC acquisitions at 13% (tax base)', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz072?: number;

  @ApiPropertyOptional({ description: 'KZ 073: VAT on IC acquisitions at 13%', example: 1300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz073?: number;

  // Reverse charge
  @ApiPropertyOptional({ description: 'KZ 048: Reverse charge base', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz048?: number;

  @ApiPropertyOptional({ description: 'KZ 088: Reverse charge VAT', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz088?: number;

  // Input VAT
  @ApiPropertyOptional({ description: 'KZ 060: Total input VAT', example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz060_vorsteuer?: number;

  @ApiPropertyOptional({ description: 'KZ 083: Input VAT from IC acquisitions', example: 5300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz083?: number;

  @ApiPropertyOptional({ description: 'KZ 065: Input VAT from reverse charge', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz065?: number;

  @ApiPropertyOptional({ description: 'KZ 066: Input VAT from imports', example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz066?: number;

  // Payment
  @ApiPropertyOptional({ description: 'KZ 095: Advance payment due', example: 5000 })
  @IsOptional()
  @IsNumber()
  kz095?: number;

  @ApiPropertyOptional({ description: 'KZ 096: Credit/refund', example: 0 })
  @IsOptional()
  @IsNumber()
  kz096?: number;

  // Other
  @ApiPropertyOptional({ description: 'KZ 090: Corrections', example: 0 })
  @IsOptional()
  @IsNumber()
  kz090?: number;

  @ApiPropertyOptional({ description: 'KZ 000: Total tax base', example: 180000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz000?: number;

  @ApiPropertyOptional({ description: 'KZ 001: Tax-free with input deduction', example: 40000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz001?: number;

  @ApiPropertyOptional({ description: 'KZ 011: Tax-free without input deduction', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kz011?: number;
}

/**
 * UVA Preparation Request DTO
 */
export class UVAPreparationDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organizationId!: string;

  @ApiProperty({
    description: 'Tax year',
    example: 2024,
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear!: number;

  @ApiProperty({
    description: 'Tax period',
    example: 'Q1',
  })
  @IsString()
  @Matches(/^(Q[1-4]|0[1-9]|1[0-2])$/)
  taxPeriod!: string;

  @ApiProperty({
    description: 'Period type',
    enum: UVAPeriodType,
    example: UVAPeriodType.QUARTERLY,
  })
  @IsEnum(UVAPeriodType)
  periodType!: UVAPeriodType;

  @ApiPropertyOptional({
    description: 'Include draft invoices',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDrafts?: boolean;

  @ApiPropertyOptional({
    description: 'Apply corrections from previous periods',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  applyCorrections?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-calculate UVA fields',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoCalculate?: boolean;

  @ApiPropertyOptional({
    description: 'Previous advance payment amount',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  previousAdvancePayment?: number;
}

/**
 * UVA Status Query DTO
 */
export class UVAStatusDto {
  @ApiProperty({
    description: 'Submission ID or Transfer ticket',
    example: 'sub_123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  identifier!: string;

  @ApiPropertyOptional({
    description: 'Organization ID (for validation)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

/**
 * UVA History Query DTO
 */
export class UVAHistoryDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organizationId!: string;

  @ApiPropertyOptional({
    description: 'Tax year filter',
    example: 2024,
  })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear?: number;

  @ApiPropertyOptional({
    description: 'Limit number of results',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * UVA Response DTO
 */
export class UVAResponseDto {
  @ApiProperty({ description: 'Submission ID' })
  submissionId!: string;

  @ApiPropertyOptional({ description: 'Transfer ticket from FinanzOnline' })
  transferTicket?: string;

  @ApiProperty({ description: 'Submission status' })
  status!: string;

  @ApiProperty({ description: 'Submitted at timestamp' })
  submittedAt!: Date;

  @ApiPropertyOptional({ description: 'Response from FinanzOnline' })
  response?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ description: 'Errors', type: [Object] })
  errors!: Array<{
    code: string;
    message: string;
    field?: string;
    severity: string;
  }>;

  @ApiProperty({ description: 'Warnings', type: [Object] })
  warnings!: Array<{
    code: string;
    message: string;
    field?: string;
  }>;

  @ApiPropertyOptional({ description: 'Receipt number' })
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Next due date' })
  nextDueDate?: Date;
}
