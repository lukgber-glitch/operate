/**
 * Loading skeleton for dashboard pages
 */

import { ChartWidgetSkeleton } from './ChartSkeleton';
import { CardSkeleton } from './LoadingSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Chart widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidgetSkeleton />
        <ChartWidgetSkeleton />
      </div>

      {/* Table or list */}
      <CardSkeleton />
    </div>
  );
}
