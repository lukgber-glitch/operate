import { Skeleton } from './Skeleton';

/**
 * ConversationItemSkeleton - Loading skeleton for conversation history items
 *
 * Features:
 * - Matches ConversationItem layout
 * - Icon placeholder (message icon area)
 * - Title and preview text lines
 * - Timestamp placeholder
 *
 * @example
 * <ConversationItemSkeleton />
 */
export function ConversationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg p-3 animate-pulse">
      {/* Icon */}
      <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title and action button area */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>

        {/* Preview text */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        {/* Timestamp */}
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * ConversationListSkeleton - Multiple conversation item skeletons
 *
 * Shows loading state for conversation history sidebar
 *
 * @example
 * <ConversationListSkeleton count={5} />
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </div>
  );
}
