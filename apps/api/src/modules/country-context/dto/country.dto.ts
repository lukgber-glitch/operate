import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VatRateDto } from './vat-rate.dto';
import { CountryFeatureDto } from './country-feature.dto';

/**
 * Country DTO for API responses
 */
export class CountryDto {
  @ApiProperty({
    description: 'Country unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  code: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-3 country code',
    example: 'DEU',
  })
  code3: string;

  @ApiProperty({
    description: 'Country name in English',
    example: 'Germany',
  })
  name: string;

  @ApiProperty({
    description: 'Country name in native language',
    example: 'Deutschland',
  })
  nameNative: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Currency symbol',
    example: '€',
  })
  currencySymbol: string;

  @ApiProperty({
    description: 'Default locale',
    example: 'de-DE',
  })
  locale: string;

  @ApiProperty({
    description: 'Default timezone',
    example: 'Europe/Berlin',
  })
  timezone: string;

  @ApiProperty({
    description: 'Fiscal year start date (MM-DD format)',
    example: '01-01',
  })
  fiscalYearStart: string;

  @ApiProperty({
    description: 'Whether country is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Current VAT rates',
    type: [VatRateDto],
  })
  currentVatRates?: VatRateDto[];

  @ApiPropertyOptional({
    description: 'Country features',
    type: [CountryFeatureDto],
  })
  features?: CountryFeatureDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * Paginated country list response
 */
export class CountryListDto {
  @ApiProperty({
    description: 'List of countries',
    type: [CountryDto],
  })
  data: CountryDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { total: 3, page: 1, pageSize: 20 },
  })
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}
