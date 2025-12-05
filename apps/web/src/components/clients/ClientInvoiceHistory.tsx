'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceStatusBadge, type InvoiceStatus } from './InvoiceStatusBadge';
import { InvoiceMiniCard } from './InvoiceMiniCard';
import {
  useClientInvoices,
  usePrefetchClientInvoices,
  type ClientInvoicesFilters,
} from './hooks/useClientInvoices';
import {
  Download,
  Eye,
  Send,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  ArrowUpDown,
  Loader2,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ClientInvoiceHistoryProps {
  clientId: string;
  className?: string;
}

type ViewMode = 'table' | 'grid';
type SortField = 'date' | 'dueDate' | 'total' | 'status';

export function ClientInvoiceHistory({
  clientId,
  className,
}: ClientInvoiceHistoryProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const filters: ClientInvoicesFilters = {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isError } = useClientInvoices(clientId, filters);
  const prefetchNextPage = usePrefetchClientInvoices(clientId, filters);

  // Prefetch next page
  if (data?.pagination && page < data.pagination.totalPages) {
    prefetchNextPage(page + 1);
  }

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    // TODO: Implement PDF download
    console.log('Download invoice:', invoiceId);
  };

  const handleSendReminder = async (invoiceId: string) => {
    // TODO: Implement send reminder
    console.log('Send reminder for invoice:', invoiceId);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Failed to load invoice history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Invoice History</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InvoiceStatus | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.data?.length ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('date')}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        Invoice #
                        {sortBy === 'date' && (
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('date')}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        Date
                        {sortBy === 'date' && (
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('dueDate')}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        Due Date
                        {sortBy === 'dueDate' && (
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('total')}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        Amount
                        {sortBy === 'total' && (
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('status')}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        Status
                        {sortBy === 'status' && (
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        {formatDate(invoice.dueDate)}
                        {invoice.status === 'OVERDUE' && (
                          <span className="ml-2 text-xs text-red-600">
                            (Overdue)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice.id)}
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(invoice.status === 'SENT' ||
                            invoice.status === 'OVERDUE') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendReminder(invoice.id)}
                              title="Send Reminder"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, data.pagination.total)} of{' '}
                  {data.pagination.total} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((invoice) => (
                <InvoiceMiniCard
                  key={invoice.id}
                  invoice={invoice}
                  onView={handleViewInvoice}
                  onDownload={handleDownloadInvoice}
                />
              ))}
            </div>

            {/* Pagination for grid view */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, data.pagination.total)} of{' '}
                  {data.pagination.total} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
