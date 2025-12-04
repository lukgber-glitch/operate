import { CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ConnectionStatusType =
  | 'connected'
  | 'disconnected'
  | 'pending'
  | 'syncing'
  | 'error'
  | 'expired'

interface ConnectionStatusProps {
  status: ConnectionStatusType
  className?: string
}

const statusConfig = {
  connected: {
    label: 'Connected',
    variant: 'default' as const,
    icon: CheckCircle2,
    className: 'bg-green-500 hover:bg-green-500/80 text-white border-green-500',
  },
  disconnected: {
    label: 'Disconnected',
    variant: 'secondary' as const,
    icon: XCircle,
    className: 'bg-gray-500 hover:bg-gray-500/80 text-white border-gray-500',
  },
  pending: {
    label: 'Pending',
    variant: 'outline' as const,
    icon: Clock,
    className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  },
  syncing: {
    label: 'Syncing',
    variant: 'outline' as const,
    icon: RefreshCw,
    className: 'border-blue-500 text-blue-700 dark:text-blue-400',
  },
  error: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'bg-red-500 hover:bg-red-500/80 text-white border-red-500',
  },
  expired: {
    label: 'Expired',
    variant: 'outline' as const,
    icon: AlertCircle,
    className: 'border-orange-500 text-orange-700 dark:text-orange-400',
  },
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'syncing' && 'animate-spin')} />
      <span>{config.label}</span>
    </Badge>
  )
}
