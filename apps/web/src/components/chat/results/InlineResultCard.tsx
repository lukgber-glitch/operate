/**
 * InlineResultCard Component
 * Versatile card component for displaying action results inline in chat
 */

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Metric with optional trend indicator
 */
export interface Metric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
}

/**
 * Action button configuration
 */
export interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

/**
 * InlineResultCard props
 */
export interface InlineResultCardProps {
  /**
   * Visual style based on result type
   */
  type: 'success' | 'warning' | 'error' | 'info';

  /**
   * Main title of the result
   */
  title: string;

  /**
   * Optional subtitle or description
   */
  subtitle?: string;

  /**
   * Metrics to display (e.g., amount, count)
   */
  metrics?: Metric[];

  /**
   * Action buttons
   */
  actions?: Action[];

  /**
   * Whether the card can expand to show more details
   */
  expandable?: boolean;

  /**
   * Callback when expand is triggered
   */
  onExpand?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show loading skeleton
   */
  isLoading?: boolean;

  /**
   * Children for expanded content
   */
  children?: React.ReactNode;
}

/**
 * Get type-specific styling
 */
function getTypeStyles(type: InlineResultCardProps['type']) {
  const styles = {
    success: {
      border: 'border-green-200 dark:border-green-900',
      bg: 'bg-green-50/50 dark:bg-green-950/20',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
    },
    warning: {
      border: 'border-orange-200 dark:border-orange-900',
      bg: 'bg-orange-50/50 dark:bg-orange-950/20',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
    },
    error: {
      border: 'border-red-200 dark:border-red-900',
      bg: 'bg-red-50/50 dark:bg-red-950/20',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
    },
    info: {
      border: 'border-blue-200 dark:border-blue-900',
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
    },
  };

  return styles[type];
}

/**
 * InlineResultCard - Versatile action result card
 *
 * Features:
 * - Type-based styling (success, warning, error, info)
 * - Metrics display with trend indicators
 * - Action buttons
 * - Optional expandable content
 * - Loading skeleton state
 * - Smooth animations
 * - Mobile responsive
 *
 * @example
 * ```tsx
 * <InlineResultCard
 *   type="success"
 *   title="Invoice Created"
 *   subtitle="INV-2024-001 for Acme Corp"
 *   metrics={[
 *     { label: 'Amount', value: '$2,500.00', trend: 'up' }
 *   ]}
 *   actions={[
 *     { label: 'View', onClick: () => {}, variant: 'primary' }
 *   ]}
 * />
 * ```
 */
export function InlineResultCard({
  type,
  title,
  subtitle,
  metrics,
  actions,
  expandable,
  onExpand,
  className,
  isLoading,
  children,
}: InlineResultCardProps) {
  const styles = getTypeStyles(type);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('max-w-[480px] mx-auto', className)}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('max-w-[480px] mx-auto', className)}
    >
      <Card className={cn('overflow-hidden', styles.border, styles.bg)}>
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
            <Badge className={cn('shrink-0', styles.badge)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metrics */}
          {metrics && metrics.length > 0 && (
            <div
              className={cn(
                'grid gap-3',
                metrics.length === 1
                  ? 'grid-cols-1'
                  : metrics.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="rounded-md border bg-background/50 p-3"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {metric.label}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-bold truncate">
                      {metric.value}
                    </p>
                    {metric.trend && (
                      <span
                        className={cn(
                          'shrink-0',
                          metric.trend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expanded content */}
          {children && <div className="pt-2 border-t">{children}</div>}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div
              className={cn(
                'flex gap-2',
                actions.length > 2 ? 'flex-col sm:flex-row' : 'flex-row'
              )}
            >
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={
                    action.variant === 'primary' ? 'default' : 'outline'
                  }
                  size="sm"
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Expand button */}
          {expandable && onExpand && (
            <Button
              onClick={onExpand}
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              View Details
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * InlineResultCardSkeleton - Loading state
 */
export function InlineResultCardSkeleton({
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
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
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
