/**
 * ExpenseResultCard Component
 * Specialized card for expense-related action results
 */

'use client';

import { motion } from 'framer-motion';
import {
  Receipt,
  Edit,
  Eye,
  Tag,
  Calendar,
  Building2,
  DollarSign,
  Image,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * ExpenseResultCard props
 */
export interface ExpenseResultCardProps {
  /**
   * Vendor/merchant name
   */
  vendorName: string;

  /**
   * Expense amount
   */
  amount: number;

  /**
   * Currency code (e.g., USD, EUR)
   */
  currency?: string;

  /**
   * Expense category
   */
  category?: string;

  /**
   * Expense date
   */
  date: string;

  /**
   * Receipt thumbnail URL
   */
  receiptUrl?: string;

  /**
   * Whether receipt is available
   */
  hasReceipt?: boolean;

  /**
   * Callback when View is clicked
   */
  onView?: () => void;

  /**
   * Callback when Edit is clicked
   */
  onEdit?: () => void;

  /**
   * Callback when Categorize is clicked
   */
  onCategorize?: () => void;

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
 * ExpenseResultCard - Specialized card for expense results
 *
 * Features:
 * - Vendor, amount, category, date display
 * - Receipt thumbnail preview
 * - Quick actions: View, Edit, Categorize
 * - Mobile responsive layout
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <ExpenseResultCard
 *   vendorName="Office Depot"
 *   amount={125.50}
 *   currency="USD"
 *   category="Office Supplies"
 *   date="2024-02-20"
 *   hasReceipt={true}
 *   onView={() => {}}
 * />
 * ```
 */
export function ExpenseResultCard({
  vendorName,
  amount,
  currency = 'USD',
  category,
  date,
  receiptUrl,
  hasReceipt,
  onView,
  onEdit,
  onCategorize,
  className,
  isLoading,
}: ExpenseResultCardProps) {
  // Loading skeleton
  if (isLoading) {
    return <ExpenseResultCardSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className="overflow-hidden border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Receipt className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">
                  Expense Recorded
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">{vendorName}</span>
                </p>
              </div>
            </div>
            {hasReceipt && (
              <Badge className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                Receipt
              </Badge>
            )}
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
              <p className="text-lg font-bold truncate">
                {formatCurrency(amount, currency)}
              </p>
            </div>

            {/* Date */}
            <div className="rounded-md border bg-background/50 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date</span>
              </div>
              <p className="text-sm font-medium">
                {formatDate(date)}
              </p>
            </div>
          </div>

          {/* Category */}
          {category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="font-normal">
                {category}
              </Badge>
            </div>
          )}

          {/* Receipt thumbnail */}
          {receiptUrl && (
            <div className="rounded-md border overflow-hidden bg-muted/50">
              <div className="aspect-video relative">
                <img
                  src={receiptUrl}
                  alt="Receipt thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Image className="h-8 w-8 text-white" />
                </div>
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
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * ExpenseResultCardSkeleton - Loading state
 */
export function ExpenseResultCardSkeleton({
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
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
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
          <Skeleton className="h-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
