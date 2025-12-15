"use client"

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Inbox, Loader2 } from 'lucide-react'

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
  /** Enable virtualization for large lists (renders items on demand) */
  virtualized?: boolean
  /** Number of items to render initially when virtualized */
  initialRenderCount?: number
  /** Number of items to add when scrolling to bottom */
  loadMoreCount?: number
}

interface GroupedNotifications {
  today: Notification[]
  yesterday: Notification[]
  thisWeek: Notification[]
  older: Notification[]
}

// Virtualization constants
const VIRTUALIZATION_THRESHOLD = 50 // Enable virtualization for lists > 50 items
const DEFAULT_INITIAL_RENDER = 20
const DEFAULT_LOAD_MORE = 15
const SCROLL_THRESHOLD = 100 // px from bottom to trigger load more

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

/**
 * Hook for virtualized list rendering
 * Renders items progressively as user scrolls
 */
function useVirtualizedList<T>(
  items: T[],
  initialCount: number,
  loadMoreCount: number,
  enabled: boolean
) {
  const [renderedCount, setRenderedCount] = useState(initialCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Reset when items change
  useEffect(() => {
    setRenderedCount(Math.min(initialCount, items.length))
  }, [items.length, initialCount])

  const loadMore = useCallback(() => {
    if (!enabled || isLoadingMore || renderedCount >= items.length) return

    setIsLoadingMore(true)
    // Small delay to show loading indicator and prevent rapid firing
    requestAnimationFrame(() => {
      setRenderedCount((prev) => Math.min(prev + loadMoreCount, items.length))
      setIsLoadingMore(false)
    })
  }, [enabled, isLoadingMore, renderedCount, items.length, loadMoreCount])

  const visibleItems = enabled ? items.slice(0, renderedCount) : items
  const hasMore = enabled && renderedCount < items.length
  const remainingCount = items.length - renderedCount

  return {
    visibleItems,
    hasMore,
    remainingCount,
    isLoadingMore,
    loadMore,
  }
}

export function NotificationList({
  notifications,
  onRead,
  onDelete,
  onItemClick,
  groupByDate = true,
  maxHeight = '440px',
  virtualized,
  initialRenderCount = DEFAULT_INITIAL_RENDER,
  loadMoreCount = DEFAULT_LOAD_MORE,
}: NotificationListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-enable virtualization for large lists
  const shouldVirtualize = virtualized ?? notifications.length > VIRTUALIZATION_THRESHOLD

  const {
    visibleItems,
    hasMore,
    remainingCount,
    isLoadingMore,
    loadMore,
  } = useVirtualizedList(
    notifications,
    initialRenderCount,
    loadMoreCount,
    shouldVirtualize
  )

  // Handle scroll to load more
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore) return

      const target = event.currentTarget
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

      if (scrollBottom < SCROLL_THRESHOLD) {
        loadMore()
      }
    },
    [hasMore, loadMore]
  )

  const groupedNotifications = useMemo(
    () => (groupByDate ? groupNotificationsByDate(visibleItems) : null),
    [visibleItems, groupByDate]
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

  // Load more indicator component
  const LoadMoreIndicator = () => {
    if (!hasMore) return null

    return (
      <div className="flex items-center justify-center py-4">
        {isLoadingMore ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <button
            onClick={loadMore}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Load {Math.min(loadMoreCount, remainingCount)} more ({remainingCount} remaining)
          </button>
        )}
      </div>
    )
  }

  if (!groupByDate) {
    return (
      <ScrollArea style={{ height: maxHeight }}>
        <div
          ref={scrollRef}
          className="space-y-2 p-2"
          onScroll={handleScroll}
        >
          {visibleItems.map((notification) => (
            <NotificationItemEnhanced
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onDelete={onDelete}
              onClick={onItemClick}
            />
          ))}
          <LoadMoreIndicator />
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
      <div
        ref={scrollRef}
        className="space-y-4 pb-2"
        onScroll={handleScroll}
      >
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

        <LoadMoreIndicator />
      </div>
    </ScrollArea>
  )
}
