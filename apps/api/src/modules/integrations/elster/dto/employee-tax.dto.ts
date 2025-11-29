import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Employer information
 */
export class EmployerInfoDto {
  @ApiProperty({ description: 'Company name', example: 'Musterfirma GmbH' })
  @IsString()
  companyName!: string;

  @ApiProperty({
    description: 'Tax number (Steuernummer)',
    example: '12/345/67890',
  })
  @IsString()
  @Matches(/^\d{2}\/\d{3}\/\d{5}$/, {
    message: 'Tax number must be in format XX/XXX/XXXXX',
  })
  taxNumber!: string;

  @ApiProperty({
    description: 'Operating number (Betriebsnummer)',
    example: '12345678',
  })
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'Operating number must be 8 digits',
  })
  operatingNumber!: string;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'Hans Schmidt',
  })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+49 30 12345678',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

/**
 * Social security contributions breakdown
 */
export class SocialSecurityContributionsDto {
  @ApiProperty({
    description: 'Health insurance contributions (Krankenversicherung)',
    example: 5000.0,
  })
  @IsNumber()
  @Min(0)
  healthInsurance!: number;

  @ApiProperty({
    description: 'Pension insurance contributions (Rentenversicherung)',
    example: 8000.0,
  })
  @IsNumber()
  @Min(0)
  pensionInsurance!: number;

  @ApiProperty({
    description: 'Unemployment insurance contributions (Arbeitslosenversicherung)',
    example: 2000.0,
  })
  @IsNumber()
  @Min(0)
  unemploymentInsurance!: number;

  @ApiProperty({
    description: 'Long-term care insurance contributions (Pflegeversicherung)',
    example: 1500.0,
  })
  @IsNumber()
  @Min(0)
  careInsurance!: number;

  @ApiPropertyOptional({
    description: 'Total employer contribution',
    example: 16500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employerTotal?: number;

  @ApiPropertyOptional({
    description: 'Total employee contribution',
    example: 16500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeTotal?: number;
}

/**
 * Employee Tax DTO for ELSTER submission
 * Represents Lohnsteueranmeldung
 */
export class EmployeeTaxDto {
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
    description: 'Tax period (month: 01-12)',
    example: '03',
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Tax period must be 01-12',
  })
  taxPeriod!: string;

  @ApiProperty({
    description: 'Employer information',
    type: EmployerInfoDto,
  })
  @ValidateNested()
  @Type(() => EmployerInfoDto)
  employer!: EmployerInfoDto;

  @ApiProperty({
    description: 'Total gross wages paid (Bruttolohn)',
    example: 150000.0,
  })
  @IsNumber()
  @Min(0)
  totalGrossWages!: number;

  @ApiProperty({
    description: 'Total wage tax withheld (Lohnsteuer)',
    example: 25000.0,
  })
  @IsNumber()
  @Min(0)
  totalWageTax!: number;

  @ApiProperty({
    description: 'Solidarity surcharge (Solidaritätszuschlag)',
    example: 1375.0,
  })
  @IsNumber()
  @Min(0)
  solidaritySurcharge!: number;

  @ApiPropertyOptional({
    description: 'Church tax withheld (Kirchensteuer)',
    example: 2000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  churchTax?: number;

  @ApiProperty({
    description: 'Number of employees during period',
    example: 25,
  })
  @IsNumber()
  @Min(1)
  numberOfEmployees!: number;

  @ApiProperty({
    description: 'Social security contributions',
    type: SocialSecurityContributionsDto,
  })
  @ValidateNested()
  @Type(() => SocialSecurityContributionsDto)
  socialSecurityContributions!: SocialSecurityContributionsDto;

  @ApiPropertyOptional({
    description: 'Special payments (bonuses, 13th/14th month salary)',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialPayments?: number;

  @ApiPropertyOptional({
    description: 'Tax on special payments',
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialPaymentsTax?: number;

  @ApiPropertyOptional({
    description: 'Company car benefits (Sachbezüge)',
    example: 2000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  benefitsInKind?: number;

  @ApiPropertyOptional({
    description: 'Mini-job wages (geringfügige Beschäftigung)',
    example: 1000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  miniJobWages?: number;

  @ApiPropertyOptional({
    description: 'Severance payments (Abfindungen)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  severancePayments?: number;

  @ApiProperty({
    description: 'Test submission flag',
    example: false,
  })
  @IsBoolean()
  testSubmission!: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes or corrections',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Is this a correction to a previous submission',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCorrection?: boolean;

  @ApiPropertyOptional({
    description: 'Original transfer ticket (if correction)',
  })
  @IsOptional()
  @IsString()
  originalTransferTicket?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Employee Tax submission response
 */
export class EmployeeTaxResponseDto {
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
 * Employee Tax validation result
 */
export class EmployeeTaxValidationDto {
  @ApiProperty({ description: 'Validation passed' })
  @IsBoolean()
  valid!: boolean;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors!: string[];

  @ApiProperty({ description: 'Validation warnings', type: [String] })
  warnings!: string[];

  @ApiPropertyOptional({ description: 'Tax calculations are correct' })
  @IsOptional()
  @IsBoolean()
  calculationsCorrect?: boolean;
}
