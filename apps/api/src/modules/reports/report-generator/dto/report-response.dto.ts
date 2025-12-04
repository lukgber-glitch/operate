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
  data: ReportLineResponseDto[];

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

export class ProfitAndLossResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      totalRevenue: { type: 'number' },
      costOfGoodsSold: { type: 'number' },
      grossProfit: { type: 'number' },
      grossProfitMargin: { type: 'number' },
      operatingExpenses: { type: 'number' },
      operatingIncome: { type: 'number' },
      operatingMargin: { type: 'number' },
      otherIncome: { type: 'number' },
      otherExpenses: { type: 'number' },
      netIncome: { type: 'number' },
      netProfitMargin: { type: 'number' },
    },
  })
  summary: {
    totalRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    operatingIncome: number;
    operatingMargin: number;
    otherIncome: number;
    otherExpenses: number;
    netIncome: number;
    netProfitMargin: number;
  };
}

export class CashFlowResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      operatingCashFlow: { type: 'number' },
      investingCashFlow: { type: 'number' },
      financingCashFlow: { type: 'number' },
      netCashFlow: { type: 'number' },
      beginningBalance: { type: 'number' },
      endingBalance: { type: 'number' },
    },
  })
  summary: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningBalance: number;
    endingBalance: number;
  };
}

export class TaxSummaryResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      totalTaxLiability: { type: 'number' },
      totalDeductions: { type: 'number' },
      totalCredits: { type: 'number' },
      netTaxDue: { type: 'number' },
      effectiveTaxRate: { type: 'number' },
    },
  })
  summary: {
    totalTaxLiability: number;
    totalDeductions: number;
    totalCredits: number;
    netTaxDue: number;
    effectiveTaxRate: number;
  };
}

export class VatReportResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      vatCollected: { type: 'number' },
      vatPaid: { type: 'number' },
      netVatPosition: { type: 'number' },
      vatRate: { type: 'number' },
    },
  })
  summary: {
    vatCollected: number;
    vatPaid: number;
    netVatPosition: number;
    vatRate: number;
  };
}

export class BalanceSheetResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      totalAssets: { type: 'number' },
      totalLiabilities: { type: 'number' },
      totalEquity: { type: 'number' },
      currentRatio: { type: 'number' },
      debtToEquityRatio: { type: 'number' },
    },
  })
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentRatio: number;
    debtToEquityRatio: number;
  };
}

export class AgingReportResponseDto extends ReportDataResponseDto {
  @ApiProperty({
    type: Object,
    properties: {
      total: { type: 'number' },
      current: { type: 'number' },
      overdue: { type: 'number' },
      averageDaysOutstanding: { type: 'number' },
    },
  })
  summary: {
    total: number;
    current: number;
    overdue: number;
    averageDaysOutstanding: number;
  };

  @ApiProperty({ type: [AgingBucketResponseDto] })
  buckets: AgingBucketResponseDto[];
}

export class ReportHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty({
    type: Object,
    properties: {
      type: { enum: DateRangeType },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      label: { type: 'string' },
    },
  })
  dateRange: {
    type: DateRangeType;
    startDate: Date;
    endDate: Date;
    label?: string;
  };

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
