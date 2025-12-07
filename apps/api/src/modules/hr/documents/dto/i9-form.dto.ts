import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsEmail,
  ValidateIf,
  Matches,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { I9DocumentListType } from '../types/employee-document.types';

/**
 * DTO for I-9 Section 1 (Employee Information and Attestation)
 * Completed by the employee on or before the first day of employment
 */
export class CreateI9Section1Dto {
  @ApiProperty({
    description: 'Employee last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

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

  @ApiPropertyOptional({
    description: 'Other last names used (if any)',
    example: 'Smith',
  })
  @IsOptional()
  @IsString()
  otherLastNames?: string;

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
  @Matches(/^\d{5}(-\d{4})?$/)
  zipCode: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-05-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Social Security Number (optional at hire, required within 90 days)',
    example: '123-45-6789',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{4}$/)
  ssn?: string;

  @ApiPropertyOptional({
    description: 'Employee email',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee phone',
    example: '555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Citizen of the United States',
    example: true,
  })
  @IsBoolean()
  citizenOfUS: boolean;

  @ApiProperty({
    description: 'Noncitizen national of the United States',
    example: false,
  })
  @IsBoolean()
  nonCitizenNational: boolean;

  @ApiProperty({
    description: 'Lawful permanent resident',
    example: false,
  })
  @IsBoolean()
  lawfulPermanentResident: boolean;

  @ApiProperty({
    description: 'Alien authorized to work',
    example: false,
  })
  @IsBoolean()
  alienAuthorizedToWork: boolean;

  @ApiPropertyOptional({
    description: 'USCIS Number (A-Number or USCIS Number)',
    example: 'A123456789',
  })
  @ValidateIf((o) => !o.citizenOfUS)
  @IsOptional()
  @IsString()
  uscisNumber?: string;

  @ApiPropertyOptional({
    description: 'I-94 Admission Number',
    example: '12345678901',
  })
  @ValidateIf((o) => o.alienAuthorizedToWork)
  @IsOptional()
  @IsString()
  i94AdmissionNumber?: string;

  @ApiPropertyOptional({
    description: 'Foreign passport number',
    example: 'P12345678',
  })
  @ValidateIf((o) => o.alienAuthorizedToWork)
  @IsOptional()
  @IsString()
  foreignPassportNumber?: string;

  @ApiPropertyOptional({
    description: 'Country of issuance',
    example: 'Canada',
  })
  @ValidateIf((o) => o.alienAuthorizedToWork)
  @IsOptional()
  @IsString()
  countryOfIssuance?: string;

  @ApiPropertyOptional({
    description: 'Work authorization expiry date',
    example: '2025-12-31',
  })
  @ValidateIf((o) => o.alienAuthorizedToWork)
  @IsOptional()
  @IsDateString()
  workAuthorizationExpiry?: string;
}

/**
 * DTO for I-9 Section 2 (Employer Review and Verification)
 * Completed by the employer within 3 business days of employee's first day
 */
export class CreateI9Section2Dto {
  @ApiProperty({
    description: 'First day of employment',
    example: '2024-01-15',
  })
  @IsDateString()
  firstDayOfEmployment: string;

  @ApiProperty({
    description: 'Document from List A (Identity and Employment Authorization)',
    enum: I9DocumentListType,
  })
  @IsOptional()
  documentListA?: I9DocumentListType;

  @ApiPropertyOptional({
    description: 'List A document title',
    example: 'US Passport',
  })
  @ValidateIf((o) => o.documentListA)
  @IsString()
  documentListATitle?: string;

  @ApiPropertyOptional({
    description: 'List A issuing authority',
    example: 'US Department of State',
  })
  @ValidateIf((o) => o.documentListA)
  @IsString()
  documentListAIssuer?: string;

  @ApiPropertyOptional({
    description: 'List A document number',
    example: 'P123456789',
  })
  @ValidateIf((o) => o.documentListA)
  @IsString()
  documentListANumber?: string;

  @ApiPropertyOptional({
    description: 'List A document expiry date',
    example: '2029-01-15',
  })
  @ValidateIf((o) => o.documentListA)
  @IsOptional()
  @IsDateString()
  documentListAExpiry?: string;

  @ApiPropertyOptional({
    description: 'Document from List B (Identity only)',
    enum: I9DocumentListType,
  })
  @IsOptional()
  documentListB?: I9DocumentListType;

  @ApiPropertyOptional({
    description: 'List B document title',
    example: 'State Drivers License',
  })
  @ValidateIf((o) => o.documentListB)
  @IsString()
  documentListBTitle?: string;

  @ApiPropertyOptional({
    description: 'List B issuing authority',
    example: 'New York DMV',
  })
  @ValidateIf((o) => o.documentListB)
  @IsString()
  documentListBIssuer?: string;

  @ApiPropertyOptional({
    description: 'List B document number',
    example: 'DL123456789',
  })
  @ValidateIf((o) => o.documentListB)
  @IsString()
  documentListBNumber?: string;

  @ApiPropertyOptional({
    description: 'List B document expiry date',
    example: '2028-05-15',
  })
  @ValidateIf((o) => o.documentListB)
  @IsOptional()
  @IsDateString()
  documentListBExpiry?: string;

  @ApiPropertyOptional({
    description: 'Document from List C (Employment Authorization only)',
    enum: I9DocumentListType,
  })
  @IsOptional()
  documentListC?: I9DocumentListType;

  @ApiPropertyOptional({
    description: 'List C document title',
    example: 'Social Security Card',
  })
  @ValidateIf((o) => o.documentListC)
  @IsString()
  documentListCTitle?: string;

  @ApiPropertyOptional({
    description: 'List C issuing authority',
    example: 'Social Security Administration',
  })
  @ValidateIf((o) => o.documentListC)
  @IsString()
  documentListCIssuer?: string;

  @ApiPropertyOptional({
    description: 'List C document number',
    example: '123-45-6789',
  })
  @ValidateIf((o) => o.documentListC)
  @IsString()
  documentListCNumber?: string;

  @ApiPropertyOptional({
    description: 'List C document expiry date',
    example: 'N/A',
  })
  @ValidateIf((o) => o.documentListC)
  @IsOptional()
  @IsDateString()
  documentListCExpiry?: string;

  @ApiProperty({
    description: 'Employer/Company name',
    example: 'Acme Corporation',
  })
  @IsString()
  employerName: string;

  @ApiProperty({
    description: 'Employer address',
    example: '456 Business Blvd',
  })
  @IsString()
  employerAddress: string;

  @ApiProperty({
    description: 'Employer city',
    example: 'New York',
  })
  @IsString()
  employerCity: string;

  @ApiProperty({
    description: 'Employer state',
    example: 'NY',
  })
  @IsString()
  @Length(2, 2)
  employerState: string;

  @ApiProperty({
    description: 'Employer ZIP code',
    example: '10002',
  })
  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/)
  employerZipCode: string;

  @ApiProperty({
    description: 'Employer representative name',
    example: 'Jane Smith',
  })
  @IsString()
  employerRepName: string;

  @ApiProperty({
    description: 'Employer representative title',
    example: 'HR Manager',
  })
  @IsString()
  employerRepTitle: string;
}

/**
 * DTO for I-9 Section 3 (Reverification and Rehires)
 */
export class CreateI9Section3Dto {
  @ApiProperty({
    description: 'Reason for reverification',
    example: 'Work authorization expired',
  })
  @IsString()
  reverificationReason: string;

  @ApiProperty({
    description: 'Date of reverification',
    example: '2025-01-15',
  })
  @IsDateString()
  reverificationDate: string;

  @ApiProperty({
    description: 'Reverification document title',
    example: 'Employment Authorization Document',
  })
  @IsString()
  reverificationDocument: string;

  @ApiProperty({
    description: 'Reverification document number',
    example: 'EAD123456789',
  })
  @IsString()
  reverificationDocumentNumber: string;

  @ApiPropertyOptional({
    description: 'Reverification document expiry',
    example: '2027-01-15',
  })
  @IsOptional()
  @IsDateString()
  reverificationDocumentExpiry?: string;
}

/**
 * Response DTO for I-9 form
 */
export class I9FormResponseDto {
  id: string;
  employeeId: string;
  section1CompletedAt?: Date;
  section2CompletedAt?: Date;
  section3CompletedAt?: Date;
  citizenshipStatus: string;
  workAuthorizationExpiry?: Date;
  requiresReverification: boolean;
  eVerifyStatus?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
