import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TaxSuggestionType {
  MISSED_DEDUCTION = 'MISSED_DEDUCTION',
  QUARTERLY_ESTIMATE = 'QUARTERLY_ESTIMATE',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  EXPENSE_CATEGORIZATION = 'EXPENSE_CATEGORIZATION',
  MILEAGE_DEDUCTION = 'MILEAGE_DEDUCTION',
  HOME_OFFICE = 'HOME_OFFICE',
  EQUIPMENT_DEPRECIATION = 'EQUIPMENT_DEPRECIATION',
  RETIREMENT_CONTRIBUTION = 'RETIREMENT_CONTRIBUTION',
  HEALTH_INSURANCE = 'HEALTH_INSURANCE',
  TAX_OPTIMIZATION = 'TAX_OPTIMIZATION',
  COMPLIANCE_WARNING = 'COMPLIANCE_WARNING',
}

export enum SuggestionStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  ACTED = 'ACTED',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
}

export enum SuggestionPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class TaxSuggestionFiltersDto {
  @ApiPropertyOptional({ enum: SuggestionStatus })
  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;

  @ApiPropertyOptional({ enum: TaxSuggestionType })
  @IsOptional()
  @IsEnum(TaxSuggestionType)
  type?: TaxSuggestionType;

  @ApiPropertyOptional({ enum: SuggestionPriority })
  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;
}
