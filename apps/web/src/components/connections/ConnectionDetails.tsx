'use client'

import { CheckCircle2, XCircle, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Integration } from './ConnectionCard'
import { ConnectionStatus } from './ConnectionStatus'

interface SyncHistory {
  id: string
  timestamp: string
  status: 'success' | 'failed' | 'partial'
  recordsProcessed?: number
  error?: string
}

interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warning'
  message: string
  details?: string
}

interface ConnectionDetailsProps {
  integration: Integration
  syncHistory?: SyncHistory[]
  errorLogs?: ErrorLog[]
  configuration?: Record<string, any>
}

export function ConnectionDetails({
  integration,
  syncHistory = [],
  errorLogs = [],
  configuration = {},
}: ConnectionDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {integration.logo ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-background">
                  <img
                    src={integration.logo}
                    alt={integration.provider}
                    className="h-10 w-10 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                  <span className="text-sm font-semibold">
                    {integration.provider.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <CardTitle>{integration.name}</CardTitle>
                <CardDescription>{integration.provider}</CardDescription>
              </div>
            </div>
            <ConnectionStatus status={integration.status} />
          </div>
        </CardHeader>
        <CardContent>
          {integration.lastSync && (
            <p className="text-sm text-muted-foreground">
              Last synced: {new Date(integration.lastSync).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {integration.connectedAccounts && integration.connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Accounts</CardTitle>
            <CardDescription>
              {integration.connectedAccounts.length} account
              {integration.connectedAccounts.length !== 1 ? 's' : ''} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {integration.connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    {account.type && (
                      <p className="text-sm text-muted-foreground">{account.type}</p>
                    )}
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
          <CardDescription>Recent synchronization activity</CardDescription>
        </CardHeader>
        <CardContent>
          {syncHistory.length > 0 ? (
            <div className="space-y-3">
              {syncHistory.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-start justify-between rounded-md border p-3"
                >
                  <div className="flex items-start gap-3">
                    {sync.status === 'success' && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    )}
                    {sync.status === 'failed' && (
                      <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                    )}
                    {sync.status === 'partial' && (
                      <Clock className="mt-0.5 h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(sync.timestamp).toLocaleString()}
                      </p>
                      {sync.recordsProcessed !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {sync.recordsProcessed} records processed
                        </p>
                      )}
                      {sync.error && (
                        <p className="text-xs text-destructive">{sync.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      sync.status === 'success'
                        ? 'default'
                        : sync.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                    }
                  >
                    {sync.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sync history available</p>
          )}
        </CardContent>
      </Card>

      {/* Error Logs */}
      {errorLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Logs</CardTitle>
            <CardDescription>Recent errors and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-destructive/20 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.level === 'error' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {log.level}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium">{log.message}</p>
                      {log.details && (
                        <p className="mt-1 text-xs text-muted-foreground">{log.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {Object.keys(configuration).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>Integration settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(configuration).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {typeof value === 'boolean'
                      ? value
                        ? 'Enabled'
                        : 'Disabled'
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
