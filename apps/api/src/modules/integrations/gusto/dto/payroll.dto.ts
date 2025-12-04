import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Create Payroll ====================

export class EmployeeCompensationDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiPropertyOptional({ description: 'Fixed compensations', type: [Object] })
  @IsOptional()
  @IsArray()
  fixed_compensations?: Array<{
    name: string;
    amount: string;
    job_uuid: string;
  }>;

  @ApiPropertyOptional({ description: 'Hourly compensations', type: [Object] })
  @IsOptional()
  @IsArray()
  hourly_compensations?: Array<{
    name: string;
    hours: string;
    job_uuid: string;
    compensation_multiplier?: number;
  }>;

  @ApiPropertyOptional({ description: 'Paid time off hours', type: [Object] })
  @IsOptional()
  @IsArray()
  paid_time_off?: Array<{
    name: string;
    hours: string;
  }>;
}

export class CreatePayrollDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsString()
  company_uuid: string;

  @ApiPropertyOptional({ description: 'Pay period start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Pay period end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Check date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  check_date?: string;

  @ApiPropertyOptional({ description: 'Is this an off-cycle payroll?' })
  @IsOptional()
  @IsBoolean()
  off_cycle?: boolean;

  @ApiPropertyOptional({ description: 'Reason for off-cycle payroll' })
  @IsOptional()
  @IsString()
  off_cycle_reason?: string;

  @ApiPropertyOptional({ description: 'Employee compensations', type: [EmployeeCompensationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeCompensationDto)
  employee_compensations?: EmployeeCompensationDto[];
}

export class CreatePayrollResponseDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  company_uuid: string;

  @ApiProperty()
  check_date: string;

  @ApiProperty()
  payroll_deadline: string;

  @ApiProperty()
  processed: boolean;

  @ApiPropertyOptional()
  off_cycle?: boolean;
}

// ==================== Update Payroll ====================

export class UpdatePayrollDto {
  @ApiProperty({ description: 'Payroll version for optimistic locking' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ description: 'Employee compensations', type: [EmployeeCompensationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeCompensationDto)
  employee_compensations?: EmployeeCompensationDto[];
}

// ==================== Calculate Payroll ====================

export class CalculatePayrollDto {
  @ApiProperty({ description: 'Payroll version for optimistic locking' })
  @IsString()
  version: string;
}

export class CalculatePayrollResponseDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  calculated_at: string;

  @ApiProperty({ type: Object })
  payroll_totals: {
    gross_pay_total: string;
    net_pay_total: string;
    employee_taxes_total: string;
    employer_taxes_total: string;
    employee_benefits_deductions_total?: string;
    employer_benefits_total?: string;
  };
}

// ==================== Submit Payroll ====================

export class SubmitPayrollDto {
  @ApiProperty({ description: 'Payroll version for optimistic locking' })
  @IsString()
  version: string;
}

export class SubmitPayrollResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  payroll_uuid: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  check_date: string;

  @ApiPropertyOptional()
  processed_date?: string;

  @ApiProperty()
  message: string;
}

// ==================== Cancel Payroll ====================

export class CancelPayrollDto {
  @ApiProperty({ description: 'Payroll version for optimistic locking' })
  @IsString()
  version: string;
}

// ==================== List Payrolls ====================

export class ListPayrollsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by processed status' })
  @IsOptional()
  @IsBoolean()
  processed?: boolean;

  @ApiPropertyOptional({ description: 'Include off-cycle payrolls' })
  @IsOptional()
  @IsBoolean()
  include_off_cycle?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  per_page?: number;
}

// ==================== Pay Period ====================

export class GetPayPeriodQueryDto {
  @ApiPropertyOptional({ description: 'Date to get pay period for (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class PayPeriodResponseDto {
  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;

  @ApiProperty()
  payroll_deadline: string;

  @ApiProperty()
  check_date: string;
}

// ==================== Payroll Summary ====================

export class PayrollSummaryDto {
  @ApiProperty()
  payroll_uuid: string;

  @ApiProperty()
  company_uuid: string;

  @ApiProperty()
  check_date: string;

  @ApiProperty()
  pay_period_start: string;

  @ApiProperty()
  pay_period_end: string;

  @ApiProperty()
  processed: boolean;

  @ApiPropertyOptional()
  processed_date?: string;

  @ApiProperty()
  employee_count: number;

  @ApiProperty()
  gross_pay_total: string;

  @ApiProperty()
  net_pay_total: string;

  @ApiProperty()
  employer_taxes_total: string;

  @ApiProperty()
  employee_taxes_total: string;

  @ApiPropertyOptional()
  off_cycle?: boolean;
}

// ==================== Generate Pay Stub ====================

export class GeneratePayStubDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiProperty({ description: 'Payroll UUID' })
  @IsString()
  payroll_uuid: string;
}

export class PayStubResponseDto {
  @ApiProperty()
  employee_uuid: string;

  @ApiProperty()
  payroll_uuid: string;

  @ApiProperty()
  check_date: string;

  @ApiProperty()
  gross_pay: string;

  @ApiProperty()
  net_pay: string;

  @ApiProperty({ type: [Object] })
  wages: Array<{
    name: string;
    hours?: string;
    amount: string;
    rate?: string;
  }>;

  @ApiProperty({ type: [Object] })
  employee_taxes: Array<{
    name: string;
    amount: string;
  }>;

  @ApiProperty({ type: [Object] })
  employee_deductions: Array<{
    name: string;
    amount: string;
  }>;

  @ApiPropertyOptional()
  pdf_url?: string;
}

// ==================== YTD Totals ====================

export class GetYTDTotalsQueryDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiPropertyOptional({ description: 'Year (defaults to current year)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;
}

export class YTDTotalsResponseDto {
  @ApiProperty()
  employee_uuid: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  gross_pay: string;

  @ApiProperty()
  net_pay: string;

  @ApiProperty()
  federal_income_tax: string;

  @ApiProperty()
  state_income_tax: string;

  @ApiProperty()
  social_security_tax: string;

  @ApiProperty()
  medicare_tax: string;

  @ApiPropertyOptional()
  retirement_contributions?: string;

  @ApiPropertyOptional()
  benefits_deductions?: string;
}

// ==================== Payroll Processing Result ====================

export class PayrollProcessingResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  payroll_uuid: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  check_date: string;

  @ApiPropertyOptional()
  processed_date?: string;

  @ApiProperty()
  total_net_pay: string;

  @ApiProperty()
  total_gross_pay: string;

  @ApiProperty()
  employee_count: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];
}
