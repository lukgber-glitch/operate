import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum PayStubFormat {
  JSON = 'json',
  PDF = 'pdf',
}

// ==================== Get Pay Stub ====================

export class GetPayStubDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiProperty({ description: 'Payroll UUID' })
  @IsString()
  payroll_uuid: string;

  @ApiPropertyOptional({
    description: 'Response format',
    enum: PayStubFormat,
    default: 'JSON',
  })
  @IsOptional()
  format?: PayStubFormat;
}

// ==================== Pay Stub Response ====================

export class WageLineDto {
  @ApiProperty({ description: 'Wage type name' })
  name: string;

  @ApiPropertyOptional({ description: 'Hours worked' })
  hours?: string;

  @ApiProperty({ description: 'Wage amount' })
  amount: string;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  rate?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  job_title?: string;
}

export class TaxLineDto {
  @ApiProperty({ description: 'Tax type name' })
  name: string;

  @ApiProperty({ description: 'Tax amount' })
  amount: string;

  @ApiPropertyOptional({ description: 'Whether this is employer tax' })
  employer?: boolean;
}

export class DeductionLineDto {
  @ApiProperty({ description: 'Deduction name' })
  name: string;

  @ApiProperty({ description: 'Deduction amount' })
  amount: string;

  @ApiPropertyOptional({ description: 'Whether this is pretax' })
  pretax?: boolean;
}

export class ContributionLineDto {
  @ApiProperty({ description: 'Contribution name' })
  name: string;

  @ApiProperty({ description: 'Contribution amount' })
  amount: string;
}

export class ReimbursementLineDto {
  @ApiProperty({ description: 'Reimbursement description' })
  name: string;

  @ApiProperty({ description: 'Reimbursement amount' })
  amount: string;
}

export class BenefitLineDto {
  @ApiProperty({ description: 'Benefit name' })
  name: string;

  @ApiPropertyOptional({ description: 'Employee deduction amount' })
  employee_deduction?: string;

  @ApiPropertyOptional({ description: 'Employer contribution amount' })
  employer_contribution?: string;
}

export class PayPeriodDto {
  @ApiProperty({ description: 'Pay period start date (YYYY-MM-DD)' })
  start_date: string;

  @ApiProperty({ description: 'Pay period end date (YYYY-MM-DD)' })
  end_date: string;

  @ApiPropertyOptional({ description: 'Payroll deadline (YYYY-MM-DD)' })
  payroll_deadline?: string;

  @ApiPropertyOptional({ description: 'Check date (YYYY-MM-DD)' })
  check_date?: string;
}

export class PayStubDetailsDto {
  @ApiProperty({ description: 'Employee UUID' })
  employee_uuid: string;

  @ApiProperty({ description: 'Payroll UUID' })
  payroll_uuid: string;

  @ApiProperty({ description: 'Company UUID' })
  company_uuid: string;

  @ApiProperty({ description: 'Pay period', type: PayPeriodDto })
  pay_period: PayPeriodDto;

  @ApiProperty({ description: 'Check date (YYYY-MM-DD)' })
  check_date: string;

  @ApiProperty({ description: 'Gross pay amount' })
  gross_pay: string;

  @ApiProperty({ description: 'Net pay amount' })
  net_pay: string;

  @ApiProperty({ description: 'Wage lines', type: [WageLineDto] })
  wages: WageLineDto[];

  @ApiProperty({ description: 'Employee tax lines', type: [TaxLineDto] })
  employee_taxes: TaxLineDto[];

  @ApiProperty({ description: 'Employer tax lines', type: [TaxLineDto] })
  employer_taxes: TaxLineDto[];

  @ApiProperty({ description: 'Employee deduction lines', type: [DeductionLineDto] })
  employee_deductions: DeductionLineDto[];

  @ApiProperty({ description: 'Employer contribution lines', type: [ContributionLineDto] })
  employer_contributions: ContributionLineDto[];

  @ApiPropertyOptional({ description: 'Reimbursement lines', type: [ReimbursementLineDto] })
  reimbursements?: ReimbursementLineDto[];

  @ApiPropertyOptional({ description: 'Employee benefit lines', type: [BenefitLineDto] })
  employee_benefits?: BenefitLineDto[];

  @ApiPropertyOptional({ description: 'PDF download URL' })
  pdf_url?: string;
}

// ==================== List Pay Stubs ====================

export class ListPayStubsQueryDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Year (e.g., 2024)' })
  @IsOptional()
  @IsString()
  year?: string;
}

export class PayStubSummaryDto {
  @ApiProperty({ description: 'Payroll UUID' })
  payroll_uuid: string;

  @ApiProperty({ description: 'Check date (YYYY-MM-DD)' })
  check_date: string;

  @ApiProperty({ description: 'Pay period start (YYYY-MM-DD)' })
  pay_period_start: string;

  @ApiProperty({ description: 'Pay period end (YYYY-MM-DD)' })
  pay_period_end: string;

  @ApiProperty({ description: 'Gross pay amount' })
  gross_pay: string;

  @ApiProperty({ description: 'Net pay amount' })
  net_pay: string;

  @ApiPropertyOptional({ description: 'PDF download URL' })
  pdf_url?: string;
}

export class ListPayStubsResponseDto {
  @ApiProperty({ description: 'Employee UUID' })
  employee_uuid: string;

  @ApiProperty({ description: 'Pay stubs', type: [PayStubSummaryDto] })
  pay_stubs: PayStubSummaryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

// ==================== Generate PDF ====================

export class GeneratePayStubPDFDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiProperty({ description: 'Payroll UUID' })
  @IsString()
  payroll_uuid: string;
}

export class PayStubPDFResponseDto {
  @ApiProperty({ description: 'PDF download URL' })
  pdf_url: string;

  @ApiProperty({ description: 'PDF expires at (ISO 8601)' })
  expires_at: string;

  @ApiProperty({ description: 'File size in bytes' })
  file_size?: number;
}

// ==================== Email Pay Stub ====================

export class EmailPayStubDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsString()
  employee_uuid: string;

  @ApiProperty({ description: 'Payroll UUID' })
  @IsString()
  payroll_uuid: string;

  @ApiPropertyOptional({ description: 'Custom recipient email (defaults to employee email)' })
  @IsOptional()
  @IsString()
  recipient_email?: string;
}

export class EmailPayStubResponseDto {
  @ApiProperty({ description: 'Whether email was sent successfully' })
  success: boolean;

  @ApiProperty({ description: 'Email sent to address' })
  sent_to: string;

  @ApiProperty({ description: 'Status message' })
  message: string;
}
