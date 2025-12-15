/**
 * TransactionResultCard Component
 * Specialized card for bank transaction action results
 */

'use client';

import { motion } from 'framer-motion';
import {
  CreditCard,
  Eye,
  Tag,
  Link as LinkIcon,
  XCircle,
  Calendar,
  Building,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Transaction type
 */
export type TransactionType = 'DEBIT' | 'CREDIT';

/**
 * Match status
 */
export type MatchStatus = 'matched' | 'unmatched' | 'ignored';

/**
 * TransactionResultCard props
 */
export interface TransactionResultCardProps {
  /**
   * Transaction description
   */
  description: string;

  /**
   * Transaction amount
   */
  amount: number;

  /**
   * Currency code
   */
  currency?: string;

  /**
   * Transaction date
   */
  date: string;

  /**
   * Transaction type (debit/credit)
   */
  type: TransactionType;

  /**
   * Account name
   */
  accountName?: string;

  /**
   * Category
   */
  category?: string;

  /**
   * Match status
   */
  matchStatus: MatchStatus;

  /**
   * Matched entity info (if matched)
   */
  matchedTo?: {
    type: 'invoice' | 'expense';
    id: string;
    number: string;
  };

  /**
   * Callback when Match is clicked
   */
  onMatch?: () => void;

  /**
   * Callback when Categorize is clicked
   */
  onCategorize?: () => void;

  /**
   * Callback when Ignore is clicked
   */
  onIgnore?: () => void;

  /**
   * Callback when View is clicked
   */
  onView?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show loading skeleton
   */
  isLoading?: boolean;
}

/**
 * Get match status configuration
 */
function getMatchStatusConfig(status: MatchStatus) {
  const configs = {
    matched: {
      label: 'Matched',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
      Icon: CheckCircle,
    },
    unmatched: {
      label: 'Unmatched',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
      Icon: XCircle,
    },
    ignored: {
      label: 'Ignored',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      Icon: XCircle,
    },
  };

  return configs[status];
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * TransactionResultCard - Specialized card for transaction results
 *
 * Features:
 * - Description, amount, date, account display
 * - Debit/credit indicator with color coding
 * - Category badge
 * - Match status indicator
 * - Matched entity link (if applicable)
 * - Quick actions: Match, Categorize, Ignore
 * - Mobile responsive layout
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <TransactionResultCard
 *   description="Office supplies purchase"
 *   amount={125.50}
 *   currency="USD"
 *   date="2024-02-20"
 *   type="DEBIT"
 *   matchStatus="unmatched"
 *   onMatch={() => {}}
 * />
 * ```
 */
export function TransactionResultCard({
  description,
  amount,
  currency = 'USD',
  date,
  type,
  accountName,
  category,
  matchStatus,
  matchedTo,
  onMatch,
  onCategorize,
  onIgnore,
  onView,
  className,
  isLoading,
}: TransactionResultCardProps) {
  const isDebit = type === 'DEBIT';
  const statusConfig = getMatchStatusConfig(matchStatus);
  const StatusIcon = statusConfig.Icon;

  // Loading skeleton
  if (isLoading) {
    return <TransactionResultCardSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className="overflow-hidden border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <CreditCard className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">
                  {description}
                </h3>
                {accountName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Building className="h-3.5 w-3.5" />
                    <span className="truncate">{accountName}</span>
                  </p>
                )}
              </div>
            </div>
            <Badge
              className={cn(
                'shrink-0',
                isDebit
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
              )}
            >
              {isDebit ? 'Debit' : 'Credit'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main info grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div className="rounded-md border bg-background/50 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Amount</span>
              </div>
              <p
                className={cn(
                  'text-lg font-bold truncate',
                  isDebit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                )}
              >
                {isDebit ? '-' : '+'}
                {formatCurrency(amount, currency)}
              </p>
            </div>

            {/* Date */}
            <div className="rounded-md border bg-background/50 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date</span>
              </div>
              <p className="text-sm font-medium">{formatDate(date)}</p>
            </div>
          </div>

          {/* Category and Match Status */}
          <div className="flex items-center justify-between gap-3">
            {category ? (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-normal">
                  {category}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                <span>No category</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <StatusIcon className="h-4 w-4" />
              <Badge className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Matched entity info */}
          {matchStatus === 'matched' && matchedTo && (
            <div className="rounded-md border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-3">
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-900 dark:text-green-100">
                  Matched to {matchedTo.type === 'invoice' ? 'Invoice' : 'Expense'}{' '}
                  <span className="font-semibold">{matchedTo.number}</span>
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onView && (
              <Button
                onClick={onView}
                variant="default"
                size="sm"
                className="flex-1 gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            )}
            {matchStatus === 'unmatched' && onMatch && (
              <Button
                onClick={onMatch}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Match
              </Button>
            )}
            {onCategorize && !category && (
              <Button
                onClick={onCategorize}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Tag className="h-4 w-4" />
                Categorize
              </Button>
            )}
            {matchStatus === 'unmatched' && onIgnore && (
              <Button
                onClick={onIgnore}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <XCircle className="h-4 w-4" />
                Ignore
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * TransactionResultCardSkeleton - Loading state
 */
export function TransactionResultCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('max-w-[480px] mx-auto', className)}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-8" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
