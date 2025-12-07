/**
 * Bank Intelligence Dashboard Types
 */

export interface CashFlowDataPoint {
  date: string;
  balance: number;
  inflows: number;
  outflows: number;
  items: string[];
}

export interface RecurringExpense {
  id: string;
  vendorName: string;
  amount: number;
  currency: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDue: string;
  category: string;
  confidence: number;
}

export interface TaxSummary {
  year: number;
  incomeTax: number;
  vat: number;
  solidaritySurcharge?: number;
  totalOwed: number;
  totalPaid: number;
  nextPaymentDue: string;
  nextPaymentAmount: number;
}

export interface ClassifiedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  taxCategory: string;
  confidence: number;
  matchedTo?: {
    type: 'invoice' | 'bill';
    id: string;
    reference: string;
  };
}

export interface UnmatchedPayment {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'incoming' | 'outgoing';
  suggestedMatches?: SuggestedMatch[];
}

export interface SuggestedMatch {
  id: string;
  type: 'invoice' | 'bill';
  reference: string;
  amount: number;
  date: string;
  confidence: number;
  clientOrVendor?: string;
}

export interface BankAlert {
  id: string;
  type: 'low_balance' | 'payment_due' | 'tax_deadline' | 'unmatched' | 'recurring_expense';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  date: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible?: boolean;
}

export interface BankIntelligenceSummary {
  currentBalance: number;
  currency: string;
  balanceChange: number;
  balanceChangePercent: number;
  lowCashDate?: string;
  lowCashAmount?: number;
  totalRecurringMonthly: number;
  unmatchedCount: number;
  alertsCount: {
    critical: number;
    warning: number;
    info: number;
  };
}
