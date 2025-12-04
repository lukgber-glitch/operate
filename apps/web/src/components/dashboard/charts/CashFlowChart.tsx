'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from 'next-themes';

import { ChartTooltip } from './ChartTooltip';
import { formatDate, type CashFlowDataPoint, type TimePeriod } from '@/hooks/useCashFlowData';

export type ChartType = 'bar' | 'line' | 'area';

export interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  chartType: ChartType;
  period: TimePeriod;
  currency?: string;
  height?: number;
}

/**
 * CashFlowChart - Main chart component supporting multiple visualization types
 *
 * Features:
 * - Multiple chart types (bar, line, area)
 * - Responsive design
 * - Theme-aware colors
 * - Custom tooltip
 * - Formatted axes
 */
export function CashFlowChart({
  data,
  chartType,
  period,
  currency = 'EUR',
  height = 350,
}: CashFlowChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart colors
  const colors = {
    income: isDark ? 'hsl(142, 76%, 45%)' : 'hsl(142, 76%, 36%)', // Green
    expenses: isDark ? 'hsl(0, 84%, 60%)' : 'hsl(0, 84%, 50%)', // Red
    net: isDark ? 'hsl(221, 83%, 63%)' : 'hsl(221, 83%, 53%)', // Blue
    grid: isDark ? 'hsl(217, 33%, 17%)' : 'hsl(214, 32%, 91%)',
    text: isDark ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 47%)',
  };

  // Format data for display
  const chartData = data.map((point) => ({
    ...point,
    displayDate: formatDate(point.date, period),
  }));

  // Reduce number of data points for better performance and readability
  const maxPoints = 50;
  const step = Math.ceil(chartData.length / maxPoints);
  const optimizedData = chartData.filter((_, index) => index % step === 0);

  // Common chart props
  const commonProps = {
    data: optimizedData,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  };

  const xAxisProps = {
    dataKey: 'displayDate',
    stroke: colors.text,
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  };

  const yAxisProps = {
    stroke: colors.text,
    fontSize: 12,
    tickLine: false,
    axisLine: false,
    tickFormatter: (value: number) => {
      if (value >= 1000) {
        return `€${(value / 1000).toFixed(0)}k`;
      }
      return `€${value}`;
    },
  };

  const tooltipProps = {
    content: <ChartTooltip currency={currency} />,
    cursor: { fill: isDark ? 'hsl(217, 33%, 17%)' : 'hsl(214, 32%, 91%)', opacity: 0.5 },
  };

  const gridProps = {
    stroke: colors.grid,
    strokeDasharray: '3 3',
    vertical: false,
  };

  // Render based on chart type
  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="income" fill={colors.income} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill={colors.expenses} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Line
              type="monotone"
              dataKey="income"
              stroke={colors.income}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke={colors.expenses}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke={colors.net}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.income} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.income} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.expenses} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.expenses} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.net} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.net} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Area
              type="monotone"
              dataKey="income"
              stroke={colors.income}
              fill="url(#colorIncome)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={colors.expenses}
              fill="url(#colorExpenses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}
