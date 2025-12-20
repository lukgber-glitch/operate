'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatHours } from '@/hooks/use-time-tracking';
import type { TimeSummary } from '@/lib/api/time-tracking';

interface WeeklySummaryChartProps {
  summary: TimeSummary | null;
  isLoading: boolean;
}

export function WeeklySummaryChart({ summary, isLoading }: WeeklySummaryChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || !summary.weekByDay) return null;

  const chartData = summary.weekByDay.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    billable: day.billable / 3600,
    nonBillable: day.nonBillable / 3600,
    total: day.duration / 3600,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week's Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `${value}h`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#fff',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}h`, '']}
            />
            <Legend />
            <Bar dataKey="billable" stackId="a" fill="#10b981" name="Billable" />
            <Bar dataKey="nonBillable" stackId="a" fill="#6b7280" name="Non-billable" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
