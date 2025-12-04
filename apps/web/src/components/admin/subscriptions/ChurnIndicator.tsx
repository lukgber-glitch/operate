'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChurnMetrics } from '@/types/subscription-analytics';

interface ChurnIndicatorProps {
  metrics: ChurnMetrics;
  isLoading?: boolean;
}

export function ChurnIndicator({ metrics, isLoading = false }: ChurnIndicatorProps) {
  const getChurnColor = (rate: number) => {
    if (rate < 3) return 'text-green-600 dark:text-green-500';
    if (rate < 5) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getChurnProgressColor = (rate: number) => {
    if (rate < 3) return 'bg-green-600';
    if (rate < 5) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />;
    }
  };

  const getTrendLabel = () => {
    switch (metrics.trend) {
      case 'up':
        return 'Increasing';
      case 'down':
        return 'Decreasing';
      default:
        return 'Stable';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-2 w-full animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main Churn Rate */}
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', getChurnColor(metrics.churnRate))}>
              {metrics.churnRate.toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground">{getTrendLabel()}</span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all', getChurnProgressColor(metrics.churnRate))}
              style={{ width: `${Math.min(metrics.churnRate * 10, 100)}%` }}
            />
          </div>

          {/* Detailed Metrics */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Churn:</span>
              <span className="font-medium">{metrics.customerChurnRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue Churn:</span>
              <span className="font-medium">{metrics.revenueChurnRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Churned MRR:</span>
              <span className="font-medium">{formatCurrency(metrics.churnedMRR)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Churned Customers:</span>
              <span className="font-medium">{metrics.churnedCustomers}</span>
            </div>
          </div>

          {/* Warning for High Churn */}
          {metrics.churnRate >= 5 && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 dark:bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
              <div className="text-xs text-red-800 dark:text-red-400">
                <p className="font-medium">High churn rate detected</p>
                <p className="mt-1 text-red-700 dark:text-red-500">
                  Consider implementing retention strategies
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
