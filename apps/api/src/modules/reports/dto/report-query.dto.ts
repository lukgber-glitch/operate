import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

/**
 * DTO for querying reports with date filters
 */
export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for report period (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for report period (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Currency code for financial reports',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  currency?: string;
}
