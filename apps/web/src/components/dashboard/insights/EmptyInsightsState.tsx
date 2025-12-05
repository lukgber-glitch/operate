'use client';

import { TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyInsightsStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  className?: string;
}

/**
 * EmptyInsightsState - Display when no insights are available
 *
 * Features:
 * - Different messages for filtered vs non-filtered states
 * - Clear filters action
 * - Refresh action
 * - Attractive illustration
 */
export function EmptyInsightsState({
  hasFilters = false,
  onClearFilters,
  onRefresh,
  className,
}: EmptyInsightsStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {/* Icon */}
      <div className="relative mb-6">
        <div className="rounded-full bg-primary/10 p-6">
          <TrendingUp className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 rounded-full bg-primary/20 p-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Message */}
      <h3 className="text-base font-semibold mb-2">
        {hasFilters ? 'No insights match your filters' : 'No insights available'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {hasFilters
          ? 'Try adjusting your filter settings to see more insights'
          : 'AI-generated insights will appear here as your business data is analyzed. Check back soon!'}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        {onRefresh && (
          <Button variant="default" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
