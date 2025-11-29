import { ApiProperty } from '@nestjs/swagger';
import { DeductionSuggestionDto } from './deduction-suggestion.dto';

/**
 * Deduction category summary DTO
 */
export class DeductionCategorySummaryDto {
  @ApiProperty()
  categoryCode!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  legalReference!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty()
  totalOriginalAmount!: number;

  @ApiProperty()
  totalDeductibleAmount!: number;

  @ApiProperty({ type: [DeductionSuggestionDto] })
  suggestions!: DeductionSuggestionDto[];
}

/**
 * Annual deduction summary DTO
 */
export class DeductionSummaryDto {
  @ApiProperty()
  year!: number;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  totalOriginalAmount!: number;

  @ApiProperty()
  totalDeductibleAmount!: number;

  @ApiProperty()
  suggestedCount!: number;

  @ApiProperty()
  confirmedCount!: number;

  @ApiProperty()
  rejectedCount!: number;

  @ApiProperty({ type: [DeductionCategorySummaryDto] })
  categories!: DeductionCategorySummaryDto[];
}

/**
 * Deduction list response DTO
 */
export class DeductionListResponseDto {
  @ApiProperty({ type: [DeductionSuggestionDto] })
  data!: DeductionSuggestionDto[];

  @ApiProperty()
  meta!: {
    total: number;
    page: number;
    pageSize: number;
  };
}
