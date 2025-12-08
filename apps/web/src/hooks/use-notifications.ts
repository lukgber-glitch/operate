"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState, useEffect, useCallback, useRef } from 'react'

import { useToast } from '@/components/ui/use-toast'

export type NotificationType =
  | 'INVOICE_DUE'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'TASK_ASSIGNED'
  | 'DOCUMENT_CLASSIFIED'
  | 'TAX_DEADLINE'
  | 'CLIENT_ACTIVITY'
  | 'AI_SUGGESTION'
  | 'SYSTEM_UPDATE'
  | 'SYSTEM_ALERT'
  | 'SYSTEM'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type NotificationCategory =
  | 'invoice'
  | 'payment'
  | 'expense'
  | 'task'
  | 'document'
  | 'tax'
  | 'client'
  | 'ai'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority: NotificationPriority
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
  readAt?: string
  actionUrl?: string
}

export interface NotificationChannel {
  inApp: boolean
  email: boolean
  push: boolean
}

export interface NotificationPreferences {
  doNotDisturb?: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  INVOICE_DUE?: NotificationChannel
  PAYMENT_RECEIVED?: NotificationChannel
  TASK_ASSIGNED?: NotificationChannel
  DOCUMENT_CLASSIFIED?: NotificationChannel
  TAX_DEADLINE?: NotificationChannel
  SYSTEM_UPDATE?: NotificationChannel
  SYSTEM?: NotificationChannel
  [key: string]: NotificationChannel | boolean | string | undefined
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch notifications list
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter((n) => !n.isRead).length
    setUnreadCount(count)
  }, [notifications])

  // SSE connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/notifications/stream?token=${token}`
    )

    eventSource.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data)

      // Update cache with new notification
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => [
        notification,
        ...old,
      ])

      // Show toast for new notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'URGENT' ? 'destructive' : 'default',
      })
    }

    eventSource.onerror = (error) => {  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
  }
}
