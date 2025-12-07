/**
 * Cash Flow Prediction Types
 * Types for forecasting future cash flow based on historical data,
 * recurring payments, pending invoices, and pending bills.
 */

export interface CashFlowForecast {
  organizationId: string;
  generatedAt: Date;
  forecastDays: number;
  currentBalance: number;
  projectedBalance: number; // At end of period

  summary: {
    totalInflows: number;
    totalOutflows: number;
    netChange: number;
  };

  inflows: {
    pendingInvoices: number;
    expectedRecurringIncome: number;
    predictedIncome: number;
    total: number;
    breakdown: CashFlowItem[];
  };

  outflows: {
    pendingBills: number;
    recurringExpenses: number;
    predictedExpenses: number;
    total: number;
    breakdown: CashFlowItem[];
  };

  dailyProjections: DailyProjection[];
  lowestPoint: LowestCashPoint;
  alerts: CashFlowAlert[];
  confidence: number; // 0-100
}

export interface CashFlowItem {
  description: string;
  amount: number;
  expectedDate: Date;
  type: 'invoice' | 'bill' | 'recurring' | 'predicted';
  confidence: number;
  source?: string; // Invoice ID, Vendor name, etc.
}

export interface DailyProjection {
  date: Date;
  dayOfWeek: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  items: CashFlowItem[];
  isWeekend: boolean;
  isPayday?: boolean; // Common payroll dates
}

export interface LowestCashPoint {
  date: Date;
  projectedBalance: number;
  daysFromNow: number;
  isCritical: boolean; // Below threshold
  riskFactors: string[];
}

export interface RunwayAnalysis {
  currentBalance: number;
  monthlyBurnRate: number;
  averageMonthlyIncome: number;
  netMonthlyChange: number;
  runwayMonths: number; // How many months until 0
  runwayDate: Date | null; // When will cash hit 0
  status: 'healthy' | 'caution' | 'critical';
  recommendations: string[];
}

export interface CashFlowAlert {
  type: 'low_balance' | 'large_outflow' | 'missed_income' | 'runway_warning';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  date: Date;
  amount?: number;
  actionRequired?: string;
}

export interface Scenario {
  name: string;
  adjustments: {
    additionalIncome?: number;
    additionalExpense?: number;
    delayedPayments?: string[]; // Invoice IDs to delay
    removedRecurring?: string[]; // Vendor names to remove
  };
}

/**
 * Recurring payment prediction
 */
export interface RecurringPayment {
  vendorName: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextExpectedDate: Date;
  confidence: number;
  lastOccurrence?: Date;
  category?: string;
}

/**
 * Historical pattern for prediction
 */
export interface HistoricalPattern {
  dayOfWeek: string;
  averageInflow: number;
  averageOutflow: number;
  transactionCount: number;
  confidence: number;
}

/**
 * Customer payment behavior
 */
export interface CustomerPaymentBehavior {
  customerId: string;
  customerName: string;
  averageDaysToPayment: number;
  onTimePaymentRate: number; // 0-1
  typicalDelay: number; // Days
  paymentProbability: number; // 0-1
}

/**
 * Thresholds for cash flow alerts
 */
export const CASH_FLOW_THRESHOLDS = {
  lowBalanceWarning: 5000, // EUR
  lowBalanceCritical: 1000, // EUR
  largeOutflowThreshold: 0.3, // 30% of balance
  runwayWarningMonths: 3,
  runwayCriticalMonths: 1,
  minBalanceForHealthy: 10000, // EUR
};

/**
 * Payment probability factors
 */
export const PAYMENT_PROBABILITY = {
  onTimeCustomer: 0.9, // 90% probability by due date
  lateCustomer: 0.7, // 70% probability with delay
  overdueDecayRate: 0.05, // 5% decrease per week overdue
  minProbability: 0.3, // Minimum 30% for very overdue
};
