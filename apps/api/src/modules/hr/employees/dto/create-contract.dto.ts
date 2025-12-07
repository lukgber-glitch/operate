import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  Length,
} from 'class-validator';
import { ContractType, SalaryPeriod } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for creating an employment contract
 */
export class CreateContractDto {
  @ApiProperty({
    description: 'Contract type',
    enum: ContractType,
    example: 'PERMANENT',
  })
  contractType: ContractType;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiPropertyOptional({
    description: 'Department',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  department?: string;

  @ApiProperty({
    description: 'Contract start date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Contract end date (ISO 8601) - null for permanent',
    example: '2025-01-14',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Probation period end date (ISO 8601)',
    example: '2024-07-14',
  })
  @IsOptional()
  @IsDateString()
  probationEnd?: string;

  @ApiProperty({
    description: 'Salary amount',
    example: 5000.0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salaryAmount: number;

  @ApiPropertyOptional({
    description: 'Salary currency',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  salaryCurrency?: string = 'EUR';

  @ApiProperty({
    description: 'Salary period',
    enum: SalaryPeriod,
    example: 'MONTHLY',
  })
  salaryPeriod: SalaryPeriod;

  @ApiProperty({
    description: 'Weekly working hours',
    example: 40.0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  weeklyHours: number;

  @ApiProperty({
    description: 'Working days of the week',
    example: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  workingDays: string[];

  @ApiPropertyOptional({
    description: 'Benefits (flexible JSON structure)',
    example: {
      healthInsurance: true,
      pensionPlan: true,
      gymMembership: false,
    },
  })
  @IsOptional()
  benefits?: any;
}
