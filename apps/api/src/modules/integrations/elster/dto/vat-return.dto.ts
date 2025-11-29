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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tax period type for VAT returns
 */
export enum VATReturnPeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

/**
 * VAT Return DTO for ELSTER submission
 * Represents Umsatzsteuervoranmeldung (UStVA)
 */
export class VATReturnDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organizationId!: string;

  @ApiProperty({
    description: 'Tax ID (Steuernummer)',
    example: '12/345/67890',
  })
  @IsString()
  @Matches(/^\d{2}\/\d{3}\/\d{5}$/, {
    message: 'Tax ID must be in format XX/XXX/XXXXX',
  })
  taxId!: string;

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
    message: 'Tax period must be Q1-Q4 or 01-12',
  })
  taxPeriod!: string;

  @ApiProperty({
    description: 'Period type',
    enum: VATReturnPeriodType,
    example: VATReturnPeriodType.QUARTERLY,
  })
  @IsEnum(VATReturnPeriodType)
  periodType!: VATReturnPeriodType;

  @ApiProperty({
    description: 'Taxable sales at 19% VAT rate (Kennziffer 81)',
    example: 100000.0,
  })
  @IsNumber()
  @Min(0)
  taxableSales19!: number;

  @ApiProperty({
    description: 'VAT at 19% (Kennziffer 81)',
    example: 19000.0,
  })
  @IsNumber()
  @Min(0)
  vat19!: number;

  @ApiProperty({
    description: 'Taxable sales at 7% VAT rate (Kennziffer 86)',
    example: 50000.0,
  })
  @IsNumber()
  @Min(0)
  taxableSales7!: number;

  @ApiProperty({
    description: 'VAT at 7% (Kennziffer 86)',
    example: 3500.0,
  })
  @IsNumber()
  @Min(0)
  vat7!: number;

  @ApiPropertyOptional({
    description: 'Intra-community acquisitions (Kennziffer 91)',
    example: 20000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  intraCommunityAcquisitions?: number;

  @ApiPropertyOptional({
    description: 'VAT on intra-community acquisitions (Kennziffer 91)',
    example: 3800.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatIntraCommunity?: number;

  @ApiProperty({
    description: 'Input tax deduction (Vorsteuerabzug - Kennziffer 66)',
    example: 15000.0,
  })
  @IsNumber()
  @Min(0)
  inputTaxDeduction!: number;

  @ApiPropertyOptional({
    description: 'Other taxable sales at various rates',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherTaxableSales?: number;

  @ApiPropertyOptional({
    description: 'Other input tax amounts',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherInputTax?: number;

  @ApiPropertyOptional({
    description: 'Tax-free sales with input tax deduction (Kennziffer 43)',
    example: 10000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxFreeSalesWithDeduction?: number;

  @ApiPropertyOptional({
    description: 'Tax-free intra-community deliveries (Kennziffer 41)',
    example: 25000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxFreeIntraCommunityDeliveries?: number;

  @ApiPropertyOptional({
    description: 'Tax-free exports (Kennziffer 45)',
    example: 15000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxFreeExports?: number;

  @ApiProperty({
    description: 'Total VAT payable (positive) or refundable (negative) - Kennziffer 83',
    example: 11300.0,
  })
  @IsNumber()
  totalVat!: number;

  @ApiPropertyOptional({
    description: 'Previous advance payments for the period',
    example: 10000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  previousAdvancePayments?: number;

  @ApiPropertyOptional({
    description: 'Special circumstances note (max 500 characters)',
    example: 'First VAT return for newly registered business',
  })
  @IsOptional()
  @IsString()
  specialCircumstances?: string;

  @ApiProperty({
    description: 'Test submission flag',
    example: false,
  })
  @IsBoolean()
  testSubmission!: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * VAT Return validation result
 */
export class VATReturnValidationDto {
  @ApiProperty({ description: 'Validation passed' })
  @IsBoolean()
  valid!: boolean;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors!: string[];

  @ApiProperty({ description: 'Validation warnings', type: [String] })
  warnings!: string[];

  @ApiPropertyOptional({ description: 'Calculated totals match' })
  @IsOptional()
  @IsBoolean()
  totalsMatch?: boolean;

  @ApiPropertyOptional({ description: 'Expected total VAT' })
  @IsOptional()
  @IsNumber()
  expectedTotalVat?: number;
}

/**
 * VAT Return submission response
 */
export class VATReturnResponseDto {
  @ApiProperty({ description: 'Submission successful' })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ description: 'Transfer ticket ID' })
  @IsString()
  transferTicket!: string;

  @ApiPropertyOptional({ description: 'Data transfer number' })
  @IsOptional()
  @IsString()
  dataTransferNumber?: string;

  @ApiProperty({ description: 'Submission timestamp' })
  timestamp!: Date;

  @ApiProperty({ description: 'Response status' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Response message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Errors', type: [Object] })
  errors!: Array<{
    code: string;
    message: string;
    severity: string;
  }>;

  @ApiProperty({ description: 'Warnings', type: [Object] })
  warnings!: Array<{
    code: string;
    message: string;
    severity: string;
  }>;
}

/**
 * VAT Return status query DTO
 */
export class VATReturnStatusDto {
  @ApiProperty({ description: 'Transfer ticket ID to check status' })
  @IsString()
  transferTicket!: string;
}
