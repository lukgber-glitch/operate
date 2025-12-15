"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

import { useToast } from '@/components/ui/use-toast'
import type {
  Notification,
  NotificationChannel,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notifications'

// Re-export types for backward compatibility
export type {
  Notification,
  NotificationChannel,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
}

// Connection status type
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// SSE Reconnection config
const SSE_RECONNECT_CONFIG = {
  initialDelay: 1000,    // 1 second
  maxDelay: 30000,       // 30 seconds max
  multiplier: 2,         // Exponential backoff multiplier
  maxRetries: 10,        // Max retry attempts before giving up
}

export function useNotifications() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')

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
    staleTime: 30000, // Data stays fresh for 30 seconds
  })

  // Memoized unread count to prevent unnecessary recalculations
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // Calculate next reconnect delay with exponential backoff
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      SSE_RECONNECT_CONFIG.initialDelay * Math.pow(SSE_RECONNECT_CONFIG.multiplier, retryCountRef.current),
      SSE_RECONNECT_CONFIG.maxDelay
    )
    return delay
  }, [])

  // Cleanup SSE connection
  const cleanupConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setConnectionStatus('disconnected')
      return
    }

    // Cleanup any existing connection
    cleanupConnection()
    setConnectionStatus('connecting')

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/notifications/stream?token=${token}`
    )

    eventSource.onopen = () => {
      setConnectionStatus('connected')
      retryCountRef.current = 0 // Reset retry count on successful connection
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle heartbeat
        if (data.type === 'heartbeat') {
          return
        }

        const notification: Notification = data

        // Update cache with new notification (optimistic update)
        queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
          // Prevent duplicates
          if (old.some((n) => n.id === notification.id)) {
            return old
          }
          return [notification, ...old]
        })

        // Show toast for new notification
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.priority === 'URGENT' ? 'destructive' : 'default',
        })
      } catch (parseError) {
        console.error('Failed to parse SSE message:', parseError)
      }
    }

    eventSource.onerror = () => {
      setConnectionStatus('error')
      eventSource.close()

      // Attempt reconnection with exponential backoff
      if (retryCountRef.current < SSE_RECONNECT_CONFIG.maxRetries) {
        const delay = getReconnectDelay()
        retryCountRef.current += 1

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE()
        }, delay)
      } else {
        setConnectionStatus('disconnected')
        console.error('SSE connection failed after max retries')
      }
    }

    eventSourceRef.current = eventSource
  }, [queryClient, toast, cleanupConnection, getReconnectDelay])

  // SSE connection lifecycle
  useEffect(() => {
    connectSSE()

    // Reconnect when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus !== 'connected') {
        retryCountRef.current = 0 // Reset retry count
        connectSSE()
      }
    }

    // Handle online/offline
    const handleOnline = () => {
      retryCountRef.current = 0 // Reset retry count
      connectSSE()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      cleanupConnection()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [connectSSE, cleanupConnection, connectionStatus])

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.patch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )

      return { previous }
    },
    onError: (err, notificationId, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_BASE_URL}/api/notifications/read-all`,
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
        old.map((n) => ({ ...n, isRead: true }))
      )

      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
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
    onError: (err, notificationId, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
  })

  // Batch mark as read mutation (more efficient for bulk operations)
  const batchMarkAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/batch/read`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      return response.data
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      )

      return { previous }
    },
    onError: (err, ids, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Batch delete mutation (more efficient for bulk operations)
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/batch/delete`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      return response.data
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.filter((n) => !ids.includes(n.id))
      )

      return { previous }
    },
    onError: (err, ids, context) => {
      queryClient.setQueryData(['notifications'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Fetch preferences
  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      return response.data
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  })

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const response = await axios.patch(
        `${API_BASE_URL}/api/notifications/preferences`,
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

  // Batch operations (more efficient for bulk actions)
  const batchMarkAsRead = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        batchMarkAsReadMutation.mutate(ids)
      }
    },
    [batchMarkAsReadMutation]
  )

  const batchDelete = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        batchDeleteMutation.mutate(ids)
      }
    },
    [batchDeleteMutation]
  )

  const updatePreferences = useCallback(
    (newPreferences: Partial<NotificationPreferences>) => {
      updatePreferencesMutation.mutate(newPreferences)
    },
    [updatePreferencesMutation]
  )

  // Manual reconnect function
  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connectSSE()
  }, [connectSSE])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    // Batch operations
    batchMarkAsRead,
    batchDelete,
    preferences,
    updatePreferences,
    // Connection status
    connectionStatus,
    reconnect,
  }
}
