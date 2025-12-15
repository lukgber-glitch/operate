'use client';

import { Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatHours } from '@/hooks/use-time-tracking';
import type { TimeSummary } from '@/lib/api/time-tracking';

interface TimeSummaryStatsProps {
  summary: TimeSummary | null;
  isLoading: boolean;
}

export function TimeSummaryStats({ summary, isLoading }: TimeSummaryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      title: 'Today',
      icon: Clock,
      total: summary.today,
      billable: summary.billableToday,
      nonBillable: summary.nonBillableToday,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'This Week',
      icon: TrendingUp,
      total: summary.thisWeek,
      billable: summary.billableThisWeek,
      nonBillable: summary.nonBillableThisWeek,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'This Month',
      icon: DollarSign,
      total: summary.thisMonth,
      billable: summary.billableThisMonth,
      nonBillable: summary.nonBillableThisMonth,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const billablePercentage = stat.total > 0 ? (stat.billable / stat.total) * 100 : 0;

        return (
          <Card key={stat.title} className={stat.bgColor}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{formatHours(stat.total)}</div>
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{formatHours(stat.billable)} billable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span>{formatHours(stat.nonBillable)} non-billable</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${billablePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
