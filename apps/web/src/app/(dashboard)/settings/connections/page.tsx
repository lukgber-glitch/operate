'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { ConnectionGrid, AddConnectionDialog, Integration, IntegrationType } from '@/components/connections'

export default function ConnectionsPage() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<IntegrationType | undefined>()

  // Fetch integrations from API
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/connection-hub/integrations')

        if (!response.ok) {
          throw new Error('Failed to fetch integrations')
        }

        const data = await response.json()
        setIntegrations(data)
      } catch (error) {
        console.error('Error fetching integrations:', error)
        // For development, use mock data if API fails
        setIntegrations(getMockIntegrations())
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntegrations()
  }, [])

  const handleAddConnection = (type: IntegrationType) => {
    setSelectedType(type)
    setDialogOpen(true)
  }

  const handleConnect = async (providerId: string) => {
    try {
      // Initiate OAuth flow or connection process
      const response = await fetch('/api/connection-hub/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate connection')
      }

      const { authUrl } = await response.json()

      // Redirect to OAuth provider or show success
      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('Error connecting:', error)
      alert('Failed to connect. Please try again.')
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return
    }

    try {
      const response = await fetch(`/api/connection-hub/integrations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      // Remove from local state
      setIntegrations((prev) => prev.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Failed to disconnect. Please try again.')
    }
  }

  const handleReconnect = async (id: string) => {
    try {
      const response = await fetch(`/api/connection-hub/integrations/${id}/reconnect`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reconnect')
      }

      const { authUrl } = await response.json()

      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('Error reconnecting:', error)
      alert('Failed to reconnect. Please try again.')
    }
  }

  const handleSyncNow = async (id: string) => {
    try {
      // Update UI to show syncing status
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'syncing' as const } : i))
      )

      const response = await fetch(`/api/connection-hub/integrations/${id}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sync')
      }

      // Refresh integration data
      const updatedIntegration = await response.json()
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? updatedIntegration : i))
      )
    } catch (error) {
      console.error('Error syncing:', error)
      // Revert to previous status on error
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error' as const } : i))
      )
      alert('Failed to sync. Please try again.')
    }
  }

  const handleViewDetails = (id: string) => {
    router.push(`/settings/connections/${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground">
          Manage your integrations with banks, accounting software, and tax authorities
        </p>
      </div>

      <ConnectionGrid
        integrations={integrations}
        onAddConnection={handleAddConnection}
        onDisconnect={handleDisconnect}
        onReconnect={handleReconnect}
        onSyncNow={handleSyncNow}
        onViewDetails={handleViewDetails}
      />

      <AddConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        onConnect={handleConnect}
      />
    </div>
  )
}

// Mock data for development/testing
function getMockIntegrations(): Integration[] {
  return [
    {
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
    {
      id: '2',
      provider: 'DATEV',
      name: 'DATEV Accounting',
      status: 'connected',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      connectedAccounts: [
        { id: 'acc3', name: 'Main Mandant', type: 'Accounting' },
      ],
    },
    {
      id: '3',
      provider: 'ELSTER',
      name: 'ELSTER Tax Filing',
      status: 'error',
      lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      error: 'Certificate expired. Please reconnect.',
    },
    {
      id: '4',
      provider: 'Gmail',
      name: 'Business Email',
      status: 'connected',
      lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      connectedAccounts: [
        { id: 'acc4', name: 'info@company.com', type: 'Email' },
      ],
    },
    {
      id: '5',
      provider: 'Google Drive',
      name: 'Document Storage',
      status: 'connected',
      lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ]
}
