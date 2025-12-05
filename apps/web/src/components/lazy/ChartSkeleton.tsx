/**
 * Loading skeleton for chart components
 * Provides visual feedback while chart libraries load
 */

import { LoadingSkeleton } from './LoadingSkeleton';

interface ChartSkeletonProps {
  height?: number;
  title?: string;
  showLegend?: boolean;
}

export function ChartSkeleton({
  height = 350,
  title,
  showLegend = true
}: ChartSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      {title && (
        <div className="space-y-2">
          <LoadingSkeleton variant="text" className="w-1/4" height={20} />
          <LoadingSkeleton variant="text" className="w-1/3" height={16} />
        </div>
      )}

      {/* Chart area */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <LoadingSkeleton
          height={height}
          variant="rectangle"
          className="w-full"
        />
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex gap-4 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <LoadingSkeleton variant="circle" className="w-3 h-3" />
              <LoadingSkeleton variant="text" className="w-16" height={12} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Skeleton for dashboard chart widget
export function ChartWidgetSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" className="w-32" height={20} />
          <LoadingSkeleton variant="text" className="w-48" height={14} />
        </div>
        <div className="flex gap-2">
          <LoadingSkeleton variant="rectangle" className="w-24 h-9" />
          <LoadingSkeleton variant="rectangle" className="w-24 h-9" />
        </div>
      </div>

      {/* Chart */}
      <ChartSkeleton height={300} showLegend={false} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <LoadingSkeleton variant="text" className="w-20" height={12} />
            <LoadingSkeleton variant="text" className="w-24" height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
