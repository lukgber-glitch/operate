'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import type { CashFlowDataPoint } from './types';

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  currency?: string;
  height?: number;
  className?: string;
}

export function CashFlowChart({ data, currency = 'EUR', height = 350, className }: CashFlowChartProps) {
  // Find the lowest balance point
  const lowestPoint = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.reduce((min, point) =>
      point.balance < min.balance ? point : min
    );
  }, [data]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as CashFlowDataPoint;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-2">
        <p className="font-semibold text-sm">
          {format(parseISO(data.date), 'MMM dd, yyyy')}
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-bold">{formatCurrency(data.balance)}</span>
          </div>
          {data.inflows > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-green-600">Inflows:</span>
              <span className="font-semibold text-green-600">+{formatCurrency(data.inflows)}</span>
            </div>
          )}
          {data.outflows > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-red-600">Outflows:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(data.outflows)}</span>
            </div>
          )}
        </div>
        {data.items && data.items.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Transactions:</p>
            <ul className="text-xs space-y-0.5">
              {data.items.slice(0, 3).map((item, i) => (
                <li key={i} className="text-muted-foreground truncate max-w-[200px]">
                  {item}
                </li>
              ))}
              {data.items.length > 3 && (
                <li className="text-muted-foreground italic">
                  +{data.items.length - 3} more...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Custom dot for lowest point
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (lowestPoint && payload.date === lowestPoint.date) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
          <AlertTriangle
            x={cx - 8}
            y={cy - 24}
            width={16}
            height={16}
            className="text-red-600 fill-red-600"
          />
        </g>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No cash flow data available
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
            className="text-xs"
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          {lowestPoint && lowestPoint.balance < 1000 && (
            <ReferenceLine
              y={1000}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Low Balance Warning', position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            dot={<CustomDot />}
          />
        </AreaChart>
      </ResponsiveContainer>

      {lowestPoint && lowestPoint.balance < 1000 && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-900 dark:text-red-100">Low Cash Warning</p>
            <p className="text-red-700 dark:text-red-300">
              Balance will drop to {formatCurrency(lowestPoint.balance)} on{' '}
              {format(parseISO(lowestPoint.date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
