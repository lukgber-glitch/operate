/**
 * Type definitions for Side Panel System
 */

export type PanelType = 'invoice' | 'expense' | 'client' | 'transaction' | 'list' | null;

export type PanelWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: PanelWidth;
  showOverlay?: boolean;
  footer?: React.ReactNode;
}

// ========== Invoice Types ==========

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface InvoiceClient {
  name: string;
  email: string;
  address?: string;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: string;
}

export interface InvoiceTimelineEvent {
  id: string;
  event: string;
  timestamp: string;
  user?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  client: InvoiceClient;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  payments?: InvoicePayment[];
  timeline?: InvoiceTimelineEvent[];
}

export interface InvoiceDetailPanelProps {
  invoice: Invoice;
  onSend?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

// ========== Expense Types ==========

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseReceipt {
  url: string;
  fileName: string;
}

export interface LinkedTransaction {
  id: string;
  description: string;
  date: string;
}

export interface Expense {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  description?: string;
  status: ExpenseStatus;
  taxDeductible: boolean;
  taxAmount?: number;
  receipt?: ExpenseReceipt;
  linkedTransaction?: LinkedTransaction;
  tags?: string[];
  notes?: string;
}

export interface ExpenseDetailPanelProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  onSplit?: () => void;
  onRecategorize?: () => void;
  onToggleTaxDeductible?: () => void;
}

// ========== Client Types ==========

export type ClientType = 'customer' | 'vendor';
export type ClientStatus = 'active' | 'inactive';

export interface ClientFinancialSummary {
  totalRevenue: number;
  outstanding: number;
  avgPaymentTime: number;
  currency: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
}

export interface ClientPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
}

export type CommunicationType = 'email' | 'call' | 'meeting';

export interface ClientCommunication {
  id: string;
  type: CommunicationType;
  subject: string;
  date: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type: ClientType;
  status: ClientStatus;
  financialSummary: ClientFinancialSummary;
  recentInvoices?: ClientInvoice[];
  recentPayments?: ClientPayment[];
  communications?: ClientCommunication[];
}

export interface ClientDetailPanelProps {
  client: Client;
  onEdit?: () => void;
  onCreateInvoice?: () => void;
  onSendEmail?: () => void;
}

// ========== Transaction Types ==========

export type TransactionType = 'debit' | 'credit';
export type TransactionStatus = 'pending' | 'posted';
export type AccountType = 'checking' | 'savings' | 'credit';

export interface TransactionAccount {
  name: string;
  lastFour: string;
  type: AccountType;
}

export interface MatchedEntity {
  type: 'invoice' | 'expense';
  id: string;
  number: string;
  amount: number;
  matchConfidence: number;
}

export interface TransactionSplit {
  id: string;
  amount: number;
  category: string;
  description: string;
}

export interface MerchantInfo {
  name: string;
  location?: string;
  category?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  account: TransactionAccount;
  type: TransactionType;
  status: TransactionStatus;
  category?: string;
  categoryConfidence?: number;
  matchedEntity?: MatchedEntity;
  splits?: TransactionSplit[];
  merchantInfo?: MerchantInfo;
}

export interface TransactionDetailPanelProps {
  transaction: Transaction;
  onMatch?: () => void;
  onIgnore?: () => void;
  onCategorize?: () => void;
  onSplit?: () => void;
}

// ========== List Types ==========

export interface ListColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface BulkAction {
  label: string;
  value: string;
  variant?: 'default' | 'destructive';
}

export interface ListDetailPanelProps {
  title: string;
  columns: ListColumn[];
  data: any[];
  totalCount?: number;
  onRowClick?: (row: any) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
  bulkActions?: BulkAction[];
  pageSize?: number;
  enableSearch?: boolean;
  enableFilters?: boolean;
  renderFilters?: () => React.ReactNode;
}

// ========== Hook Types ==========

export interface UseSidePanelReturn {
  isOpen: boolean;
  panelType: PanelType;
  panelData: any;
  openPanel: (type: PanelType, data: any) => void;
  closePanel: () => void;
}

// ========== Skeleton Types ==========

export type SkeletonVariant = 'invoice' | 'expense' | 'client' | 'transaction' | 'list';

export interface SidePanelSkeletonProps {
  isOpen: boolean;
  onClose: () => void;
  width?: PanelWidth;
  variant?: SkeletonVariant;
}
