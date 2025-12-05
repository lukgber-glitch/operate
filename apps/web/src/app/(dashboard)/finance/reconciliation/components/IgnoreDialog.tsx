'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ReconciliationTransaction } from '@/hooks/use-reconciliation';

interface IgnoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ReconciliationTransaction | null;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const IGNORE_REASONS = [
  { value: 'PERSONAL', label: 'Personal Transaction' },
  { value: 'DUPLICATE', label: 'Duplicate Entry' },
  { value: 'INTERNAL_TRANSFER', label: 'Internal Transfer' },
  { value: 'RECONCILED_EXTERNALLY', label: 'Reconciled Externally' },
  { value: 'OTHER', label: 'Other' },
];

export function IgnoreDialog({
  open,
  onOpenChange,
  transaction,
  onConfirm,
  isLoading,
}: IgnoreDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleConfirm = () => {
    const reason = selectedReason === 'OTHER' ? customReason : selectedReason;
    if (reason) {
      onConfirm(reason);
      // Reset form
      setSelectedReason('');
      setCustomReason('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedReason('');
      setCustomReason('');
    }
    onOpenChange(open);
  };

  const isValid = selectedReason && (selectedReason !== 'OTHER' || customReason.trim());

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ignore Transaction</DialogTitle>
          <DialogDescription>
            This transaction will be marked as ignored and excluded from reconciliation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Details */}
          <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{transaction.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {transaction.accountName} • {formatDate(transaction.transactionDate)}
                </p>
              </div>
              <p className="font-semibold text-sm">
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for ignoring</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {IGNORE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Please specify</Label>
              <Textarea
                id="customReason"
                placeholder="Enter reason for ignoring this transaction..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <XCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-400">
                Transaction will be excluded
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                Ignored transactions won't appear in reconciliation reports. You can unignore
                them later if needed.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Ignoring...' : 'Ignore Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
