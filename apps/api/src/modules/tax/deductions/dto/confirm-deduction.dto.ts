import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * Confirm deduction suggestion DTO
 */
export class ConfirmDeductionDto {
  @ApiPropertyOptional({
    description: 'Modified deductible amount (if user wants to change it)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductibleAmount?: number;

  @ApiPropertyOptional({
    description: 'Notes or comments for the confirmation',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Reject deduction suggestion DTO
 */
export class RejectDeductionDto {
  @ApiProperty({
    description: 'Reason for rejecting the suggestion',
    example: 'Not actually business-related',
  })
  @IsString()
  reason!: string;
}

/**
 * Modify deduction suggestion DTO
 */
export class ModifyDeductionDto {
  @ApiPropertyOptional({
    description: 'Modified deductible amount',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductibleAmount?: number;

  @ApiPropertyOptional({
    description: 'Modified category code',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  @ApiPropertyOptional({
    description: 'Modification notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
