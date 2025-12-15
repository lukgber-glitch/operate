'use client';

import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, memo } from 'react';

import { ClientStatusBadge } from './ClientStatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import type { Client, UpdateClientDto } from '@/lib/api/clients';

export interface ClientDataTableProps {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => Promise<void>;
  onBulkUpdate: (clientIds: string[], updates: UpdateClientDto) => Promise<void>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onPrefetch?: (id: string) => void;
}

const typeVariants: Record<string, string> = {
  INDIVIDUAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  COMPANY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  CUSTOMER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  LEAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PROSPECT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  PARTNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  VENDOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

// Memoized currency formatter for performance
const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

// Memoized date formatter options
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

// Format currency helper (using cached formatter)
const formatCurrency = (amount?: number): string => {
  if (!amount) return currencyFormatter.format(0);
  return currencyFormatter.format(amount);
};

// Format date helper
const formatDate = (date?: string): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-GB', dateFormatOptions);
};

// Helper to get client number
const getClientNumber = (client: Client): string => {
  return (client as any).clientNumber || client.id.slice(0, 8).toUpperCase();
};

export function ClientDataTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onDelete,
  onBulkUpdate,
  sortBy = 'name',
  sortOrder = 'asc',
  onSortChange,
  onPrefetch,
}: ClientDataTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    clientNumber: true,
    name: true,
    type: true,
    status: true,
    email: true,
    phone: true,
    totalRevenue: true,
    lastActivity: true,
  });

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  // Memoized sort handler
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  }, [sortBy, sortOrder, onSortChange]);

  // Memoized select all handler
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? data.map((client) => client.id) : []);
  }, [data]);

  // Memoized select one handler
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((cid) => cid !== id)));
  }, []);

  // Memoized row click handler
  const handleRowClick = useCallback((clientId: string) => {
    router.push(`/clients/${clientId}`);
  }, [router]);

  // Memoized delete click handler
  const handleDeleteClick = useCallback((e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    setDeleteClientId(clientId);
  }, []);

  // Memoized confirm delete handler
  const handleConfirmDelete = useCallback(async () => {
    if (deleteClientId) {
      try {
        await onDelete(deleteClientId);
        setDeleteClientId(null);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteClientId));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [deleteClientId, onDelete]);

  // Prefetch handler for hover optimization
  const handleRowHover = useCallback((clientId: string) => {
    if (onPrefetch) {
      onPrefetch(clientId);
    }
  }, [onPrefetch]);

  if (data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-lg">No clients found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or add a new client to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      onBulkUpdate(selectedIds, { status: 'ACTIVE' });
                      setSelectedIds([]);
                    }}
                  >
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onBulkUpdate(selectedIds, { status: 'INACTIVE' });
                      setSelectedIds([]);
                    }}
                  >
                    Mark as Inactive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onBulkUpdate(selectedIds, { isVip: true });
                      setSelectedIds([]);
                    }}
                  >
                    Mark as VIP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} clients
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(visibleColumns).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({ ...prev, [key]: checked }))
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === data.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.clientNumber && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('clientNumber')}
                    className="h-8 px-2"
                  >
                    Client #
                    {sortBy === 'clientNumber' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.name && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-2"
                  >
                    Name
                    {sortBy === 'name' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.type && <TableHead>Type</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.email && <TableHead>Email</TableHead>}
              {visibleColumns.phone && <TableHead>Phone</TableHead>}
              {visibleColumns.totalRevenue && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalRevenue')}
                    className="h-8 px-2"
                  >
                    Revenue
                    {sortBy === 'totalRevenue' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
              )}
              {visibleColumns.lastActivity && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('lastPaymentDate')}
                    className="h-8 px-2"
                  >
                    Last Activity
                    {sortBy === 'lastPaymentDate' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(client.id)}
                onMouseEnter={() => handleRowHover(client.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(client.id)}
                    onCheckedChange={(checked) => handleSelectOne(client.id, !!checked)}
                  />
                </TableCell>
                {visibleColumns.clientNumber && (
                  <TableCell className="font-mono text-sm">{getClientNumber(client)}</TableCell>
                )}
                {visibleColumns.name && (
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {client.name}
                      {(client as any).isVip && (
                        <Badge variant="secondary" className="text-xs">
                          VIP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.type && (
                  <TableCell>
                    <Badge variant="secondary" className={typeVariants[client.type]}>
                      {client.type}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                )}
                {visibleColumns.email && (
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email || '-'}
                  </TableCell>
                )}
                {visibleColumns.phone && (
                  <TableCell className="text-sm text-muted-foreground">
                    {client.phone || '-'}
                  </TableCell>
                )}
                {visibleColumns.totalRevenue && (
                  <TableCell className="font-medium">{formatCurrency(client.totalRevenue)}</TableCell>
                )}
                {visibleColumns.lastActivity && (
                  <TableCell className="text-sm">
                    {formatDate(client.lastContactDate || (client as any).lastPaymentDate)}
                  </TableCell>
                )}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(e, client.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone and will remove
              all associated data including contacts, communications, and invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
