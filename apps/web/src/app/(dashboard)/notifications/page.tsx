"use client"

import {
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  Inbox
} from 'lucide-react'
import { useState } from 'react'

import { NotificationItem } from '@/components/notifications/NotificationItem'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications, NotificationType } from '@/hooks/use-notifications'
const ITEMS_PER_PAGE = 20



export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Tab filter
    if (activeTab === 'unread' && notification.isRead) return false

    // Type filter
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }

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
  // Preserve for future use
  void handleSelectAll

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

  if (activeTab === 'preferences') {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">Manage how you receive notifications</p>
          </div>
          <Button variant="outline" onClick={() => setActiveTab('all')}>
            Back to Notifications
          </Button>
        </div>
        <NotificationPreferences />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('preferences')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-[24px]">
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

          {/* Filters and search */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as any)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INVOICE_DUE">Invoice Due</SelectItem>
                <SelectItem value="TASK_ASSIGNED">Task Assigned</SelectItem>
                <SelectItem value="DOCUMENT_CLASSIFIED">Document Classified</SelectItem>
                <SelectItem value="TAX_DEADLINE">Tax Deadline</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
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
              <Inbox className="mx-auto h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No notifications found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== 'all'
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
                        onRead={markAsRead}
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
                  <p className="text-sm text-muted-foreground">
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
