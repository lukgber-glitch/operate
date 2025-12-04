// Notification Type Definitions for Operate/CoachOS

export type NotificationType =
  | 'INVOICE_DUE'
  | 'PAYMENT_RECEIVED'
  | 'TASK_ASSIGNED'
  | 'DOCUMENT_CLASSIFIED'
  | 'TAX_DEADLINE'
  | 'SYSTEM_UPDATE'
  | 'SYSTEM'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type NotificationCategory =
  | 'invoice'
  | 'payment'
  | 'task'
  | 'document'
  | 'tax'
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
