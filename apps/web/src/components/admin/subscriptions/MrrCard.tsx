'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MrrCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  currency?: string;
  isLoading?: boolean;
  format?: 'currency' | 'number' | 'percentage';
}

export function MrrCard({
  title,
  value,
  change,
  changeLabel,
  currency = 'EUR',
  isLoading = false,
  format = 'currency',
}: MrrCardProps) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('de-DE').format(val);
  };

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <ArrowUpIcon className="h-4 w-4" />;
    if (change < 0) return <ArrowDownIcon className="h-4 w-4" />;
    return <MinusIcon className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-muted-foreground';
    if (change > 0) return 'text-green-600 dark:text-green-500';
    if (change < 0) return 'text-red-600 dark:text-red-500';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          {changeLabel && (
            <div className="mt-1 h-4 w-24 animate-pulse rounded bg-muted" />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && change !== null && (
          <div className={cn('mt-1 flex items-center gap-1 text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
