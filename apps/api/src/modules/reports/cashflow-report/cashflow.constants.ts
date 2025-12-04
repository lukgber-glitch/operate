/**
 * Cash Flow Report Constants
 * Standard categories, mappings, and configuration for cash flow reporting
 */

/**
 * Transaction categories mapped to cash flow statement sections
 * Based on IFRS (IAS 7) and US GAAP (ASC 230) classifications
 */
export const CASH_FLOW_CATEGORY_MAPPING = {
  // OPERATING ACTIVITIES - Direct Method Receipts
  INTEREST_RECEIVED: { section: 'OPERATING', type: 'RECEIPT', directMethod: true },
  DIVIDEND_INCOME: { section: 'OPERATING', type: 'RECEIPT', directMethod: true },
  OTHER_OPERATING_RECEIPT: { section: 'OPERATING', type: 'RECEIPT', directMethod: true },

  // OPERATING ACTIVITIES - Direct Method Payments
  SUPPLIER_PAYMENT: { section: 'OPERATING', type: 'PAYMENT', directMethod: true },
  EMPLOYEE_SALARY: { section: 'OPERATING', type: 'PAYMENT', directMethod: true },
  INTEREST_PAID: { section: 'OPERATING', type: 'PAYMENT', directMethod: true },
  TAX_PAYMENT: { section: 'OPERATING', type: 'PAYMENT', directMethod: true },
  OTHER_OPERATING_PAYMENT: { section: 'OPERATING', type: 'PAYMENT', directMethod: true },

  // OPERATING ACTIVITIES - Non-cash Adjustments
  DEPRECIATION: { section: 'OPERATING', type: 'NON_CASH', directMethod: false },
  AMORTIZATION: { section: 'OPERATING', type: 'NON_CASH', directMethod: false },
  STOCK_COMPENSATION: { section: 'OPERATING', type: 'NON_CASH', directMethod: false },
  IMPAIRMENT: { section: 'OPERATING', type: 'NON_CASH', directMethod: false },

  // INVESTING ACTIVITIES
  CAPEX_PURCHASE: { section: 'INVESTING', type: 'OUTFLOW', description: 'Capital Expenditure' },
  ASSET_SALE: { section: 'INVESTING', type: 'INFLOW', description: 'Proceeds from Asset Sale' },
  INTANGIBLE_PURCHASE: { section: 'INVESTING', type: 'OUTFLOW', description: 'Intangible Asset Purchase' },
  INTANGIBLE_SALE: { section: 'INVESTING', type: 'INFLOW', description: 'Intangible Asset Sale' },
  INVESTMENT_PURCHASE: { section: 'INVESTING', type: 'OUTFLOW', description: 'Investment Purchase' },
  INVESTMENT_SALE: { section: 'INVESTING', type: 'INFLOW', description: 'Investment Sale' },
  INVESTMENT_MATURITY: { section: 'INVESTING', type: 'INFLOW', description: 'Investment Maturity' },
  BUSINESS_ACQUISITION: { section: 'INVESTING', type: 'OUTFLOW', description: 'Business Acquisition' },
  BUSINESS_DISPOSAL: { section: 'INVESTING', type: 'INFLOW', description: 'Business Disposal' },
  LOAN_GIVEN: { section: 'INVESTING', type: 'OUTFLOW', description: 'Loans to Others' },
  LOAN_COLLECTED: { section: 'INVESTING', type: 'INFLOW', description: 'Collection of Loans' },
  OTHER_INVESTING: { section: 'INVESTING', type: 'BOTH', description: 'Other Investing Activities' },

  // FINANCING ACTIVITIES
  DEBT_PROCEEDS: { section: 'FINANCING', type: 'INFLOW', description: 'Proceeds from Borrowing' },
  DEBT_REPAYMENT: { section: 'FINANCING', type: 'OUTFLOW', description: 'Debt Repayment' },
  BOND_ISSUANCE: { section: 'FINANCING', type: 'INFLOW', description: 'Bond Issuance' },
  BOND_REPAYMENT: { section: 'FINANCING', type: 'OUTFLOW', description: 'Bond Repayment' },
  EQUITY_ISSUANCE: { section: 'FINANCING', type: 'INFLOW', description: 'Equity Issuance' },
  SHARE_BUYBACK: { section: 'FINANCING', type: 'OUTFLOW', description: 'Share Repurchase' },
  DIVIDEND_PAYMENT: { section: 'FINANCING', type: 'OUTFLOW', description: 'Dividends Paid' },
  OWNER_DISTRIBUTION: { section: 'FINANCING', type: 'OUTFLOW', description: 'Distributions to Owners' },
  LEASE_PRINCIPAL: { section: 'FINANCING', type: 'OUTFLOW', description: 'Lease Principal Payments' },
  OTHER_FINANCING: { section: 'FINANCING', type: 'BOTH', description: 'Other Financing Activities' },
} as const;

/**
 * Standard IFRS/GAAP cash flow line item display order
 */
export const CASH_FLOW_DISPLAY_ORDER = {
  OPERATING: [
    'netIncome',
    'depreciation',
    'amortization',
    'stockBasedCompensation',
    'gainLossOnAssetDisposal',
    'impairmentCharges',
    'deferredTaxes',
    'unrealizedGainsLosses',
    'accountsReceivableChange',
    'inventoryChange',
    'prepaidExpensesChange',
    'accountsPayableChange',
    'accruedExpensesChange',
    'deferredRevenueChange',
    'netCashFromOperatingActivities',
  ],
  INVESTING: [
    'purchaseOfPPE',
    'proceedsFromSaleOfPPE',
    'purchaseOfIntangibles',
    'proceedsFromSaleOfIntangibles',
    'purchaseOfInvestments',
    'proceedsFromSaleOfInvestments',
    'proceedsFromMaturityOfInvestments',
    'acquisitionOfBusinesses',
    'proceedsFromDisposalOfBusinesses',
    'loansToOthers',
    'collectionOfLoans',
    'netCashFromInvestingActivities',
  ],
  FINANCING: [
    'proceedsFromBorrowing',
    'repaymentOfBorrowing',
    'proceedsFromBonds',
    'repaymentOfBonds',
    'proceedsFromEquityIssuance',
    'shareRepurchases',
    'dividendsPaid',
    'distributionsToOwners',
    'principalPaymentsOnLeases',
    'netCashFromFinancingActivities',
  ],
} as const;

/**
 * Line item labels for display
 */
export const CASH_FLOW_LABELS: Record<string, string> = {
  // Operating Activities
  netIncome: 'Net Income',
  depreciation: 'Depreciation',
  amortization: 'Amortization',
  stockBasedCompensation: 'Stock-Based Compensation',
  gainLossOnAssetDisposal: 'Gain/(Loss) on Asset Disposal',
  impairmentCharges: 'Impairment Charges',
  deferredTaxes: 'Deferred Taxes',
  unrealizedGainsLosses: 'Unrealized Gains/(Losses)',
  accountsReceivableChange: 'Change in Accounts Receivable',
  inventoryChange: 'Change in Inventory',
  prepaidExpensesChange: 'Change in Prepaid Expenses',
  accountsPayableChange: 'Change in Accounts Payable',
  accruedExpensesChange: 'Change in Accrued Expenses',
  deferredRevenueChange: 'Change in Deferred Revenue',
  netCashFromOperatingActivities: 'Net Cash from Operating Activities',

  // Investing Activities
  purchaseOfPPE: 'Purchase of Property, Plant & Equipment',
  proceedsFromSaleOfPPE: 'Proceeds from Sale of PP&E',
  purchaseOfIntangibles: 'Purchase of Intangible Assets',
  proceedsFromSaleOfIntangibles: 'Proceeds from Sale of Intangibles',
  purchaseOfInvestments: 'Purchase of Investments',
  proceedsFromSaleOfInvestments: 'Proceeds from Sale of Investments',
  proceedsFromMaturityOfInvestments: 'Proceeds from Maturity of Investments',
  acquisitionOfBusinesses: 'Acquisition of Businesses, net of cash',
  proceedsFromDisposalOfBusinesses: 'Proceeds from Disposal of Businesses',
  loansToOthers: 'Loans to Others',
  collectionOfLoans: 'Collection of Loans',
  netCashFromInvestingActivities: 'Net Cash from Investing Activities',

  // Financing Activities
  proceedsFromBorrowing: 'Proceeds from Borrowing',
  repaymentOfBorrowing: 'Repayment of Borrowing',
  proceedsFromBonds: 'Proceeds from Bonds',
  repaymentOfBonds: 'Repayment of Bonds',
  proceedsFromEquityIssuance: 'Proceeds from Issuance of Equity',
  shareRepurchases: 'Share Repurchases',
  dividendsPaid: 'Dividends Paid',
  distributionsToOwners: 'Distributions to Owners',
  principalPaymentsOnLeases: 'Principal Payments on Leases',
  netCashFromFinancingActivities: 'Net Cash from Financing Activities',

  // Summary
  netIncreaseDecreaseInCash: 'Net Increase/(Decrease) in Cash',
  cashAtBeginningOfPeriod: 'Cash at Beginning of Period',
  cashAtEndOfPeriod: 'Cash at End of Period',
};

/**
 * Ratio interpretation thresholds
 * Based on industry standards and financial analysis best practices
 */
export const RATIO_THRESHOLDS = {
  // Operating Cash Flow Ratio (OCF / Current Liabilities)
  operatingCashFlowRatio: {
    excellent: 1.5, // Can cover 150% of current liabilities
    good: 1.0, // Can cover current liabilities
    fair: 0.5, // Can cover 50%
    poor: 0.25, // Below 25%
  },

  // Cash Flow Margin (OCF / Revenue)
  cashFlowMargin: {
    excellent: 20, // 20%+
    good: 15, // 15%
    fair: 10, // 10%
    poor: 5, // Below 5%
  },

  // Current Ratio
  currentRatio: {
    excellent: 2.0,
    good: 1.5,
    fair: 1.0,
    poor: 0.75,
  },

  // Quick Ratio
  quickRatio: {
    excellent: 1.5,
    good: 1.0,
    fair: 0.75,
    poor: 0.5,
  },

  // Debt Service Coverage Ratio
  debtServiceCoverageRatio: {
    excellent: 2.0,
    good: 1.5,
    fair: 1.25,
    poor: 1.0,
  },

  // Quality of Earnings (OCF / Net Income)
  qualityOfEarnings: {
    excellent: 1.2, // Cash flow exceeds earnings
    good: 1.0, // Matches earnings
    fair: 0.8, // Reasonable conversion
    poor: 0.5, // Poor conversion
  },

  // Cash Conversion Cycle (days)
  cashConversionCycle: {
    excellent: 30,
    good: 45,
    fair: 60,
    poor: 90,
  },
} as const;

/**
 * Runway alert thresholds (months)
 */
export const RUNWAY_THRESHOLDS = {
  critical: 3, // Less than 3 months
  warning: 6, // Less than 6 months
  healthy: 12, // 12+ months is healthy
} as const;

/**
 * Cash and cash equivalents definition (IFRS/GAAP)
 */
export const CASH_EQUIVALENTS_CRITERIA = {
  maxMaturityMonths: 3, // Original maturity <= 3 months
  liquidityRequired: true, // Must be readily convertible to cash
  immaterialRisk: true, // Insignificant risk of value change
} as const;

/**
 * Standard reporting period configurations
 */
export const REPORTING_PERIODS = {
  MONTHLY: {
    months: 1,
    label: (date: Date) =>
      `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`,
  },
  QUARTERLY: {
    months: 3,
    label: (date: Date) => {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    },
  },
  ANNUAL: {
    months: 12,
    label: (date: Date) => `FY ${date.getFullYear()}`,
  },
} as const;

/**
 * Minimum historical data requirements for projections
 */
export const PROJECTION_REQUIREMENTS = {
  minHistoricalMonths: 3,
  recommendedHistoricalMonths: 12,
  maxProjectionMonths: 24,
} as const;

/**
 * Data quality thresholds
 */
export const DATA_QUALITY_THRESHOLDS = {
  completeness: {
    excellent: 95, // 95%+ of expected data
    good: 80,
    fair: 60,
    poor: 40,
  },
  accuracy: {
    excellent: 99, // 99%+ accuracy
    good: 95,
    fair: 90,
    poor: 85,
  },
} as const;

/**
 * Export format configurations
 */
export const EXPORT_FORMATS = {
  PDF: {
    mimeType: 'application/pdf',
    extension: '.pdf',
    supportsCharts: true,
  },
  EXCEL: {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    supportsCharts: true,
  },
  CSV: {
    mimeType: 'text/csv',
    extension: '.csv',
    supportsCharts: false,
  },
  JSON: {
    mimeType: 'application/json',
    extension: '.json',
    supportsCharts: false,
  },
} as const;

/**
 * Helper function to get cash flow section for a transaction category
 */
export function getCashFlowSection(category: string): string | null {
  const mapping = CASH_FLOW_CATEGORY_MAPPING[category as keyof typeof CASH_FLOW_CATEGORY_MAPPING];
  return mapping?.section || null;
}

/**
 * Helper function to determine if amount should be negative in statement
 */
export function isOutflow(category: string): boolean {
  const mapping = CASH_FLOW_CATEGORY_MAPPING[category as keyof typeof CASH_FLOW_CATEGORY_MAPPING];
  return mapping?.type === 'OUTFLOW' || mapping?.type === 'PAYMENT';
}

/**
 * Helper function to get display label for a line item
 */
export function getLineItemLabel(key: string): string {
  return CASH_FLOW_LABELS[key] || key;
}

/**
 * Helper function to assess ratio health
 */
export function assessRatioHealth(
  ratioName: keyof typeof RATIO_THRESHOLDS,
  value: number,
): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  const thresholds = RATIO_THRESHOLDS[ratioName];

  if (value >= thresholds.excellent) return 'EXCELLENT';
  if (value >= thresholds.good) return 'GOOD';
  if (value >= thresholds.fair) return 'FAIR';
  return 'POOR';
}

/**
 * Helper function to assess runway health
 */
export function assessRunwayHealth(
  months: number,
): { level: 'CRITICAL' | 'WARNING' | 'HEALTHY'; message: string } {
  if (months < RUNWAY_THRESHOLDS.critical) {
    return {
      level: 'CRITICAL',
      message: `Only ${months.toFixed(1)} months of runway - immediate action required`,
    };
  }
  if (months < RUNWAY_THRESHOLDS.warning) {
    return {
      level: 'WARNING',
      message: `${months.toFixed(1)} months of runway - below recommended 6 months`,
    };
  }
  return {
    level: 'HEALTHY',
    message: `${months.toFixed(1)} months of runway - healthy cash position`,
  };
}

/**
 * Helper function to format currency values
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Helper function to format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Helper function to validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): {
  valid: boolean;
  error?: string;
} {
  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1095) {
    // More than 3 years
    return { valid: false, error: 'Date range cannot exceed 3 years' };
  }

  return { valid: true };
}
