'use client';

import { Plus, Download, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { VendorTable } from '@/components/vendors/VendorTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useVendors, useDeleteVendor, usePrefetchVendor } from '@/hooks/useVendors';
import type { VendorFilters as VendorFilterType, VendorStatus } from '@/lib/api/vendors';

// Custom debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function VendorsPage() {
  const router = useRouter();
  const prefetchVendor = usePrefetchVendor();

  // Separate search input state for debouncing
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filters, setFilters] = useState<VendorFilterType>({
    page: 1,
    pageSize: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Sync debounced search to filters
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        search: debouncedSearch || undefined,
        page: 1, // Reset to first page on search
      }));
    }
  }, [debouncedSearch, filters.search]);

  const { data: vendorsData, isLoading, error } = useVendors(filters);
  const deleteMutation = useDeleteVendor();

  // Memoized filter change handler for non-search filters
  const handleFilterChange = useCallback((newFilters: Partial<VendorFilterType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when status changes
      page: newFilters.status !== undefined ? 1 : (newFilters.page ?? prev.page),
    }));
  }, []);

  // Memoized status change handler with proper typing
  const handleStatusChange = useCallback((value: string) => {
    handleFilterChange({ status: value === 'all' ? undefined : (value as VendorStatus) });
  }, [handleFilterChange]);

  const handleDeleteVendor = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleExportCSV = () => {
    if (!vendorsData?.items) return;

    const headers = [
      'Name',
      'Display Name',
      'Email',
      'Phone',
      'City',
      'Country',
      'Status',
      'Payment Terms',
      'Total Bills',
      'Outstanding',
    ];
    const rows = vendorsData.items.map((vendor) => [
      vendor.name,
      vendor.displayName || '',
      vendor.email || '',
      vendor.phone || '',
      vendor.city || '',
      vendor.country || '',
      vendor.status,
      vendor.paymentTerms.toString(),
      (vendor._count?.bills || vendor.totalBills || 0).toString(),
      (vendor.totalOutstanding || 0).toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Vendors</h1>
          <p className="text-white/70">Manage your vendor relationships</p>
        </div>
        <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive mb-4">Error loading vendors. Please try again.</p>
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
          <h1 className="text-2xl text-white font-semibold tracking-tight">Vendors</h1>
          <p className="text-white/70">Manage suppliers and accounts payable</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!vendorsData?.items?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => router.push('/vendors/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard padding="lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  placeholder="Search vendors by name, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
      </GlassCard>

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
        <VendorTable
          data={vendorsData?.items || []}
          total={vendorsData?.total || 0}
          page={filters.page || 1}
          pageSize={filters.pageSize || 50}
          onPageChange={(page) => handleFilterChange({ page })}
          onDelete={handleDeleteVendor}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            handleFilterChange({ sortBy: sortBy as VendorFilterType['sortBy'], sortOrder })
          }
          onPrefetch={prefetchVendor}
        />
      )}
    </div>
  );
}
