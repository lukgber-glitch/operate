"use client"

import { useMemo } from 'react'
import { Inbox } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { Notification } from '@/types/notifications'

import { NotificationItemEnhanced } from './NotificationItemEnhanced'

interface NotificationListProps {
  notifications: Notification[]
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onItemClick?: (notification: Notification) => void
  groupByDate?: boolean
  maxHeight?: string
}

interface GroupedNotifications {
  today: Notification[]
  yesterday: Notification[]
  thisWeek: Notification[]
  older: Notification[]
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return date > weekAgo && !isToday(date) && !isYesterday(date)
}

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt)

    if (isToday(date)) {
      grouped.today.push(notification)
    } else if (isYesterday(date)) {
      grouped.yesterday.push(notification)
    } else if (isThisWeek(date)) {
      grouped.thisWeek.push(notification)
    } else {
      grouped.older.push(notification)
    }
  })

  return grouped
}

export function NotificationList({
  notifications,
  onRead,
  onDelete,
  onItemClick,
  groupByDate = true,
  maxHeight = '440px',
}: NotificationListProps) {
  const groupedNotifications = useMemo(
    () => (groupByDate ? groupNotificationsByDate(notifications) : null),
    [notifications, groupByDate]
  )

  if (notifications.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-center">
        <div>
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No notifications</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You&apos;re all caught up!
          </p>
        </div>
      </div>
    )
  }

  if (!groupByDate) {
    return (
      <ScrollArea style={{ height: maxHeight }}>
        <div className="space-y-2 p-2">
          {notifications.map((notification) => (
            <NotificationItemEnhanced
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onDelete={onDelete}
              onClick={onItemClick}
            />
          ))}
        </div>
      </ScrollArea>
    )
  }

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null

    return (
      <div key={title}>
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            {title}
          </h4>
        </div>
        <div className="space-y-2 px-2">
          {items.map((notification) => (
            <NotificationItemEnhanced
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onDelete={onDelete}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea style={{ height: maxHeight }}>
      <div className="space-y-4 pb-2">
        {renderGroup('Today', groupedNotifications!.today)}
        {groupedNotifications!.today.length > 0 &&
         groupedNotifications!.yesterday.length > 0 && <Separator />}

        {renderGroup('Yesterday', groupedNotifications!.yesterday)}
        {groupedNotifications!.yesterday.length > 0 &&
         groupedNotifications!.thisWeek.length > 0 && <Separator />}

        {renderGroup('This Week', groupedNotifications!.thisWeek)}
        {groupedNotifications!.thisWeek.length > 0 &&
         groupedNotifications!.older.length > 0 && <Separator />}

        {renderGroup('Older', groupedNotifications!.older)}
      </div>
    </ScrollArea>
  )
}
