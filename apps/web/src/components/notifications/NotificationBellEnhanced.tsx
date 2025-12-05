"use client"

import { useEffect } from 'react'
import { Bell } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

import { NotificationCenterEnhanced } from './NotificationCenterEnhanced'

interface NotificationBellEnhancedProps {
  className?: string
}

export function NotificationBellEnhanced({ className }: NotificationBellEnhancedProps) {
  const { unreadCount } = useNotifications()

  // Update app badge for mobile devices and PWA
  useEffect(() => {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge?.(unreadCount).catch(err => {
          console.error('Failed to set app badge:', err)
        })
      } else {
        navigator.clearAppBadge?.().catch(err => {
          console.error('Failed to clear app badge:', err)
        })
      }
    }

    // Update document title with unread count
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Operate - Business Management`
    } else {
      document.title = 'Operate - Business Management'
    }
  }, [unreadCount])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs font-semibold animate-in fade-in zoom-in duration-200"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
        <NotificationCenterEnhanced />
      </PopoverContent>
    </Popover>
  )
}
