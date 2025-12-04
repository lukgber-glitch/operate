import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * VAT Validation Result DTO
 */
export class VatValidationResultDto {
  @ApiProperty({
    description: 'Whether the VAT number is valid',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  countryCode: string;

  @ApiProperty({
    description: 'VAT number (without country code)',
    example: '123456789',
  })
  vatNumber: string;

  @ApiProperty({
    description: 'Date when the validation was performed',
    example: '2025-11-29T12:00:00Z',
  })
  requestDate: string;

  @ApiPropertyOptional({
    description: 'Company name (if available from VIES)',
    example: 'Example GmbH',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Company address (if available from VIES)',
    example: 'Hauptstraße 1, 10115 Berlin, Germany',
  })
  address?: string;

  @ApiProperty({
    description: 'Whether this result was retrieved from cache',
    example: false,
  })
  cached: boolean;

  @ApiPropertyOptional({
    description: 'Cache expiry date (if cached)',
    example: '2025-11-30T12:00:00Z',
  })
  cacheExpiry?: string;

  @ApiPropertyOptional({
    description: 'Error code if validation failed',
    example: null,
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Error message if validation failed',
    example: null,
  })
  errorMessage?: string;
}

/**
 * Bulk VAT Validation Result DTO
 */
export class BulkVatValidationResultDto {
  @ApiProperty({
    description: 'Array of validation results',
    type: [VatValidationResultDto],
  })
  results: VatValidationResultDto[];

  @ApiProperty({
    description: 'Total number of validations requested',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Number of valid VAT numbers',
    example: 2,
  })
  valid: number;

  @ApiProperty({
    description: 'Number of invalid VAT numbers',
    example: 1,
  })
  invalid: number;

  @ApiProperty({
    description: 'Number of errors encountered',
    example: 0,
  })
  errors: number;
}

/**
 * Cross-border transaction rules
 */
export class CrossBorderRulesDto {
  @ApiProperty({
    description: 'Whether this is a cross-border transaction',
    example: true,
  })
  isCrossBorder: boolean;

  @ApiProperty({
    description: 'Supplier country code',
    example: 'DE',
  })
  supplierCountry: string;

  @ApiProperty({
    description: 'Customer country code',
    example: 'FR',
  })
  customerCountry: string;

  @ApiProperty({
    description: 'Whether reverse charge mechanism applies',
    example: true,
  })
  reverseChargeApplicable: boolean;

  @ApiProperty({
    description: 'VAT treatment description',
    example: 'B2B intra-community supply - reverse charge',
  })
  vatTreatment: string;

  @ApiPropertyOptional({
    description: 'Additional notes or requirements',
    example:
      'Supplier must include "Reverse charge - Article 196 of Directive 2006/112/EC" on invoice',
  })
  notes?: string;
}
