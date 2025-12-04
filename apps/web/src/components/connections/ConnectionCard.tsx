'use client'

import { ChevronDown, ChevronUp, Link2Off, RefreshCw, Eye, Unplug } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { ConnectionStatus, ConnectionStatusType } from './ConnectionStatus'


export interface Integration {
  id: string
  provider: string
  name: string
  status: ConnectionStatusType
  lastSync?: string
  logo?: string
  connectedAccounts?: Array<{
    id: string
    name: string
    type?: string
  }>
  error?: string
}

interface ConnectionCardProps {
  integration: Integration
  onDisconnect?: (id: string) => void
  onReconnect?: (id: string) => void
  onSyncNow?: (id: string) => void
  onViewDetails?: (id: string) => void
  className?: string
}

export function ConnectionCard({
  integration,
  onDisconnect,
  onReconnect,
  onSyncNow,
  onViewDetails,
  className,
}: ConnectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasAccounts = integration.connectedAccounts && integration.connectedAccounts.length > 0
  const isConnected = integration.status === 'connected'
  const isSyncing = integration.status === 'syncing'

  const handleSyncNow = () => {
    if (onSyncNow && !isSyncing) {
      onSyncNow(integration.id)
    }
  }

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {integration.logo ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                <img
                  src={integration.logo}
                  alt={integration.provider}
                  className="h-8 w-8 object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                <span className="text-xs font-semibold">
                  {integration.provider.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription className="text-xs">
                {integration.provider}
              </CardDescription>
            </div>
          </div>
          <ConnectionStatus status={integration.status} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {integration.lastSync && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(integration.lastSync).toLocaleString()}
          </p>
        )}
        {integration.error && (
          <p className="mt-2 text-xs text-destructive">{integration.error}</p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pb-3">
        <div className="flex w-full flex-wrap gap-2">
          {isConnected && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex-1"
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails?.(integration.id)}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Button>
            </>
          )}
          {(integration.status === 'error' || integration.status === 'expired') && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onReconnect?.(integration.id)}
              className="flex-1"
            >
              <Link2Off className="mr-2 h-4 w-4" />
              Reconnect
            </Button>
          )}
          {isConnected && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDisconnect?.(integration.id)}
              className="flex-1"
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>

        {hasAccounts && (
          <div className="w-full">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between"
            >
              <span className="text-xs">
                {integration.connectedAccounts?.length || 0} connected account
                {(integration.connectedAccounts?.length || 0) !== 1 ? 's' : ''}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && integration.connectedAccounts && (
              <div className="mt-2 space-y-1 rounded-md border bg-muted/50 p-2">
                {integration.connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-sm bg-background px-2 py-1.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{account.name}</span>
                      {account.type && (
                        <span className="text-xs text-muted-foreground">{account.type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
