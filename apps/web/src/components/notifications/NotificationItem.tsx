"use client"

import { memo, useCallback, useMemo } from 'react'
import {
  FileText,
  CheckSquare,
  FileSearch,
  Calendar,
  Bell,
  X,
  ExternalLink,
  CreditCard,
  Receipt,
  Users,
  Sparkles,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Notification, NotificationType } from '@/hooks/use-notifications'
import { cn, formatRelativeTime } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (notification: Notification) => void
}

const notificationConfig: Record<NotificationType, { icon: any; color: string; bgColor: string }> = {
  INVOICE_DUE: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  INVOICE_PAID: {
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  INVOICE_OVERDUE: {
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  PAYMENT_RECEIVED: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  EXPENSE_APPROVED: {
    icon: Receipt,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  EXPENSE_REJECTED: {
    icon: Receipt,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  TASK_ASSIGNED: {
    icon: CheckSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  DOCUMENT_CLASSIFIED: {
    icon: FileSearch,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  TAX_DEADLINE: {
    icon: Calendar,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  CLIENT_ACTIVITY: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  AI_SUGGESTION: {
    icon: Sparkles,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
  },
  SYSTEM_UPDATE: {
    icon: Bell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  SYSTEM_ALERT: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
  },
  SYSTEM: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
  },
}

const priorityColors = {
  LOW: 'border-l-gray-300',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-400',
  URGENT: 'border-l-red-500',
}

function NotificationItemComponent({ notification, onRead, onDelete, onClick }: NotificationItemProps) {
  // Memoize config lookup
  const config = useMemo(() => notificationConfig[notification.type], [notification.type])
  const Icon = config.icon

  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onRead(notification.id)
    }
    onClick?.(notification)
  }, [notification, onRead, onClick])

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg border-l-4 p-4 transition-all hover:bg-accent/50',
        priorityColors[notification.priority],
        !notification.isRead && 'bg-accent/30'
      )}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 rounded-full p-2', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-none">{notification.title}</p>
          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-blue-600" title="Unread" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex flex-shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {notification.metadata?.link && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = notification.metadata?.link
            }}
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
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Delete notification</span>
        </Button>
      </div>
    </div>
  )
}

export const NotificationItem = memo(NotificationItemComponent)
