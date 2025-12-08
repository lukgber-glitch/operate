'use client';

import { AnimatedCard, CardContent, CardHeader, CardTitle } from '@/components/ui/AnimatedCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useRevenueData } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function RevenueChart() {
  const { data, isLoading, error } = useRevenueData(12);

  if (isLoading) {
    return (
      <AnimatedCard hoverEffect="lift" className="rounded-[24px]">
        <CardHeader>
          <CardTitle>Umsatz (12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </AnimatedCard>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <AnimatedCard hoverEffect="lift" className="rounded-[24px]">
        <CardHeader>
          <CardTitle>Umsatz (12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Keine Umsatzdaten verfügbar</p>
          </div>
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard hoverEffect="lift" className="rounded-[24px]">
      <CardHeader>
        <CardTitle>Umsatz (12 Monate)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Umsatz']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
