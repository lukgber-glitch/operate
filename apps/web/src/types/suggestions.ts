/**
 * Suggestions and AI Insights Types
 * Type definitions for proactive suggestions, insights, and quick actions
 */

export type SuggestionType = 'WARNING' | 'DEADLINE' | 'INSIGHT' | 'QUICK_ACTION' | 'TIP';
export type SuggestionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: SuggestionPriority;
  page: string;
  entityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  expiresAt?: Date;

  // UI-specific fields
  isExpanded?: boolean;
  isDismissed?: boolean;
}

export interface Insight {
  id: string;
  type: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'COMPARISON';
  title: string;
  description: string;
  metric: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    label: string;
  };
  comparison?: {
    label: string;
    value: string | number;
  };
  chartData?: any;
  createdAt: Date;

  // UI-specific fields
  isExpanded?: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  category: 'TAX' | 'PAYROLL' | 'INVOICE' | 'COMPLIANCE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE';
  actionUrl?: string;
  actionLabel?: string;

  // UI-specific fields
  isDismissed?: boolean;
  remindLater?: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'INVOICE' | 'EXPENSE' | 'TAX' | 'REPORT' | 'HR' | 'OTHER';
  shortcut?: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  insights: Insight[];
  deadlines: Deadline[];
  total: number;
  page: number;
  limit: number;
}

export interface InsightsResponse {
  insights: Insight[];
  total: number;
}

export interface DeadlinesResponse {
  deadlines: Deadline[];
  total: number;
}

// Default quick actions
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-invoice',
    label: 'Create Invoice',
    icon: 'FileText',
    prompt: 'Help me create a new invoice',
    category: 'INVOICE',
    shortcut: 'I',
  },
  {
    id: 'add-expense',
    label: 'Add Expense',
    icon: 'Receipt',
    prompt: 'I want to add an expense',
    category: 'EXPENSE',
    shortcut: 'E',
  },
  {
    id: 'check-tax',
    label: 'Check Tax',
    icon: 'Calculator',
    prompt: 'Show me my tax status',
    category: 'TAX',
    shortcut: 'T',
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    icon: 'BarChart3',
    prompt: 'Generate a financial report',
    category: 'REPORT',
    shortcut: 'R',
  },
  {
    id: 'hr-question',
    label: 'HR Question',
    icon: 'Users',
    prompt: 'I have an HR question',
    category: 'HR',
    shortcut: 'H',
  },
];
