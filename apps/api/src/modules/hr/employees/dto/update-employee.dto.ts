import { ApiPropertyOptional } from '@nestjs/swagger';
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
 * DTO for updating an employee
 * All fields are optional for partial updates
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    description: 'Employee first name',
    example: 'Max',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Employee last name',
    example: 'Mustermann',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Employee email address',
    example: 'max.mustermann@company.de',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+49 30 12345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

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

  @ApiPropertyOptional({
    description: 'Employment status',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional({
    description: 'Termination date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;
}
