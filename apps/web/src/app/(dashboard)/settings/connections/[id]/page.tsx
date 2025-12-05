'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { ConnectionDetails, Integration } from '@/components/connections'
import { Button } from '@/components/ui/button'


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

export default function ConnectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [configuration, setConfiguration] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchIntegrationDetails() {
      try {
        setIsLoading(true)

        // Fetch integration details
        const integrationResponse = await fetch(
          `/api/connection-hub/integrations/${params.id}`
        )

        if (!integrationResponse.ok) {
          throw new Error('Failed to fetch integration')
        }

        const integrationData = await integrationResponse.json()
        setIntegration(integrationData)

        // Fetch sync history
        const historyResponse = await fetch(
          `/api/connection-hub/integrations/${params.id}/sync-history`
        )

        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setSyncHistory(historyData)
        }

        // Fetch error logs
        const logsResponse = await fetch(
          `/api/connection-hub/integrations/${params.id}/error-logs`
        )

        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          setErrorLogs(logsData)
        }

        // Fetch configuration
        const configResponse = await fetch(
          `/api/connection-hub/integrations/${params.id}/configuration`
        )

        if (configResponse.ok) {
          const configData = await configResponse.json()
          setConfiguration(configData)
        }
      } catch (error) {
        console.error('Error fetching integration details:', error)
        // Use mock data for development
        setIntegration(getMockIntegration(params.id))
        setSyncHistory(getMockSyncHistory())
        setErrorLogs(getMockErrorLogs())
        setConfiguration(getMockConfiguration())
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntegrationDetails()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!integration) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Integration not found</p>
        <Button onClick={() => router.push('/settings/connections')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Connections
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/settings/connections')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Connection Details</h1>
          <p className="text-muted-foreground">View and manage this integration</p>
        </div>
      </div>

      <ConnectionDetails
        integration={integration}
        syncHistory={syncHistory}
        errorLogs={errorLogs}
        configuration={configuration}
      />
    </div>
  )
}

// Mock data for development
function getMockIntegration(id: string): Integration {
  const integrations: Record<string, Integration> = {
    '1': {
      id: '1',
      provider: 'Plaid',
      name: 'Deutsche Bank Connection',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      connectedAccounts: [
        { id: 'acc1', name: 'Business Checking', type: 'Checking' },
        { id: 'acc2', name: 'Savings Account', type: 'Savings' },
      ],
    },
    '2': {
      id: '2',
      provider: 'DATEV',
      name: 'DATEV Accounting',
      status: 'connected',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      connectedAccounts: [
        { id: 'acc3', name: 'Main Mandant', type: 'Accounting' },
      ],
    },
    '3': {
      id: '3',
      provider: 'ELSTER',
      name: 'ELSTER Tax Filing',
      status: 'error',
      lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      error: 'Certificate expired. Please reconnect.',
    },
  }

  return (
    integrations[id] || {
      id,
      provider: 'Unknown',
      name: 'Unknown Integration',
      status: 'disconnected',
    }
  )
}

function getMockSyncHistory(): SyncHistory[] {
  return [
    {
      id: 'sync1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success',
      recordsProcessed: 127,
    },
    {
      id: 'sync2',
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      status: 'success',
      recordsProcessed: 84,
    },
    {
      id: 'sync3',
      timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
      status: 'partial',
      recordsProcessed: 45,
      error: 'Some transactions could not be categorized',
    },
    {
      id: 'sync4',
      timestamp: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString(),
      status: 'failed',
      error: 'Connection timeout',
    },
  ]
}

function getMockErrorLogs(): ErrorLog[] {
  return [
    {
      id: 'err1',
      timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
      level: 'warning',
      message: 'Transaction categorization confidence low',
      details: '3 transactions could not be automatically categorized',
    },
    {
      id: 'err2',
      timestamp: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString(),
      level: 'error',
      message: 'Connection timeout',
      details: 'Failed to connect to remote server after 30 seconds',
    },
  ]
}

function getMockConfiguration(): Record<string, any> {
  return {
    autoSync: true,
    syncFrequency: 'Every 6 hours',
    categorizeTransactions: true,
    notifyOnErrors: true,
    retentionPeriod: '90 days',
  }
}
