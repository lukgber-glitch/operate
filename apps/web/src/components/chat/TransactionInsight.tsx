/**
 * TransactionInsight Component
 * Displays bank transaction insights in chat messages with category, tax info, and reconciliation status
 */

'use client';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  CheckCircle,
  Tag,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TransactionInsightProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    merchantName?: string;
    bookingDate: string;
    category?: string;
    taxCategory?: string;
    confidence?: number;
    reconciliationStatus: 'UNMATCHED' | 'MATCHED' | 'IGNORED';
    isDebit: boolean;
  };
  onCategorize?: (id: string) => void;
  onMatch?: (id: string) => void;
  onIgnore?: (id: string) => void;
}

/**
 * Get status configuration for reconciliation status
 */
function getStatusConfig(status: 'UNMATCHED' | 'MATCHED' | 'IGNORED') {
  switch (status) {
    case 'MATCHED':
      return {
        icon: CheckCircle,
        label: 'Matched',
        variant: 'default' as const,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700',
      };
    case 'UNMATCHED':
      return {
        icon: TrendingUp,
        label: 'Unmatched',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
      };
    case 'IGNORED':
      return {
        icon: XCircle,
        label: 'Ignored',
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-700',
      };
  }
}

/**
 * Get confidence level styling and label
 */
function getConfidenceConfig(confidence?: number) {
  if (!confidence) {
    return {
      label: 'Unknown',
      color: 'bg-gray-400',
      textColor: 'text-gray-600 dark:text-gray-400',
    };
  }

  if (confidence >= 0.8) {
    return {
      label: 'High',
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
    };
  }

  if (confidence >= 0.6) {
    return {
      label: 'Medium',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    };
  }

  return {
    label: 'Low',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  };
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(Math.abs(amount));
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TransactionInsight({
  transaction,
  onCategorize,
  onMatch,
  onIgnore,
}: TransactionInsightProps) {
  const statusConfig = getStatusConfig(transaction.reconciliationStatus);
  const confidenceConfig = getConfidenceConfig(transaction.confidence);
  const StatusIcon = statusConfig.icon;

  // Color coding for debit vs credit
  const amountColorClass = transaction.isDebit
    ? 'text-red-600 dark:text-red-400'
    : 'text-green-600 dark:text-green-400';

  const amountIcon = transaction.isDebit ? ArrowDownCircle : ArrowUpCircle;
  const AmountIcon = amountIcon;

  return (
    <Card className={cn(
      'transition-all hover:shadow-md border-l-4',
      transaction.isDebit
        ? 'border-l-red-500'
        : 'border-l-green-500'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Transaction type icon and amount */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'p-2 rounded-lg shrink-0',
              transaction.isDebit
                ? 'bg-red-100 dark:bg-red-950'
                : 'bg-green-100 dark:bg-green-950'
            )}>
              <AmountIcon className={cn('h-5 w-5', amountColorClass)} />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold mb-1">
                <span className={amountColorClass}>
                  {transaction.isDebit ? '-' : '+'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </CardTitle>
              <p className="text-sm font-medium text-foreground truncate mb-1">
                {transaction.description}
              </p>

              {/* Merchant name if available */}
              {transaction.merchantName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{transaction.merchantName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <Badge variant={statusConfig.variant} className={cn('shrink-0', statusConfig.className)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transaction details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(transaction.bookingDate)}
            </span>
          </div>

          {/* Category */}
          {transaction.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium truncate">
                {transaction.category}
              </span>
            </div>
          )}
        </div>

        {/* Tax category if available */}
        {transaction.taxCategory && (
          <div className="p-2 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Tax Category
              </span>
              <Badge variant="outline" className="text-xs">
                {transaction.taxCategory}
              </Badge>
            </div>
          </div>
        )}

        {/* AI Confidence score */}
        {transaction.confidence !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                AI Classification Confidence
              </span>
              <span className={cn('font-medium', confidenceConfig.textColor)}>
                {confidenceConfig.label} ({Math.round(transaction.confidence * 100)}%)
              </span>
            </div>
            <Progress
              value={transaction.confidence * 100}
              className="h-2"
              indicatorClassName={confidenceConfig.color}
            />
          </div>
        )}

        {/* Quick actions - only show if handlers are provided */}
        {(onCategorize || onMatch || onIgnore) && transaction.reconciliationStatus === 'UNMATCHED' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {onCategorize && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCategorize(transaction.id)}
                className="flex-1 min-w-[100px]"
              >
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                Categorize
              </Button>
            )}
            {onMatch && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMatch(transaction.id)}
                className="flex-1 min-w-[100px]"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Match
              </Button>
            )}
            {onIgnore && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onIgnore(transaction.id)}
                className="flex-1 min-w-[100px]"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Ignore
              </Button>
            )}
          </div>
        )}

        {/* Show message for matched/ignored transactions */}
        {transaction.reconciliationStatus === 'MATCHED' && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-green-900 dark:text-green-100">
              This transaction has been matched and reconciled
            </span>
          </div>
        )}

        {transaction.reconciliationStatus === 'IGNORED' && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-950/20 rounded-md text-sm">
            <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">
              This transaction has been marked as ignored
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
