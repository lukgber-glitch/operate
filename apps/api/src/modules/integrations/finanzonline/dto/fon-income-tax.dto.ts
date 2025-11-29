import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsDate,
  IsOptional,
  Min,
  Max,
  Matches,
  IsEmail,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Marital status enum
 */
export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

/**
 * Address DTO
 */
export class AddressDto {
  @ApiProperty({
    description: 'Street and house number',
    example: 'Hauptstraße 123',
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Postal code',
    example: '1010',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Austrian postal code must be 4 digits',
  })
  postalCode!: string;

  @ApiProperty({
    description: 'City',
    example: 'Wien',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'AT',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country code must be 2 uppercase letters',
  })
  country!: string;
}

/**
 * Personal info DTO
 */
export class PersonalInfoDto {
  @ApiProperty({
    description: 'First name',
    example: 'Max',
  })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Mustermann',
  })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1980-01-15',
  })
  @IsDate()
  @Type(() => Date)
  dateOfBirth!: Date;

  @ApiPropertyOptional({
    description: 'Austrian social security number (Sozialversicherungsnummer)',
    example: '1234-150180',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{6}$/, {
    message: 'Social security number must be in format: XXXX-DDMMYY',
  })
  socialSecurityNumber?: string;

  @ApiProperty({
    description: 'Address',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiPropertyOptional({
    description: 'Marital status',
    enum: MaritalStatus,
    example: MaritalStatus.SINGLE,
  })
  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;
}

/**
 * Income details DTO
 */
export class IncomeDetailsDto {
  @ApiPropertyOptional({
    description: 'Employment income in cents',
    example: 4500000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  employment?: number;

  @ApiPropertyOptional({
    description: 'Self-employment income in cents',
    example: 2000000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  selfEmployment?: number;

  @ApiPropertyOptional({
    description: 'Rental income in cents',
    example: 500000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rental?: number;

  @ApiPropertyOptional({
    description: 'Investment income in cents',
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  investment?: number;

  @ApiPropertyOptional({
    description: 'Other income in cents',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  other?: number;

  @ApiProperty({
    description: 'Total gross income in cents',
    example: 7150000,
  })
  @IsNumber()
  @Min(0)
  totalGross!: number;
}

/**
 * Deduction details DTO
 */
export class DeductionDetailsDto {
  @ApiPropertyOptional({
    description: 'Business expenses in cents',
    example: 500000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  businessExpenses?: number;

  @ApiPropertyOptional({
    description: 'Home office deduction in cents',
    example: 150000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  homeOffice?: number;

  @ApiPropertyOptional({
    description: 'Commuting expenses in cents',
    example: 200000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  commuting?: number;

  @ApiPropertyOptional({
    description: 'Social security contributions in cents',
    example: 800000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  socialSecurity?: number;

  @ApiPropertyOptional({
    description: 'Insurance premiums in cents',
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  insurance?: number;

  @ApiProperty({
    description: 'Total deductions in cents',
    example: 1750000,
  })
  @IsNumber()
  @Min(0)
  total!: number;
}

/**
 * Special expense DTO
 */
export class SpecialExpenseDto {
  @ApiProperty({
    description: 'Expense type code',
    example: 'CHARITY',
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    description: 'Amount in cents',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    description: 'Description',
    example: 'Donation to registered charity',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Reference to supporting documents',
    example: 'DOC-2025-001',
  })
  @IsString()
  @IsOptional()
  documentsRef?: string;
}

/**
 * Tax advisor info DTO
 */
export class TaxAdvisorInfoDto {
  @ApiProperty({
    description: 'Tax advisor registration number',
    example: 'TA-12345',
  })
  @IsString()
  @IsNotEmpty()
  advisorNumber!: string;

  @ApiProperty({
    description: 'Tax advisor name',
    example: 'Steuerberatung Müller GmbH',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'office@steuerberatung-mueller.at',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+43 1 234567',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * Income tax return submission DTO
 */
export class FonIncomeTaxDto {
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

  @ApiProperty({
    description: 'Tax year',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear!: number;

  @ApiProperty({
    description: 'Personal information',
    type: PersonalInfoDto,
  })
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo!: PersonalInfoDto;

  @ApiProperty({
    description: 'Income details',
    type: IncomeDetailsDto,
  })
  @ValidateNested()
  @Type(() => IncomeDetailsDto)
  income!: IncomeDetailsDto;

  @ApiProperty({
    description: 'Deduction details',
    type: DeductionDetailsDto,
  })
  @ValidateNested()
  @Type(() => DeductionDetailsDto)
  deductions!: DeductionDetailsDto;

  @ApiPropertyOptional({
    description: 'Special expenses',
    type: [SpecialExpenseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialExpenseDto)
  @IsOptional()
  specialExpenses?: SpecialExpenseDto[];

  @ApiProperty({
    description: 'Declaration date',
    example: '2025-11-29',
  })
  @IsDate()
  @Type(() => Date)
  declarationDate!: Date;

  @ApiPropertyOptional({
    description: 'Tax advisor information',
    type: TaxAdvisorInfoDto,
  })
  @ValidateNested()
  @Type(() => TaxAdvisorInfoDto)
  @IsOptional()
  taxAdvisor?: TaxAdvisorInfoDto;

  @ApiPropertyOptional({
    description: 'Session ID for authenticated session',
    example: 'sess_1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

/**
 * Income tax response DTO
 */
export class IncomeTaxResponseDto {
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
    description: 'Assessment notice available',
    example: false,
  })
  assessmentAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Expected refund amount in cents',
    example: 150000,
  })
  expectedRefund?: number;

  @ApiPropertyOptional({
    description: 'Expected payment amount in cents',
    example: 0,
  })
  expectedPayment?: number;

  @ApiPropertyOptional({
    description: 'Error code if submission failed',
    example: 'INVALID_DATA',
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Error message if submission failed',
    example: 'Invalid social security number',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Warning messages',
    type: [String],
    example: ['Missing optional field: tax advisor information'],
  })
  warnings?: string[];
}
