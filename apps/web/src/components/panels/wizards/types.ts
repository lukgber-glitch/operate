/**
 * Shared types for panel wizards
 */

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface InvoiceFormData {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lineItems: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface CreatedInvoice extends InvoiceFormData {
  id: string;
  status: 'draft' | 'sent';
}

export interface ExpenseFormData {
  vendorId?: string;
  vendorName: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description: string;
  receiptUrl?: string;
  taxDeductible: boolean;
}

export interface CreatedExpense extends ExpenseFormData {
  id: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
  paymentTerms: number;
  notes?: string;
}

export interface CreatedClient extends ClientFormData {
  id: string;
}

export interface LeaveRequestFormData {
  leaveType: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason?: string;
  halfDay?: boolean;
}

export interface CreatedLeaveRequest extends LeaveRequestFormData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PaymentFormData {
  amount: number;
  currency: 'EUR' | 'GBP';
  beneficiaryName: string;
  reference: string;
  accountType: 'IBAN' | 'SORT_CODE_ACCOUNT_NUMBER';
  iban?: string;
  sortCode?: string;
  accountNumber?: string;
  description?: string;
  billId?: string;
  invoiceId?: string;
}

export interface CreatedPayment extends PaymentFormData {
  id: string;
  status: 'pending' | 'authorized' | 'failed';
  authorizationUrl?: string;
}

// Wizard callback props
export interface WizardPanelProps<T> {
  onComplete: (data: T) => void;
  onCancel: () => void;
  onStepChange?: (step: number, stepName: string) => void;
}
