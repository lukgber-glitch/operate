import { Skeleton } from './Skeleton';

export interface DashboardWidgetSkeletonProps {
  /**
   * Widget variant type
   * - chart: Chart widget with graph area
   * - stat: Stat card with large number
   * - list: List widget with multiple rows
   * - table: Table widget with columns
   */
  variant?: 'chart' | 'stat' | 'list' | 'table';
  /**
   * Show header section
   */
  showHeader?: boolean;
}

/**
 * DashboardWidgetSkeleton - Loading skeleton for dashboard widgets
 *
 * Features:
 * - Multiple variants for different widget types
 * - Card-based layout matching real widgets
 * - Header with title and controls
 * - Content area matching widget type
 *
 * @example
 * // Chart widget skeleton
 * <DashboardWidgetSkeleton variant="chart" />
 *
 * // Stat card skeleton
 * <DashboardWidgetSkeleton variant="stat" />
 */
export function DashboardWidgetSkeleton({
  variant = 'chart',
  showHeader = true,
}: DashboardWidgetSkeletonProps) {
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="p-6 space-y-4 animate-pulse">
        {/* Header */}
        {showHeader && (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        )}

        {/* Content based on variant */}
        {variant === 'chart' && <ChartSkeleton />}
        {variant === 'stat' && <StatSkeleton />}
        {variant === 'list' && <ListSkeleton />}
        {variant === 'table' && <TableSkeleton />}
      </div>
    </div>
  );
}

/**
 * ChartSkeleton - Chart area skeleton
 */
function ChartSkeleton() {
  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Chart area */}
      <div className="h-[300px] flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 100 + 50}px` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-12" />
        ))}
      </div>
    </div>
  );
}

/**
 * StatSkeleton - Stat card skeleton
 */
function StatSkeleton() {
  return (
    <div className="space-y-4">
      {/* Large number */}
      <Skeleton className="h-12 w-32" />

      {/* Trend indicator */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * ListSkeleton - List widget skeleton
 */
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * TableSkeleton - Table widget skeleton
 */
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Table rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardGridSkeleton - Multiple dashboard widgets in grid
 *
 * @example
 * <DashboardGridSkeleton count={6} />
 */
export function DashboardGridSkeleton({ count = 6 }: { count?: number }) {
  const variants: Array<'chart' | 'stat' | 'list' | 'table'> = [
    'chart',
    'stat',
    'list',
    'table',
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardWidgetSkeleton
          key={i}
          variant={variants[i % variants.length]}
        />
      ))}
    </div>
  );
}
