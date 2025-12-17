'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useExpenseCategories } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

function ExpenseBreakdownComponent() {
  const { data, isLoading, error } = useExpenseCategories();

  if (isLoading) {
    return (
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle>Ausgaben nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle>Ausgaben nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-300">
            <p>Keine Ausgabendaten verfügbar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartCells = useMemo(() => {
    return data.map((entry, index) => (
      <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
    ));
  }, [data]);

  return (
    <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle>Ausgaben nach Kategorie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any[]}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              >
                {chartCells}
              </Pie>
              <Tooltip
                formatter={(value: number) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export const ExpenseBreakdown = memo(ExpenseBreakdownComponent);
