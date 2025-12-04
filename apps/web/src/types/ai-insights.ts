/**
 * AI Insights Types
 * Extended types for dashboard AI insights card
 */

import { Suggestion, Insight, SuggestionType, SuggestionPriority } from './suggestions';

export type InsightCategory =
  | 'TAX_OPTIMIZATION'
  | 'EXPENSE_ANOMALY'
  | 'CASH_FLOW'
  | 'PAYMENT_REMINDER'
  | 'GENERAL';

export type InsightUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AIInsight {
  id: string;
  category: InsightCategory;
  type: SuggestionType;
  priority: SuggestionPriority;
  urgency: InsightUrgency;
  title: string;
  description: string;
  summary?: string; // Short summary for collapsed view
  details?: string; // Extended details for expanded view
  actionUrl?: string;
  actionLabel?: string;
  actionData?: Record<string, any>; // Data for action handler
  metric?: {
    label: string;
    value: string | number;
    change?: {
      value: number;
      direction: 'up' | 'down' | 'stable';
      label: string;
    };
  };
  tags?: string[];
  createdAt: Date;
  expiresAt?: Date;
  dismissable?: boolean;
  dismissedAt?: Date;
  snoozeUntil?: Date;

  // UI state
  isExpanded?: boolean;
  isDismissed?: boolean;
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  suggestions: Suggestion[];
  rawInsights: Insight[];
  total: number;
  hasMore: boolean;
}

export interface InsightAction {
  type: 'VIEW_DETAILS' | 'TAKE_ACTION' | 'DISMISS' | 'SNOOZE';
  insightId: string;
  data?: any;
}

export interface InsightFilters {
  categories?: InsightCategory[];
  urgency?: InsightUrgency[];
  dismissed?: boolean;
  limit?: number;
}

// Helper to convert Suggestion to AIInsight
export function suggestionToAIInsight(suggestion: Suggestion): AIInsight {
  const category = categorizeFromType(suggestion.type);
  const urgency = priorityToUrgency(suggestion.priority);

  return {
    id: suggestion.id,
    category,
    type: suggestion.type,
    priority: suggestion.priority,
    urgency,
    title: suggestion.title,
    description: suggestion.description,
    summary: suggestion.description.substring(0, 100),
    actionUrl: suggestion.actionUrl,
    actionLabel: suggestion.actionLabel,
    createdAt: suggestion.createdAt,
    expiresAt: suggestion.expiresAt,
    dismissable: true,
    isExpanded: suggestion.isExpanded,
    isDismissed: suggestion.isDismissed,
  };
}

// Helper to convert Insight to AIInsight
export function insightToAIInsight(insight: Insight): AIInsight {
  const category: InsightCategory = insight.type === 'ANOMALY'
    ? 'EXPENSE_ANOMALY'
    : insight.type === 'TREND'
    ? 'CASH_FLOW'
    : 'GENERAL';

  return {
    id: insight.id,
    category,
    type: 'INSIGHT',
    priority: 'MEDIUM',
    urgency: 'LOW',
    title: insight.title,
    description: insight.description,
    summary: insight.description.substring(0, 100),
    metric: insight.value ? {
      label: insight.metric,
      value: insight.value,
      change: insight.change,
    } : undefined,
    createdAt: insight.createdAt,
    dismissable: true,
    isExpanded: insight.isExpanded,
  };
}

function categorizeFromType(type: SuggestionType): InsightCategory {
  switch (type) {
    case 'WARNING':
      return 'EXPENSE_ANOMALY';
    case 'DEADLINE':
      return 'PAYMENT_REMINDER';
    case 'INSIGHT':
      return 'GENERAL';
    case 'QUICK_ACTION':
      return 'GENERAL';
    case 'TIP':
      return 'TAX_OPTIMIZATION';
    default:
      return 'GENERAL';
  }
}

function priorityToUrgency(priority: SuggestionPriority): InsightUrgency {
  switch (priority) {
    case 'URGENT':
      return 'URGENT';
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'LOW':
      return 'LOW';
    default:
      return 'LOW';
  }
}
