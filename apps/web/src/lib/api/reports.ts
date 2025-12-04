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
   * Get organisation ID from localStorage or session
   * In production, this would come from auth context
   */
  private getOrgId(): string {
    // TODO: Replace with actual organisation context when available
    // For now, using a placeholder - this should come from auth/user context
    return 'placeholder-org-id';
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
    return response.data;
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
    return response.data;
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
    return response.data;
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
    return response.data;
  }

  /**
   * Export report in specified format
   */
  async exportReport(request: ExportReportRequest): Promise<ExportReportResponse> {
    const orgId = this.getOrgId();
    const endpoint = `/organisations/${orgId}/reports/export`;
    const response = await api.post<ExportReportResponse>(endpoint, request);
    return response.data;
  }
}

export const reportsApi = new ReportsApi();
