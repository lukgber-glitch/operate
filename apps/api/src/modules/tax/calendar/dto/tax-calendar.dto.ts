import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxDeadlineType, TaxDeadlineStatus } from '../types';

/**
 * DTO for querying tax deadlines by year
 */
export class GetDeadlinesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

/**
 * DTO for getting upcoming deadlines
 */
export class GetUpcomingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

/**
 * DTO for filtering deadlines
 */
export class FilterDeadlinesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsEnum(['vat_return', 'income_tax', 'prepayment', 'annual_return', 'custom'])
  type?: TaxDeadlineType;

  @IsOptional()
  @IsEnum(['upcoming', 'due_soon', 'overdue', 'completed'])
  status?: TaxDeadlineStatus;

  @IsOptional()
  @IsString()
  country?: string;
}

/**
 * Response DTO for deadline summary
 */
export class DeadlineSummaryDto {
  total: number;
  upcoming: number;
  dueSoon: number;
  overdue: number;
  completed: number;
  nextDeadline?: {
    id: string;
    title: string;
    dueDate: Date;
    daysUntil: number;
  };
}
