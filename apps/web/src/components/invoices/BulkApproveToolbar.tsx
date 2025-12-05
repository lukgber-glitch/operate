/**
 * Bulk Approve Toolbar Component
 * Toolbar for bulk actions on extracted invoices
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface BulkApproveToolbarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onCreateInvoices?: () => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}

export function BulkApproveToolbar({
  selectedCount,
  onApprove,
  onReject,
  onCreateInvoices,
  onClear,
  loading = false,
  className,
}: BulkApproveToolbarProps) {
  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'bg-card border rounded-lg shadow-lg p-4',
          'flex items-center gap-4',
          'animate-in slide-in-from-bottom-5 duration-300',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={loading}
          >
            Clear
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowApproveDialog(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Approve
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRejectDialog(true)}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>

          {onCreateInvoices && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={loading}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Create Invoices
            </Button>
          )}
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Selected Extractions?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve {selectedCount} extracted{' '}
              {selectedCount === 1 ? 'invoice' : 'invoices'}. This action will
              mark them as approved and ready for invoice creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onApprove();
                setShowApproveDialog(false);
              }}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Selected Extractions?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reject {selectedCount} extracted{' '}
              {selectedCount === 1 ? 'invoice' : 'invoices'}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReject();
                setShowRejectDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Invoices Confirmation Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Invoices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create {selectedCount} new{' '}
              {selectedCount === 1 ? 'invoice' : 'invoices'} from the approved
              extractions. Make sure all data has been reviewed and corrected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCreateInvoices?.();
                setShowCreateDialog(false);
              }}
            >
              Create Invoices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
