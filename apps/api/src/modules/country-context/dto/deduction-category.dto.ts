import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Deduction Category DTO for API responses
 */
export class DeductionCategoryDto {
  @ApiProperty({
    description: 'Deduction category unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Country ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  countryId: string;

  @ApiProperty({
    description: 'Deduction category code',
    example: 'TRAVEL',
  })
  code: string;

  @ApiProperty({
    description: 'Deduction category name',
    example: 'Travel Expenses',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Deduction category description',
    example: 'Business travel expenses including flights, hotels, and meals',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Maximum deductible amount',
    example: 5000.00,
    nullable: true,
  })
  maxAmount: number | null;

  @ApiPropertyOptional({
    description: 'Legal basis reference',
    example: '§9 EStG',
    nullable: true,
  })
  legalBasis: string | null;

  @ApiProperty({
    description: 'Whether proof is required',
    example: true,
  })
  requiresProof: boolean;

  @ApiProperty({
    description: 'Whether category is active',
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
