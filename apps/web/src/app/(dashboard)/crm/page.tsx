'use client';

import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Grid,
  List,
  ArrowUpDown,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

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

import { ClientCard } from '@/components/crm/ClientCard';
import { ClientForm } from '@/components/crm/ClientForm';
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
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import type { Client, ClientType, ClientStatus, RiskLevel, ClientFilters } from '@/lib/api/crm';

const statusVariants = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CHURNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const typeVariants = {
  CUSTOMER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  LEAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PROSPECT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  PARTNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  VENDOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const riskVariants = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function CRMPage() {
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  // Separate search input state for debouncing
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filters, setFilters] = useState<ClientFilters>({
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  });

  // Sync debounced search to filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1, // Reset to first page on search
    }));
  }, [debouncedSearch]);

  const { data: clientsData, isLoading } = useClients(filters);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  // Memoized create handler with proper typing
  const handleCreateClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalRevenue' | 'totalInvoices' | 'pendingInvoices' | 'overdueInvoices' | 'avgPaymentDays'>) => {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
  }, [createMutation]);

  // Memoized update handler with proper typing
  const handleUpdateClient = useCallback(async (data: Partial<Client>) => {
    if (editClient) {
      await updateMutation.mutateAsync({ id: editClient.id, data });
      setEditClient(null);
    }
  }, [editClient, updateMutation]);

  const handleDeleteClient = async () => {
    if (deleteClient) {
      await deleteMutation.mutateAsync(deleteClient.id);
      setDeleteClient(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">CRM</h1>
          <p className="text-white/70">Manage your clients and relationships</p>
        </div>
        <Dialog
          open={isCreateOpen || !!editClient}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditClient(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editClient ? 'Edit Client' : 'Create Client'}</DialogTitle>
            </DialogHeader>
            <ClientForm
              client={editClient || undefined}
              onSubmit={editClient ? handleUpdateClient : handleCreateClient}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <GlassCard padding="lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                <Input
                  placeholder="Search clients..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4 text-white/70" />
                  </button>
                )}
              </div>
            </div>

            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, type: value === 'all' ? undefined : (value as ClientType) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="PARTNER">Partner</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === 'all' ? undefined : (value as ClientStatus) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CHURNED">Churned</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.riskLevel || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, riskLevel: value === 'all' ? undefined : (value as RiskLevel) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Content */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !clientsData?.items.length ? (
        <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-white/70 mb-4">No clients found</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
        </GlassCard>
      ) : view === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clientsData.items.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => setEditClient(client)}
              onDelete={() => setDeleteClient(client)}
            />
          ))}
        </div>
      ) : (
        <GlassCard padding="lg">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        sortBy: 'name',
                        sortOrder: filters.sortBy === 'name' && filters.sortOrder === 'asc' ? 'desc' : 'asc',
                      })
                    }
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        sortBy: 'revenue',
                        sortOrder: filters.sortBy === 'revenue' && filters.sortOrder === 'asc' ? 'desc' : 'asc',
                      })
                    }
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        sortBy: 'lastContact',
                        sortOrder:
                          filters.sortBy === 'lastContact' && filters.sortOrder === 'asc' ? 'desc' : 'asc',
                      })
                    }
                  >
                    Last Contact
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsData.items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/crm/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeVariants[client.type]}>
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusVariants[client.status]}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(client.totalRevenue)}</TableCell>
                  <TableCell>{formatDate(client.lastContactDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={riskVariants[client.riskLevel]}>
                      {client.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/crm/${client.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditClient(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteClient(client)}
                          className="text-red-600"
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
        </GlassCard>
      )}
      </motion.div>

      {/* Pagination */}
      {clientsData && clientsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-white/70">
            Page {filters.page} of {clientsData.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={filters.page === clientsData.totalPages}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteClient?.name}? This action cannot be undone and
              will remove all associated contacts and communications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
