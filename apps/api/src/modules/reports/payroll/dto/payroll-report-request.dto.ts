import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollReportType, ReportFormat, ReportDeliveryMethod } from '../types/payroll-report.types';

/**
 * Base Payroll Report Request DTO
 */
export class PayrollReportRequestDto {
  @ApiProperty({
    description: 'Company UUID for the report',
    example: '7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab',
  })
  @IsString()
  companyUuid: string;

  @ApiProperty({
    description: 'Start date for the report period (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for the report period (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Filter by specific employee UUIDs',
    type: [String],
    example: ['emp-uuid-1', 'emp-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeUuids?: string[];

  @ApiPropertyOptional({
    description: 'Filter by department IDs',
    type: [String],
    example: ['dept-1', 'dept-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by location IDs',
    type: [String],
    example: ['loc-1', 'loc-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by specific payroll UUIDs',
    type: [String],
    example: ['payroll-uuid-1', 'payroll-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payrollUuids?: string[];

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
    default: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Report delivery method',
    enum: ReportDeliveryMethod,
    example: ReportDeliveryMethod.DOWNLOAD,
    default: ReportDeliveryMethod.DOWNLOAD,
  })
  @IsOptional()
  @IsEnum(ReportDeliveryMethod)
  deliveryMethod?: ReportDeliveryMethod;

  @ApiPropertyOptional({
    description: 'Email addresses to send report to (if delivery method is EMAIL)',
    type: [String],
    example: ['user@example.com'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailRecipients?: string[];
}

/**
 * Payroll Summary Report Request
 */
export class PayrollSummaryRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Group results by period',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  groupByPeriod?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDetailedBreakdown?: boolean;
}

/**
 * Employee Earnings Report Request
 */
export class EmployeeEarningsRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Include YTD totals',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeYTD?: boolean;

  @ApiPropertyOptional({
    description: 'Group by department',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  groupByDepartment?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'grossPay',
    default: 'employeeName',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Tax Liability Report Request
 */
export class TaxLiabilityRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Include federal taxes',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeFederal?: boolean;

  @ApiPropertyOptional({
    description: 'Include state taxes',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeState?: boolean;

  @ApiPropertyOptional({
    description: 'Include local taxes',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeLocal?: boolean;

  @ApiPropertyOptional({
    description: 'Group by tax type',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  groupByTaxType?: boolean;
}

/**
 * 401(k) Contribution Report Request
 */
export class FourOhOneKRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Include vesting information',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeVesting?: boolean;

  @ApiPropertyOptional({
    description: 'Include YTD totals',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeYTD?: boolean;

  @ApiPropertyOptional({
    description: 'Show only active participants',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  activeParticipantsOnly?: boolean;
}

/**
 * Benefits Deduction Report Request
 */
export class BenefitsDeductionRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Filter by benefit type',
    type: [String],
    example: ['health_insurance', 'retirement'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefitTypes?: string[];

  @ApiPropertyOptional({
    description: 'Include YTD totals',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeYTD?: boolean;

  @ApiPropertyOptional({
    description: 'Group by benefit type',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  groupByBenefitType?: boolean;
}

/**
 * YTD Report Request
 */
export class YTDReportRequestDto extends PayrollReportRequestDto {
  @ApiPropertyOptional({
    description: 'Include detailed earnings breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeEarningsBreakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed tax breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTaxBreakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed deductions breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeDeductionsBreakdown?: boolean;
}

/**
 * Quarterly Tax Report Request (Form 941)
 */
export class QuarterlyTaxRequestDto {
  @ApiProperty({
    description: 'Company UUID',
    example: '7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab',
  })
  @IsString()
  companyUuid: string;

  @ApiProperty({
    description: 'Quarter number (1-4)',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(4)
  quarter: number;

  @ApiProperty({
    description: 'Year',
    example: 2024,
    minimum: 2020,
    maximum: 2100,
  })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
    default: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Include monthly liability schedule',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeMonthlySchedule?: boolean;
}

/**
 * Annual W-2 Summary Report Request
 */
export class AnnualW2SummaryRequestDto {
  @ApiProperty({
    description: 'Company UUID',
    example: '7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab',
  })
  @IsString()
  companyUuid: string;

  @ApiProperty({
    description: 'Tax year',
    example: 2024,
    minimum: 2020,
    maximum: 2100,
  })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({
    description: 'Filter by employee UUIDs',
    type: [String],
    example: ['emp-uuid-1', 'emp-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeUuids?: string[];

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
    default: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Include confidential information (SSN)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeConfidential?: boolean;

  @ApiPropertyOptional({
    description: 'Include state and local info',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeStateLocal?: boolean;
}

/**
 * Report Schedule DTO
 */
export class CreateReportScheduleDto {
  @ApiProperty({
    description: 'Report type to schedule',
    enum: PayrollReportType,
    example: PayrollReportType.PAYROLL_SUMMARY,
  })
  @IsEnum(PayrollReportType)
  reportType: PayrollReportType;

  @ApiProperty({
    description: 'Company UUID',
    example: '7b5b3f0e-4c8d-4f7e-8c3d-1234567890ab',
  })
  @IsString()
  companyUuid: string;

  @ApiProperty({
    description: 'Schedule frequency',
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'],
    example: 'monthly',
  })
  @IsString()
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

  @ApiPropertyOptional({
    description: 'Day of week for weekly schedules (0=Sunday, 6=Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly schedules (1-31)',
    example: 1,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Month of year for annual schedules (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  monthOfYear?: number;

  @ApiProperty({
    description: 'Email recipients',
    type: [String],
    example: ['user@example.com', 'admin@example.com'],
  })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Additional filters',
    example: { departmentIds: ['dept-1'] },
  })
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Enable schedule',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
