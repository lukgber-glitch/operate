/**
 * Suggestion Types
 * Defines comprehensive types for proactive AI suggestions
 */

/**
 * Main suggestion interface
 */
export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action?: SuggestedAction;
  priority: SuggestionPriority;
  dismissible: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  expiresAt?: Date;
}

/**
 * Suggestion types
 */
export enum SuggestionType {
  QUICK_ACTION = 'quick_action',     // e.g., "Send reminder"
  INSIGHT = 'insight',                // e.g., "Revenue up 20%"
  WARNING = 'warning',                // e.g., "3 invoices overdue"
  TIP = 'tip',                        // e.g., "Did you know..."
  DEADLINE = 'deadline',              // e.g., "VAT due in 5 days"
  OPTIMIZATION = 'optimization',      // e.g., "Could save €200 on..."
  ANOMALY = 'anomaly',                // e.g., "Unusual expense detected"
  OPPORTUNITY = 'opportunity',        // e.g., "New deduction available"
}

/**
 * Suggestion priority levels
 */
export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Suggested action that can be taken
 */
export interface SuggestedAction {
  type: string;                       // e.g., "send_reminders", "prepare_vat"
  label: string;                      // Display label for button
  params: Record<string, any>;        // Parameters needed for action
  confirmation?: boolean;             // Whether to show confirmation dialog
}

/**
 * Business insight
 */
export interface Insight {
  id: string;
  title: string;
  description: string;
  trend?: TrendDirection;
  value?: number;
  comparison?: string;
  icon?: string;
  period?: string;
  metadata?: Record<string, any>;
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

/**
 * Deadline reminder
 */
export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  daysRemaining: number;
  type: ReminderType;
  severity: SuggestionPriority;
  action?: SuggestedAction;
}

export enum ReminderType {
  VAT_RETURN = 'vat_return',
  TAX_FILING = 'tax_filing',
  INVOICE_DUE = 'invoice_due',
  EXPENSE_APPROVAL = 'expense_approval',
  DOCUMENT_EXPIRY = 'document_expiry',
  COMPLIANCE = 'compliance',
}

/**
 * Optimization suggestion
 */
export interface Optimization {
  id: string;
  title: string;
  description: string;
  potentialSaving?: number;
  effort: OptimizationEffort;
  category: string;
  action?: SuggestedAction;
}

export enum OptimizationEffort {
  LOW = 'low',      // Quick wins
  MEDIUM = 'medium',
  HIGH = 'high',    // Requires significant work
}

/**
 * Base context for generating suggestions
 */
export interface SuggestionContext {
  orgId: string;
  userId?: string;
  page?: string;
  entityType?: string;
  entityId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Generator output
 */
export interface GeneratorResult {
  suggestions: Suggestion[];
  insights?: Insight[];
  reminders?: Reminder[];
  optimizations?: Optimization[];
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: SuggestionPriority;
  detectedAt: Date;
  affectedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  metrics?: {
    expected: number;
    actual: number;
    deviation: number;
  };
}

export enum AnomalyType {
  UNUSUAL_EXPENSE = 'unusual_expense',
  PAYMENT_DELAY = 'payment_delay',
  REVENUE_DROP = 'revenue_drop',
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  MISSING_DATA = 'missing_data',
  THRESHOLD_BREACH = 'threshold_breach',
}
