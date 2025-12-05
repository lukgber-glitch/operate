'use client';

import { formatCurrency } from '@/hooks/useCashFlowData';
import { cn } from '@/lib/utils';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  currency?: string;
}

/**
 * ChartTooltip - Custom tooltip component for Recharts
 *
 * Features:
 * - Shows date label
 * - Displays all data series with colors
 * - Formatted currency values
 * - Clean, readable design
 */
export function ChartTooltip({ active, payload, label, currency = 'EUR' }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Map dataKey to readable labels
  const labelMap: Record<string, string> = {
    income: 'Income',
    expenses: 'Expenses',
    net: 'Net Cash Flow',
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      {/* Date Label */}
      <div className="text-sm font-medium text-foreground mb-2 pb-2 border-b border-border">
        {label}
      </div>

      {/* Data Series */}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const isNet = entry.dataKey === 'net';
          const isNegative = entry.value < 0;

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {labelMap[entry.dataKey] || entry.name}
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  isNet && isNegative ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}
              >
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Net Indicator (if showing all three values) */}
      {(() => {
        const balanceEntry = payload[2];
        if (payload.length !== 3 || !balanceEntry) return null;
        const balanceValue = balanceEntry.value as number;
        return (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  balanceValue >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {balanceValue >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
