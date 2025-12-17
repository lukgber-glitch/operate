"use client"

import {
  CheckCheck,
  Trash2,
  Filter,
  Inbox,
  Bell,
  AlertCircle,
  Mail,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { NotificationItem } from '@/components/notifications/NotificationItem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications, NotificationCategory } from '@/hooks/use-notifications'

const ITEMS_PER_PAGE = 20

type CategoryFilter = NotificationCategory | 'all'

export default function NotificationInboxPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Tab filter (all/unread)
    if (activeTab === 'unread' && notification.isRead) return false

    // Category filter
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedNotifications.map((n) => n.id)))
    }
  }

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteNotification(id))
    setSelectedIds(new Set())
  }

  const handleBulkMarkRead = () => {
    selectedIds.forEach((id) => {
      const notification = notifications.find((n) => n.id === id)
      if (notification && !notification.isRead) {
        markAsRead(id)
      }
    })
    setSelectedIds(new Set())
  }

  const handleToggleReadStatus = (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    if (notification && !notification.isRead) {
      markAsRead(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/notifications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notifications
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Notification Inbox</h1>
          <p className="text-white/70">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedIds.size === paginatedNotifications.length ? 'Deselect all' : 'Select all'}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-[16px]">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator className="my-4" />

            {/* Category Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      All Categories
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Alerts
                    </div>
                  </SelectItem>
                  <SelectItem value="invoice">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Updates
                    </div>
                  </SelectItem>
                  <SelectItem value="task">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Messages
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-white/70">
                Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-accent p-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkMarkRead}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            <div>
              {/* Notification list */}
              {paginatedNotifications.length === 0 ? (
                <div className="py-16 text-center">
                  <Inbox className="mx-auto h-16 w-16 text-white/70/50" />
                  <h3 className="mt-4 text-lg font-semibold">No notifications found</h3>
                  <p className="mt-2 text-sm text-white/70">
                    {categoryFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedNotifications.map((notification) => (
                      <div key={notification.id} className="relative">
                        <input
                          type="checkbox"
                          className="absolute left-2 top-2 z-10 h-4 w-4 cursor-pointer"
                          checked={selectedIds.has(notification.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedIds)
                            if (e.target.checked) {
                              newSelected.add(notification.id)
                            } else {
                              newSelected.delete(notification.id)
                            }
                            setSelectedIds(newSelected)
                          }}
                        />
                        <div className="pl-8">
                          <NotificationItem
                            notification={notification}
                            onRead={handleToggleReadStatus}
                            onDelete={deleteNotification}
                            onClick={(n) => {
                              if (n.metadata?.link) {
                                window.location.href = n.metadata.link
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-white/70">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length)} of{' '}
                        {filteredNotifications.length}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
