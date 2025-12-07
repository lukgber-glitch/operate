import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeDocumentType } from '../types/employee-document.types';

/**
 * DTO for uploading employee documents
 */
export class DocumentUploadDto {
  @ApiProperty({
    enum: EmployeeDocumentType,
    description: 'Type of document being uploaded',
  })
  documentType: EmployeeDocumentType;

  @ApiPropertyOptional({
    description: 'Document issue date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Document expiration date',
    example: '2029-01-15',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Document number (passport number, license number, etc.)',
    example: 'P12345678',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Issuing authority',
    example: 'US Department of State',
  })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

/**
 * DTO for document verification
 */
export class VerifyDocumentDto {
  @ApiPropertyOptional({
    description: 'Verification notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for document rejection
 */
export class RejectDocumentDto {
  @ApiProperty({
    description: 'Reason for rejection',
  })
  @IsString()
  reason: string;
}

/**
 * DTO for document query filters
 */
export class DocumentQueryDto {
  @ApiPropertyOptional({
    enum: EmployeeDocumentType,
    description: 'Filter by document type',
  })
  @IsOptional()
  documentType?: EmployeeDocumentType;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
