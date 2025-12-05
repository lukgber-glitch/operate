// Notification Type Definitions for Operate/CoachOS

export type NotificationType =
  | 'INVOICE_DUE'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'TASK_ASSIGNED'
  | 'DOCUMENT_CLASSIFIED'
  | 'TAX_DEADLINE'
  | 'CLIENT_ACTIVITY'
  | 'AI_SUGGESTION'
  | 'SYSTEM_UPDATE'
  | 'SYSTEM_ALERT'
  | 'SYSTEM'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type NotificationCategory =
  | 'invoice'
  | 'payment'
  | 'expense'
  | 'task'
  | 'document'
  | 'tax'
  | 'client'
  | 'ai'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority: NotificationPriority
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
  readAt?: string
  actionUrl?: string
}

export interface NotificationChannel {
  inApp: boolean
  email: boolean
  push: boolean
}

export interface NotificationPreferences {
  doNotDisturb?: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  INVOICE_DUE?: NotificationChannel
  PAYMENT_RECEIVED?: NotificationChannel
  TASK_ASSIGNED?: NotificationChannel
  DOCUMENT_CLASSIFIED?: NotificationChannel
  TAX_DEADLINE?: NotificationChannel
  SYSTEM_UPDATE?: NotificationChannel
  SYSTEM?: NotificationChannel
  [key: string]: NotificationChannel | boolean | string | undefined
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type PushPermissionState = 'default' | 'granted' | 'denied'

export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface NotificationFilter {
  category?: NotificationCategory[]
  priority?: NotificationPriority[]
  isRead?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byPriority: Record<NotificationPriority, number>
}

// ============================================================================
// Extended Notification Preferences (for Zustand Store)
// ============================================================================

export type SuggestionFrequency = 'realtime' | 'hourly' | 'daily' | 'off';
export type EmailDigestFrequency = 'daily' | 'weekly' | 'never';

export interface ExtendedNotificationPreferences {
  // Suggestion types
  showInvoiceSuggestions: boolean;
  showExpenseSuggestions: boolean;
  showTaxDeadlines: boolean;
  showBankAlerts: boolean;
  showAIInsights: boolean;

  // Frequency
  suggestionFrequency: SuggestionFrequency;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:MM" format
  quietHoursEnd: string;   // "HH:MM" format

  // Push notifications
  pushEnabled: boolean;
  pushPermission: PushPermissionState;

  // Email digests
  emailDigestEnabled: boolean;
  emailDigestFrequency: EmailDigestFrequency;
}

export type SuggestionTypeKey =
  | 'showInvoiceSuggestions'
  | 'showExpenseSuggestions'
  | 'showTaxDeadlines'
  | 'showBankAlerts'
  | 'showAIInsights';

export type SuggestionType =
  | 'invoice'
  | 'expense'
  | 'tax'
  | 'bank'
  | 'ai-insight';

export const SUGGESTION_TYPE_TO_KEY: Record<SuggestionType, SuggestionTypeKey> = {
  'invoice': 'showInvoiceSuggestions',
  'expense': 'showExpenseSuggestions',
  'tax': 'showTaxDeadlines',
  'bank': 'showBankAlerts',
  'ai-insight': 'showAIInsights',
};

export const DEFAULT_EXTENDED_NOTIFICATION_PREFERENCES: ExtendedNotificationPreferences = {
  showInvoiceSuggestions: true,
  showExpenseSuggestions: true,
  showTaxDeadlines: true,
  showBankAlerts: true,
  showAIInsights: true,
  suggestionFrequency: 'realtime',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  pushEnabled: false,
  pushPermission: 'default',
  emailDigestEnabled: true,
  emailDigestFrequency: 'weekly',
};
