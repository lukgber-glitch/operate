'use client'

import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'error'
}

// Mock data - replace with actual data from API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New employee added',
    description: 'Sarah Johnson has been added to the team',
    time: '5m ago',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'Invoice approved',
    description: 'Invoice #1234 has been approved',
    time: '1h ago',
    read: false,
    type: 'success',
  },
  {
    id: '3',
    title: 'Tax deadline reminder',
    description: 'VAT filing deadline in 3 days',
    time: '2h ago',
    read: true,
    type: 'warning',
  },
]

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs font-normal text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No notifications
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'relative flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  !notification.read && 'bg-slate-50 dark:bg-slate-800/30'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {notification.title}
                    </p>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {notification.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button className="w-full cursor-pointer text-center text-sm">
            View all notifications
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
