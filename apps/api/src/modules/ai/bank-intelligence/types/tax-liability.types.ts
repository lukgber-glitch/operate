/**
 * Tax Liability Tracking Types
 * Real-time tax estimates for German freelancers/small businesses
 */

/**
 * Complete tax liability calculation for an organization
 */
export interface TaxLiability {
  organizationId: string;
  year: number;
  asOfDate: Date;

  income: {
    totalRevenue: number; // In cents
    totalDeductions: number; // In cents
    netProfit: number; // In cents
  };

  incomeTax: {
    taxableIncome: number; // In cents
    estimatedTax: number; // In cents
    effectiveRate: number; // As decimal (0.242 = 24.2%)
    bracket: string; // e.g., "Progressionszone 2 (24%-42%)"
    alreadyPaid: number; // Vorauszahlungen (in cents)
    stillOwed: number; // In cents
  };

  solidaritySurcharge: {
    rate: number; // As decimal (0.055 = 5.5%)
    amount: number; // In cents
  };

  vat: {
    collectedVat: number; // From invoices (in cents)
    paidVat: number; // From expenses (in cents)
    netVatDue: number; // In cents (positive = owed, negative = refund)
    alreadySubmitted: number; // Previously submitted VAT (in cents)
    stillOwed: number; // In cents
  };

  total: {
    estimatedTotalTax: number; // Income tax + Soli (in cents)
    alreadyPaid: number; // All prepayments (in cents)
    stillOwed: number; // In cents
    nextPaymentDue: Date | null;
    nextPaymentAmount: number; // In cents
  };

  confidence: number; // 0-1 confidence score
  notes: string[];
}

/**
 * Quarterly tax estimate
 */
export interface QuarterlyEstimate {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  startDate: Date;
  endDate: Date;
  revenue: number; // In cents
  expenses: number; // In cents
  netProfit: number; // In cents
  estimatedIncomeTax: number; // In cents
  vatCollected: number; // In cents
  vatPaid: number; // In cents
  netVat: number; // In cents (positive = owed, negative = refund)
  status: 'projected' | 'in_progress' | 'completed';
}

/**
 * VAT summary by period
 */
export interface VatSummary {
  period: 'monthly' | 'quarterly' | 'yearly';
  periods: VatPeriod[];
  totalCollected: number; // In cents
  totalPaid: number; // In cents
  netDue: number; // In cents (positive = owed, negative = refund)
  nextDeadline: Date | null;
  nextAmount: number; // In cents
}

/**
 * Single VAT period
 */
export interface VatPeriod {
  label: string; // "Q1 2025" or "January 2025"
  startDate: Date;
  endDate: Date;
  invoicesIssued: number; // Count
  vatCollected: number; // In cents
  expensesClaimed: number; // Count
  vatPaid: number; // In cents
  netVat: number; // In cents (positive = owed, negative = refund)
  status: 'submitted' | 'due' | 'upcoming';
  submissionDeadline: Date;
}

/**
 * Deductions summary by category
 */
export interface DeductionsSummary {
  year: number;
  totalDeductions: number; // In cents
  categories: CategoryDeduction[];
  specialItems: SpecialDeduction[];
}

/**
 * Deduction by tax category
 */
export interface CategoryDeduction {
  category: string; // Display name
  eurLine: string; // EÜR line number (e.g., "26")
  amount: number; // Total amount spent (in cents)
  transactionCount: number;
  deductionRate: number; // As decimal (0.7 = 70%)
  effectiveDeduction: number; // Actual deductible amount (in cents)
}

/**
 * Special deduction items with limits
 */
export interface SpecialDeduction {
  name: string;
  amount: number; // Amount spent (in cents)
  limit: number | null; // Limit if applicable (in cents)
  claimed: number; // Amount claimed (in cents)
  remaining: number | null; // Remaining if limited (in cents)
  note: string;
}

/**
 * Tax alert/notification
 */
export interface TaxAlert {
  id: string;
  type: 'deadline' | 'payment_due' | 'missing_document' | 'limit_exceeded' | 'quarterly_estimate';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  dueDate?: Date;
  amount?: number; // In cents
  actionRequired: string;
}

/**
 * VAT submission tracking
 */
export interface VatSubmission {
  id: string;
  organizationId: string;
  period: string; // "2025-Q1" or "2025-01"
  periodType: 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  vatCollected: number; // In cents
  vatPaid: number; // In cents
  netVat: number; // In cents
  status: 'pending' | 'submitted' | 'paid';
  submittedAt?: Date;
  paidAt?: Date;
}

/**
 * Income tax prepayment (Vorauszahlung)
 */
export interface TaxPrepayment {
  id: string;
  organizationId: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  dueDate: Date;
  amount: number; // In cents
  paid: boolean;
  paidAt?: Date;
  transactionId?: string;
}

/**
 * Tax calculation options
 */
export interface TaxCalculationOptions {
  /** Year to calculate (default: current year) */
  year?: number;

  /** Include Gewerbesteuer (trade tax)? Only for Gewerbetreibende */
  includeGewerbeSteuer?: boolean;

  /** Municipality tax rate (Hebesatz) for Gewerbesteuer */
  hebesatz?: number;

  /** Married filing jointly? Affects Soli threshold */
  isMarried?: boolean;

  /** Is Kleinunternehmer (small business VAT exempt)? */
  isKleinunternehmer?: boolean;

  /** VAT filing frequency */
  vatFrequency?: 'monthly' | 'quarterly' | 'yearly';

  /** Include only confirmed transactions? */
  confirmedOnly?: boolean;
}
