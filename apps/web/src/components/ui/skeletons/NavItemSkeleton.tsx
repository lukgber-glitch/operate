import { Skeleton } from './Skeleton';

export interface NavItemSkeletonProps {
  /**
   * Sidebar expanded state
   */
  isExpanded?: boolean;
  /**
   * Show nested items
   */
  hasChildren?: boolean;
}

/**
 * NavItemSkeleton - Loading skeleton for navigation items
 *
 * Features:
 * - Icon and label placeholders
 * - Collapsed/expanded states
 * - Optional nested items
 * - Matches NavItem component layout
 *
 * @example
 * // Collapsed sidebar
 * <NavItemSkeleton isExpanded={false} />
 *
 * // Expanded with children
 * <NavItemSkeleton isExpanded hasChildren />
 */
export function NavItemSkeleton({
  isExpanded = true,
  hasChildren = false,
}: NavItemSkeletonProps) {
  return (
    <div className="space-y-1 animate-pulse">
      {/* Main nav item */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-md">
        <Skeleton className="h-5 w-5 flex-shrink-0" />
        {isExpanded && (
          <>
            <Skeleton className="h-4 w-24 flex-1" />
            {hasChildren && <Skeleton className="h-4 w-4" />}
          </>
        )}
      </div>

      {/* Nested children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 space-y-1">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      )}
    </div>
  );
}

/**
 * NavMenuSkeleton - Multiple navigation items skeleton
 *
 * Shows loading state for entire navigation menu
 *
 * @example
 * <NavMenuSkeleton count={6} isExpanded />
 */
export function NavMenuSkeleton({
  count = 6,
  isExpanded = true,
}: {
  count?: number;
  isExpanded?: boolean;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <NavItemSkeleton
          key={i}
          isExpanded={isExpanded}
          hasChildren={i % 3 === 0} // Every 3rd item has children
        />
      ))}
    </div>
  );
}

/**
 * SidebarSkeleton - Complete sidebar loading skeleton
 *
 * Includes header, navigation, and footer sections
 *
 * @example
 * <SidebarSkeleton isExpanded />
 */
export function SidebarSkeleton({ isExpanded = true }: { isExpanded?: boolean }) {
  return (
    <div className="flex flex-col h-full border-r bg-card animate-pulse">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          {isExpanded && <Skeleton className="h-6 w-32" />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        <NavMenuSkeleton count={8} isExpanded={isExpanded} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          {isExpanded && (
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
