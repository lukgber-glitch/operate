'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { GlassCard } from '@/components/ui/glass-card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';

interface MileageChartProps {
  data: Array<{
    month: string;
    distance: number;
    amount: number;
    entries: number;
  }>;
  currency: CurrencyCode;
  distanceUnit: 'km' | 'miles';
}

export function MileageChart({ data, currency, distanceUnit }: MileageChartProps) {
  if (!data || data.length === 0) {
    return (
      <GlassCard className="rounded-[16px] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Trend</h3>
        <div className="flex items-center justify-center h-[300px] text-white/50">
          No data available
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="rounded-[16px] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 10, 10, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'distance') {
                return [`${value} ${distanceUnit}`, 'Distance'];
              }
              if (name === 'amount') {
                return [
                  <CurrencyDisplay key="amount" amount={value} currency={currency} />,
                  'Amount',
                ];
              }
              if (name === 'entries') {
                return [value, 'Entries'];
              }
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
            formatter={(value) => {
              if (value === 'distance') return `Distance (${distanceUnit})`;
              if (value === 'amount') return 'Amount';
              if (value === 'entries') return 'Entries';
              return value;
            }}
          />
          <Bar dataKey="distance" fill="#1565C0" radius={[8, 8, 0, 0]} />
          <Bar dataKey="amount" fill="#34d399" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
