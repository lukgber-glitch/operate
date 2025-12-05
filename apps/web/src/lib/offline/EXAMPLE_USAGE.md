# Offline Data Layer - Example Usage

Complete examples for implementing offline functionality in Operate/CoachOS.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Offline Queries](#offline-queries)
3. [Offline Mutations](#offline-mutations)
4. [Sync Management](#sync-management)
5. [Real-World Examples](#real-world-examples)

---

## Basic Setup

### 1. Add OfflineProvider to App

```tsx
// apps/web/src/app/layout.tsx
import { OfflineProvider } from '@/contexts/OfflineContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <OfflineProvider
            autoSync={true}
            syncInterval={30000} // Sync every 30 seconds
            defaultStrategy="server-wins"
          >
            {children}
          </OfflineProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

### 2. Show Offline Status

```tsx
// apps/web/src/components/layout/OfflineIndicator.tsx
'use client'

import { useOffline } from '@/contexts/OfflineContext'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOffline()

  if (isOnline && pendingSyncCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-yellow-600" />
            <span>You're offline</span>
          </>
        ) : (
          <>
            <Wifi className="h-5 w-5 text-green-600" />
            <span>{pendingSyncCount} changes pending sync</span>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## Offline Queries

### Example 1: Invoice List with Offline Support

```tsx
// apps/web/src/app/(dashboard)/invoices/page.tsx
'use client'

import { useOfflineQuery } from '@/hooks/useOfflineQuery'
import { financeApi } from '@/lib/api/finance'
import { InvoiceCard } from '@/components/invoices/invoice-card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function InvoicesPage() {
  const {
    data: invoices,
    isLoading,
    isError,
    error,
    isCached,
    isOnline,
    lastSyncedAt,
    refetch,
  } = useOfflineQuery({
    entityType: 'invoices',
    queryKey: 'invoices-list',
    fetchFn: () => financeApi.getInvoices(),
    cacheFirst: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute when online
  })

  if (isLoading) {
    return <div>Loading invoices...</div>
  }

  if (isError) {
    return (
      <div>
        <p>Error: {error?.message}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status indicators */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You're offline. Showing cached data from {lastSyncedAt?.toLocaleString()}
          </p>
        </div>
      )}

      {isCached && isOnline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Cached data. Last synced: {lastSyncedAt?.toLocaleString()}
          </p>
        </div>
      )}

      {/* Invoice list */}
      <div className="grid gap-4">
        {invoices?.map(invoice => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  )
}
```

### Example 2: Single Invoice with Cache

```tsx
// apps/web/src/app/(dashboard)/invoices/[id]/page.tsx
'use client'

import { useOfflineQuery } from '@/hooks/useOfflineQuery'
import { financeApi } from '@/lib/api/finance'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { data: invoice, isLoading, isCached } = useOfflineQuery({
    entityType: 'invoices',
    queryKey: `invoice-${params.id}`,
    fetchFn: async () => {
      const invoices = await financeApi.getInvoices()
      return invoices.filter(inv => inv.id === params.id)
    },
    cacheFirst: true,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const currentInvoice = invoice?.[0]

  if (!currentInvoice) {
    return <div>Invoice not found</div>
  }

  return (
    <div>
      {isCached && <span className="text-sm text-gray-500">Cached</span>}
      <h1>{currentInvoice.number}</h1>
      <p>Amount: ${currentInvoice.totalAmount}</p>
      {/* More invoice details */}
    </div>
  )
}
```

---

## Offline Mutations

### Example 1: Create Invoice Offline

```tsx
// apps/web/src/components/invoices/create-invoice-form.tsx
'use client'

import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { financeApi, type CreateInvoiceRequest } from '@/lib/api/finance'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function CreateInvoiceForm() {
  const router = useRouter()
  const { toast } = useToast()

  const { mutate, isLoading, isPending, isOnline } = useOfflineMutation({
    entityType: 'invoices',
    mutationFn: financeApi.createInvoice,
    onSuccess: (data) => {
      toast({
        title: 'Invoice created',
        description: `Invoice ${data.number} has been created.`,
      })
      router.push('/invoices')
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    optimisticUpdate: (variables) => ({
      id: `temp_${Date.now()}`,
      number: `INV-${Date.now()}`,
      ...variables,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  })

  const handleSubmit = (data: CreateInvoiceRequest) => {
    mutate(data)
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleSubmit({
        customerName: formData.get('customerName') as string,
        issueDate: formData.get('issueDate') as string,
        dueDate: formData.get('dueDate') as string,
        currency: 'EUR',
        items: [], // Parse items from form
      })
    }}>
      {/* Offline warning */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">
            You're offline. Invoice will be saved locally and synced when connection is restored.
          </p>
        </div>
      )}

      {/* Pending sync indicator */}
      {isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800">
            Invoice is queued for sync. It will be uploaded when you're back online.
          </p>
        </div>
      )}

      <input name="customerName" placeholder="Customer Name" required />
      <input name="issueDate" type="date" required />
      <input name="dueDate" type="date" required />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  )
}
```

### Example 2: Update Invoice Offline

```tsx
// apps/web/src/components/invoices/edit-invoice-form.tsx
'use client'

import { useOfflineUpdate } from '@/hooks/useOfflineMutation'
import { financeApi, type UpdateInvoiceRequest } from '@/lib/api/finance'

interface EditInvoiceFormProps {
  invoice: Invoice
  onSuccess: () => void
}

export function EditInvoiceForm({ invoice, onSuccess }: EditInvoiceFormProps) {
  const { mutate, isLoading, isPending } = useOfflineUpdate(
    'invoices',
    financeApi.updateInvoice,
    {
      onSuccess,
      optimisticUpdate: (variables) => ({
        ...invoice,
        ...variables,
        updatedAt: new Date().toISOString(),
      }),
    }
  )

  const handleSubmit = (updates: Partial<UpdateInvoiceRequest>) => {
    mutate({
      id: invoice.id,
      ...updates,
    })
  }

  return (
    <form>
      {isPending && (
        <span className="text-sm text-yellow-600">Pending sync</span>
      )}

      {/* Form fields */}

      <button onClick={() => handleSubmit({ notes: 'Updated notes' })} disabled={isLoading}>
        Save Changes
      </button>
    </form>
  )
}
```

### Example 3: Delete with Offline Support

```tsx
// apps/web/src/components/invoices/delete-invoice-button.tsx
'use client'

import { useOfflineDelete } from '@/hooks/useOfflineMutation'
import { financeApi } from '@/lib/api/finance'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteInvoiceButtonProps {
  invoiceId: string
  onSuccess: () => void
}

export function DeleteInvoiceButton({ invoiceId, onSuccess }: DeleteInvoiceButtonProps) {
  const { mutate, isLoading } = useOfflineDelete(
    'invoices',
    financeApi.deleteInvoice,
    {
      onSuccess,
    }
  )

  return (
    <Button
      onClick={() => mutate({ id: invoiceId })}
      disabled={isLoading}
      variant="destructive"
      size="sm"
    >
      <Trash2 className="h-4 w-4" />
      {isLoading ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
```

---

## Sync Management

### Example 1: Sync Status Widget

```tsx
// apps/web/src/components/sync/sync-status-widget.tsx
'use client'

import { useSync, useOffline } from '@/contexts/OfflineContext'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export function SyncStatusWidget() {
  const { isOnline, dbStats } = useOffline()
  const { isSyncing, syncProgress, pendingSyncCount, syncNow, hasPendingChanges } = useSync()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Sync Status</h3>
        {isOnline ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Status:</span>
          <span className={isOnline ? 'text-green-600' : 'text-yellow-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {hasPendingChanges && (
          <div className="flex justify-between text-sm">
            <span>Pending changes:</span>
            <span className="text-blue-600">{pendingSyncCount}</span>
          </div>
        )}

        {isSyncing && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Syncing...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {dbStats && (
          <div className="pt-2 border-t text-sm space-y-1">
            <div className="flex justify-between">
              <span>Cached invoices:</span>
              <span>{dbStats.invoices}</span>
            </div>
            <div className="flex justify-between">
              <span>Cached expenses:</span>
              <span>{dbStats.expenses}</span>
            </div>
            <div className="flex justify-between">
              <span>Cached contacts:</span>
              <span>{dbStats.contacts}</span>
            </div>
          </div>
        )}

        {hasPendingChanges && isOnline && (
          <Button
            onClick={syncNow}
            disabled={isSyncing}
            className="w-full mt-2"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Example 2: Pending Changes List

```tsx
// apps/web/src/components/sync/pending-changes-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { useOffline } from '@/contexts/OfflineContext'
import { SyncQueueItem } from '@/lib/offline'

export function PendingChangesList() {
  const { getPendingItems } = useOffline()
  const [items, setItems] = useState<SyncQueueItem[]>([])

  useEffect(() => {
    loadPendingItems()
  }, [])

  const loadPendingItems = async () => {
    const pending = await getPendingItems()
    setItems(pending)
  }

  if (items.length === 0) {
    return <div>No pending changes</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Pending Changes</h3>
      {items.map(item => (
        <div key={item.id} className="border rounded p-3">
          <div className="flex justify-between">
            <span className="font-medium capitalize">
              {item.operation} {item.entityType}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
          {item.retryCount > 0 && (
            <div className="text-sm text-yellow-600 mt-1">
              Retried {item.retryCount} times
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## Real-World Examples

### Complete Invoice Management with Offline Support

```tsx
// apps/web/src/components/invoices/invoice-manager.tsx
'use client'

import { useState } from 'react'
import { useOfflineQuery } from '@/hooks/useOfflineQuery'
import { useOfflineMutation, useOfflineDelete } from '@/hooks/useOfflineMutation'
import { useOffline } from '@/contexts/OfflineContext'
import { financeApi } from '@/lib/api/finance'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function InvoiceManager() {
  const { isOnline } = useOffline()
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  // Fetch invoices with offline support
  const {
    data: invoices,
    isLoading,
    isCached,
    refetch,
  } = useOfflineQuery({
    entityType: 'invoices',
    queryKey: 'invoices',
    fetchFn: financeApi.getInvoices,
    cacheFirst: true,
  })

  // Create invoice mutation
  const createMutation = useOfflineMutation({
    entityType: 'invoices',
    mutationFn: financeApi.createInvoice,
    onSuccess: () => {
      refetch()
    },
    optimisticUpdate: (vars) => ({
      id: `temp_${Date.now()}`,
      number: `INV-TEMP-${Date.now()}`,
      ...vars,
      status: 'DRAFT',
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  })

  // Update invoice mutation
  const updateMutation = useOfflineMutation({
    entityType: 'invoices',
    mutationFn: financeApi.updateInvoice,
    onSuccess: () => {
      refetch()
    },
  })

  // Delete invoice mutation
  const deleteMutation = useOfflineDelete(
    'invoices',
    financeApi.deleteInvoice,
    {
      onSuccess: () => {
        refetch()
        setSelectedInvoice(null)
      },
    }
  )

  if (isLoading) {
    return <div>Loading invoices...</div>
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {isCached && <Badge variant="outline">Cached</Badge>}
          {createMutation.isPending && <Badge variant="warning">Pending Sync</Badge>}
        </div>
        <Button onClick={refetch} disabled={!isOnline}>
          Refresh
        </Button>
      </div>

      {/* Create button */}
      <Button
        onClick={() => {
          createMutation.mutate({
            customerName: 'New Customer',
            issueDate: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            currency: 'EUR',
            items: [],
          })
        }}
        disabled={createMutation.isLoading}
      >
        Create Invoice {createMutation.isLoading && '...'}
      </Button>

      {/* Invoice list */}
      <div className="grid gap-4">
        {invoices?.map(invoice => (
          <div
            key={invoice.id}
            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => setSelectedInvoice(invoice.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{invoice.number}</h3>
                <p className="text-sm text-gray-600">{invoice.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                <Badge>{invoice.status}</Badge>
              </div>
            </div>

            {invoice._syncStatus === 'pending' && (
              <div className="mt-2 text-sm text-yellow-600">
                Pending sync
              </div>
            )}

            {selectedInvoice === invoice.id && (
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    updateMutation.mutate({
                      id: invoice.id,
                      notes: 'Updated offline',
                    })
                  }}
                  size="sm"
                >
                  Update
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate({ id: invoice.id })}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Tips and Best Practices

1. **Always show offline status** - Users need to know when they're offline
2. **Indicate cached data** - Let users know if they're viewing cached data
3. **Show pending syncs** - Display pending changes with clear indicators
4. **Provide manual sync** - Give users a way to trigger sync manually
5. **Handle errors gracefully** - Show clear error messages and retry options
6. **Use optimistic updates** - Provide instant feedback for better UX
7. **Cache critical data** - Ensure important data is available offline
8. **Clean up old data** - Periodically remove old cached entries

---

**Last Updated**: 2025-12-02
**Agent**: PRISM
**Task**: W17-T3
