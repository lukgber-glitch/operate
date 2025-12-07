import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CostCategory } from '@prisma/client';

/**
 * Query parameters for filtering cost entries
 */
export class CostQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by cost category',
    enum: CostCategory,
  })
  @IsOptional()
  category?: CostCategory;

  @ApiPropertyOptional({
    description: 'Filter by automation ID',
    example: 'auto-001',
  })
  @IsOptional()
  @IsString()
  automationId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
