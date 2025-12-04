import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { CountryDto } from './country.dto';

/**
 * DTO for adding country to organisation
 */
export class AddCountryToOrganisationDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsString()
  @IsNotEmpty()
  countryCode: string;
}

/**
 * Organisation Country DTO for API responses
 */
export class OrganisationCountryDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orgId: string;

  @ApiProperty({
    description: 'Country ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  countryId: string;

  @ApiProperty({
    description: 'Whether country is active for organisation',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Country details',
    type: CountryDto,
  })
  country: CountryDto;

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
