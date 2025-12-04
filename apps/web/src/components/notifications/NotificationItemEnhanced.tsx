"use client"

import { useRouter } from 'next/navigation'
import {
  FileText,
  CheckSquare,
  FileSearch,
  Calendar,
  Bell,
  X,
  ExternalLink,
  DollarSign,
  Receipt,
  XCircle,
  CheckCircle,
  Users,
  Sparkles,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Notification } from '@/types/notifications'
import { cn, formatRelativeTime } from '@/lib/utils'

interface NotificationItemEnhancedProps {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (notification: Notification) => void
}

const notificationConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  INVOICE_PAID: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    label: 'Invoice Paid',
  },
  INVOICE_OVERDUE: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    label: 'Invoice Overdue',
  },
  INVOICE_DUE: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    label: 'Invoice Due',
  },
  PAYMENT_RECEIVED: {
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    label: 'Payment Received',
  },
  EXPENSE_APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    label: 'Expense Approved',
  },
  EXPENSE_REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    label: 'Expense Rejected',
  },
  TASK_ASSIGNED: {
    icon: CheckSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    label: 'Task Assigned',
  },
  DOCUMENT_CLASSIFIED: {
    icon: FileSearch,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    label: 'Document Classified',
  },
  TAX_DEADLINE: {
    icon: Calendar,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    label: 'Tax Deadline',
  },
  CLIENT_ACTIVITY: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    label: 'Client Activity',
  },
  AI_SUGGESTION: {
    icon: Sparkles,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    label: 'AI Suggestion',
  },
  SYSTEM_UPDATE: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    label: 'System Update',
  },
  SYSTEM_ALERT: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    label: 'System Alert',
  },
  SYSTEM: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    label: 'System',
  },
}

const priorityColors = {
  LOW: 'border-l-gray-300',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-400',
  URGENT: 'border-l-red-500',
}

export function NotificationItemEnhanced({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemEnhancedProps) {
  const router = useRouter()
  const config = notificationConfig[notification.type] || notificationConfig.SYSTEM
  const Icon = config.icon

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id)
    }

    // Navigate to related entity if actionUrl exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.metadata?.link) {
      router.push(notification.metadata.link)
    }

    onClick?.(notification)
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.metadata?.link) {
      router.push(notification.metadata.link)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg border-l-4 p-4 transition-all hover:bg-accent/50 cursor-pointer',
        priorityColors[notification.priority],
        !notification.isRead && 'bg-accent/30'
      )}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 rounded-full p-2', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-none">{notification.title}</p>
          {!notification.isRead && (
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"
              title="Unread"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatRelativeTime(notification.createdAt)}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-muted-foreground/80">{config.label}</span>
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex flex-shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {(notification.actionUrl || notification.metadata?.link) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleExternalLink}
            title="Go to details"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open link</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
          title="Delete notification"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Delete notification</span>
        </Button>
      </div>
    </div>
  )
}
