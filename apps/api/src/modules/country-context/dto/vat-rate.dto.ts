import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * VAT Rate DTO for API responses
 */
export class VatRateDto {
  @ApiProperty({
    description: 'VAT rate unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Country ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  countryId: string;

  @ApiProperty({
    description: 'VAT rate name',
    example: 'Standard',
    enum: ['Standard', 'Reduced', 'Super-Reduced', 'Zero'],
  })
  name: string;

  @ApiProperty({
    description: 'VAT rate percentage',
    example: 19.00,
  })
  rate: number;

  @ApiProperty({
    description: 'Valid from date',
    example: '2020-01-01T00:00:00Z',
  })
  validFrom: Date;

  @ApiPropertyOptional({
    description: 'Valid to date',
    example: null,
    nullable: true,
  })
  validTo: Date | null;

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
 * Query parameters for VAT rates
 */
export class VatRateQueryDto {
  @ApiPropertyOptional({
    description: 'Get VAT rates valid on specific date (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
