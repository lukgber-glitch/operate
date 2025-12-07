/**
 * Dashboard Hooks
 * Provides data fetching hooks for the financial dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface CashFlowForecast {
  currentBalance: number;
  previousWeekBalance: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  forecast: Array<{
    date: string;
    balance: number;
  }>;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface OverdueInvoice {
  id: string;
  name: string;
  amount: number;
  daysOverdue: number;
  dueDate: string;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export interface RunwayData {
  months: number;
  status: 'healthy' | 'warning' | 'critical';
  burnRate: number;
  currentCash: number;
}

export function useCashFlowForecast(days: number = 7) {
  return useQuery<CashFlowForecast>({
    queryKey: ['dashboard', 'cashFlow', days],
    queryFn: async () => {
      const response = await api.get<CashFlowForecast>(`/dashboard/cash-flow`, {
        params: { days },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRevenueData(months: number = 12) {
  return useQuery<RevenueDataPoint[]>({
    queryKey: ['dashboard', 'revenue', months],
    queryFn: async () => {
      const response = await api.get<RevenueDataPoint[]>(`/dashboard/revenue`, {
        params: { months },
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ['dashboard', 'expenses'],
    queryFn: async () => {
      const response = await api.get<ExpenseCategory[]>('/dashboard/expense-categories');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useOverdueInvoices(limit: number = 5) {
  return useQuery<{ items: OverdueInvoice[]; total: number }>({
    queryKey: ['dashboard', 'overdueInvoices', limit],
    queryFn: async () => {
      const response = await api.get<{ items: OverdueInvoice[]; total: number }>('/invoices/overdue', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpcomingBills(limit: number = 5) {
  return useQuery<{ items: UpcomingBill[]; total: number }>({
    queryKey: ['dashboard', 'upcomingBills', limit],
    queryFn: async () => {
      const response = await api.get<{ items: UpcomingBill[]; total: number }>('/bills/upcoming', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRunwayData() {
  return useQuery<RunwayData>({
    queryKey: ['dashboard', 'runway'],
    queryFn: async () => {
      const response = await api.get<RunwayData>('/dashboard/runway');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export interface ArApSummary {
  total: number;
  overdue?: number;
  count: number;
  change: number;
  changePercent: number;
}

export function useArApSummary(type: 'receivables' | 'payables') {
  return useQuery<ArApSummary>({
    queryKey: ['dashboard', 'arAp', type],
    queryFn: async () => {
      const endpoint = type === 'receivables' ? '/dashboard/receivables' : '/dashboard/payables';
      const response = await api.get<ArApSummary>(endpoint);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
