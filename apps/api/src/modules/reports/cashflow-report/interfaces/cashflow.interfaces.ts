/**
 * Cash Flow Statement Interfaces
 * Complete type definitions for IFRS/GAAP compliant cash flow reporting
 */

import { CashFlowMethod, CashFlowCategory, ProjectionMethod } from '../dto/cashflow.dto';

/**
 * Main Cash Flow Statement structure
 */
export interface CashFlowStatement {
  id: string;
  organisationId: string;
  period: ReportingPeriod;
  method: CashFlowMethod;
  currency: string;
  generatedAt: Date;

  // Main sections
  operatingActivities: OperatingActivities;
  investingActivities: InvestingActivities;
  financingActivities: FinancingActivities;

  // Summary
  summary: CashFlowSummary;

  // Optional comparative data
  comparison?: CashFlowComparison;

  // Metadata
  metadata: StatementMetadata;
}

/**
 * Reporting period
 */
export interface ReportingPeriod {
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "Q1 2024", "FY 2024"
  daysInPeriod: number;
}

/**
 * Operating Activities (Indirect Method - Primary)
 */
export interface OperatingActivities {
  // Starting point
  netIncome: number;

  // Non-cash adjustments
  adjustments: OperatingAdjustments;

  // Working capital changes
  workingCapitalChanges: WorkingCapitalChanges;

  // Total
  netCashFromOperatingActivities: number;

  // Direct method alternative (if requested)
  directMethod?: DirectMethodOperating;
}

/**
 * Operating adjustments (indirect method)
 */
export interface OperatingAdjustments {
  depreciation: number;
  amortization: number;
  stockBasedCompensation?: number;
  gainLossOnAssetDisposal: number;
  impairmentCharges: number;
  deferredTaxes: number;
  unrealizedGainsLosses: number;
  otherNonCashItems: number;
  totalAdjustments: number;
}

/**
 * Working capital changes
 */
export interface WorkingCapitalChanges {
  // Assets (increases = use of cash, decreases = source of cash)
  accountsReceivableChange: number;
  inventoryChange: number;
  prepaidExpensesChange: number;
  otherCurrentAssetsChange: number;

  // Liabilities (increases = source of cash, decreases = use of cash)
  accountsPayableChange: number;
  accruedExpensesChange: number;
  deferredRevenueChange: number;
  otherCurrentLiabilitiesChange: number;

  totalWorkingCapitalChange: number;
}

/**
 * Direct Method Operating Activities (alternative presentation)
 */
export interface DirectMethodOperating {
  cashReceipts: {
    fromCustomers: number;
    fromInterest: number;
    fromDividends: number;
    other: number;
    total: number;
  };

  cashPayments: {
    toSuppliers: number;
    toEmployees: number;
    forInterest: number;
    forTaxes: number;
    other: number;
    total: number;
  };

  netCashFromOperatingActivities: number;
}

/**
 * Investing Activities
 */
export interface InvestingActivities {
  // Property, Plant & Equipment
  purchaseOfPPE: number; // Negative (outflow)
  proceedsFromSaleOfPPE: number; // Positive (inflow)

  // Intangible assets
  purchaseOfIntangibles: number; // Negative
  proceedsFromSaleOfIntangibles: number; // Positive

  // Investments
  purchaseOfInvestments: number; // Negative
  proceedsFromSaleOfInvestments: number; // Positive
  proceedsFromMaturityOfInvestments: number; // Positive

  // Business combinations
  acquisitionOfBusinesses: number; // Negative (net of cash acquired)
  proceedsFromDisposalOfBusinesses: number; // Positive

  // Loans and advances
  loansToOthers: number; // Negative
  collectionOfLoans: number; // Positive

  // Other
  otherInvestingActivities: number;

  netCashFromInvestingActivities: number;
}

/**
 * Financing Activities
 */
export interface FinancingActivities {
  // Debt
  proceedsFromBorrowing: number; // Positive
  repaymentOfBorrowing: number; // Negative
  proceedsFromBonds: number; // Positive
  repaymentOfBonds: number; // Negative

  // Equity
  proceedsFromEquityIssuance: number; // Positive
  shareRepurchases: number; // Negative (treasury stock)

  // Dividends and distributions
  dividendsPaid: number; // Negative
  distributionsToOwners: number; // Negative

  // Leases
  principalPaymentsOnLeases: number; // Negative (IFRS 16 / ASC 842)

  // Other
  otherFinancingActivities: number;

  netCashFromFinancingActivities: number;
}

/**
 * Cash Flow Summary
 */
export interface CashFlowSummary {
  netIncreaseDecreaseInCash: number;

  // Cash reconciliation
  cashAtBeginningOfPeriod: number;
  cashAtEndOfPeriod: number;

  // Cash and cash equivalents detail
  cashAndCashEquivalents: {
    cash: number;
    cashEquivalents: number;
    restrictedCash?: number;
    total: number;
  };

  // Validation
  reconciliationCheck: boolean; // Should always be true
  reconciliationDifference?: number; // Should be 0
}

/**
 * Cash Flow Comparison (YoY, QoQ, etc.)
 */
export interface CashFlowComparison {
  currentPeriod: CashFlowSummary;
  previousPeriod: CashFlowSummary;

  variance: {
    absolute: {
      operating: number;
      investing: number;
      financing: number;
      netChange: number;
    };
    percentage: {
      operating: number;
      investing: number;
      financing: number;
      netChange: number;
    };
  };
}

/**
 * Cash Flow Ratios and Metrics
 */
export interface CashFlowRatios {
  // Operating ratios
  operatingCashFlowRatio: number; // OCF / Current Liabilities
  cashFlowMargin: number; // OCF / Revenue
  cashReturnOnAssets: number; // OCF / Total Assets

  // Coverage ratios
  debtServiceCoverageRatio: number; // OCF / Total Debt Service
  interestCoverageRatio: number; // OCF / Interest Paid
  dividendCoverageRatio?: number; // OCF / Dividends Paid

  // Efficiency ratios
  cashConversionCycle: number; // DSO + DIO - DPO (in days)
  daysSalesOutstanding: number; // (AR / Revenue) * Days
  daysInventoryOutstanding?: number; // (Inventory / COGS) * Days
  daysPayablesOutstanding: number; // (AP / COGS) * Days

  // Quality metrics
  qualityOfEarnings: number; // OCF / Net Income
  accrualRatio: number; // (Net Income - OCF) / Total Assets

  // Free cash flow metrics
  freeCashFlow: number; // OCF - CapEx
  freeCashFlowYield?: number; // FCF / Market Cap
  freeCashFlowToEquity?: number; // FCF - Net Debt Payments

  // Liquidity
  operatingCashFlowPerShare?: number;
  cashFlowPerShare?: number;
}

/**
 * Cash Flow Projection
 */
export interface CashFlowProjection {
  projectionId: string;
  generatedAt: Date;
  method: ProjectionMethod;

  // Historical baseline
  historicalData: {
    months: number;
    averageOperatingCF: number;
    averageInvestingCF: number;
    averageFinancingCF: number;
    volatility: number;
  };

  // Projected periods
  projectedPeriods: ProjectedPeriod[];

  // Summary
  summary: {
    totalProjectedCash: number;
    projectedEndingCash: number;
    minimumCashPosition: number;
    maximumCashPosition: number;
  };

  // Confidence intervals (if requested)
  confidenceIntervals?: {
    level: number; // e.g., 95
    lowerBound: number[];
    upperBound: number[];
  };

  // Scenarios (if requested)
  scenarios?: {
    bestCase: ProjectedPeriod[];
    worstCase: ProjectedPeriod[];
    base: ProjectedPeriod[];
  };
}

/**
 * Single projected period
 */
export interface ProjectedPeriod {
  period: string; // e.g., "2024-07"
  month: number; // 1-12
  year: number;

  projectedOperatingCF: number;
  projectedInvestingCF: number;
  projectedFinancingCF: number;
  projectedNetChange: number;
  projectedEndingCash: number;

  assumptions?: string[];
}

/**
 * Burn Rate Analysis
 */
export interface BurnRateAnalysis {
  analysisDate: Date;
  periodMonths: number;

  // Burn metrics
  averageMonthlyBurn: number;
  netBurnRate: number; // Negative = burning cash
  grossBurnRate: number; // Total monthly expenses

  // Runway
  currentCash: number;
  monthsOfRunway: number;
  runwayEndDate: Date;

  // Trend
  burnRateTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  monthlyBurnHistory: MonthlyBurn[];

  // Growth-adjusted (if revenue exists)
  growthAdjustedBurn?: {
    monthlyRecurringRevenue?: number;
    revenueGrowthRate?: number;
    adjustedRunway?: number;
  };

  // Recommendations
  alerts: BurnRateAlert[];
}

/**
 * Monthly burn data point
 */
export interface MonthlyBurn {
  month: string;
  operatingCF: number;
  burnRate: number;
  endingCash: number;
}

/**
 * Burn rate alert
 */
export interface BurnRateAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  message: string;
  recommendedAction?: string;
}

/**
 * Liquidity Risk Analysis
 */
export interface LiquidityRiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100

  indicators: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapital: number;
    operatingCashFlowRatio: number;
  };

  risks: LiquidityRisk[];
  recommendations: string[];
}

/**
 * Individual liquidity risk
 */
export interface LiquidityRisk {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  impact: number; // Estimated monetary impact
  probability: number; // 0-1
  mitigation?: string;
}

/**
 * Free Cash Flow Analysis
 */
export interface FreeCashFlowAnalysis {
  period: ReportingPeriod;

  // Components
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;

  // Advanced metrics
  freeCashFlowMargin: number; // FCF / Revenue
  fcfConversionRate: number; // FCF / Operating Income

  // Levered vs Unlevered
  unleveredFreeCashFlow: number; // Before interest
  leveredFreeCashFlow: number; // After debt service

  // Per share metrics (if applicable)
  fcfPerShare?: number;

  // Quality assessment
  fcfQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  sustainabilityScore: number; // 0-100

  // Historical comparison
  historicalFCF?: {
    period: string;
    fcf: number;
  }[];
}

/**
 * Cash Conversion Cycle Analysis
 */
export interface CashConversionCycleAnalysis {
  period: ReportingPeriod;

  // Components (in days)
  daysSalesOutstanding: number; // DSO - collection period
  daysInventoryOutstanding: number; // DIO - inventory holding period
  daysPayablesOutstanding: number; // DPO - payment period

  // Cycle
  cashConversionCycle: number; // DSO + DIO - DPO

  // Trend
  trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE';

  // Historical data
  historical: {
    period: string;
    dso: number;
    dio: number;
    dpo: number;
    ccc: number;
  }[];

  // Benchmarks
  industryBenchmark?: number;
  comparisonToIndustry?: 'BETTER' | 'AVERAGE' | 'WORSE';

  // Recommendations
  optimizationOpportunities: {
    area: 'RECEIVABLES' | 'INVENTORY' | 'PAYABLES';
    currentDays: number;
    targetDays: number;
    potentialCashImpact: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

/**
 * Statement metadata
 */
export interface StatementMetadata {
  version: string;
  standard: 'IFRS' | 'GAAP' | 'BOTH';
  preparedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  notes?: string[];
  assumptions?: string[];

  dataQuality: {
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    warnings: string[];
  };

  calculationDetails?: {
    totalTransactionsAnalyzed: number;
    periodCoverage: number; // Percentage of period with data
    estimatedValues: string[]; // List of estimated line items
  };
}

/**
 * Cash Flow Line Item (for drill-down)
 */
export interface CashFlowLineItem {
  id: string;
  category: CashFlowCategory;
  subCategory: string;
  description: string;
  amount: number;
  date: Date;

  // Optional details
  transactionId?: string;
  invoiceId?: string;
  accountId?: string;
  counterparty?: string;

  metadata?: Record<string, any>;
}

/**
 * Export options
 */
export interface CashFlowExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  includeCharts: boolean;
  includeComparison: boolean;
  includeRatios: boolean;
  includeProjection: boolean;
  template?: string;
}
