/**
 * Search Query DTOs
 */

import { IsString, IsOptional, IsArray, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchableEntityType } from '../interfaces/search-result.interface';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'invoice 2024',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Entity types to search (comma-separated or array)',
    example: 'invoice,expense',
    enum: SearchableEntityType,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim());
    }
    return value;
  })
  @IsArray()
  @IsEnum(SearchableEntityType, { each: true })
  types?: SearchableEntityType[];

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
