/**
 * ListResultCard Component
 * For displaying lists of items (invoices, expenses, etc)
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * List item interface
 */
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  currency?: string;
  status?: string;
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  metadata?: string;
}

/**
 * ListResultCard props
 */
export interface ListResultCardProps {
  /**
   * List title
   */
  title: string;

  /**
   * List subtitle/description
   */
  subtitle?: string;

  /**
   * Total count
   */
  count: number;

  /**
   * Total amount (if applicable)
   */
  total?: number;

  /**
   * Currency code
   */
  currency?: string;

  /**
   * List items
   */
  items: ListItem[];

  /**
   * Maximum items to show initially
   */
  maxVisible?: number;

  /**
   * Callback when View All is clicked
   */
  onViewAll?: () => void;

  /**
   * Callback when Export is clicked
   */
  onExport?: () => void;

  /**
   * Callback when an item is clicked
   */
  onItemClick?: (itemId: string) => void;

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
 * ListResultCard - For displaying lists of items
 *
 * Features:
 * - Header with count and total
 * - Scrollable list of mini-cards (max 5 visible by default)
 * - Expandable to show more items
 * - View All button that triggers side panel
 * - Export option
 * - Click handlers for individual items
 * - Mobile responsive layout
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <ListResultCard
 *   title="Outstanding Invoices"
 *   count={12}
 *   total={15000}
 *   currency="USD"
 *   items={[
 *     {
 *       id: '1',
 *       title: 'INV-2024-001',
 *       subtitle: 'Acme Corp',
 *       amount: 2500,
 *       status: 'Overdue',
 *       statusVariant: 'destructive',
 *     },
 *   ]}
 *   onViewAll={() => {}}
 * />
 * ```
 */
export function ListResultCard({
  title,
  subtitle,
  count,
  total,
  currency = 'USD',
  items,
  maxVisible = 5,
  onViewAll,
  onExport,
  onItemClick,
  className,
  isLoading,
}: ListResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  // Loading skeleton
  if (isLoading) {
    return <ListResultCardSkeleton className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {count} {count === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          {/* Total amount */}
          {total !== undefined && (
            <div className="mt-3 p-3 rounded-md bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold">
                {formatCurrency(total, currency)}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              <ScrollArea className={cn(!isExpanded && hasMore && 'max-h-[300px]')}>
                <div className="space-y-2 pr-4">
                  <AnimatePresence>
                    {visibleItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <button
                          onClick={() => onItemClick?.(item.id)}
                          className={cn(
                            'w-full rounded-md border bg-background p-3 text-left transition-all',
                            onItemClick &&
                              'hover:border-primary hover:shadow-sm active:scale-[0.98]'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {item.subtitle}
                                </p>
                              )}
                              {item.metadata && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.metadata}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {item.amount !== undefined && (
                                <p className="text-sm font-bold">
                                  {formatCurrency(item.amount, item.currency || currency)}
                                </p>
                              )}
                              {item.status && (
                                <Badge
                                  variant={item.statusVariant || 'outline'}
                                  className="text-xs"
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Expand/Collapse toggle */}
              {hasMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>
                        Show {items.length - maxVisible} More
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items to display</p>
            </div>
          )}

          {/* Actions */}
          {items.length > 0 && (onViewAll || onExport) && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              {onViewAll && (
                <Button
                  onClick={onViewAll}
                  variant="default"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All
                </Button>
              )}
              {onExport && (
                <Button
                  onClick={onExport}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * ListResultCardSkeleton - Loading state
 */
export function ListResultCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('max-w-[480px] mx-auto', className)}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-16 mt-3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
