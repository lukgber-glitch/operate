/**
 * Tax calculation interfaces and types
 */

export interface TaxBracketConfig {
  min: number;
  max: number | null;
  rate: number;
  baseAmount?: number;
  description?: string;
}

export interface VatRateConfig {
  standard: number;
  reduced: number;
  superReduced?: number;
  zero?: number;
  description?: Record<string, string>;
}

export interface TradeTaxConfig {
  baseRate: number;
  defaultMultiplier: number;
  exemptionThreshold?: number;
  description?: string;
}

export interface DeductionLimitsConfig {
  homeOffice: number | { dailyRate?: number; maxDays?: number; maxAnnual: number };
  mileageRate: number;
  entertainmentPercent: number;
  workingMaterials?: {
    lowValueAssets: number;
  };
}

export interface SocialSecurityRates {
  pension: number;
  health: number;
  unemployment: number;
  longTermCare?: number;
  accident?: number;
}

export interface TaxYearConfig {
  country: string;
  year: number;
  incomeTaxBrackets: TaxBracketConfig[];
  vatRates: VatRateConfig;
  tradeTax?: TradeTaxConfig;
  deductionLimits: DeductionLimitsConfig;
  socialSecurity?: SocialSecurityRates;
}

export interface TransactionTaxData {
  id: string;
  date: Date;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  vatRate?: number;
  vatAmount?: number;
  isIntraEu?: boolean;
  isReverseCharge?: boolean;
  isExport?: boolean;
  countryCode?: string;
  documentIds?: string[];
  metadata?: Record<string, any>;
}

export interface TaxCalculationResult {
  grossRevenue: number;
  totalDeductions: number;
  taxableIncome: number;
  taxLiability: number;
  taxCredits: number;
  prepayments: number;
  netTaxDue: number;
  effectiveTaxRate: number;
}

export interface VatCalculationResult {
  totalVatCollected: number;
  totalVatPaid: number;
  netVatPosition: number;
  reverseChargeVat: number;
  intraEuVat: number;
  importVat: number;
  exportVat: number;
}

export interface TradeTaxCalculationResult {
  tradeTaxBase: number;
  municipalMultiplier: number;
  tradeTaxLiability: number;
  tradeTaxCredit: number;
}

export interface DeductionCalculationOptions {
  applyLimits: boolean;
  includeDepreciation: boolean;
  useActualCosts: boolean;
  fiscalYear: number;
  country: string;
}

export interface TaxOptimizationSuggestion {
  category: string;
  description: string;
  currentAmount: number;
  optimizedAmount: number;
  potentialSavings: number;
  confidence: number;
  actionRequired: string;
  deadline?: string;
}

export interface TaxAuditTrail {
  timestamp: Date;
  userId: string;
  action: string;
  field: string;
  oldValue: any;
  newValue: any;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export interface ElsterExportData {
  organization: {
    name: string;
    taxNumber?: string;
    vatNumber?: string;
    address: string;
  };
  taxYear: number;
  taxOfficeNumber?: string;
  incomeTax: TaxCalculationResult;
  vat: VatCalculationResult;
  tradeTax?: TradeTaxCalculationResult;
  additionalData?: Record<string, any>;
}

export interface FinanzOnlineExportData {
  organization: {
    name: string;
    taxNumber?: string;
    vatNumber?: string;
    address: string;
  };
  taxYear: number;
  incomeTax: TaxCalculationResult;
  vat: VatCalculationResult;
  additionalData?: Record<string, any>;
}

export interface TaxReportMetadata {
  generatedAt: Date;
  generatedBy: string;
  reportVersion: string;
  dataSourceVersion: string;
  calculationMethod: string;
  assumptions?: string[];
  disclaimers?: string[];
}

export interface TaxPlanningScenario {
  name: string;
  description: string;
  assumptions: Record<string, any>;
  projectedIncome: number;
  projectedExpenses: number;
  projectedTaxLiability: number;
  comparisonToBaseline: number;
  recommendations: string[];
}

export interface QuarterlyTaxEstimate {
  quarter: number;
  year: number;
  dueDate: Date;
  estimatedIncome: number;
  estimatedTax: number;
  paymentAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paidDate?: Date;
  paidAmount?: number;
}

export interface TaxDeadlineInfo {
  type: 'INCOME_TAX' | 'VAT' | 'TRADE_TAX' | 'SOCIAL_SECURITY' | 'OTHER';
  description: string;
  dueDate: Date;
  country: string;
  isExtendable: boolean;
  extensionDeadline?: Date;
  penaltyRate?: number;
  isOverdue: boolean;
  daysUntilDue: number;
}

export interface ViesValidationResult {
  valid: boolean;
  vatNumber: string;
  countryCode: string;
  companyName?: string;
  companyAddress?: string;
  validatedAt: Date;
  requestIdentifier?: string;
}

export interface TaxComplianceCheck {
  item: string;
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation?: string;
  deadline?: Date;
}

export interface TaxRiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: Array<{
    factor: string;
    score: number;
    description: string;
    mitigation?: string;
  }>;
  complianceChecks: TaxComplianceCheck[];
  auditProbability: number;
}
