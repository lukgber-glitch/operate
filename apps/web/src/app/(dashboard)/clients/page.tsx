'use client';

import { Plus, Download } from 'lucide-react';
import { useState, useCallback } from 'react';

import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { ClientDataTable } from '@/components/clients/ClientDataTable';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients, useDeleteClient, useBulkUpdateClients, usePrefetchClient } from '@/hooks/useClients';
import type { ClientFilters as ClientFilterType, UpdateClientDto } from '@/lib/api/clients';

export default function ClientsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState<ClientFilterType>({
    page: 1,
    pageSize: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const { data: clientsData, isLoading, error } = useClients(filters);
  const deleteMutation = useDeleteClient();
  const bulkUpdateMutation = useBulkUpdateClients();
  const prefetchClient = usePrefetchClient();

  const handleFilterChange = (newFilters: Partial<ClientFilterType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change
      page: newFilters.search !== undefined || newFilters.status !== undefined ? 1 : prev.page,
    }));
  };

  const handleDeleteClient = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleBulkUpdate = useCallback(async (clientIds: string[], updates: UpdateClientDto) => {
    await bulkUpdateMutation.mutateAsync({ clientIds, updates });
  }, [bulkUpdateMutation]);

  const handleExportCSV = () => {
    if (!clientsData?.items) return;

    const headers = ['Client Number', 'Name', 'Type', 'Status', 'Email', 'Phone', 'Total Revenue', 'Last Activity'];
    const rows = clientsData.items.map((client) => [
      client.clientNumber || client.id.slice(0, 8).toUpperCase(),
      client.name,
      client.type,
      client.status,
      client.email || '',
      client.phone || '',
      client.totalRevenue?.toString() || '0',
      client.lastContactDate ? new Date(client.lastContactDate).toLocaleDateString() : 'Never',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Clients</h1>
          <p className="text-white/70">Manage your client relationships</p>
        </div>
        <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive mb-4">Error loading clients. Please try again.</p>
            </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Clients</h1>
          <p className="text-white/70">Manage your client relationships and track key metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!clientsData?.items?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ClientFilters filters={filters} onFilterChange={handleFilterChange} isLoading={isLoading} />

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <ClientDataTable
          data={clientsData?.items || []}
          total={clientsData?.total || 0}
          page={filters.page || 1}
          pageSize={filters.pageSize || 50}
          onPageChange={(page) => handleFilterChange({ page })}
          onDelete={handleDeleteClient}
          onBulkUpdate={handleBulkUpdate}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={(sortBy, sortOrder) => handleFilterChange({ sortBy: sortBy as ClientFilterType['sortBy'], sortOrder })}
          onPrefetch={prefetchClient}
        />
      )}

      {/* Add Client Dialog */}
      <AddClientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
