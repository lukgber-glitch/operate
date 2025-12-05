'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, XCircle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ReconciliationTransaction, SuggestedMatch } from '@/hooks/use-reconciliation';
import { useSuggestedMatches } from '@/hooks/use-reconciliation';

import { MatchSuggestions } from './MatchSuggestions';

interface TransactionRowProps {
  transaction: ReconciliationTransaction;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onIgnore: (transaction: ReconciliationTransaction) => void;
  onApplyMatch: (transaction: ReconciliationTransaction, match: SuggestedMatch) => void;
  applyingMatch: boolean;
}

const statusColors = {
  UNMATCHED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  MATCHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IGNORED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function TransactionRow({
  transaction,
  isSelected,
  onToggle,
  onIgnore,
  onApplyMatch,
  applyingMatch,
}: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { matches, isLoading, fetchMatches } = useSuggestedMatches(
    isExpanded ? transaction.id : null
  );

  useEffect(() => {
    if (isExpanded && transaction.status === 'UNMATCHED') {
      fetchMatches();
    }
  }, [isExpanded, transaction.status, fetchMatches]);

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleApplyMatch = (entityType: string, entityId: string) => {
    const match = matches.find(
      (m) => m.entityType === entityType && m.entityId === entityId
    );
    if (match) {
      onApplyMatch(transaction, match);
    }
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="w-[30px]" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(transaction.id)}
            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
          />
        </TableCell>
        <TableCell className="w-[30px]">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {formatDate(transaction.transactionDate)}
        </TableCell>
        <TableCell>
          <div className="max-w-md">
            <p className="font-medium truncate">{transaction.description}</p>
            <p className="text-xs text-muted-foreground truncate">
              {transaction.accountName}
            </p>
          </div>
        </TableCell>
        <TableCell className="font-semibold">
          {formatCurrency(transaction.amount, transaction.currency)}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="uppercase text-xs">
            {transaction.type}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={statusColors[transaction.status]}
          >
            {transaction.status.toLowerCase()}
          </Badge>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {transaction.status === 'UNMATCHED' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onIgnore(transaction);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Ignore
              </Button>
            )}
            {transaction.status === 'MATCHED' && (
              <Button size="sm" variant="ghost">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/20">
            <div className="py-4 px-2">
              {transaction.status === 'UNMATCHED' ? (
                <MatchSuggestions
                  suggestions={matches}
                  isLoading={isLoading}
                  onApplyMatch={handleApplyMatch}
                  applyingMatch={applyingMatch}
                />
              ) : transaction.status === 'MATCHED' ? (
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Matched Transaction</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Matched to:</span>{' '}
                      <span className="font-medium">
                        {transaction.matchedEntityType === 'EXPENSE' ? 'Expense' : 'Invoice Payment'}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Entity ID:</span>{' '}
                      <span className="font-mono text-xs">{transaction.matchedEntityId}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Ignored Transaction</span>
                  </div>
                  <div className="text-sm">
                    <p>
                      <span className="text-muted-foreground">Reason:</span>{' '}
                      <span className="font-medium">{transaction.ignoredReason || 'Not specified'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
