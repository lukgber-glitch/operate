import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

/**
 * Generate Filing Report DTO
 */
export class GenerateFilingReportDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  endDate: string;
}

/**
 * Generate Monthly Report DTO
 */
export class GenerateMonthlyReportDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 2024, minimum: 2000, maximum: 2100 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}

/**
 * Generate Quarterly Report DTO
 */
export class GenerateQuarterlyReportDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 2024, minimum: 2000, maximum: 2100 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 4, description: 'Quarter (1-4)' })
  @IsNumber()
  @Min(1)
  @Max(4)
  quarter: number;
}

/**
 * Generate Annual Report DTO
 */
export class GenerateAnnualReportDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 2024, minimum: 2000, maximum: 2100 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;
}

/**
 * Export for Avalara Filing DTO
 */
export class ExportForAvalaraFilingDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 2024, minimum: 2000, maximum: 2100 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}

/**
 * Get Upcoming Filing Deadlines DTO
 */
export class GetUpcomingFilingDeadlinesDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  daysAhead?: number;
}
