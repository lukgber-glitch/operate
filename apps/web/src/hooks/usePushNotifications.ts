"use client"

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

import type { PushPermissionState, PushSubscriptionData } from '@/types/notifications'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function usePushNotifications() {
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const { toast } = useToast()

  // Check initial permission state and subscription
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    const checkPermissionAndSubscription = async () => {
      // Check permission
      const permission = Notification.permission as PushPermissionState
      setPermissionState(permission)

      // Check if already subscribed
      if ('serviceWorker' in navigator && permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready
          const existingSubscription = await registration.pushManager.getSubscription()

          if (existingSubscription) {
            setSubscription(existingSubscription)
            setIsSubscribed(true)
          }
        } catch (error) {
          console.error('Error checking push subscription:', error)
        }
      }
    }

    checkPermissionAndSubscription()
  }, [])

  // Request push notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      })
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission as PushPermissionState)

      if (permission === 'granted') {
        toast({
          title: 'Permission granted',
          description: 'You will now receive push notifications.',
        })
        return true
      } else if (permission === 'denied') {
        toast({
          title: 'Permission denied',
          description: 'Push notifications have been blocked. You can enable them in your browser settings.',
          variant: 'destructive',
        })
        return false
      }

      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      })
      return false
    }
  }, [toast])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      })
      return false
    }

    setIsLoading(true)

    try {
      // Request permission if not already granted
      if (permissionState !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          setIsLoading(false)
          return false
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check if already subscribed
      let pushSubscription = await registration.pushManager.getSubscription()

      if (!pushSubscription) {
        // Get VAPID public key from server
        const { data: config } = await axios.get(`${API_BASE_URL}/api/notifications/push/config`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        // Subscribe to push notifications
        const keyArray = urlBase64ToUint8Array(config.vapidPublicKey)
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray.buffer as ArrayBuffer,
        })
      }

      // Send subscription to server
      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')),
        },
      }

      await axios.post(
        `${API_BASE_URL}/api/notifications/push/subscribe`,
        subscriptionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      setSubscription(pushSubscription)
      setIsSubscribed(true)

      toast({
        title: 'Subscribed',
        description: 'You are now subscribed to push notifications.',
      })

      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      toast({
        title: 'Subscription failed',
        description: 'Failed to subscribe to push notifications. Please try again.',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [permissionState, requestPermission, toast])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) {
      return true
    }

    setIsLoading(true)

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe()

      // Remove subscription from server
      await axios.post(
        `${API_BASE_URL}/api/notifications/push/unsubscribe`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      setSubscription(null)
      setIsSubscribed(false)

      toast({
        title: 'Unsubscribed',
        description: 'You have been unsubscribed from push notifications.',
      })

      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      toast({
        title: 'Unsubscribe failed',
        description: 'Failed to unsubscribe from push notifications. Please try again.',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription, toast])

  // Test push notification
  const testNotification = useCallback(async () => {
    if (permissionState !== 'granted') {
      toast({
        title: 'Permission required',
        description: 'Please grant notification permission first.',
        variant: 'destructive',
      })
      return
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/notifications/push/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      toast({
        title: 'Test sent',
        description: 'A test notification has been sent.',
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast({
        title: 'Test failed',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      })
    }
  }, [permissionState, toast])

  return {
    permissionState,
    isSubscribed,
    isLoading,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
  }
}

// Helper functions

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    // Safe access - we know i is within bounds due to loop condition
    binary += String.fromCharCode(bytes[i]!)
  }
  return window.btoa(binary)
}
