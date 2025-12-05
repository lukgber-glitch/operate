/**
 * Exports API Client
 * Handles communication with the compliance exports API
 */

import { apiClient } from './client';

/**
 * Export Formats
 */
export enum ExportFormat {
  DATEV = 'DATEV',
  SAFT = 'SAFT',
  BMD = 'BMD',
}

/**
 * Export Status
 */
export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VALIDATING = 'VALIDATING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  DOWNLOADED = 'DOWNLOADED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * DATEV SKR Types
 */
export enum DatevSKRType {
  SKR03 = '03',
  SKR04 = '04',
}

/**
 * SAF-T Variants
 */
export enum SaftVariant {
  INTERNATIONAL = 'INTERNATIONAL',
  PORTUGAL = 'PT',
  NORWAY = 'NO',
  AUSTRIA = 'AT',
  POLAND = 'PL',
  LUXEMBOURG = 'LU',
}

/**
 * SAF-T Export Scopes
 */
export enum SaftExportScope {
  FULL = 'FULL',
  MASTER_FILES = 'MASTER_FILES',
  TRANSACTIONS = 'TRANSACTIONS',
  SOURCE_DOCUMENTS = 'SOURCE_DOCUMENTS',
}

/**
 * BMD Export Types
 */
export enum BmdExportType {
  BOOKING_JOURNAL = 'BOOKING_JOURNAL',
  CHART_OF_ACCOUNTS = 'CHART_OF_ACCOUNTS',
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  TAX_ACCOUNTS = 'TAX_ACCOUNTS',
}

/**
 * Date Range
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * DATEV Company Config
 */
export interface DatevCompanyConfig {
  consultantNumber: number;
  clientNumber: number;
  fiscalYearStart: number;
  skrType: DatevSKRType;
  accountLength?: number;
  companyName?: string;
}

/**
 * DATEV Export Options
 */
export interface DatevExportOptions {
  includeAccountLabels?: boolean;
  includeCustomers?: boolean;
  includeSuppliers?: boolean;
  includeTransactions?: boolean;
  formatVersion?: string;
  origin?: string;
  label?: string;
}

/**
 * Create DATEV Export Request
 */
export interface CreateDatevExportRequest {
  orgId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  companyConfig: DatevCompanyConfig;
  options?: DatevExportOptions;
}

/**
 * SAF-T Export Options
 */
export interface CreateSaftExportRequest {
  variant: SaftVariant;
  scope: SaftExportScope;
  dateRange: DateRange;
  includeOpeningBalances?: boolean;
  includeClosingBalances?: boolean;
  includeTaxDetails?: boolean;
  includeCustomerSupplierDetails?: boolean;
  compression?: boolean;
  validation?: boolean;
  countrySpecificExtensions?: Record<string, any>;
  description?: string;
}

/**
 * BMD Export Options
 */
export interface BmdExportOptions {
  useSemicolon?: boolean;
  includeHeader?: boolean;
  useIsoEncoding?: boolean;
  postedOnly?: boolean;
  accountingFramework?: string;
}

/**
 * Create BMD Export Request
 */
export interface CreateBmdExportRequest {
  orgId: string;
  exportTypes: BmdExportType[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  format?: string;
  options?: BmdExportOptions;
  includeArchived?: boolean;
}

/**
 * Export Response
 */
export interface ExportResponse {
  id: string;
  orgId: string;
  format: ExportFormat;
  status: ExportStatus;
  filename: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

/**
 * Export List Response
 */
export interface ExportListResponse {
  data: ExportResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Export Filters
 */
export interface ExportFilters {
  format?: ExportFormat;
  status?: ExportStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ExportsApi {
  /**
   * Get list of exports
   */
  async getExports(filters?: ExportFilters): Promise<ExportListResponse> {
    const response = await apiClient.get<ExportListResponse>('/compliance/exports', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get single export by ID
   */
  async getExport(id: string): Promise<ExportResponse> {
    const response = await apiClient.get<ExportResponse>(`/compliance/exports/${id}`);
    return response.data;
  }

  /**
   * Create DATEV export
   */
  async createDatevExport(data: CreateDatevExportRequest): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/compliance/exports/datev', data);
    return response.data;
  }

  /**
   * Create SAF-T export
   */
  async createSaftExport(data: CreateSaftExportRequest): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/compliance/exports/saft', data);
    return response.data;
  }

  /**
   * Create BMD export
   */
  async createBmdExport(data: CreateBmdExportRequest): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/compliance/exports/bmd', data);
    return response.data;
  }

  /**
   * Download export file
   */
  async downloadExport(id: string, format: ExportFormat): Promise<Blob> {
    const formatPath = format.toLowerCase();
    const response = await apiClient.get<Blob>(
      `/compliance/exports/${formatPath}/${id}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Delete export
   */
  async deleteExport(id: string, format: ExportFormat): Promise<void> {
    const formatPath = format.toLowerCase();
    await apiClient.delete(`/compliance/exports/${formatPath}/${id}`);
  }

  /**
   * Get export status
   */
  async getExportStatus(id: string, format: ExportFormat): Promise<ExportResponse> {
    const formatPath = format.toLowerCase();
    const response = await apiClient.get<ExportResponse>(
      `/compliance/exports/${formatPath}/${id}/status`
    );
    return response.data;
  }
}

export const exportsApi = new ExportsApi();
