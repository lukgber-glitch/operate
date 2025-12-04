import {
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDecimal,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FilingStatus } from '../types/employee-document.types';

/**
 * DTO for creating/submitting W-4 form
 */
export class CreateW4FormDto {
  @ApiProperty({
    description: 'Tax year for this W-4',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2050)
  taxYear: number;

  @ApiProperty({
    description: 'Employee first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Employee middle initial',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  middleInitial?: string;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Social Security Number (will be encrypted)',
    example: '123-45-6789',
  })
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{4}$/, {
    message: 'SSN must be in format XXX-XX-XXXX',
  })
  ssn: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main St, Apt 4B',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State (2-letter code)',
    example: 'NY',
  })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiProperty({
    description: 'ZIP code',
    example: '10001',
  })
  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/, {
    message: 'ZIP code must be in format XXXXX or XXXXX-XXXX',
  })
  zipCode: string;

  @ApiProperty({
    enum: FilingStatus,
    description: 'Tax filing status',
  })
  @IsEnum(FilingStatus)
  filingStatus: FilingStatus;

  @ApiProperty({
    description: 'Check if multiple jobs or spouse works',
    example: false,
  })
  @IsBoolean()
  multipleJobsOrSpouseWorks: boolean;

  @ApiProperty({
    description: 'Number of qualifying children under 17',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  numberOfDependentsUnder17: number;

  @ApiProperty({
    description: 'Number of other dependents',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  numberOfOtherDependents: number;

  @ApiPropertyOptional({
    description: 'Other income not from jobs (Step 4a)',
    example: 5000.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  otherIncome?: number = 0;

  @ApiPropertyOptional({
    description: 'Deductions (Step 4b)',
    example: 2000.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  deductions?: number = 0;

  @ApiPropertyOptional({
    description: 'Extra withholding per pay period (Step 4c)',
    example: 50.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  extraWithholding?: number = 0;

  @ApiPropertyOptional({
    description: 'Effective date for this W-4',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

/**
 * DTO for updating W-4 form (before signature)
 */
export class UpdateW4FormDto {
  @ApiPropertyOptional({
    enum: FilingStatus,
    description: 'Tax filing status',
  })
  @IsOptional()
  @IsEnum(FilingStatus)
  filingStatus?: FilingStatus;

  @ApiPropertyOptional({
    description: 'Check if multiple jobs or spouse works',
  })
  @IsOptional()
  @IsBoolean()
  multipleJobsOrSpouseWorks?: boolean;

  @ApiPropertyOptional({
    description: 'Number of qualifying children under 17',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  numberOfDependentsUnder17?: number;

  @ApiPropertyOptional({
    description: 'Number of other dependents',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  numberOfOtherDependents?: number;

  @ApiPropertyOptional({
    description: 'Other income not from jobs (Step 4a)',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  otherIncome?: number;

  @ApiPropertyOptional({
    description: 'Deductions (Step 4b)',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  deductions?: number;

  @ApiPropertyOptional({
    description: 'Extra withholding per pay period (Step 4c)',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  extraWithholding?: number;
}

/**
 * DTO for signing W-4 form
 */
export class SignW4FormDto {
  @ApiProperty({
    description: 'Employee confirmation of accuracy',
    example: true,
  })
  @IsBoolean()
  confirmAccuracy: boolean;
}

/**
 * Response DTO for W-4 form with calculated withholding
 */
export class W4FormResponseDto {
  id: string;
  employeeId: string;
  taxYear: number;
  filingStatus: FilingStatus;
  numberOfDependentsUnder17: number;
  numberOfOtherDependents: number;
  dependentsUnder17Amount: number;
  otherDependentsAmount: number;
  totalClaimDependentsAmount: number;
  otherIncome: number;
  deductions: number;
  extraWithholding: number;
  calculatedWithholding?: number;
  isActive: boolean;
  effectiveDate: Date;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
