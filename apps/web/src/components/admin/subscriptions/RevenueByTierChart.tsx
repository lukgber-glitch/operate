'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RevenueByTier } from '@/types/subscription-analytics';

interface RevenueByTierChartProps {
  data: RevenueByTier[];
  currency?: string;
  isLoading?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  starter: 'hsl(200, 98%, 39%)',
  professional: 'hsl(142, 76%, 36%)',
  enterprise: 'hsl(262, 83%, 58%)',
  custom: 'hsl(25, 95%, 53%)',
};

export function RevenueByTierChart({
  data,
  currency = 'EUR',
  isLoading = false,
}: RevenueByTierChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No revenue data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: formatTierName(item.tier),
    value: item.revenue,
    count: item.subscriptionCount,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Tier</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={TIER_COLORS[data[index].tier] || 'hsl(var(--primary))'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${formatCurrency(value)} (${props.payload.count} subs)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data.map((tier) => (
            <div key={tier.tier} className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier.tier] }}
                />
                <span className="text-xs font-medium">
                  {formatTierName(tier.tier)}
                </span>
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(tier.revenue)}
              </div>
              <div className="text-xs text-muted-foreground">
                {tier.subscriptionCount} subs
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
