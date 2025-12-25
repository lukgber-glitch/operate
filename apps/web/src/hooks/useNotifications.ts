"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState, useEffect, useCallback, useRef } from 'react'

import { useToast } from '@/components/ui/use-toast'
import type { Notification, NotificationPreferences } from '@/types/notifications'

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
      `${API_BASE_URL}/notifications/stream?token=${token}`
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

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
    }
  }, [queryClient, toast])

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )

      return { previous }
    },
    onError: (_err, _notificationId, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.patch(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )

      return { previous }
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.filter((n) => n.id !== notificationId)
      )

      return { previous }
    },
    onError: (_err, _notificationId, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Default preferences when endpoint doesn't exist
  const defaultChannel = { inApp: true, email: true, push: true }
  const defaultPreferences: NotificationPreferences = {
    doNotDisturb: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    INVOICE_DUE: defaultChannel,
    PAYMENT_RECEIVED: defaultChannel,
    TASK_ASSIGNED: defaultChannel,
    DOCUMENT_CLASSIFIED: defaultChannel,
    TAX_DEADLINE: defaultChannel,
    SYSTEM_UPDATE: defaultChannel,
    SYSTEM: defaultChannel,
  }

  // Fetch preferences - returns defaults if endpoint doesn't exist
  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/notifications/preferences`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        return response.data
      } catch (error: any) {
        // Return defaults if endpoint doesn't exist (404)
        if (error?.response?.status === 404) {
          console.debug('[Notifications] Preferences endpoint not available, using defaults')
          return defaultPreferences
        }
        throw error
      }
    },
  })

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/preferences`,
        newPreferences,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      })
    },
  })

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId)
    },
    [markAsReadMutation]
  )

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId)
    },
    [deleteNotificationMutation]
  )

  const updatePreferences = useCallback(
    (newPreferences: Partial<NotificationPreferences>) => {
      updatePreferencesMutation.mutate(newPreferences)
    },
    [updatePreferencesMutation]
  )

  return {
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

// Export types for backward compatibility
export type { Notification, NotificationPreferences }
export type NotificationType = Notification['type']
export type NotificationPriority = Notification['priority']
