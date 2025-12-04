/**
 * Report Generator Interfaces
 * Core type definitions for the reporting system
 */

export enum ReportType {
  PL_STATEMENT = 'PL_STATEMENT',
  CASH_FLOW = 'CASH_FLOW',
  TAX_SUMMARY = 'TAX_SUMMARY',
  VAT_REPORT = 'VAT_REPORT',
  BALANCE_SHEET = 'BALANCE_SHEET',
  EXPENSE_REPORT = 'EXPENSE_REPORT',
  REVENUE_REPORT = 'REVENUE_REPORT',
  AR_AGING = 'AR_AGING',
  AP_AGING = 'AP_AGING',
}

export enum DateRangeType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum ComparisonPeriodType {
  NONE = 'NONE',
  YOY = 'YOY', // Year over Year
  MOM = 'MOM', // Month over Month
  QOQ = 'QOQ', // Quarter over Quarter
  CUSTOM = 'CUSTOM',
}

export enum TrendIndicator {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT',
}

export enum ReportStatus {
  GENERATING = 'GENERATING',
  READY = 'READY',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface ReportMetadata {
  generatedAt: Date;
  generatedBy: string;
  organisationId: string;
  reportType: ReportType;
  version: number;
  correlationId: string;
  generationTimeMs: number;
  cached: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  type: DateRangeType;
  label?: string;
}

export interface ComparisonPeriod {
  type: ComparisonPeriodType;
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source: string;
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  data: Record<string, any>;
  subtotal?: number;
  percentage?: number;
}

export interface ReportLine {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  currency: string;
  percentage?: number;
  trend?: TrendIndicator;
  comparison?: {
    value: number;
    variance: number;
    variancePercent: number;
  };
  drillDownAvailable: boolean;
  metadata?: Record<string, any>;
}

export interface ReportSummary {
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  profitMargin?: number;
  cashFlow?: number;
  taxLiability?: number;
  customMetrics?: Record<string, number>;
}

export interface AgingBucket {
  label: string;
  daysRange: string;
  amount: number;
  count: number;
  percentage: number;
  items?: AgingItem[];
}

export interface AgingItem {
  id: string;
  reference: string;
  name: string;
  dueDate: Date;
  amount: number;
  currency: string;
  daysOverdue: number;
}

export interface CalculatedField {
  name: string;
  formula: string;
  value: number;
  dependencies: string[];
}

export interface ReportAnnotation {
  id: string;
  reportId: string;
  userId: string;
  sectionId?: string;
  lineId?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  configuration: Record<string, any>;
  customFields: CalculatedField[];
  isPublic: boolean;
  createdBy: string;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CacheStrategy {
  enabled: boolean;
  ttlSeconds: number;
  key: string;
  tags: string[];
}

export interface ReportOptions {
  currency?: string;
  comparison?: ComparisonPeriod;
  groupBy?: string[];
  filters?: Record<string, any>;
  includeDetails?: boolean;
  cache?: CacheStrategy;
  customFields?: CalculatedField[];
  templateId?: string;
}

export interface ReportData {
  metadata: ReportMetadata;
  summary: ReportSummary;
  sections: ReportSection[];
  annotations?: ReportAnnotation[];
  template?: ReportTemplate;
}

export interface VarianceAnalysis {
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
  trend: TrendIndicator;
  significant: boolean;
}

export interface DrillDownParams {
  reportId: string;
  sectionId: string;
  lineId?: string;
  filters?: Record<string, any>;
}

export interface DataAggregation {
  groupBy: string[];
  metrics: AggregationMetric[];
  filters?: Record<string, any>;
  having?: Record<string, any>;
}

export interface AggregationMetric {
  field: string;
  operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  alias?: string;
}

export interface ReportHistory {
  id: string;
  reportType: ReportType;
  dateRange: DateRange;
  generatedAt: Date;
  status: ReportStatus;
  fileSize?: number;
  downloadUrl?: string;
}

export interface ScheduledReport {
  id: string;
  organisationId: string;
  reportType: ReportType;
  schedule: string; // cron expression
  recipients: string[];
  options: ReportOptions;
  lastRunAt?: Date;
  nextRunAt: Date;
  enabled: boolean;
}

export interface PerformanceMetrics {
  queryTimeMs: number;
  processingTimeMs: number;
  totalTimeMs: number;
  recordsProcessed: number;
  cacheHit: boolean;
  memoryUsedMb?: number;
}

export interface ProfitAndLossData extends ReportData {
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
  sections: {
    revenue: ReportSection;
    cogs: ReportSection;
    operatingExpenses: ReportSection;
    otherIncomeExpenses: ReportSection;
  };
}

export interface CashFlowData extends ReportData {
  summary: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningBalance: number;
    endingBalance: number;
  };
  sections: {
    operating: ReportSection;
    investing: ReportSection;
    financing: ReportSection;
  };
}

export interface TaxSummaryData extends ReportData {
  summary: {
    totalTaxLiability: number;
    totalDeductions: number;
    totalCredits: number;
    netTaxDue: number;
    effectiveTaxRate: number;
  };
  sections: {
    liabilities: ReportSection;
    deductions: ReportSection;
    credits: ReportSection;
  };
}

export interface VatReportData extends ReportData {
  summary: {
    vatCollected: number;
    vatPaid: number;
    netVatPosition: number;
    vatRate: number;
  };
  sections: {
    sales: ReportSection;
    purchases: ReportSection;
  };
}

export interface BalanceSheetData extends ReportData {
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentRatio: number;
    debtToEquityRatio: number;
  };
  sections: {
    currentAssets: ReportSection;
    fixedAssets: ReportSection;
    currentLiabilities: ReportSection;
    longTermLiabilities: ReportSection;
    equity: ReportSection;
  };
}

export interface AgingReportData extends ReportData {
  summary: {
    total: number;
    current: number;
    overdue: number;
    averageDaysOutstanding: number;
  };
  buckets: AgingBucket[];
}
