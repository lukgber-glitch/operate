'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AutopilotWeeklyData } from '@/hooks/use-autopilot';

interface AutopilotWeeklyChartProps {
  data: AutopilotWeeklyData[];
}

const ACTION_COLORS: Record<string, string> = {
  CATEGORIZE_TRANSACTION: '#3b82f6', // blue
  CREATE_INVOICE: '#10b981', // green
  SEND_REMINDER: '#f59e0b', // yellow
  RECONCILE_TRANSACTION: '#8b5cf6', // purple
  EXTRACT_RECEIPT: '#ec4899', // pink
  PAY_BILL: '#f97316', // orange
  FILE_EXPENSE: '#06b6d4', // cyan
};

export function AutopilotWeeklyChart({ data }: AutopilotWeeklyChartProps) {
  // Transform data for recharts
  const chartData = data.map((day) => {
    const dayData: any = { day: day.day };
    day.actions.forEach((action) => {
      dayData[action.type] = action.count;
    });
    return dayData;
  });

  // Get unique action types for legend
  const actionTypes = Array.from(
    new Set(data.flatMap((day) => day.actions.map((a) => a.type)))
  );

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Weekly Activity</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend
              wrapperStyle={{ color: '#9ca3af' }}
              iconType="square"
            />
            {actionTypes.map((type) => (
              <Bar
                key={type}
                dataKey={type}
                stackId="a"
                fill={ACTION_COLORS[type] || '#6b7280'}
                name={type.replace(/_/g, ' ').toLowerCase()}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
