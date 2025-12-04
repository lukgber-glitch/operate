import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, EmploymentStatus } from '@prisma/client';

/**
 * DTO for employee response
 * Sensitive data (IBAN, taxId) should be masked unless authorized
 */
export class EmployeeResponseDto {
  @ApiProperty({
    description: 'Employee unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId: string;

  @ApiPropertyOptional({
    description: 'Linked user account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string | null;

  @ApiProperty({
    description: 'Internal employee number',
    example: 'EMP-001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: 'First name',
    example: 'Max',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Mustermann',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'max.mustermann@company.de',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+49 30 12345678',
  })
  phone?: string | null;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-05-15T00:00:00Z',
  })
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
  })
  gender?: Gender | null;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'DE',
  })
  nationality?: string | null;

  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Hauptstraße 123',
  })
  street?: string | null;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Berlin',
  })
  city?: string | null;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10115',
  })
  postalCode?: string | null;

  @ApiProperty({
    description: 'Work country code',
    example: 'DE',
  })
  countryCode: string;

  @ApiPropertyOptional({
    description: 'Tax ID (masked unless authorized)',
    example: '***********',
  })
  taxId?: string | null;

  @ApiPropertyOptional({
    description: 'Tax class',
    example: '1',
  })
  taxClass?: string | null;

  @ApiProperty({
    description: 'Church tax liability',
    example: false,
  })
  churchTax: boolean;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Deutsche Bank',
  })
  bankName?: string | null;

  @ApiPropertyOptional({
    description: 'IBAN (masked unless authorized)',
    example: 'DE89***************000',
  })
  iban?: string | null;

  @ApiPropertyOptional({
    description: 'BIC',
    example: 'DEUTDEFF',
  })
  bic?: string | null;

  @ApiProperty({
    description: 'Employment status',
    enum: EmploymentStatus,
  })
  status: EmploymentStatus;

  @ApiProperty({
    description: 'Hire date',
    example: '2024-01-15T00:00:00Z',
  })
  hireDate: Date;

  @ApiPropertyOptional({
    description: 'Termination date',
    example: '2024-12-31T00:00:00Z',
  })
  terminationDate?: Date | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
