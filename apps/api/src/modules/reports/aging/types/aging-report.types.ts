/**
 * Aging Report Types
 * Shared types for AR and AP aging reports
 */

export interface AgingReportFilters {
  asOfDate?: Date;
  customerId?: string;
  vendorId?: string;
  minAmount?: number;
  currency?: string;
}

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  invoices: (InvoiceAgingItem | BillAgingItem)[];
  total: number;
  count: number;
}

export interface InvoiceAgingItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  amountDue: number;
  daysOverdue: number;
  status: string;
}

export interface BillAgingItem {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  amountDue: number;
  daysOverdue: number;
  status: string;
}

export interface ArAgingSummary {
  totalReceivables: number;
  totalOverdue: number;
  overduePercentage: number;
  customerCount: number;
  invoiceCount: number;
}

export interface ApAgingSummary {
  totalPayables: number;
  totalOverdue: number;
  overduePercentage: number;
  vendorCount: number;
  billCount: number;
}

export interface CustomerAgingBreakdown {
  customerId: string;
  customerName: string;
  total: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  overdue90Plus: number;
}

export interface VendorAgingBreakdown {
  vendorId: string;
  vendorName: string;
  total: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  overdue90Plus: number;
}
