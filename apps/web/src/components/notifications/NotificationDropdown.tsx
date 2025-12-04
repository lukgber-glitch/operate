"use client"

import { CheckCheck, Inbox } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/use-notifications'

import { NotificationItem } from './NotificationItem'


export function NotificationDropdown() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const recentNotifications = notifications.slice(0, 10)
  const hasUnread = notifications.some((n) => !n.isRead)

  if (notifications.length === 0) {
    return (
      <div className="w-80 p-8 text-center">
        <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium">No notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You&apos;re all caught up!
        </p>
      </div>
    )
  }

  return (
    <div className="w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-8 gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-2">
          {recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-2">
        <Link href="/notifications" passHref>
          <Button variant="ghost" className="w-full" size="sm">
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  )
}
