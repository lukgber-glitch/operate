/**
 * Daily Briefing Types
 * Type definitions for AI-generated financial briefings
 */

export interface DailyBriefing {
  date: string;
  greeting: string;
  summary: BriefingSummary;
  alerts: BriefingAlert[];
  suggestions: BriefingSuggestion[];
  insights: string[];
  generatedAt: Date;
}

export interface BriefingSummary {
  cashPosition: number;
  cashChange: number;
  cashChangePercent: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  overdueInvoices: number;
  overdueInvoicesAmount: number;
  upcomingBills: number;
  upcomingBillsAmount: number;
  overdueBills: number;
  overdueBillsAmount: number;
  recentTransactions: number;
  currency: string;
}

export interface BriefingAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  description: string;
  priority: number;
  action?: BriefingAction;
  metadata?: Record<string, any>;
}

export interface BriefingAction {
  label: string;
  url: string;
  method?: 'GET' | 'POST';
}

export interface BriefingSuggestion {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'invoice' | 'bill' | 'cash-flow' | 'tax' | 'general';
  action?: BriefingAction;
  estimatedImpact?: string;
  metadata?: Record<string, any>;
}

export interface WeeklyBriefing extends DailyBriefing {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  weekSummary: WeekSummary;
}

export interface WeekSummary {
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  invoicesIssued: number;
  invoicesPaid: number;
  billsPaid: number;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface BriefingContext {
  orgId: string;
  userId?: string;
  date: Date;
  includeProjections?: boolean;
  includeRecommendations?: boolean;
}

export interface FinancialDataSnapshot {
  bankAccounts: Array<{
    id: string;
    name: string;
    balance: number;
    currency: string;
    lastUpdated: Date;
  }>;
  invoices: {
    pending: Array<{
      id: string;
      number: string;
      customerName: string;
      amount: number;
      dueDate: Date;
      daysOverdue?: number;
    }>;
    overdue: Array<{
      id: string;
      number: string;
      customerName: string;
      amount: number;
      dueDate: Date;
      daysOverdue: number;
    }>;
  };
  bills: {
    upcoming: Array<{
      id: string;
      billNumber: string;
      vendorName: string;
      amount: number;
      dueDate: Date;
      daysUntilDue: number;
    }>;
    overdue: Array<{
      id: string;
      billNumber: string;
      vendorName: string;
      amount: number;
      dueDate: Date;
      daysOverdue: number;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: 'credit' | 'debit';
  }>;
  previousBalance?: number;
}
