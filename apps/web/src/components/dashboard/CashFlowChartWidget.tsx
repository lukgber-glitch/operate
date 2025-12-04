'use client';

import { useState, useRef } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { toPng } from 'html-to-image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CashFlowChart, type ChartType } from './charts/CashFlowChart';
import {
  useCashFlowData,
  formatCurrency,
  type TimePeriod,
  type CashFlowFilters,
} from '@/hooks/useCashFlowData';
import { cn } from '@/lib/utils';

export interface CashFlowChartWidgetProps {
  className?: string;
  defaultPeriod?: TimePeriod;
  defaultChartType?: ChartType;
  showExport?: boolean;
}

/**
 * CashFlowChartWidget - Complete cash flow visualization widget
 *
 * Features:
 * - Multiple time period selection
 * - Three chart types (bar, line, area)
 * - Summary statistics with trends
 * - Export as PNG
 * - Loading states
 * - Error handling
 * - Responsive design
 */
export function CashFlowChartWidget({
  className,
  defaultPeriod = '30d',
  defaultChartType = 'bar',
  showExport = true,
}: CashFlowChartWidgetProps) {
  const [period, setPeriod] = useState<TimePeriod>(defaultPeriod);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [customDateRange, setCustomDateRange] = useState<{ start?: string; end?: string }>({});
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch cash flow data
  const filters: CashFlowFilters = {
    period,
    startDate: customDateRange.start,
    endDate: customDateRange.end,
    currency: 'EUR',
  };

  const { data, isLoading, isError, error } = useCashFlowData(filters);

  // Handle export to PNG
  const handleExport = async () => {
    if (!chartRef.current) return;

    try {
      const dataUrl = await toPng(chartRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `cash-flow-${period}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  // Period label mapping
  const periodLabels: Record<TimePeriod, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '3m': 'Last 3 Months',
    '12m': 'Last 12 Months',
    'custom': 'Custom Range',
  };

  // Chart type icons
  const chartTypeIcons: Record<ChartType, typeof BarChart3> = {
    bar: BarChart3,
    line: LineChartIcon,
    area: AreaChartIcon,
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Cash Flow Overview
            </CardTitle>
            <CardDescription>Track your income and expenses over time</CardDescription>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {(['bar', 'line', 'area'] as ChartType[]).map((type) => {
                const Icon = chartTypeIcons[type];
                return (
                  <Button
                    key={type}
                    variant={chartType === type ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setChartType(type)}
                    title={`${type.charAt(0).toUpperCase() + type.slice(1)} chart`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            {/* Export Button */}
            {showExport && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleExport}
                disabled={isLoading || isError}
                title="Export as PNG"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 pt-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[350px] w-full" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">Failed to load cash flow data</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        )}

        {/* Success State */}
        {data && !isLoading && !isError && (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Income */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Total Income</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalIncome, data.currency)}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-600" />
                  <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalExpenses, data.currency)}
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Net Cash Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {formatCurrency(data.summary.netCashFlow, data.currency)}
                  </span>
                  <Badge
                    variant={data.summary.percentChange >= 0 ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {data.summary.percentChange >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(data.summary.percentChange).toFixed(1)}%</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  vs. previous period: {formatCurrency(data.summary.previousPeriodNet, data.currency)}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div ref={chartRef} className="bg-background rounded-lg">
              <CashFlowChart
                data={data.data}
                chartType={chartType}
                period={period}
                currency={data.currency}
                height={350}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-green-600" />
                <span className="text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-red-600" />
                <span className="text-muted-foreground">Expenses</span>
              </div>
              {chartType === 'line' && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-blue-600" />
                  <span className="text-muted-foreground">Net (dashed)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
