import { Skeleton } from './Skeleton';

export interface SuggestionCardSkeletonProps {
  /**
   * Compact mode for horizontal scrolling lists
   */
  compact?: boolean;
}

/**
 * SuggestionCardSkeleton - Loading skeleton for suggestion cards
 *
 * Features:
 * - Matches SuggestionCard layout exactly
 * - Icon, badge, and text placeholders
 * - Compact variant for horizontal lists
 * - Border accent on left
 *
 * @example
 * // Full suggestion card skeleton
 * <SuggestionCardSkeleton />
 *
 * // Compact variant for horizontal scroll
 * <SuggestionCardSkeleton compact />
 */
export function SuggestionCardSkeleton({ compact = false }: SuggestionCardSkeletonProps) {
  if (compact) {
    return (
      <div className="min-w-[280px] max-w-[280px] border border-border rounded-lg border-l-4 border-l-muted">
        <div className="p-4 space-y-3 animate-pulse">
          {/* Header with icon and badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Title */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg border-l-4 border-l-muted">
      <div className="p-6 space-y-4 animate-pulse">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Action button */}
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}

/**
 * SuggestionCardListSkeleton - Multiple suggestion card skeletons
 *
 * @example
 * // Vertical list
 * <SuggestionCardListSkeleton count={3} />
 *
 * // Horizontal scroll
 * <SuggestionCardListSkeleton count={5} compact />
 */
export function SuggestionCardListSkeleton({
  count = 3,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <SuggestionCardSkeleton key={i} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SuggestionCardSkeleton key={i} />
      ))}
    </div>
  );
}
