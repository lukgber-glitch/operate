/**
 * Extracted Invoice List Component
 * List view with filtering and sorting
 */

'use client';

import React, { useState } from 'react';
import { ExtractedInvoiceCard } from './ExtractedInvoiceCard';
import { InvoiceReviewDialog } from './InvoiceReviewDialog';
import { BulkApproveToolbar } from './BulkApproveToolbar';
import { ExportMenu } from './ExportMenu';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, RefreshCw, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import {
  useExtractedInvoices,
  useApproveExtraction,
  useRejectExtraction,
  useUpdateExtractedInvoice,
  useBulkApproveExtractions,
  useBulkRejectExtractions,
  useCreateInvoiceFromExtraction,
  useExtractionStatistics,
} from '@/hooks/useExtractedInvoices';
import type {
  ExtractedInvoice,
  ExtractionReviewStatus,
  InvoiceExtractionStatus,
  ExtractedInvoiceData,
} from '@/types/extracted-invoice';

interface ExtractedInvoiceListProps {
  className?: string;
}

export function ExtractedInvoiceList({ className }: ExtractedInvoiceListProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as InvoiceExtractionStatus | undefined,
    reviewStatus: undefined as ExtractionReviewStatus | undefined,
    minConfidence: undefined as number | undefined,
  });

  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [reviewingInvoice, setReviewingInvoice] = useState<ExtractedInvoice | null>(
    null
  );
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global keyboard shortcut for help
  useKeyboardShortcuts([
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: () => setShowShortcuts(true),
      enabled: true,
    },
  ]);

  // Queries
  const { data, isLoading, refetch } = useExtractedInvoices({
    page,
    limit: 20,
    ...filters,
  });

  const { data: statistics } = useExtractionStatistics();

  // Mutations
  const approveMutation = useApproveExtraction();
  const rejectMutation = useRejectExtraction();
  const updateMutation = useUpdateExtractedInvoice();
  const bulkApproveMutation = useBulkApproveExtractions();
  const bulkRejectMutation = useBulkRejectExtractions();
  const createInvoiceMutation = useCreateInvoiceFromExtraction();

  const handleSelectInvoice = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedInvoices(newSelection);
  };

  const handleSelectAll = () => {
    if (!data?.items) return;

    if (selectedInvoices.size === data.items.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(data.items.map((inv) => inv.id)));
    }
  };

  const handleBulkApprove = async () => {
    await bulkApproveMutation.mutateAsync({
      extractionIds: Array.from(selectedInvoices),
      autoCreateInvoices: false,
    });
    setSelectedInvoices(new Set());
  };

  const handleBulkReject = async () => {
    await bulkRejectMutation.mutateAsync({
      extractionIds: Array.from(selectedInvoices),
    });
    setSelectedInvoices(new Set());
  };

  const handleApprove = (id: string, notes?: string) => {
    approveMutation.mutate({ id, notes });
  };

  const handleReject = (id: string, reason?: string) => {
    rejectMutation.mutate({ id, reason });
  };

  const handleUpdate = (id: string, data: ExtractedInvoiceData) => {
    updateMutation.mutate({ id, data: { data } });
  };

  const handleCreateInvoice = (id: string) => {
    createInvoiceMutation.mutate(
      { extractionId: id, applyCorrections: true },
      {
        onSuccess: () => {
          setReviewingInvoice(null);
        },
      }
    );
  };

  const loading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    updateMutation.isPending ||
    bulkApproveMutation.isPending ||
    bulkRejectMutation.isPending ||
    createInvoiceMutation.isPending;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.approved}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Avg. Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averageConfidence * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Vendor, invoice number..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status:
                      value === 'all'
                        ? undefined
                        : (value as InvoiceExtractionStatus),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Review Status</Label>
              <Select
                value={filters.reviewStatus || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    reviewStatus:
                      value === 'all'
                        ? undefined
                        : (value as ExtractionReviewStatus),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="NEEDS_CORRECTION">
                    Needs Correction
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min. Confidence</Label>
              <Select
                value={filters.minConfidence?.toString() || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    minConfidence: value === 'all' ? undefined : parseFloat(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0.8">80%+</SelectItem>
                  <SelectItem value="0.6">60%+</SelectItem>
                  <SelectItem value="0.4">40%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Extracted Invoices</h2>
          {data && (
            <Badge variant="secondary">
              {data.total} total
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (Shift + ?)"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Shortcuts
          </Button>

          {data && data.items.length > 0 && (
            <>
              <ExportMenu
                extractions={data.items}
                statistics={statistics}
                variant="outline"
                size="sm"
              />
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedInvoices.size === data.items.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.items.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No extracted invoices found.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Invoices will appear here after email sync and extraction.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((invoice) => (
              <ExtractedInvoiceCard
                key={invoice.id}
                invoice={invoice}
                selected={selectedInvoices.has(invoice.id)}
                onSelect={(selected) => handleSelectInvoice(invoice.id, selected)}
                onView={() => setReviewingInvoice(invoice)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkApproveToolbar
        selectedCount={selectedInvoices.size}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        onClear={() => setSelectedInvoices(new Set())}
        loading={loading}
      />

      {/* Review Dialog */}
      <InvoiceReviewDialog
        invoice={reviewingInvoice}
        open={!!reviewingInvoice}
        onOpenChange={(open) => !open && setReviewingInvoice(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onUpdate={handleUpdate}
        onCreateInvoice={handleCreateInvoice}
        loading={loading}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </div>
  );
}
