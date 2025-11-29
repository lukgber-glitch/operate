import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  ValidateIf,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * VAT Number Validation Request DTO
 */
export class ValidateVatDto {
  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code (e.g., DE, FR, NL)',
    example: 'DE',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country code must be 2 uppercase letters',
  })
  @Transform(({ value }) => value?.toUpperCase())
  countryCode?: string;

  @ApiProperty({
    description:
      'VAT number (can include country code or be numeric only)',
    example: 'DE123456789',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.replace(/[\s\-\.]/g, '').toUpperCase())
  vatNumber: string;
}

/**
 * Bulk VAT Validation Request DTO
 */
export class BulkValidateVatDto {
  @ApiProperty({
    description: 'Array of VAT numbers to validate',
    example: ['DE123456789', 'FR12345678901', 'NL123456789B01'],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => v?.replace(/[\s\-\.]/g, '').toUpperCase())
      : value,
  )
  vatNumbers: string[];
}

/**
 * Query parameters for GET endpoint
 */
export class ValidateVatQueryDto {
  @ApiPropertyOptional({
    description: 'Force fresh validation (skip cache)',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  skipCache?: boolean;
}
