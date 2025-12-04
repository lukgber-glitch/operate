/**
 * Recurring Invoices API Client
 * Handles all recurring invoice-related API calls
 */

import { financeApi, type Invoice, type InvoiceItem, type PaginatedResponse } from './finance';

// Recurring Invoice Types
export interface RecurringInvoice {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  isActive: boolean;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTermsDays: number;
  notes?: string;
  items: InvoiceItem[];
  generatedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoiceFilters {
  search?: string;
  status?: 'active' | 'paused' | 'all';
  customerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateRecurringInvoiceRequest {
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  currency: string;
  paymentTermsDays: number;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
}

export interface UpdateRecurringInvoiceRequest extends Partial<CreateRecurringInvoiceRequest> {}

export interface RecurringInvoiceHistory {
  invoiceId: string;
  invoiceNumber: string;
  generatedDate: string;
  status: string;
  amount: number;
}

// API Helper to access private request method
class RecurringInvoiceApi {
  private baseUrl = '/api/v1';

  private getOrgId(): string {
    if (typeof window !== 'undefined' && (window as any).__orgId) {
      return (window as any).__orgId;
    }
    return 'default-org-id';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const orgId = this.getOrgId();
    const url = endpoint.startsWith('/organisations/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/organisations/${orgId}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getRecurringInvoices(
    filters?: RecurringInvoiceFilters
  ): Promise<PaginatedResponse<RecurringInvoice>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return this.request<PaginatedResponse<RecurringInvoice>>(
      `/invoices/recurring?${params.toString()}`
    );
  }

  async getRecurringInvoice(id: string): Promise<RecurringInvoice> {
    return this.request<RecurringInvoice>(`/invoices/recurring/${id}`);
  }

  async createRecurringInvoice(
    data: CreateRecurringInvoiceRequest
  ): Promise<RecurringInvoice> {
    return this.request<RecurringInvoice>('/invoices/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecurringInvoice(
    id: string,
    data: UpdateRecurringInvoiceRequest
  ): Promise<RecurringInvoice> {
    return this.request<RecurringInvoice>(`/invoices/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringInvoice(id: string): Promise<void> {
    return this.request<void>(`/invoices/recurring/${id}`, {
      method: 'DELETE',
    });
  }

  async activateRecurringInvoice(id: string): Promise<RecurringInvoice> {
    return this.request<RecurringInvoice>(`/invoices/recurring/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateRecurringInvoice(id: string): Promise<RecurringInvoice> {
    return this.request<RecurringInvoice>(`/invoices/recurring/${id}/deactivate`, {
      method: 'POST',
    });
  }

  async generateRecurringInvoiceNow(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/recurring/${id}/generate`, {
      method: 'POST',
    });
  }

  async getRecurringInvoiceHistory(
    id: string
  ): Promise<PaginatedResponse<RecurringInvoiceHistory>> {
    return this.request<PaginatedResponse<RecurringInvoiceHistory>>(
      `/invoices/recurring/${id}/history`
    );
  }
}

const recurringInvoiceApi = new RecurringInvoiceApi();

// Export individual functions
export const getRecurringInvoices = (filters?: RecurringInvoiceFilters) =>
  recurringInvoiceApi.getRecurringInvoices(filters);

export const getRecurringInvoice = (id: string) =>
  recurringInvoiceApi.getRecurringInvoice(id);

export const createRecurringInvoice = (data: CreateRecurringInvoiceRequest) =>
  recurringInvoiceApi.createRecurringInvoice(data);

export const updateRecurringInvoice = (id: string, data: UpdateRecurringInvoiceRequest) =>
  recurringInvoiceApi.updateRecurringInvoice(id, data);

export const deleteRecurringInvoice = (id: string) =>
  recurringInvoiceApi.deleteRecurringInvoice(id);

export const activateRecurringInvoice = (id: string) =>
  recurringInvoiceApi.activateRecurringInvoice(id);

export const deactivateRecurringInvoice = (id: string) =>
  recurringInvoiceApi.deactivateRecurringInvoice(id);

export const generateRecurringInvoiceNow = (id: string) =>
  recurringInvoiceApi.generateRecurringInvoiceNow(id);

export const getRecurringInvoiceHistory = (id: string) =>
  recurringInvoiceApi.getRecurringInvoiceHistory(id);
