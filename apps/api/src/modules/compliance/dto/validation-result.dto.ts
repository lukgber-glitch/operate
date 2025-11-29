import { ApiProperty } from '@nestjs/swagger';

/**
 * Validation Error DTO
 */
export class ValidationErrorDto {
  @ApiProperty({
    description: 'Error code',
    example: 'MISSING_REQUIRED_FIELD',
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Invoice number is required',
  })
  message: string;

  @ApiProperty({
    description: 'Field path',
    example: 'transactions[5].invoiceNumber',
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: 'Error severity',
    enum: ['error', 'critical'],
    example: 'error',
  })
  severity: 'error' | 'critical';
}

/**
 * Validation Warning DTO
 */
export class ValidationWarningDto {
  @ApiProperty({
    description: 'Warning code',
    example: 'RECOMMENDED_FIELD_MISSING',
  })
  code: string;

  @ApiProperty({
    description: 'Warning message',
    example: 'Tax number is recommended but not required',
  })
  message: string;

  @ApiProperty({
    description: 'Field path',
    example: 'company.taxNumber',
    required: false,
  })
  path?: string;
}

/**
 * Validation Result DTO
 * Response for export validation operations
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether the export is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'List of validation errors',
    type: [ValidationErrorDto],
  })
  errors: ValidationErrorDto[];

  @ApiProperty({
    description: 'List of validation warnings',
    type: [ValidationWarningDto],
  })
  warnings: ValidationWarningDto[];

  @ApiProperty({
    description: 'Validation timestamp',
    example: '2024-04-01T10:00:00Z',
  })
  validatedAt: Date;

  @ApiProperty({
    description: 'Schema version used for validation',
    example: '1.0.0',
  })
  schemaVersion: string;

  @ApiProperty({
    description: 'Total number of records validated',
    example: 1250,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Number of records with errors',
    example: 3,
  })
  recordsWithErrors: number;

  @ApiProperty({
    description: 'Number of records with warnings',
    example: 15,
  })
  recordsWithWarnings: number;
}
