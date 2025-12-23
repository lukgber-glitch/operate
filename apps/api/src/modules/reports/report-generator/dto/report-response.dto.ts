/**
 * Response DTOs for Report Generation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReportType,
  ReportStatus,
  TrendIndicator,
  DateRangeType,
  ComparisonPeriodType,
} from '../interfaces/report.interfaces';

export class ReportMetadataResponseDto {
  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  generatedBy: string;

  @ApiProperty()
  organisationId: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty()
  version: number;

  @ApiProperty()
  correlationId: string;

  @ApiProperty()
  generationTimeMs: number;

  @ApiProperty()
  cached: boolean;
}

export class ReportSummaryResponseDto {
  @ApiPropertyOptional()
  totalRevenue?: number;

  @ApiPropertyOptional()
  totalExpenses?: number;

  @ApiPropertyOptional()
  netIncome?: number;

  @ApiPropertyOptional()
  profitMargin?: number;

  @ApiPropertyOptional()
  cashFlow?: number;

  @ApiPropertyOptional()
  taxLiability?: number;

  @ApiPropertyOptional({ type: Object })
  customMetrics?: Record<string, number>;
}

export class ComparisonDataDto {
  @ApiProperty()
  value: number;

  @ApiProperty()
  variance: number;

  @ApiProperty()
  variancePercent: number;
}

export class ReportLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  formattedValue: string;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  percentage?: number;

  @ApiPropertyOptional({ enum: TrendIndicator })
  trend?: TrendIndicator;

  @ApiPropertyOptional({ type: ComparisonDataDto })
  comparison?: ComparisonDataDto;

  @ApiProperty()
  drillDownAvailable: boolean;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, any>;
}

export class ReportSectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [ReportLineResponseDto] })
  lines: ReportLineResponseDto[];

  @ApiProperty({ type: Object })
  data: Record<string, any>;

  @ApiPropertyOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  percentage?: number;
}

export class ReportAnnotationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reportId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  sectionId?: string;

  @ApiPropertyOptional()
  lineId?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CalculatedFieldResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  formula: string;

  @ApiProperty()
  value: number;

  @ApiProperty({ type: [String] })
  dependencies: string[];
}

export class ReportTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty({ type: Object })
  configuration: Record<string, any>;

  @ApiProperty({ type: [CalculatedFieldResponseDto] })
  customFields: CalculatedFieldResponseDto[];

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  organisationId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReportDataResponseDto {
  @ApiProperty({ type: ReportMetadataResponseDto })
  metadata: ReportMetadataResponseDto;

  @ApiProperty({ type: ReportSummaryResponseDto })
  summary: ReportSummaryResponseDto;

  @ApiProperty({ type: [ReportSectionResponseDto] })
  sections: ReportSectionResponseDto[];

  @ApiPropertyOptional({ type: [ReportAnnotationResponseDto] })
  annotations?: ReportAnnotationResponseDto[];

  @ApiPropertyOptional({ type: ReportTemplateResponseDto })
  template?: ReportTemplateResponseDto;
}

export class AgingItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  daysOverdue: number;
}

export class AgingBucketResponseDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  daysRange: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;

  @ApiPropertyOptional({ type: [AgingItemResponseDto] })
  items?: AgingItemResponseDto[];
}

export class ProfitAndLossSummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  costOfGoodsSold: number;

  @ApiProperty()
  grossProfit: number;

  @ApiProperty()
  grossProfitMargin: number;

  @ApiProperty()
  operatingExpenses: number;

  @ApiProperty()
  operatingIncome: number;

  @ApiProperty()
  operatingMargin: number;

  @ApiProperty()
  otherIncome: number;

  @ApiProperty()
  otherExpenses: number;

  @ApiProperty()
  netIncome: number;

  @ApiProperty()
  netProfitMargin: number;
}

export class ProfitAndLossResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: ProfitAndLossSummaryDto })
  summary: ProfitAndLossSummaryDto;
}

export class CashFlowSummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  operatingCashFlow: number;

  @ApiProperty()
  investingCashFlow: number;

  @ApiProperty()
  financingCashFlow: number;

  @ApiProperty()
  netCashFlow: number;

  @ApiProperty()
  beginningBalance: number;

  @ApiProperty()
  endingBalance: number;
}

export class CashFlowResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: CashFlowSummaryDto })
  summary: CashFlowSummaryDto;
}

export class TaxSummarySummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  totalTaxLiability: number;

  @ApiProperty()
  totalDeductions: number;

  @ApiProperty()
  totalCredits: number;

  @ApiProperty()
  netTaxDue: number;

  @ApiProperty()
  effectiveTaxRate: number;
}

export class TaxSummaryResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: TaxSummarySummaryDto })
  summary: TaxSummarySummaryDto;
}

export class VatReportSummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  vatCollected: number;

  @ApiProperty()
  vatPaid: number;

  @ApiProperty()
  netVatPosition: number;

  @ApiProperty()
  vatRate: number;
}

export class VatReportResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: VatReportSummaryDto })
  summary: VatReportSummaryDto;
}

export class BalanceSheetSummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  totalAssets: number;

  @ApiProperty()
  totalLiabilities: number;

  @ApiProperty()
  totalEquity: number;

  @ApiProperty()
  currentRatio: number;

  @ApiProperty()
  debtToEquityRatio: number;
}

export class BalanceSheetResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: BalanceSheetSummaryDto })
  summary: BalanceSheetSummaryDto;
}

export class AgingReportSummaryDto extends ReportSummaryResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  current: number;

  @ApiProperty()
  overdue: number;

  @ApiProperty()
  averageDaysOutstanding: number;
}

export class AgingReportResponseDto extends ReportDataResponseDto {
  @ApiProperty({ type: AgingReportSummaryDto })
  summary: AgingReportSummaryDto;

  @ApiProperty({ type: [AgingBucketResponseDto] })
  buckets: AgingBucketResponseDto[];
}

export class DateRangeDto {
  @ApiProperty({ enum: DateRangeType })
  type: DateRangeType;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiPropertyOptional()
  label?: string;
}

export class ReportHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty({ type: DateRangeDto })
  dateRange: DateRangeDto;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  downloadUrl?: string;
}

export class ScheduledReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organisationId: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty()
  schedule: string;

  @ApiProperty({ type: [String] })
  recipients: string[];

  @ApiProperty({ type: Object })
  options: Record<string, any>;

  @ApiPropertyOptional()
  lastRunAt?: Date;

  @ApiProperty()
  nextRunAt: Date;

  @ApiProperty()
  enabled: boolean;
}

export class VarianceAnalysisResponseDto {
  @ApiProperty()
  current: number;

  @ApiProperty()
  previous: number;

  @ApiProperty()
  variance: number;

  @ApiProperty()
  variancePercent: number;

  @ApiProperty({ enum: TrendIndicator })
  trend: TrendIndicator;

  @ApiProperty()
  significant: boolean;
}

export class CompareReportsResponseDto {
  @ApiProperty()
  reportA: ReportDataResponseDto;

  @ApiProperty()
  reportB: ReportDataResponseDto;

  @ApiProperty({ type: [VarianceAnalysisResponseDto] })
  variances: VarianceAnalysisResponseDto[];

  @ApiProperty({ type: Object })
  summary: Record<string, any>;
}

export class PerformanceMetricsResponseDto {
  @ApiProperty()
  queryTimeMs: number;

  @ApiProperty()
  processingTimeMs: number;

  @ApiProperty()
  totalTimeMs: number;

  @ApiProperty()
  recordsProcessed: number;

  @ApiProperty()
  cacheHit: boolean;

  @ApiPropertyOptional()
  memoryUsedMb?: number;
}
