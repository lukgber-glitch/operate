'use client';

import { FileText, Receipt, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReconciliationTransaction, SuggestedMatch } from '@/hooks/use-reconciliation';

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ReconciliationTransaction | null;
  match: SuggestedMatch | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function MatchDialog({
  open,
  onOpenChange,
  transaction,
  match,
  onConfirm,
  isLoading,
}: MatchDialogProps) {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  if (!transaction || !match) return null;

  const amountDifference = Math.abs(transaction.amount - match.entity.amount);
  const hasDiscrepancy = amountDifference > 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Match</DialogTitle>
          <DialogDescription>
            Review the details before confirming this match
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Bank Transaction</h4>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.accountName} • {formatDate(transaction.transactionDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow Indicator */}
          <div className="flex items-center justify-center">
            <div className="p-2 bg-primary/10 rounded-full">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Match Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">
                {match.entityType === 'EXPENSE' ? 'Expense' : 'Invoice Payment'}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {match.confidence}% confidence
              </Badge>
            </div>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {match.entityType === 'EXPENSE' ? (
                    <Receipt className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {match.entity.number || match.entity.description}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {match.entity.description}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(match.entity.amount, match.entity.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(match.entity.date)}</span>
                    {match.entity.vendorName && <span>{match.entity.vendorName}</span>}
                    {match.entity.customerName && <span>{match.entity.customerName}</span>}
                    {match.entity.category && (
                      <Badge variant="outline" className="text-xs">
                        {match.entity.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded text-sm">
                <p className="text-muted-foreground">{match.reason}</p>
              </div>
            </div>
          </div>

          {/* Warning for discrepancies */}
          {hasDiscrepancy && (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Amount Discrepancy
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                There is a difference of {formatCurrency(amountDifference, transaction.currency)}{' '}
                between the transaction and the matched entity.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Confirming...' : 'Confirm Match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
