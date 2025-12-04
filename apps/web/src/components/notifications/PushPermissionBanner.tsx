"use client"

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { permissionState, isSubscribed, subscribe, isLoading } = usePushNotifications()

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('push-banner-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
      return
    }

    // Show banner if permission is default and not subscribed
    if (permissionState === 'default' && !isSubscribed) {
      // Show after a short delay to avoid overwhelming the user
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [permissionState, isSubscribed])

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('push-banner-dismissed', 'true')
  }

  const handleRemindLater = () => {
    setIsVisible(false)
    // Don't set permanently dismissed, allow it to show again later
  }

  if (!isVisible || isDismissed || permissionState !== 'default') {
    return null
  }

  return (
    <Alert className="relative mb-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Stay updated with push notifications
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        Get instant alerts for important updates like invoice reminders, payment confirmations, and
        tax deadlines. You can customize which notifications you receive anytime.
      </AlertDescription>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={handleEnable}
          disabled={isLoading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isLoading ? 'Enabling...' : 'Enable notifications'}
        </Button>
        <Button
          onClick={handleRemindLater}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          Remind me later
        </Button>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          Don&apos;t ask again
        </Button>
      </div>

      <Button
        onClick={handleDismiss}
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}
