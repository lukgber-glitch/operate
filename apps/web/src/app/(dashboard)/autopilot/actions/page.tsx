'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAutopilotActions,
  useApproveAction,
  useRejectAction,
  AutopilotActionType,
  AutopilotActionStatus,
} from '@/hooks/use-autopilot';
import {
  AutopilotActionIcon,
  getActionTypeLabel,
  getActionTypeColor,
} from '@/components/autopilot';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function getStatusBadge(status: AutopilotActionStatus) {
  const variants: Record<AutopilotActionStatus, { label: string; className: string }> = {
    EXECUTED: { label: 'Executed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    APPROVED: { label: 'Approved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    FAILED: { label: 'Failed', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  };

  const variant = variants[status];
  return (
    <Badge variant="outline" className={cn('border', variant.className)}>
      {variant.label}
    </Badge>
  );
}

export default function AutopilotActionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AutopilotActionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AutopilotActionStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { actions, total, isLoading, fetchActions } = useAutopilotActions({
    page,
    pageSize,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { approveAction } = useApproveAction();
  const { rejectAction } = useRejectAction();

  useEffect(() => {
    fetchActions();
  }, [page, typeFilter, statusFilter]);

  const handleBulkApprove = async () => {
    const pendingActions = actions.filter((a) => a.status === 'PENDING');
    for (const action of pendingActions) {
      try {
        await approveAction(action.id);
      } catch (error) {
        console.error(`Failed to approve action ${action.id}:`, error);
      }
    }
    await fetchActions();
  };

  const handleBulkReject = async () => {
    const pendingActions = actions.filter((a) => a.status === 'PENDING');
    for (const action of pendingActions) {
      try {
        await rejectAction(action.id, 'Bulk rejection');
      } catch (error) {
        console.error(`Failed to reject action ${action.id}:`, error);
      }
    }
    await fetchActions();
  };

  const totalPages = Math.ceil(total / pageSize);
  const pendingCount = actions.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/autopilot">
            <Button variant="ghost" className="mb-2 text-gray-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Autopilot
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-white">All Actions</h1>
          <p className="text-sm text-gray-400">
            Complete history of autopilot actions ({total} total)
          </p>
        </div>
        <Button variant="outline" className="border-white/10">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CATEGORIZE_TRANSACTION">Categorize</SelectItem>
            <SelectItem value="CREATE_INVOICE">Create Invoice</SelectItem>
            <SelectItem value="SEND_REMINDER">Send Reminder</SelectItem>
            <SelectItem value="RECONCILE_TRANSACTION">Reconcile</SelectItem>
            <SelectItem value="EXTRACT_RECEIPT">Extract Receipt</SelectItem>
            <SelectItem value="PAY_BILL">Pay Bill</SelectItem>
            <SelectItem value="FILE_EXPENSE">File Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="EXECUTED">Executed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-400">
            {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkApprove}
              className="bg-green-500 hover:bg-green-600"
            >
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkReject}
              className="border-red-500/50 text-red-400"
            >
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Description</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Confidence</TableHead>
              <TableHead className="text-gray-400">Created</TableHead>
              <TableHead className="text-gray-400">Executed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  Loading actions...
                </TableCell>
              </TableRow>
            ) : actions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  No actions found
                </TableCell>
              </TableRow>
            ) : (
              actions.map((action) => (
                <TableRow
                  key={action.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          getActionTypeColor(action.type)
                        )}
                      >
                        <AutopilotActionIcon type={action.type} className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-white">
                        {getActionTypeLabel(action.type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-300 max-w-md truncate">
                    {action.description}
                  </TableCell>
                  <TableCell>{getStatusBadge(action.status)}</TableCell>
                  <TableCell className="text-sm text-gray-300">
                    {action.confidence}%
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {format(new Date(action.createdAt), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {action.executedAt
                      ? format(new Date(action.executedAt), 'MMM d, HH:mm')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-white/10"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
