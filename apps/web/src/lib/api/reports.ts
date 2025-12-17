/**
 * Reports API Client
 * Handles all report-related API calls
 */

import { api } from './client';

// Type definitions for report data structures
export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportQueryParams {
  fromDate?: string;
  toDate?: string;
  currency?: string;
}

// Financial Report Types
export interface FinancialReportData {
  reportType: 'financial';
  organisationId: string;
  period: ReportPeriod;
  currency: string;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenue: {
    invoiced: number;
    paid: number;
    outstanding: number;
    overdue: number;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    net: number;
  };
  generatedAt: string;
}

// Tax Report Types
export interface TaxReportData {
  reportType: 'tax';
  organisationId: string;
  period: ReportPeriod;
  currency: string;
  vat: {
    collected: number;
    paid: number;
    netVatDue: number;
    vatRate: number;
  };
  deductions: {
    total: number;
    byCategory: Record<string, number>;
    suggested: number;
    confirmed: number;
    rejected: number;
  };
  taxableIncome: {
    gross: number;
    deductions: number;
    net: number;
  };
  estimatedTax: {
    incomeTax: number;
    tradeTax: number;
    total: number;
  };
  generatedAt: string;
}

// Invoice Report Types
export interface InvoiceReportData {
  reportType: 'invoices';
  organisationId: string;
  period: ReportPeriod;
  currency: string;
  summary: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
  };
  byStatus: Record<string, { count: number; amount: number }>;
  aging: {
    current: { count: number; amount: number };
    days_1_30: { count: number; amount: number };
    days_31_60: { count: number; amount: number };
    days_60_plus: { count: number; amount: number };
  };
  averagePaymentTime: number;
  generatedAt: string;
}

// HR Report Types
export interface HRReportData {
  reportType: 'hr';
  organisationId: string;
  period: ReportPeriod;
  currency: string;
  employees: {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
  };
  payroll: {
    totalGrossSalary: number;
    totalNetSalary: number;
    totalDeductions: number;
    averageGrossSalary: number;
    averageNetSalary: number;
    byDepartment: Record<string, number>;
  };
  leave: {
    totalDaysUsed: number;
    totalDaysRemaining: number;
    byType: Record<string, { used: number; remaining: number }>;
  };
  timeTracking: {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    averageHoursPerEmployee: number;
  };
  generatedAt: string;
}

// Export Types
export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum ReportType {
  FINANCIAL = 'financial',
  TAX = 'tax',
  INVOICES = 'invoices',
  HR = 'hr',
}

export interface ExportReportRequest {
  reportType: ReportType;
  format: ExportFormat;
  fromDate?: string;
  toDate?: string;
  title?: string;
}

export interface ExportReportResponse {
  success: boolean;
  message: string;
  reportType: string;
  format: string;
  fileName: string;
  title: string;
  period: ReportPeriod;
  estimatedCompletionTime: string;
  downloadUrl: string;
  expiresAt: string;
  generatedAt: string;
}

class ReportsApi {
  /**
   * Get organisation ID from auth context
   * The orgId is set in window.__orgId by the useAuth hook when user authenticates
   *
   * NOTE: This method now returns empty string instead of throwing to prevent page crashes.
   * The API call will handle auth errors gracefully via the fetch() error handling.
   */
  private getOrgId(): string {
    if (typeof window !== 'undefined') {
      if ((window as any).__orgId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ReportsAPI] Using window.__orgId:', (window as any).__orgId);
        }
        return (window as any).__orgId;
      }

      // Fallback: try to parse from cookie
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('op_auth='));

      if (authCookie) {
        try {
          const authValue = decodeURIComponent(authCookie.split('=')[1] || '');
          if (process.env.NODE_ENV === 'development') {
            console.log('[ReportsAPI] Found op_auth cookie, attempting to parse...');
          }
          const authData = JSON.parse(authValue);

          // Parse JWT to extract orgId
          if (authData.a) {
            const payload = JSON.parse(atob(authData.a.split('.')[1]));
            if (payload.orgId) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[ReportsAPI] Extracted orgId from JWT:', payload.orgId);
              }
              return payload.orgId;
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ReportsAPI] Failed to parse auth cookie:', e);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ReportsAPI] No op_auth cookie found');
        }
      }
    }

    // Return empty string instead of throwing - let the API call handle the 401/403
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ReportsAPI] Organisation ID not available - returning empty string');
    }
    return '';
  }

  /**
   * Get financial report
   */
  async getFinancialReport(params?: ReportQueryParams): Promise<FinancialReportData> {
    const orgId = this.getOrgId();
    const queryParams = new URLSearchParams();

    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.currency) queryParams.append('currency', params.currency);

    const endpoint = `/organisations/${orgId}/reports/financial?${queryParams.toString()}`;
    const response = await api.get<FinancialReportData>(endpoint);
    return response.data || ({} as FinancialReportData);
  }

  /**
   * Get tax report
   */
  async getTaxReport(params?: ReportQueryParams): Promise<TaxReportData> {
    const orgId = this.getOrgId();
    const queryParams = new URLSearchParams();

    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.currency) queryParams.append('currency', params.currency);

    const endpoint = `/organisations/${orgId}/reports/tax?${queryParams.toString()}`;
    const response = await api.get<TaxReportData>(endpoint);
    return response.data || ({} as TaxReportData);
  }

  /**
   * Get invoice report
   */
  async getInvoiceReport(params?: ReportQueryParams): Promise<InvoiceReportData> {
    const orgId = this.getOrgId();
    const queryParams = new URLSearchParams();

    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.currency) queryParams.append('currency', params.currency);

    const endpoint = `/organisations/${orgId}/reports/invoices?${queryParams.toString()}`;
    const response = await api.get<InvoiceReportData>(endpoint);
    return response.data || ({} as InvoiceReportData);
  }

  /**
   * Get HR report
   */
  async getHRReport(params?: ReportQueryParams): Promise<HRReportData> {
    const orgId = this.getOrgId();
    const queryParams = new URLSearchParams();

    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.currency) queryParams.append('currency', params.currency);

    const endpoint = `/organisations/${orgId}/reports/hr?${queryParams.toString()}`;
    const response = await api.get<HRReportData>(endpoint);
    return response.data || ({} as HRReportData);
  }

  /**
   * Export report in specified format
   */
  async exportReport(request: ExportReportRequest): Promise<ExportReportResponse> {
    const orgId = this.getOrgId();
    const endpoint = `/organisations/${orgId}/reports/export`;
    const response = await api.post<ExportReportResponse>(endpoint, request);
    return response.data || ({} as ExportReportResponse);
  }
}

export const reportsApi = new ReportsApi();
