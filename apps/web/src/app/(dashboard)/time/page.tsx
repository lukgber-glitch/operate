'use client';

import { ActiveTimer, TimeSummaryStats, WeeklySummaryChart, TodayEntries } from '@/components/time-tracking';
import { useTimeSummary } from '@/hooks/use-time-tracking';

export default function TimePage() {
  const { summary, isLoading } = useTimeSummary();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Time Tracking</h1>
        <p className="text-gray-300">Track your time and monitor project progress</p>
      </div>

      {/* Active Timer */}
      <ActiveTimer />

      {/* Summary Stats */}
      <TimeSummaryStats summary={summary} isLoading={isLoading} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Entries */}
        <TodayEntries />

        {/* Weekly Summary Chart */}
        <WeeklySummaryChart summary={summary} isLoading={isLoading} />
      </div>

      {/* Today by Project */}
      {summary?.todayByProject && summary.todayByProject.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.todayByProject.map((item) => (
            <div
              key={item.projectId}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <p className="text-sm text-gray-300 mb-1">{item.projectName}</p>
              <p className="text-2xl font-bold text-white">
                {(item.duration / 3600).toFixed(2)}h
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
