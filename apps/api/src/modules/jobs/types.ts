/**
 * Job Types
 * Common types for background jobs
 */

/**
 * Daily Insight Job Data
 */
export interface InsightJobData {
  orgId: string;
  triggeredBy: 'scheduler' | 'manual';
  userId?: string;
}

/**
 * Daily Insight Result
 */
export interface InsightResult {
  jobId: string;
  success: boolean;
  orgId: string;
  insightCount: number;
  categories: {
    cashFlow: number;
    tax: number;
    invoice: number;
    bill: number;
    hr: number;
  };
  highPriorityCount: number;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  errorMessage?: string;
}

/**
 * Generated Insight Data
 */
export interface GeneratedInsight {
  type: InsightType;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: string;
  actionParams?: Record<string, any>;
  entityType?: string;
  entityId?: string;
  data?: Record<string, any>;
  expiresAt: Date;
}

/**
 * Insight Types (based on SuggestionType from schema)
 */
export enum InsightType {
  TAX_DEADLINE = 'TAX_DEADLINE',
  INVOICE_REMINDER = 'INVOICE_REMINDER',
  EXPENSE_ANOMALY = 'EXPENSE_ANOMALY',
  CASH_FLOW = 'CASH_FLOW',
  CLIENT_FOLLOWUP = 'CLIENT_FOLLOWUP',
  COMPLIANCE = 'COMPLIANCE',
  OPTIMIZATION = 'OPTIMIZATION',
  INSIGHT = 'INSIGHT',
}

/**
 * Insight Priority (based on SuggestionPriority from schema)
 */
export enum InsightPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Insight Category (for organization)
 */
export enum InsightCategory {
  CASH_FLOW = 'CASH_FLOW',
  TAX = 'TAX',
  INVOICE = 'INVOICE',
  BILL = 'BILL',
  HR = 'HR',
  EXPENSE = 'EXPENSE',
  CLIENT = 'CLIENT',
  COMPLIANCE = 'COMPLIANCE',
}
