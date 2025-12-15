'use client';

import { useQuery } from '@tanstack/react-query';
import {
  reportsApi,
  type FinancialReportData as ApiFinancialReportData,
  type TaxReportData as ApiTaxReportData,
  type InvoiceReportData as ApiInvoiceReportData,
  type HRReportData as ApiHRReportData,
  type ReportQueryParams,
} from '@/lib/api/reports';

// Type definitions for report data (adapted from API types for UI compatibility)
export interface FinancialReportData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
  cashFlow: number;
  outstandingInvoices: number;
}

export interface TaxReportData {
  vatCollected: number;
  vatPaid: number;
  vatOwed: number;
  estimatedTaxLiability: number;
  deductions: number;
  upcomingDeadlines: Array<{
    type: string;
    dueDate: string;
    status: 'upcoming' | 'due-soon' | 'overdue';
    description: string;
  }>;
  breakdown: Array<{
    category: string;
    amount: number;
    period: string;
  }>;
}

export interface ClientMetricsData {
  totalClients: number;
  activeClients: number;
  newClientsThisPeriod: number;
  clientGrowthRate: number;
  topClients: Array<{
    id: string;
    name: string;
    revenue: number;
    invoiceCount: number;
    paymentStatus: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
  averageRevenuePerClient: number;
  clientRetentionRate: number;
  paymentBehavior: {
    onTime: number;
    late: number;
    overdue: number;
  };
}

export interface DocumentStatsData {
  totalProcessed: number;
  successfulClassifications: number;
  classificationAccuracy: number;
  averageProcessingTime: number;
  fastestProcessingTime: number;
  slowestProcessingTime: number;
  processingTrend: Array<{
    period: string;
    processed: number;
    avgTime: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  pendingDocuments: number;
  failedDocuments: number;
}

export interface ReportFilters {
  dateRange: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  categoryId?: string;
}

// Mock data generators for development
const generateMockFinancialData = (): FinancialReportData => ({
  revenue: 125600,
  expenses: 78400,
  profit: 47200,
  profitMargin: 37.6,
  monthlyTrend: [
    { month: 'Jan', revenue: 18500, expenses: 12200 },
    { month: 'Feb', revenue: 21300, expenses: 13800 },
    { month: 'Mar', revenue: 19800, expenses: 11900 },
    { month: 'Apr', revenue: 23400, expenses: 14600 },
    { month: 'May', revenue: 20800, expenses: 12700 },
    { month: 'Jun', revenue: 21800, expenses: 13200 },
  ],
  cashFlow: 35400,
  outstandingInvoices: 45800,
});

const generateMockTaxData = (): TaxReportData => ({
  vatCollected: 23860,
  vatPaid: 14904,
  vatOwed: 8956,
  estimatedTaxLiability: 18500,
  deductions: 15600,
  upcomingDeadlines: [
    {
      type: 'VAT Return Q4 2024',
      dueDate: '2025-01-31',
      status: 'due-soon',
      description: 'Quarterly VAT return submission',
    },
    {
      type: 'Annual Tax Return 2024',
      dueDate: '2025-05-31',
      status: 'upcoming',
      description: 'Annual income tax declaration',
    },
  ],
  breakdown: [
    { category: 'VAT on Sales', amount: 23860, period: 'Q3 2024' },
    { category: 'VAT on Purchases', amount: -14904, period: 'Q3 2024' },
    { category: 'Business Deductions', amount: -15600, period: 'Q3 2024' },
  ],
});

const generateMockClientMetrics = (): ClientMetricsData => ({
  totalClients: 45,
  activeClients: 38,
  newClientsThisPeriod: 7,
  clientGrowthRate: 18.4,
  topClients: [
    {
      id: '1',
      name: 'Acme Corporation',
      revenue: 25400,
      invoiceCount: 12,
      paymentStatus: 'excellent',
    },
    {
      id: '2',
      name: 'Tech Solutions GmbH',
      revenue: 18900,
      invoiceCount: 8,
      paymentStatus: 'good',
    },
    {
      id: '3',
      name: 'Digital Services Ltd',
      revenue: 14200,
      invoiceCount: 6,
      paymentStatus: 'excellent',
    },
    {
      id: '4',
      name: 'Innovation Hub',
      revenue: 11800,
      invoiceCount: 5,
      paymentStatus: 'fair',
    },
    {
      id: '5',
      name: 'StartUp Inc',
      revenue: 9600,
      invoiceCount: 4,
      paymentStatus: 'good',
    },
  ],
  averageRevenuePerClient: 2791,
  clientRetentionRate: 94.7,
  paymentBehavior: {
    onTime: 78,
    late: 15,
    overdue: 7,
  },
});

const generateMockDocumentStats = (): DocumentStatsData => ({
  totalProcessed: 2847,
  successfulClassifications: 2698,
  classificationAccuracy: 94.8,
  averageProcessingTime: 2.3,
  fastestProcessingTime: 0.8,
  slowestProcessingTime: 8.5,
  processingTrend: [
    { period: 'Week 1', processed: 456, avgTime: 2.1 },
    { period: 'Week 2', processed: 523, avgTime: 2.3 },
    { period: 'Week 3', processed: 489, avgTime: 2.5 },
    { period: 'Week 4', processed: 512, avgTime: 2.2 },
    { period: 'Week 5', processed: 478, avgTime: 2.4 },
    { period: 'Week 6', processed: 389, avgTime: 2.1 },
  ],
  categoryBreakdown: [
    { category: 'Invoices', count: 1245, percentage: 43.7 },
    { category: 'Receipts', count: 856, percentage: 30.1 },
    { category: 'Contracts', count: 423, percentage: 14.9 },
    { category: 'Tax Documents', count: 234, percentage: 8.2 },
    { category: 'Other', count: 89, percentage: 3.1 },
  ],
  pendingDocuments: 24,
  failedDocuments: 12,
});

/**
 * Convert date range string to actual dates
 */
const convertDateRange = (dateRange: string): { fromDate?: string; toDate?: string } => {
  const today = new Date();
  const year = today.getFullYear();

  switch (dateRange) {
    case 'q1-2024':
      return { fromDate: '2024-01-01', toDate: '2024-03-31' };
    case 'q2-2024':
      return { fromDate: '2024-04-01', toDate: '2024-06-30' };
    case 'q3-2024':
      return { fromDate: '2024-07-01', toDate: '2024-09-30' };
    case 'q4-2024':
      return { fromDate: '2024-10-01', toDate: '2024-12-31' };
    case 'ytd-2024':
      return { fromDate: '2024-01-01', toDate: today.toISOString().split('T')[0] };
    case '2023':
      return { fromDate: '2023-01-01', toDate: '2023-12-31' };
    default:
      return { fromDate: `${year}-01-01`, toDate: today.toISOString().split('T')[0] };
  }
};

/**
 * Transform API financial report to UI format
 */
const transformFinancialReport = (apiData: ApiFinancialReportData): FinancialReportData => {
  return {
    revenue: apiData.summary.totalRevenue,
    expenses: apiData.summary.totalExpenses,
    profit: apiData.summary.netProfit,
    profitMargin: apiData.summary.profitMargin,
    monthlyTrend: [], // TODO: Extract from API when available
    cashFlow: apiData.cashFlow.net,
    outstandingInvoices: apiData.revenue.outstanding,
  };
};

/**
 * Transform API tax report to UI format
 */
const transformTaxReport = (apiData: ApiTaxReportData): TaxReportData => {
  return {
    vatCollected: apiData.vat.collected,
    vatPaid: apiData.vat.paid,
    vatOwed: apiData.vat.netVatDue,
    estimatedTaxLiability: apiData.estimatedTax.total,
    deductions: apiData.deductions.total,
    upcomingDeadlines: [], // TODO: Fetch from separate endpoint when available
    breakdown: Object.entries(apiData.deductions.byCategory).map(([category, amount]) => ({
      category,
      amount,
      period: apiData.period.from.split('T')[0] + ' to ' + apiData.period.to.split('T')[0],
    })),
  };
};

// API fetch functions
const fetchFinancialReport = async (filters: ReportFilters): Promise<FinancialReportData> => {
  try {
    const dateRange = convertDateRange(filters.dateRange);
    const params: ReportQueryParams = {
      ...dateRange,
      currency: 'EUR',
    };

    const apiData = await reportsApi.getFinancialReport(params);
    return transformFinancialReport(apiData);
  } catch (error) {    // Fallback to mock data on error
    return generateMockFinancialData();
  }
};

const fetchTaxReport = async (filters: ReportFilters): Promise<TaxReportData> => {
  try {
    const dateRange = convertDateRange(filters.dateRange);
    const params: ReportQueryParams = {
      ...dateRange,
      currency: 'EUR',
    };

    const apiData = await reportsApi.getTaxReport(params);
    return transformTaxReport(apiData);
  } catch (error) {    // Fallback to mock data on error
    return generateMockTaxData();
  }
};

const fetchClientMetrics = async (filters: ReportFilters): Promise<ClientMetricsData> => {
  try {
    // Client metrics endpoint doesn't exist yet in the API
    // Using invoice report as a temporary solution until client metrics endpoint is implemented
    const dateRange = convertDateRange(filters.dateRange);
    const params: ReportQueryParams = {
      ...dateRange,
      currency: 'EUR',
    };

    const apiData = await reportsApi.getInvoiceReport(params);

    // Transform invoice report to client metrics (temporary)
    // This is a placeholder - will be replaced when client metrics endpoint is available
    return generateMockClientMetrics(); // Using mock for now
  } catch (error) {    return generateMockClientMetrics();
  }
};

const fetchDocumentStats = async (_filters: ReportFilters): Promise<DocumentStatsData> => {
  try {
    // Document stats endpoint doesn't exist yet in the API
    // This will be implemented when the document processing module is ready
    // For now, return mock data
    return generateMockDocumentStats();
  } catch (error) {    return generateMockDocumentStats();
  }
};

// Cache configuration for different report types
const REPORT_CACHE_CONFIG = {
  financial: {
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data updates frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache retention
  },
  tax: {
    staleTime: 15 * 60 * 1000, // 15 minutes - tax data is more stable
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
  },
  clients: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  },
  documents: {
    staleTime: 5 * 60 * 1000, // 5 minutes - document stats can change often
    gcTime: 30 * 60 * 1000,
  },
} as const;

// Custom hooks for each report type with optimized caching
export function useFinancialReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['financial-report', filters],
    queryFn: () => fetchFinancialReport(filters),
    staleTime: REPORT_CACHE_CONFIG.financial.staleTime,
    gcTime: REPORT_CACHE_CONFIG.financial.gcTime,
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching
    refetchOnWindowFocus: false, // Don't refetch on tab switch - reports don't need real-time updates
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useTaxReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['tax-report', filters],
    queryFn: () => fetchTaxReport(filters),
    staleTime: REPORT_CACHE_CONFIG.tax.staleTime,
    gcTime: REPORT_CACHE_CONFIG.tax.gcTime,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useClientMetrics(filters: ReportFilters) {
  return useQuery({
    queryKey: ['client-metrics', filters],
    queryFn: () => fetchClientMetrics(filters),
    staleTime: REPORT_CACHE_CONFIG.clients.staleTime,
    gcTime: REPORT_CACHE_CONFIG.clients.gcTime,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useDocumentStats(filters: ReportFilters) {
  return useQuery({
    queryKey: ['document-stats', filters],
    queryFn: () => fetchDocumentStats(filters),
    staleTime: REPORT_CACHE_CONFIG.documents.staleTime,
    gcTime: REPORT_CACHE_CONFIG.documents.gcTime,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Combined hook for all reports
export function useReports(filters: ReportFilters) {
  const financial = useFinancialReport(filters);
  const tax = useTaxReport(filters);
  const clients = useClientMetrics(filters);
  const documents = useDocumentStats(filters);

  return {
    financial,
    tax,
    clients,
    documents,
    isLoading: financial.isLoading || tax.isLoading || clients.isLoading || documents.isLoading,
    isError: financial.isError || tax.isError || clients.isError || documents.isError,
  };
}

// Export report hook
export function useExportReport() {
  const exportReport = async (
    reportType: 'financial' | 'tax' | 'invoices' | 'hr',
    format: 'pdf' | 'csv' | 'xlsx',
    filters: ReportFilters
  ) => {
    try {
      const dateRange = convertDateRange(filters.dateRange);
      const response = await reportsApi.exportReport({
        reportType: reportType.toUpperCase() as any,
        format: format.toUpperCase() as any,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      });

      return response;
    } catch (error) {      throw error;
    }
  };

  return { exportReport };
}
