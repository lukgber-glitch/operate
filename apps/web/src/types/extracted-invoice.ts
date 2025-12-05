/**
 * Extracted Invoice Types
 * Type definitions for AI-extracted invoice data
 */

export enum InvoiceExtractionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ExtractionReviewStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
}

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface ExtractedInvoiceData {
  vendorName?: string;
  vendorAddress?: string;
  vendorVatId?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  purchaseOrderNumber?: string;
  customerName?: string;
  customerAddress?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount?: number;
  taxRate?: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentTerms?: string;
  iban?: string;
  bic?: string;
}

export interface FieldConfidence {
  field: string;
  confidence: number;
  extracted: boolean;
}

export interface ExtractedInvoice {
  id: string;
  organisationId: string;
  attachmentId?: string;
  emailId?: string;
  status: InvoiceExtractionStatus;
  reviewStatus: ExtractionReviewStatus;
  data: ExtractedInvoiceData;
  originalData?: ExtractedInvoiceData; // For tracking edits
  overallConfidence: number;
  fieldConfidences: FieldConfidence[];
  pageCount?: number;
  processingTime?: number;
  errorMessage?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  invoiceId?: string; // ID of created invoice
  attachmentUrl?: string; // URL to view original document
  attachmentMimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListExtractedInvoicesParams {
  page?: number;
  limit?: number;
  status?: InvoiceExtractionStatus;
  reviewStatus?: ExtractionReviewStatus;
  minConfidence?: number;
  maxConfidence?: number;
  vendorName?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface ListExtractedInvoicesResponse {
  items: ExtractedInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateExtractedInvoiceDto {
  data?: Partial<ExtractedInvoiceData>;
  reviewStatus?: ExtractionReviewStatus;
  reviewNotes?: string;
}

export interface BulkApproveDto {
  extractionIds: string[];
  autoCreateInvoices?: boolean;
}

export interface BulkRejectDto {
  extractionIds: string[];
  reason?: string;
}

export interface CreateInvoiceFromExtractionDto {
  extractionId: string;
  applyCorrections?: boolean;
}

export interface ExtractionStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsCorrection: number;
  averageConfidence: number;
  byVendor: Record<string, number>;
}
