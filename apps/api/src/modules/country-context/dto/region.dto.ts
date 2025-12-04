import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Region DTO for API responses
 */
export class RegionDto {
  @ApiProperty({
    description: 'Region unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Country ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  countryId: string;

  @ApiProperty({
    description: 'Region code',
    example: 'BY',
  })
  code: string;

  @ApiProperty({
    description: 'Region name in English',
    example: 'Bavaria',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Region name in native language',
    example: 'Bayern',
    nullable: true,
  })
  nameNative: string | null;

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
