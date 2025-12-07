'use client';

import { Plus, Download, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { VendorTable } from '@/components/vendors/VendorTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useVendors, useDeleteVendor } from '@/hooks/useVendors';
import type { VendorFilters as VendorFilterType } from '@/lib/api/vendors';

export default function VendorsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<VendorFilterType>({
    page: 1,
    pageSize: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const { data: vendorsData, isLoading, error } = useVendors(filters);
  const deleteMutation = useDeleteVendor();

  const handleFilterChange = (newFilters: Partial<VendorFilterType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change
      page: newFilters.search !== undefined || newFilters.status !== undefined ? 1 : prev.page,
    }));
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground">Manage your vendor relationships</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">Error loading vendors. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage suppliers and accounts payable
          </p>
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name, email..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  handleFilterChange({ status: value === 'all' ? undefined : (value as any) })
                }
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
        </CardContent>
      </Card>

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
        />
      )}
    </div>
  );
}
