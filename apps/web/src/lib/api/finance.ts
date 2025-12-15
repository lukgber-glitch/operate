/**
 * Finance API Client
 * Handles all finance-related API calls
 */

// Invoice Types
export interface Invoice {
  id: string;
  number: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface InvoiceFilters {
  search?: string;
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInvoiceRequest {
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  issueDate: string;
  dueDate: string;
  currency: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {}

// Expense Types
export interface Expense {
  id: string;
  number: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  vendorName: string;
  vendorEmail?: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  expenseDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  receiptUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  search?: string;
  status?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateExpenseRequest {
  categoryId?: string;
  vendorName: string;
  vendorEmail?: string;
  description: string;
  amount: number;
  taxAmount: number;
  currency: string;
  expenseDate: string;
  receiptFile?: File;
}

export interface UpdateExpenseRequest extends Partial<Omit<CreateExpenseRequest, 'receiptFile'>> {}

// Bank Account Types
export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
  bankName: string;
  currency: string;
  balance: number;
  isActive: boolean;
  isPrimary?: boolean;
  type?: 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  transactionDate: string;
  description: string;
  amount: number;
  currency: string;
  type: 'DEBIT' | 'CREDIT';
  category?: string;
  reference?: string;
  createdAt: string;
}

export interface BankTransactionFilters {
  accountId?: string;
  type?: 'DEBIT' | 'CREDIT';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBankAccountRequest {
  accountName: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
  bankName: string;
  currency: string;
  balance: number;
}

export interface UpdateBankAccountRequest extends Partial<CreateBankAccountRequest> {}

// Statistics Types
export interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  pendingExpenses: number;
  currency: string;
  period: {
    from: string;
    to: string;
  };
  revenueByMonth?: Array<{
    month: string;
    amount: number;
  }>;
  expensesByCategory?: Array<{
    category: string;
    amount: number;
  }>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

class FinanceApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  /**
   * Get organisation ID from auth context
   * The orgId is set in window.__orgId by the useAuth hook when user authenticates
   *
   * NOTE: This method now returns empty string instead of throwing to prevent page crashes.
   * The API call will handle auth errors gracefully via the fetch() error handling.
   */
  private getOrgId(): string {
    // Try multiple sources for orgId
    if (typeof window !== 'undefined') {
      // First try window.__orgId (set by useAuth)
      if ((window as any).__orgId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[FinanceAPI] Using window.__orgId:', (window as any).__orgId);
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
            console.log('[FinanceAPI] Found op_auth cookie, attempting to parse...');
          }
          const authData = JSON.parse(authValue);

          // Parse JWT to extract orgId
          if (authData.a) {
            const payload = JSON.parse(atob(authData.a.split('.')[1]));
            if (payload.orgId) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[FinanceAPI] Extracted orgId from JWT:', payload.orgId);
              }
              return payload.orgId;
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[FinanceAPI] Failed to parse auth cookie:', e);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[FinanceAPI] No op_auth cookie found');
        }
      }
    }

    // Return empty string instead of throwing - let the API call handle the 401/403
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FinanceAPI] Organisation ID not available - returning empty string');
    }
    return '';
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

  // Invoice CRUD
  async getInvoices(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<Invoice>>(
      `/invoices?${params.toString()}`
    );
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    return this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.request<void>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  async sendInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/send`, {
      method: 'POST',
    });
  }

  async markInvoiceAsPaid(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Expense CRUD
  async getExpenses(filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<Expense>>(
      `/expenses?${params.toString()}`
    );
  }

  async getExpense(id: string): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    if (data.receiptFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'receiptFile' && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      if (data.receiptFile) {
        formData.append('receipt', data.receiptFile);
      }

      const response = await fetch(`${this.baseUrl}/expenses`, {
        method: 'POST',
        body: formData,
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

    const { receiptFile: _receiptFile, ...restData } = data;
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(restData),
    });
  }

  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async approveExpense(id: string): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectExpense(id: string, reason: string): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async markExpenseAsPaid(id: string): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  // Bank Account CRUD
  async getBankAccounts(): Promise<BankAccount[]> {
    const response = await this.request<ApiResponse<BankAccount[]>>('/banking/accounts');
    return response.data;
  }

  async getBankAccount(id: string): Promise<BankAccount> {
    return this.request<BankAccount>(`/banking/accounts/${id}`);
  }

  async createBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
    return this.request<BankAccount>('/banking/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBankAccount(id: string, data: UpdateBankAccountRequest): Promise<BankAccount> {
    return this.request<BankAccount>(`/banking/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBankAccount(id: string): Promise<void> {
    return this.request<void>(`/banking/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Bank Transactions
  async getBankTransactions(filters?: BankTransactionFilters): Promise<PaginatedResponse<BankTransaction>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<PaginatedResponse<BankTransaction>>(
      `/banking/transactions?${params.toString()}`
    );
  }

  // Statistics
  async getFinanceStats(dateFrom?: string, dateTo?: string): Promise<FinanceStats> {
    // Since there's no unified stats endpoint, we'll fetch from both invoices and expenses
    // and combine them on the frontend
    try {
      const [invoiceStats, expenseStats] = await Promise.all([
        this.request<any>(`/invoices/statistics`),
        this.request<any>(`/expenses/statistics`),
      ]);

      // Combine the stats into a unified format
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      return {
        totalRevenue: invoiceStats.totalPaid || 0,
        totalExpenses: expenseStats.totalApproved || 0,
        netIncome: (invoiceStats.totalPaid || 0) - (expenseStats.totalApproved || 0),
        outstandingInvoices: invoiceStats.totalSent || 0,
        overdueInvoices: invoiceStats.totalOverdue || 0,
        pendingExpenses: expenseStats.totalPending || 0,
        currency: 'EUR', // Default currency
        period: {
          from: dateFrom || yearStart.toISOString(),
          to: dateTo || now.toISOString(),
        },
      };
    } catch (error) {
      // If the stats endpoints don't exist yet, return default values
      console.warn('Finance stats endpoints not available, using defaults:', error);
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        outstandingInvoices: 0,
        overdueInvoices: 0,
        pendingExpenses: 0,
        currency: 'EUR',
        period: {
          from: dateFrom || yearStart.toISOString(),
          to: dateTo || now.toISOString(),
        },
      };
    }
  }
}

export const financeApi = new FinanceApi();
