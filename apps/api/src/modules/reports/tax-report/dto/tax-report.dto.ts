import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TaxReportCountry {
  GERMANY = 'DE',
  AUSTRIA = 'AT',
}

export enum TaxReportPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum VatRateType {
  STANDARD = 'STANDARD',
  REDUCED = 'REDUCED',
  ZERO = 'ZERO',
  EXEMPT = 'EXEMPT',
  REVERSE_CHARGE = 'REVERSE_CHARGE',
}

export enum DeductionCategory {
  BUSINESS_EXPENSES = 'BUSINESS_EXPENSES',
  DEPRECIATION = 'DEPRECIATION',
  HOME_OFFICE = 'HOME_OFFICE',
  TRAVEL = 'TRAVEL',
  ENTERTAINMENT = 'ENTERTAINMENT',
  PROFESSIONAL_DEVELOPMENT = 'PROFESSIONAL_DEVELOPMENT',
  INSURANCE = 'INSURANCE',
  RETIREMENT = 'RETIREMENT',
  VEHICLE = 'VEHICLE',
  UTILITIES = 'UTILITIES',
  RENT = 'RENT',
  INTEREST = 'INTEREST',
  OTHER = 'OTHER',
}

export enum TaxExportFormat {
  ELSTER_XML = 'ELSTER_XML',
  FINANZONLINE_XML = 'FINANZONLINE_XML',
  CSV = 'CSV',
  PDF = 'PDF',
}

export class GenerateTaxSummaryDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Tax year (YYYY)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear: number;

  @ApiPropertyOptional({ enum: TaxReportCountry, default: TaxReportCountry.GERMANY })
  @IsOptional()
  @IsEnum(TaxReportCountry)
  country?: TaxReportCountry;

  @ApiPropertyOptional({ description: 'Include detailed deductions breakdown' })
  @IsOptional()
  @IsBoolean()
  includeDeductions?: boolean;

  @ApiPropertyOptional({ description: 'Include VAT report' })
  @IsOptional()
  @IsBoolean()
  includeVat?: boolean;

  @ApiPropertyOptional({ description: 'Include audit trail' })
  @IsOptional()
  @IsBoolean()
  includeAuditTrail?: boolean;
}

export class GenerateVatReportDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: TaxReportCountry })
  @IsNotEmpty()
  @IsEnum(TaxReportCountry)
  country: TaxReportCountry;

  @ApiPropertyOptional({ enum: TaxReportPeriod, default: TaxReportPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(TaxReportPeriod)
  period?: TaxReportPeriod;

  @ApiPropertyOptional({ description: 'Include intra-EU transactions' })
  @IsOptional()
  @IsBoolean()
  includeIntraEu?: boolean;
}

export class GenerateIncomeTaxReportDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Tax year (YYYY)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear: number;

  @ApiProperty({ enum: TaxReportCountry })
  @IsNotEmpty()
  @IsEnum(TaxReportCountry)
  country: TaxReportCountry;

  @ApiPropertyOptional({ description: 'Include quarterly estimates' })
  @IsOptional()
  @IsBoolean()
  includeQuarterlyEstimates?: boolean;
}

export class TaxExportDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Tax year (YYYY)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  taxYear: number;

  @ApiProperty({ enum: TaxExportFormat })
  @IsNotEmpty()
  @IsEnum(TaxExportFormat)
  format: TaxExportFormat;

  @ApiPropertyOptional({ description: 'Tax office number (Germany)' })
  @IsOptional()
  @IsString()
  taxOfficeNumber?: string;

  @ApiPropertyOptional({ description: 'Tax identifier' })
  @IsOptional()
  @IsString()
  taxIdentifier?: string;
}

export class VatRateBreakdown {
  @ApiProperty({ enum: VatRateType })
  rateType: VatRateType;

  @ApiProperty({ description: 'VAT rate percentage' })
  rate: number;

  @ApiProperty({ description: 'Net amount' })
  netAmount: number;

  @ApiProperty({ description: 'VAT amount' })
  vatAmount: number;

  @ApiProperty({ description: 'Gross amount' })
  grossAmount: number;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number;
}

export class VatSummary {
  @ApiProperty({ description: 'Total VAT collected (output tax)' })
  totalVatCollected: number;

  @ApiProperty({ description: 'Total VAT paid (input tax)' })
  totalVatPaid: number;

  @ApiProperty({ description: 'Net VAT position (positive = owe, negative = refund)' })
  netVatPosition: number;

  @ApiProperty({ description: 'Reverse charge VAT' })
  reverseChargeVat: number;

  @ApiProperty({ description: 'Intra-EU VAT' })
  intraEuVat: number;

  @ApiProperty({ description: 'Import VAT' })
  importVat: number;

  @ApiProperty({ type: [VatRateBreakdown] })
  rateBreakdown: VatRateBreakdown[];
}

export class TaxBracket {
  @ApiProperty({ description: 'Bracket minimum income' })
  min: number;

  @ApiProperty({ description: 'Bracket maximum income (null for top bracket)' })
  max: number | null;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiProperty({ description: 'Income in this bracket' })
  incomeInBracket: number;

  @ApiProperty({ description: 'Tax on this bracket' })
  taxOnBracket: number;
}

export class DeductionItem {
  @ApiProperty({ enum: DeductionCategory })
  category: DeductionCategory;

  @ApiProperty({ description: 'Deduction description' })
  description: string;

  @ApiProperty({ description: 'Deduction amount' })
  amount: number;

  @ApiProperty({ description: 'Number of items/transactions' })
  itemCount: number;

  @ApiProperty({ description: 'Supporting document IDs' })
  documentIds: string[];
}

export class IncomeTaxSummary {
  @ApiProperty({ description: 'Gross revenue' })
  grossRevenue: number;

  @ApiProperty({ description: 'Total allowable deductions' })
  totalDeductions: number;

  @ApiProperty({ description: 'Taxable income' })
  taxableIncome: number;

  @ApiProperty({ description: 'Total tax liability' })
  taxLiability: number;

  @ApiProperty({ description: 'Tax credits applied' })
  taxCredits: number;

  @ApiProperty({ description: 'Prepayments made' })
  prepayments: number;

  @ApiProperty({ description: 'Net tax due (positive) or refund (negative)' })
  netTaxDue: number;

  @ApiProperty({ description: 'Effective tax rate percentage' })
  effectiveTaxRate: number;

  @ApiProperty({ type: [TaxBracket] })
  bracketBreakdown: TaxBracket[];

  @ApiProperty({ type: [DeductionItem] })
  deductions: DeductionItem[];
}

export class TradeTaxSummary {
  @ApiProperty({ description: 'Trade tax base (Gewerbeertrag)' })
  tradeTaxBase: number;

  @ApiProperty({ description: 'Municipal multiplier (Hebesatz)' })
  municipalMultiplier: number;

  @ApiProperty({ description: 'Trade tax liability' })
  tradeTaxLiability: number;

  @ApiProperty({ description: 'Trade tax credit on income tax' })
  tradeTaxCredit: number;
}

export class QuarterlyEstimate {
  @ApiProperty({ description: 'Quarter (1-4)' })
  quarter: number;

  @ApiProperty({ description: 'Due date' })
  dueDate: string;

  @ApiProperty({ description: 'Estimated tax payment' })
  estimatedPayment: number;

  @ApiProperty({ description: 'Payment status' })
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export class TaxDeadline {
  @ApiProperty({ description: 'Deadline description' })
  description: string;

  @ApiProperty({ description: 'Due date' })
  dueDate: string;

  @ApiProperty({ description: 'Tax type' })
  taxType: 'INCOME' | 'VAT' | 'TRADE' | 'OTHER';

  @ApiProperty({ description: 'Is overdue' })
  isOverdue: boolean;

  @ApiProperty({ description: 'Days until/past due' })
  daysUntilDue: number;
}

export class AuditTrailEntry {
  @ApiProperty({ description: 'Entry timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Field changed' })
  field: string;

  @ApiProperty({ description: 'Old value' })
  oldValue: any;

  @ApiProperty({ description: 'New value' })
  newValue: any;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;
}

export class TaxSummaryResponse {
  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Tax year' })
  taxYear: number;

  @ApiProperty({ enum: TaxReportCountry })
  country: TaxReportCountry;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: string;

  @ApiProperty({ type: IncomeTaxSummary })
  incomeTax: IncomeTaxSummary;

  @ApiProperty({ type: VatSummary })
  vat: VatSummary;

  @ApiProperty({ type: TradeTaxSummary, nullable: true })
  tradeTax: TradeTaxSummary | null;

  @ApiProperty({ type: [QuarterlyEstimate] })
  quarterlyEstimates: QuarterlyEstimate[];

  @ApiProperty({ type: [TaxDeadline] })
  upcomingDeadlines: TaxDeadline[];

  @ApiProperty({ type: [AuditTrailEntry], nullable: true })
  auditTrail?: AuditTrailEntry[];
}

export class VatReportResponse {
  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Period start date' })
  startDate: string;

  @ApiProperty({ description: 'Period end date' })
  endDate: string;

  @ApiProperty({ enum: TaxReportCountry })
  country: TaxReportCountry;

  @ApiProperty({ type: VatSummary })
  summary: VatSummary;

  @ApiProperty({ description: 'VAT return filing deadline' })
  filingDeadline: string;

  @ApiProperty({ description: 'Payment deadline' })
  paymentDeadline: string;
}

export class IncomeTaxReportResponse {
  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Tax year' })
  taxYear: number;

  @ApiProperty({ enum: TaxReportCountry })
  country: TaxReportCountry;

  @ApiProperty({ type: IncomeTaxSummary })
  summary: IncomeTaxSummary;

  @ApiProperty({ type: [QuarterlyEstimate], nullable: true })
  quarterlyEstimates?: QuarterlyEstimate[];
}

export class DeductionsAnalysisResponse {
  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Tax year' })
  taxYear: number;

  @ApiProperty({ type: [DeductionItem] })
  deductions: DeductionItem[];

  @ApiProperty({ description: 'Total deductions' })
  totalDeductions: number;

  @ApiProperty({ description: 'Potential additional deductions identified' })
  potentialDeductions: DeductionItem[];

  @ApiProperty({ description: 'Estimated tax savings from potential deductions' })
  estimatedSavings: number;
}

export class TaxExportResponse {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ enum: TaxExportFormat })
  format: TaxExportFormat;

  @ApiProperty({ description: 'File content (base64 for binary, plain text for XML/CSV)' })
  content: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'Export timestamp' })
  exportedAt: string;
}
