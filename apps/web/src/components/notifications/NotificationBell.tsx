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
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

import { NotificationCenter } from './NotificationCenter'

interface NotificationBellProps {
  className?: string
  useEnhancedCenter?: boolean
}

export function NotificationBell({ className, useEnhancedCenter = true }: NotificationBellProps) {
  const { unreadCount } = useNotifications()

  // Update app badge for mobile devices
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
              className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs font-semibold animate-in fade-in zoom-in"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        {useEnhancedCenter ? <NotificationCenter /> : null}
      </PopoverContent>
    </Popover>
  )
}
