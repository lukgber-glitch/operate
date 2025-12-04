import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  Max,
  Matches,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Taxpayer address information
 */
export class TaxpayerAddressDto {
  @ApiProperty({ description: 'Street name', example: 'Hauptstraße' })
  @IsString()
  street!: string;

  @ApiProperty({ description: 'House number', example: '123' })
  @IsString()
  houseNumber!: string;

  @ApiProperty({ description: 'Postal code', example: '10115' })
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode!: string;

  @ApiProperty({ description: 'City', example: 'Berlin' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ description: 'Additional address line' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

/**
 * Taxpayer information
 */
export class TaxpayerDto {
  @ApiProperty({ description: 'First name', example: 'Max' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last name', example: 'Mustermann' })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1980-01-15',
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({
    description: 'Tax ID (Steueridentifikationsnummer)',
    example: '12345678901',
  })
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'Tax ID must be 11 digits',
  })
  taxId!: string;

  @ApiProperty({ description: 'Taxpayer address', type: TaxpayerAddressDto })
  @ValidateNested()
  @Type(() => TaxpayerAddressDto)
  address!: TaxpayerAddressDto;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * Spouse information for joint filing
 */
export class SpouseDto {
  @ApiProperty({ description: 'First name', example: 'Maria' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last name', example: 'Mustermann' })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1982-05-20',
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({
    description: 'Tax ID (Steueridentifikationsnummer)',
    example: '98765432109',
  })
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'Tax ID must be 11 digits',
  })
  taxId!: string;
}

/**
 * Income Tax Return DTO for ELSTER submission
 * Represents Einkommensteuererklärung (ESt)
 */
export class IncomeTaxReturnDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  organizationId!: string;

  @ApiProperty({
    description: 'Tax year',
    example: 2023,
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear!: number;

  @ApiProperty({
    description: 'Taxpayer information',
    type: TaxpayerDto,
  })
  @ValidateNested()
  @Type(() => TaxpayerDto)
  taxpayer!: TaxpayerDto;

  @ApiPropertyOptional({
    description: 'Spouse information (for joint filing)',
    type: SpouseDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpouseDto)
  spouse?: SpouseDto;

  @ApiProperty({
    description: 'Filing status is joint (married filing jointly)',
    example: false,
  })
  @IsBoolean()
  jointFiling!: boolean;

  @ApiProperty({
    description: 'Income from employment (Einkünfte aus nichtselbständiger Arbeit)',
    example: 50000.0,
  })
  @IsNumber()
  @Min(0)
  employmentIncome!: number;

  @ApiPropertyOptional({
    description: 'Income from self-employment (Einkünfte aus selbständiger Arbeit)',
    example: 30000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selfEmploymentIncome?: number;

  @ApiPropertyOptional({
    description: 'Income from business operations (Einkünfte aus Gewerbebetrieb)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  businessIncome?: number;

  @ApiPropertyOptional({
    description: 'Capital income (Einkünfte aus Kapitalvermögen)',
    example: 2000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capitalIncome?: number;

  @ApiPropertyOptional({
    description: 'Rental income (Einkünfte aus Vermietung und Verpachtung)',
    example: 12000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentalIncome?: number;

  @ApiPropertyOptional({
    description: 'Other income (Sonstige Einkünfte)',
    example: 1000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherIncome?: number;

  @ApiPropertyOptional({
    description: 'Special expenses deductions (Sonderausgaben)',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialExpenses?: number;

  @ApiPropertyOptional({
    description: 'Extraordinary expenses (Außergewöhnliche Belastungen)',
    example: 2000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraordinaryExpenses?: number;

  @ApiPropertyOptional({
    description: 'Business expenses (Werbungskosten)',
    example: 3000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  businessExpenses?: number;

  @ApiPropertyOptional({
    description: 'Household-related services deduction',
    example: 1000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  householdServicesDeduction?: number;

  @ApiPropertyOptional({
    description: 'Donations and contributions',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  donations?: number;

  @ApiProperty({
    description: 'Church tax applicable (Kirchensteuerpflicht)',
    example: true,
  })
  @IsBoolean()
  churchTaxApplicable!: boolean;

  @ApiPropertyOptional({
    description: 'Religious denomination code (if church tax applicable)',
    example: 'RK',
  })
  @IsOptional()
  @IsString()
  religiousDenomination?: string;

  @ApiPropertyOptional({
    description: 'Supporting documents reference numbers',
    type: [String],
    example: ['DOC-2024-001', 'DOC-2024-002'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];

  @ApiProperty({
    description: 'Test submission flag',
    example: false,
  })
  @IsBoolean()
  testSubmission!: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Income Tax Return submission response
 */
export class IncomeTaxReturnResponseDto {
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
