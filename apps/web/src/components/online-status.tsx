'use client'

import { useServiceWorker } from '@/hooks/use-service-worker'
import { Wifi, WifiOff } from 'lucide-react'

interface OnlineStatusProps {
  showWhenOnline?: boolean
  className?: string
}

export function OnlineStatus({ showWhenOnline = false, className = '' }: OnlineStatusProps) {
  const { isOnline } = useServiceWorker()

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) {
    return null
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
        isOnline
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      } ${className}`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  )
}
