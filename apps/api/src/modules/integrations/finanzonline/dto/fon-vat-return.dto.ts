import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDate,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VatPeriodType } from '../interfaces/fon-submission.interface';

/**
 * VAT period DTO
 */
export class VatPeriodDto {
  @ApiProperty({
    description: 'Tax year',
    example: 2025,
    minimum: 2000,
    maximum: 2100,
  })
  @IsNumber()
  @Min(2000)
  year!: number;

  @ApiProperty({
    description: 'Period type',
    enum: VatPeriodType,
    example: 'MONTHLY',
  })
  type!: VatPeriodType;

  @ApiPropertyOptional({
    description: 'Period number (1-12 for monthly, 1-4 for quarterly)',
    example: 11,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  period?: number;

  @ApiProperty({
    description: 'Period start date',
    example: '2025-11-01',
  })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'Period end date',
    example: '2025-11-30',
  })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

/**
 * VAT return line item DTO
 */
export class VatReturnLineDto {
  @ApiProperty({
    description: 'Austrian VAT line code (Kennzahl)',
    example: '000',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}$/, {
    message: 'VAT line code must be a 3-digit number',
  })
  code!: string;

  @ApiProperty({
    description: 'Amount in cents (e.g., 10050 = 100.50 EUR)',
    example: 10050,
  })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Line description',
    example: 'Domestic supplies at 20% rate',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * VAT return submission DTO
 */
export class FonVatReturnDto {
  @ApiProperty({
    description: 'Austrian tax ID (Steuernummer)',
    example: '12-345/6789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}-\d{3}\/\d{4}$/, {
    message: 'Tax ID must be in format: XX-YYY/ZZZZ',
  })
  taxId!: string;

  @ApiPropertyOptional({
    description: 'Austrian VAT ID (UID)',
    example: 'ATU12345678',
  })
  @IsString()
  @IsOptional()
  @Matches(/^ATU\d{8}$/, {
    message: 'VAT ID must be in format: ATU12345678',
  })
  vatId?: string;

  @ApiProperty({
    description: 'Tax period',
    type: VatPeriodDto,
  })
  @ValidateNested()
  @Type(() => VatPeriodDto)
  period!: VatPeriodDto;

  @ApiProperty({
    description: 'VAT return lines (Kennzahlen)',
    type: [VatReturnLineDto],
    example: [
      { code: '000', amount: 50000, description: 'Taxable turnover' },
      { code: '022', amount: 10000, description: 'VAT at 20%' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VatReturnLineDto)
  lines!: VatReturnLineDto[];

  @ApiProperty({
    description: 'Total output VAT in cents',
    example: 10000,
  })
  @IsNumber()
  totalOutputVat!: number;

  @ApiProperty({
    description: 'Total input VAT in cents',
    example: 5000,
  })
  @IsNumber()
  totalInputVat!: number;

  @ApiProperty({
    description: 'Net VAT payable (positive) or refundable (negative) in cents',
    example: 5000,
  })
  @IsNumber()
  netVat!: number;

  @ApiProperty({
    description: 'Declaration date',
    example: '2025-11-29',
  })
  @IsDate()
  @Type(() => Date)
  declarationDate!: Date;

  @ApiPropertyOptional({
    description: 'Submitter name',
    example: 'Max Mustermann',
  })
  @IsString()
  @IsOptional()
  submitterName?: string;

  @ApiPropertyOptional({
    description: 'Submitter phone',
    example: '+43 1 234567',
  })
  @IsString()
  @IsOptional()
  submitterPhone?: string;

  @ApiPropertyOptional({
    description: 'Special remarks or notes',
    example: 'Corrected return due to error in previous submission',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Session ID for authenticated session',
    example: 'sess_1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

/**
 * VAT return response DTO
 */
export class VatReturnResponseDto {
  @ApiProperty({
    description: 'Submission success status',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-11-29T10:00:00Z',
  })
  timestamp!: Date;

  @ApiPropertyOptional({
    description: 'FinanzOnline reference ID',
    example: 'FON-2025-11-29-123456',
  })
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Submission status',
    example: 'ACCEPTED',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Tax office reference number',
    example: 'TO-2025-ABC123',
  })
  taxOfficeReference?: string;

  @ApiPropertyOptional({
    description: 'Calculated tax amount in cents',
    example: 5000,
  })
  calculatedTaxAmount?: number;

  @ApiPropertyOptional({
    description: 'Payment due date',
    example: '2025-12-15',
  })
  paymentDueDate?: Date;

  @ApiPropertyOptional({
    description: 'Payment reference',
    example: 'PAY-2025-XYZ789',
  })
  paymentReference?: string;

  @ApiPropertyOptional({
    description: 'Error code if submission failed',
    example: 'INVALID_DATA',
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Error message if submission failed',
    example: 'Invalid VAT line code: 999',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Warning messages',
    type: [String],
    example: ['VAT amount does not match calculated value'],
  })
  warnings?: string[];
}

/**
 * Common Austrian VAT line codes (Kennzahlen)
 * Reference for developers
 */
export const AUSTRIAN_VAT_CODES = {
  // Turnover
  TOTAL_TURNOVER: '000',
  TAXABLE_TURNOVER_20: '022',
  TAXABLE_TURNOVER_10: '029',
  TAXABLE_TURNOVER_13: '006',
  EXPORT_TURNOVER: '011',
  IC_SUPPLY: '017',

  // Output VAT
  OUTPUT_VAT_20: '056',
  OUTPUT_VAT_10: '057',
  OUTPUT_VAT_13: '007',

  // Input VAT
  INPUT_VAT_GOODS: '060',
  INPUT_VAT_OTHER: '061',
  INPUT_VAT_IC_ACQUISITION: '065',

  // Corrections
  PREVIOUS_PERIOD_CORRECTION: '090',
} as const;
