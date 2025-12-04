'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ConnectionCard, Integration } from './ConnectionCard'

export type IntegrationType = 'banking' | 'email' | 'accounting' | 'tax' | 'storage'

export interface ConnectionGridProps {
  integrations: Integration[]
  onAddConnection?: (type: IntegrationType) => void
  onDisconnect?: (id: string) => void
  onReconnect?: (id: string) => void
  onSyncNow?: (id: string) => void
  onViewDetails?: (id: string) => void
  className?: string
}

const categoryConfig: Record<
  IntegrationType,
  { label: string; description: string }
> = {
  banking: {
    label: 'Banking',
    description: 'Connect your bank accounts for transaction sync',
  },
  email: {
    label: 'Email',
    description: 'Integrate email providers for document processing',
  },
  accounting: {
    label: 'Accounting',
    description: 'Sync with accounting software and ERPs',
  },
  tax: {
    label: 'Tax',
    description: 'Connect to tax authorities and ELSTER',
  },
  storage: {
    label: 'Storage',
    description: 'Integrate cloud storage providers',
  },
}

// Helper to categorize integrations by type
function categorizeIntegrations(integrations: Integration[]): Record<IntegrationType, Integration[]> {
  const categories: Record<IntegrationType, Integration[]> = {
    banking: [],
    email: [],
    accounting: [],
    tax: [],
    storage: [],
  }

  integrations.forEach((integration) => {
    // Simple categorization based on provider name
    const provider = integration.provider.toLowerCase()
    if (provider.includes('bank') || provider.includes('plaid') || provider.includes('finapi')) {
      categories.banking.push(integration)
    } else if (
      provider.includes('gmail') ||
      provider.includes('outlook') ||
      provider.includes('mail')
    ) {
      categories.email.push(integration)
    } else if (
      provider.includes('datev') ||
      provider.includes('lexoffice') ||
      provider.includes('quickbooks')
    ) {
      categories.accounting.push(integration)
    } else if (
      provider.includes('elster') ||
      provider.includes('finanz') ||
      provider.includes('vies')
    ) {
      categories.tax.push(integration)
    } else if (
      provider.includes('drive') ||
      provider.includes('dropbox') ||
      provider.includes('s3')
    ) {
      categories.storage.push(integration)
    }
  })

  return categories
}

export function ConnectionGrid({
  integrations,
  onAddConnection,
  onDisconnect,
  onReconnect,
  onSyncNow,
  onViewDetails,
  className,
}: ConnectionGridProps) {
  const categorizedIntegrations = categorizeIntegrations(integrations)

  return (
    <div className={cn('space-y-8', className)}>
      {(Object.keys(categoryConfig) as IntegrationType[]).map((type) => {
        const category = categoryConfig[type]
        const categoryIntegrations = categorizedIntegrations[type]

        return (
          <section key={type} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{category.label}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddConnection?.(type)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </div>

            {categoryIntegrations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryIntegrations.map((integration) => (
                  <ConnectionCard
                    key={integration.id}
                    integration={integration}
                    onDisconnect={onDisconnect}
                    onReconnect={onReconnect}
                    onSyncNow={onSyncNow}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No {category.label.toLowerCase()} integrations connected
                </p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
