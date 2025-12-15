"use client"

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ConnectionStatus } from '@/hooks/use-notifications'

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus
  onReconnect?: () => void
  className?: string
  showLabel?: boolean
  compact?: boolean
}

const statusConfig: Record<
  ConnectionStatus,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    color: string
    bgColor: string
    animate?: boolean
  }
> = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    description: 'Real-time updates active',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting',
    description: 'Establishing connection...',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true,
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    description: 'Click to reconnect',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  error: {
    icon: AlertCircle,
    label: 'Connection Error',
    description: 'Failed to connect. Click to retry.',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

export function ConnectionStatusIndicator({
  status,
  onReconnect,
  className,
  showLabel = false,
  compact = false,
}: ConnectionStatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const canReconnect = status === 'disconnected' || status === 'error'

  // Pulse animation for connected state
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    if (status === 'connected') {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleClick = () => {
    if (canReconnect && onReconnect) {
      onReconnect()
    }
  }

  const indicator = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all',
        config.bgColor,
        canReconnect && 'cursor-pointer hover:opacity-80',
        compact && 'px-1.5 py-0.5',
        className
      )}
      onClick={handleClick}
      role={canReconnect ? 'button' : undefined}
      tabIndex={canReconnect ? 0 : undefined}
      onKeyDown={(e) => {
        if (canReconnect && (e.key === 'Enter' || e.key === ' ')) {
          handleClick()
        }
      }}
    >
      {/* Icon */}
      <span className="relative">
        <Icon
          className={cn(
            compact ? 'h-3 w-3' : 'h-4 w-4',
            config.color,
            config.animate && 'animate-spin'
          )}
        />
        {/* Pulse animation for connected */}
        {showPulse && status === 'connected' && (
          <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75" />
        )}
      </span>

      {/* Label */}
      {showLabel && (
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
        </span>
      )}

      {/* Reconnect button for error/disconnected */}
      {canReconnect && !compact && (
        <RefreshCw
          className={cn('h-3 w-3 opacity-60', config.color)}
        />
      )}
    </div>
  )

  // Wrap with tooltip if not showing label
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-center">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return indicator
}

/**
 * Compact inline status dot
 */
export function ConnectionStatusDot({
  status,
  className,
}: {
  status: ConnectionStatus
  className?: string
}) {
  const colorMap: Record<ConnectionStatus, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-blue-500 animate-pulse',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
  }

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        colorMap[status],
        className
      )}
      title={statusConfig[status].label}
    />
  )
}

/**
 * Full connection status banner (for prominent display)
 */
export function ConnectionStatusBanner({
  status,
  onReconnect,
  className,
}: {
  status: ConnectionStatus
  onReconnect?: () => void
  className?: string
}) {
  // Only show banner for disconnected/error states
  if (status === 'connected' || status === 'connecting') {
    return null
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-4 py-3',
        status === 'error'
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.color)} />
        <div>
          <p className="text-sm font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reconnect
        </Button>
      )}
    </div>
  )
}
