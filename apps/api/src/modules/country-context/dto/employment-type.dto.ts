import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Employment Type DTO for API responses
 */
export class EmploymentTypeDto {
  @ApiProperty({
    description: 'Employment type unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Country ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  countryId: string;

  @ApiProperty({
    description: 'Employment type code',
    example: 'FULL_TIME',
  })
  code: string;

  @ApiProperty({
    description: 'Employment type name',
    example: 'Full-time Employee',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Employment type description',
    example: 'Standard full-time employment contract',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether type is active',
    example: true,
  })
  isActive: boolean;

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
