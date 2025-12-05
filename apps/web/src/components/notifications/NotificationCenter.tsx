"use client"

import { useState } from 'react'
import { CheckCheck, Inbox, Settings, Filter, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import type { NotificationCategory, NotificationPriority } from '@/types/notifications'

import { NotificationItem } from './NotificationItem'

type FilterType = 'all' | NotificationCategory
type SortType = 'recent' | 'priority' | 'unread'

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('recent')

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true

    // Map notification type to category
    const categoryMap: Record<string, NotificationCategory> = {
      INVOICE_DUE: 'invoice',
      INVOICE_PAID: 'invoice',
      INVOICE_OVERDUE: 'invoice',
      PAYMENT_RECEIVED: 'payment',
      EXPENSE_APPROVED: 'expense',
      EXPENSE_REJECTED: 'expense',
      TASK_ASSIGNED: 'task',
      DOCUMENT_CLASSIFIED: 'document',
      TAX_DEADLINE: 'tax',
      CLIENT_ACTIVITY: 'client',
      AI_SUGGESTION: 'ai',
      SYSTEM_UPDATE: 'system',
      SYSTEM_ALERT: 'system',
      SYSTEM: 'system',
    }

    return categoryMap[notification.type] === filter
  })

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === 'priority') {
      const priorityOrder: Record<NotificationPriority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    } else if (sortBy === 'unread') {
      return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1
    }
    return 0
  })

  const unreadNotifications = sortedNotifications.filter((n) => !n.isRead)
  const readNotifications = sortedNotifications.filter((n) => n.isRead)
  const hasUnread = unreadNotifications.length > 0

  // Category counts
  const categoryCounts: Record<NotificationCategory, number> = {
    invoice: notifications.filter((n) => ['INVOICE_DUE', 'INVOICE_PAID', 'INVOICE_OVERDUE'].includes(n.type)).length,
    payment: notifications.filter((n) => n.type === 'PAYMENT_RECEIVED').length,
    expense: notifications.filter((n) => ['EXPENSE_APPROVED', 'EXPENSE_REJECTED'].includes(n.type)).length,
    task: notifications.filter((n) => n.type === 'TASK_ASSIGNED').length,
    document: notifications.filter((n) => n.type === 'DOCUMENT_CLASSIFIED').length,
    tax: notifications.filter((n) => n.type === 'TAX_DEADLINE').length,
    client: notifications.filter((n) => n.type === 'CLIENT_ACTIVITY').length,
    ai: notifications.filter((n) => n.type === 'AI_SUGGESTION').length,
    system: notifications.filter((n) => ['SYSTEM_UPDATE', 'SYSTEM_ALERT', 'SYSTEM'].includes(n.type)).length,
  }

  if (notifications.length === 0) {
    return (
      <div className="w-[400px] p-8 text-center">
        <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium">No notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You&apos;re all caught up!
        </p>
      </div>
    )
  }

  return (
    <div className="w-[480px]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadNotifications.length} unread
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Link href="/settings/notifications" passHref>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Notification settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and sorting */}
        <div className="mt-4 flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="h-8 w-[140px]">
              <Filter className="mr-2 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
              </SelectItem>
              <SelectItem value="invoice">
                Invoices <Badge variant="secondary" className="ml-2">{categoryCounts.invoice}</Badge>
              </SelectItem>
              <SelectItem value="payment">
                Payments <Badge variant="secondary" className="ml-2">{categoryCounts.payment}</Badge>
              </SelectItem>
              <SelectItem value="task">
                Tasks <Badge variant="secondary" className="ml-2">{categoryCounts.task}</Badge>
              </SelectItem>
              <SelectItem value="document">
                Documents <Badge variant="secondary" className="ml-2">{categoryCounts.document}</Badge>
              </SelectItem>
              <SelectItem value="tax">
                Tax <Badge variant="secondary" className="ml-2">{categoryCounts.tax}</Badge>
              </SelectItem>
              <SelectItem value="system">
                System <Badge variant="secondary" className="ml-2">{categoryCounts.system}</Badge>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="unread">Unread first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification list with tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="all" className="flex-1">
            All
            <Badge variant="secondary" className="ml-2">
              {sortedNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1">
            Unread
            <Badge variant="secondary" className="ml-2">
              {unreadNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="read" className="flex-1">
            Read
            <Badge variant="secondary" className="ml-2">
              {readNotifications.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <ScrollArea className="h-[440px]">
            <div className="space-y-2 p-2">
              {sortedNotifications.length > 0 ? (
                sortedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="m-0">
          <ScrollArea className="h-[440px]">
            <div className="space-y-2 p-2">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="read" className="m-0">
          <ScrollArea className="h-[440px]">
            <div className="space-y-2 p-2">
              {readNotifications.length > 0 ? (
                readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Trash2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No read notifications</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

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
