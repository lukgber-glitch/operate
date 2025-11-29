import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an employment contract
 * All fields are optional for partial updates
 */
export class UpdateContractDto {
  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Lead Software Engineer',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Department',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  department?: string;

  @ApiPropertyOptional({
    description: 'Contract end date (ISO 8601)',
    example: '2025-01-14',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Salary amount',
    example: 5500.0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salaryAmount?: number;

  @ApiPropertyOptional({
    description: 'Weekly working hours',
    example: 40.0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  weeklyHours?: number;

  @ApiPropertyOptional({
    description: 'Working days of the week',
    example: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @ApiPropertyOptional({
    description: 'Benefits (flexible JSON structure)',
    example: {
      healthInsurance: true,
      pensionPlan: true,
      gymMembership: true,
    },
  })
  @IsOptional()
  benefits?: any;
}
