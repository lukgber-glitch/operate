'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { IntegrationType } from './ConnectionGrid'


interface Provider {
  id: string
  name: string
  description: string
  logo?: string
  isAvailable: boolean
}

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: IntegrationType
  onConnect: (providerId: string) => void
}

// Mock provider data - in production, this would come from an API
const providersByType: Record<IntegrationType, Provider[]> = {
  banking: [
    {
      id: 'plaid',
      name: 'Plaid',
      description: 'Connect to 11,000+ banks and financial institutions',
      isAvailable: true,
    },
    {
      id: 'finapi',
      name: 'FinAPI',
      description: 'European banking integration',
      isAvailable: true,
    },
    {
      id: 'yodlee',
      name: 'Yodlee',
      description: 'Global financial data aggregation',
      isAvailable: false,
    },
  ],
  email: [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Connect your Google Workspace email',
      isAvailable: true,
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Connect your Microsoft 365 email',
      isAvailable: true,
    },
    {
      id: 'imap',
      name: 'IMAP/SMTP',
      description: 'Generic email server connection',
      isAvailable: true,
    },
  ],
  accounting: [
    {
      id: 'datev',
      name: 'DATEV',
      description: 'Connect to DATEV accounting software',
      isAvailable: true,
    },
    {
      id: 'lexoffice',
      name: 'lexoffice',
      description: 'Cloud accounting for Germany',
      isAvailable: true,
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Intuit QuickBooks integration',
      isAvailable: false,
    },
  ],
  tax: [
    {
      id: 'elster',
      name: 'ELSTER',
      description: 'German tax authority integration',
      isAvailable: true,
    },
    {
      id: 'finanzonline',
      name: 'FinanzOnline',
      description: 'Austrian tax authority',
      isAvailable: true,
    },
    {
      id: 'vies',
      name: 'VIES',
      description: 'EU VAT Information Exchange System',
      isAvailable: true,
    },
  ],
  storage: [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Store documents in Google Drive',
      isAvailable: true,
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Sync files with Dropbox',
      isAvailable: true,
    },
    {
      id: 's3',
      name: 'Amazon S3',
      description: 'AWS cloud storage',
      isAvailable: true,
    },
  ],
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  type,
  onConnect,
}: AddConnectionDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const providers = type ? providersByType[type] : []

  const handleConnect = () => {
    if (selectedProvider) {
      onConnect(selectedProvider)
      setSelectedProvider(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>
            {type
              ? `Select a ${type} provider to connect`
              : 'Choose a provider to integrate with your account'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => provider.isAvailable && setSelectedProvider(provider.id)}
              disabled={!provider.isAvailable}
              className={cn(
                'flex items-start gap-4 rounded-lg border p-4 text-left transition-colors',
                provider.isAvailable
                  ? 'cursor-pointer hover:border-primary hover:bg-accent'
                  : 'cursor-not-allowed opacity-50',
                selectedProvider === provider.id && 'border-primary bg-accent'
              )}
            >
              {provider.logo ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-background">
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="h-10 w-10 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                  <span className="font-semibold">
                    {provider.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{provider.name}</h4>
                  {!provider.isAvailable && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={!selectedProvider}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
