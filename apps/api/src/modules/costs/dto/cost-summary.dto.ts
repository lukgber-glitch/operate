import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostCategory } from '@prisma/client';

/**
 * Category breakdown in cost summary
 */
export class CategoryBreakdown {
  @ApiProperty({
    description: 'Cost category',
    enum: CostCategory,
  })
  category: CostCategory;

  @ApiProperty({
    description: 'Total amount for this category',
    example: 15.75,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of entries in this category',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 35.5,
  })
  percentage: number;
}

/**
 * Automation breakdown in cost summary
 */
export class AutomationBreakdown {
  @ApiPropertyOptional({
    description: 'Automation ID (null for manual entries)',
    example: 'auto-001',
  })
  automationId: string | null;

  @ApiProperty({
    description: 'Total amount for this automation',
    example: 8.25,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of entries for this automation',
    example: 28,
  })
  count: number;
}

/**
 * Response DTO for cost summary aggregation
 */
export class CostSummaryDto {
  @ApiProperty({
    description: 'Total cost amount across all entries',
    example: 125.50,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of cost entries',
    example: 350,
  })
  totalEntries: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Start date of the summary period',
    example: '2024-01-01T00:00:00Z',
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the summary period',
    example: '2024-12-31T23:59:59Z',
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Breakdown by category',
    type: [CategoryBreakdown],
  })
  byCategory: CategoryBreakdown[];

  @ApiProperty({
    description: 'Breakdown by automation',
    type: [AutomationBreakdown],
  })
  byAutomation: AutomationBreakdown[];

  @ApiProperty({
    description: 'Average cost per entry',
    example: 0.36,
  })
  averageCostPerEntry: number;
}
