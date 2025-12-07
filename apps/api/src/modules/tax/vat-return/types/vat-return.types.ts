export interface InvoiceVatItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: Date;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ExpenseVatItem {
  id: string;
  description: string;
  vendorName?: string;
  date: Date;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  category: string;
}

export interface VatRateBreakdown {
  invoices?: InvoiceVatItem[];
  expenses?: ExpenseVatItem[];
  subtotal: number;
  vat: number;
  count: number;
}

export interface OutputVatSummary {
  rate19: VatRateBreakdown;
  rate7: VatRateBreakdown;
  rate0: VatRateBreakdown;
  total: number;
  totalVat: number;
  totalInvoices: number;
}

export interface InputVatSummary {
  rate19: VatRateBreakdown;
  rate7: VatRateBreakdown;
  total: number;
  totalVat: number;
  totalExpenses: number;
}

export interface VatReturnPreview {
  organizationId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;

  outputVat: OutputVatSummary;
  inputVat: InputVatSummary;

  netVat: number; // outputVat.totalVat - inputVat.totalVat
  dueDate: Date;
  status: 'draft' | 'ready' | 'pending_approval' | 'approved' | 'submitted';

  warnings: string[];
  missingData: string[];
}

export type VatReturnStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED';

export interface PeriodInfo {
  periodStart: Date;
  periodEnd: Date;
  periodType: 'monthly' | 'quarterly' | 'yearly';
}

export interface CreateVatReturnDto {
  organizationId: string;
  period: string; // Format: "2025-Q1" or "2025-01" or "2025"
}

export interface ApproveVatReturnDto {
  userId: string;
  notes?: string;
}

export interface SubmitVatReturnDto {
  transferTicket: string;
  receiptId?: string;
}
