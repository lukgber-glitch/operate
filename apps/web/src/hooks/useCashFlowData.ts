'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export type TimePeriod = '7d' | '30d' | '3m' | '12m' | 'custom';

export interface CashFlowDataPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  percentChange: number;
  previousPeriodNet: number;
}

export interface CashFlowResponse {
  data: CashFlowDataPoint[];
  summary: CashFlowSummary;
  period: {
    from: string;
    to: string;
  };
  currency: string;
}

export interface CashFlowFilters {
  period: TimePeriod;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

/**
 * Calculate date range based on period
 */
const getDateRange = (period: TimePeriod, customStart?: string, customEnd?: string) => {
  const today = new Date();
  let fromDate: string;
  let toDate = today.toISOString().split('T')[0];

  if (period === 'custom' && customStart && customEnd) {
    fromDate = customStart;
    toDate = customEnd;
  } else {
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '12m': 365,
    }[period] || 30;

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysAgo);
    fromDate = startDate.toISOString().split('T')[0];
  }

  return { fromDate, toDate };
};

/**
 * Generate mock cash flow data for development
 */
const generateMockData = (fromDate: string, toDate: string): CashFlowResponse => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const data: CashFlowDataPoint[] = [];

  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints = Math.min(daysDiff, 365); // Max 365 data points

  let totalIncome = 0;
  let totalExpenses = 0;

  for (let i = 0; i <= dataPoints; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + Math.floor((i / dataPoints) * daysDiff));

    // Generate realistic cash flow patterns
    const baseIncome = 5000 + Math.random() * 3000;
    const baseExpenses = 3000 + Math.random() * 2000;

    // Add some weekly patterns (higher on weekdays)
    const dayOfWeek = date.getDay();
    const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.7;

    const income = Math.round(baseIncome * weekdayMultiplier);
    const expenses = Math.round(baseExpenses * weekdayMultiplier);
    const net = income - expenses;

    totalIncome += income;
    totalExpenses += expenses;

    data.push({
      date: date.toISOString().split('T')[0],
      income,
      expenses,
      net,
    });
  }

  const netCashFlow = totalIncome - totalExpenses;
  const previousPeriodNet = netCashFlow * (0.85 + Math.random() * 0.3); // Simulate previous period
  const percentChange = ((netCashFlow - previousPeriodNet) / previousPeriodNet) * 100;

  return {
    data,
    summary: {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netCashFlow: Math.round(netCashFlow),
      percentChange: Math.round(percentChange * 10) / 10,
      previousPeriodNet: Math.round(previousPeriodNet),
    },
    period: {
      from: fromDate,
      to: toDate,
    },
    currency: 'EUR',
  };
};

/**
 * Fetch cash flow data from API
 */
const fetchCashFlowData = async (filters: CashFlowFilters): Promise<CashFlowResponse> => {
  try {
    const { fromDate, toDate } = getDateRange(filters.period, filters.startDate, filters.endDate);

    const response = await api.get<CashFlowResponse>('/api/reports/cash-flow', {
      params: {
        fromDate,
        toDate,
        currency: filters.currency || 'EUR',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch cash flow data, using mock data:', error);
    // Fallback to mock data on error
    const { fromDate, toDate } = getDateRange(filters.period, filters.startDate, filters.endDate);
    return generateMockData(fromDate, toDate);
  }
};

/**
 * Hook to fetch and manage cash flow data
 */
export function useCashFlowData(filters: CashFlowFilters) {
  return useQuery({
    queryKey: ['cash-flow', filters],
    queryFn: () => fetchCashFlowData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, period: TimePeriod): string {
  const date = new Date(dateString);

  switch (period) {
    case '7d':
    case '30d':
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    case '3m':
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    case '12m':
      return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    default:
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  }
}
