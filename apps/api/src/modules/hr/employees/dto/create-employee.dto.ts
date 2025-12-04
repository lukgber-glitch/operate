import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { Gender, EmploymentStatus } from '@prisma/client';

/**
 * DTO for creating a new employee
 */
export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Internal employee number/ID',
    example: 'EMP-001',
  })
  @IsString()
  @Length(1, 50)
  employeeNumber: string;

  @ApiProperty({
    description: 'Employee first name',
    example: 'Max',
  })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Mustermann',
  })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'max.mustermann@company.de',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+49 30 12345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1990-05-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Nationality (ISO country code)',
    example: 'DE',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Hauptstraße 123',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Berlin',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10115',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Work country code (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  countryCode: string;

  @ApiPropertyOptional({
    description: 'Tax ID (Steuer-ID, etc.)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Tax class (German Steuerklasse)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  taxClass?: string;

  @ApiPropertyOptional({
    description: 'Church tax liability',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  churchTax?: boolean;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Deutsche Bank',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)
  iban?: string;

  @ApiPropertyOptional({
    description: 'BIC/SWIFT code',
    example: 'DEUTDEFF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
  bic?: string;

  @ApiProperty({
    description: 'Employment status',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
  })
  @IsEnum(EmploymentStatus)
  status: EmploymentStatus;

  @ApiProperty({
    description: 'Hire date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  hireDate: string;

  @ApiPropertyOptional({
    description: 'Termination date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @ApiPropertyOptional({
    description: 'Link to existing user account (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
