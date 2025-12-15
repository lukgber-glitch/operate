'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface HealthScoreTrendProps {
  data: Array<{ date: string; score: number }>;
  currentScore: number;
  className?: string;
}

export function HealthScoreTrend({ data, currentScore, className }: HealthScoreTrendProps) {
  const strokeColor = useMemo(() => {
    if (currentScore >= 80) return '#22c55e';
    if (currentScore >= 60) return '#eab308';
    if (currentScore >= 40) return '#f97316';
    return '#ef4444';
  }, [currentScore]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: strokeColor }}
          />
          <ReferenceLine
            y={currentScore}
            stroke={strokeColor}
            strokeDasharray="3 3"
            label={{ value: 'Current', fill: strokeColor, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={strokeColor}
            strokeWidth={2}
            dot={{ fill: strokeColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
