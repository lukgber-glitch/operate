import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostCategory } from '@prisma/client';

/**
 * Response DTO for cost entry
 */
export class CostEntryResponseDto {
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
    description: 'Cost category',
    enum: CostCategory,
    example: CostCategory.AI_CLASSIFICATION,
  })
  category: CostCategory;

  @ApiProperty({
    description: 'Cost amount',
    example: 0.0025,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Description of the cost',
    example: 'AI classification of invoice #INV-2024-001',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Automation ID',
    example: 'auto-001',
  })
  automationId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { model: 'gpt-4', tokens: 1500 },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-29T10:30:00Z',
  })
  createdAt: Date;
}
