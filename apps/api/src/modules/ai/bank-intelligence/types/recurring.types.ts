/**
 * Types for recurring transaction detection
 * Identifies subscriptions, regular payments, and recurring patterns
 */

export interface RecurringPattern {
  /** Original vendor name as it appears in transactions */
  vendorName: string;

  /** Normalized vendor name for matching */
  normalizedVendorName: string;

  /** Detected frequency of the recurring pattern */
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';

  /** Average transaction amount in cents */
  averageAmount: number;

  /** Minimum transaction amount in cents */
  minAmount: number;

  /** Maximum transaction amount in cents */
  maxAmount: number;

  /** Currency code (e.g., EUR, USD) */
  currency: string;

  /** Number of times this pattern has occurred */
  occurrences: number;

  /** First transaction date */
  firstSeen: Date;

  /** Most recent transaction date */
  lastSeen: Date;

  /** Predicted next payment date */
  nextExpected: Date;

  /** Confidence score (0-100) based on regularity */
  confidence: number;

  /** Expense category if classified */
  category?: string;

  /** German tax category if classified */
  taxCategory?: string;

  /** Transaction IDs that match this pattern */
  transactions: {
    id: string;
    date: Date;
    amount: number;
  }[];

  /** Is this pattern still active? (Has occurred in last 2 cycles) */
  isActive: boolean;

  /** Pattern status */
  status: 'confirmed' | 'predicted' | 'ended';

  /** Standard deviation of intervals (days) - lower is more regular */
  intervalStdDev?: number;

  /** Standard deviation of amounts (cents) - lower is more consistent */
  amountStdDev?: number;

  /** Notes about the pattern */
  notes?: string;
}

export interface UpcomingPayment {
  /** Vendor name */
  vendorName: string;

  /** Expected payment date */
  expectedDate: Date;

  /** Expected amount in cents */
  expectedAmount: number;

  /** Confidence in this prediction (0-100) */
  confidence: number;

  /** Frequency description */
  frequency: string;

  /** Last actual payment date */
  lastPaymentDate: Date;

  /** Days until payment is due */
  daysTillDue: number;

  /** Pattern ID reference */
  patternId?: string;

  /** Amount range (min-max) */
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface RecurringSummary {
  /** Total monthly recurring expenses in cents */
  totalMonthlyRecurring: number;

  /** Total annual recurring expenses in cents */
  totalYearlyRecurring: number;

  /** Number of active subscriptions/recurring payments */
  subscriptionCount: number;

  /** Breakdown by category */
  categories: {
    category: string;
    monthlyTotal: number;
    yearlyTotal: number;
    count: number;
    patterns: RecurringPattern[];
  }[];

  /** Top 10 recurring expenses by amount */
  topRecurringExpenses: RecurringPattern[];

  /** Upcoming payments in the next 7 days */
  upcomingWeek: UpcomingPayment[];

  /** Upcoming payments in the next 30 days */
  upcomingMonth: UpcomingPayment[];

  /** Potential cost savings opportunities */
  potentialSavings?: {
    vendor: string;
    currentMonthlyAmount: number;
    suggestion: string;
    potentialSavingsPerYear: number;
  }[];

  /** Insights and observations */
  insights?: {
    type: 'DUPLICATE_SERVICES' | 'UNUSED_SUBSCRIPTION' | 'PRICE_INCREASE' | 'IRREGULAR_PATTERN';
    message: string;
    affectedVendors: string[];
    potentialSavings?: number;
  }[];
}

export interface DetectionOptions {
  /** Minimum number of occurrences to establish a pattern (default: 2) */
  minOccurrences?: number;

  /** Number of days to look back (default: 365) */
  lookbackDays?: number;

  /** Include patterns that have ended (default: false) */
  includeEnded?: boolean;

  /** Minimum confidence to include (default: 60) */
  minConfidence?: number;

  /** Specific vendor to analyze */
  vendorName?: string;

  /** Only return active patterns */
  activeOnly?: boolean;
}

export interface IntervalAnalysis {
  /** Detected frequency */
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';

  /** Average gap in days */
  averageGapDays: number;

  /** Standard deviation of gaps */
  standardDeviation: number;

  /** Confidence in the frequency detection (0-100) */
  confidence: number;

  /** All gaps between transactions */
  gaps: number[];

  /** Expected next date based on pattern */
  expectedNextDate: Date;
}

export interface VendorGroup {
  /** Normalized vendor name */
  normalizedName: string;

  /** All variations of this vendor name seen */
  nameVariations: string[];

  /** All transactions for this vendor */
  transactions: {
    id: string;
    date: Date;
    amount: number;
    description: string;
  }[];

  /** Currency */
  currency: string;
}
