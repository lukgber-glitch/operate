/**
 * Document Types - Shared type definitions for document management
 * Optimized for type safety and consistency across the application
 */

// Document type enum matching Prisma schema
export type DocumentType =
  | 'CONTRACT'
  | 'INVOICE'
  | 'RECEIPT'
  | 'REPORT'
  | 'POLICY'
  | 'FORM'
  | 'CERTIFICATE'
  | 'OTHER';

// Document status enum matching Prisma schema
export type DocumentStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'PROCESSING';

// Classification confidence levels
export type ClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Document entity interface
 */
export interface Document {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  folderId?: string | null;
  folder?: DocumentFolder | null;
  tags: string[];
  uploadedBy: string;
  metadata?: DocumentMetadata | null;
  version: number;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document folder interface
 */
export interface DocumentFolder {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  path: string;
  parentId?: string | null;
  parent?: DocumentFolder | null;
  children?: DocumentFolder[];
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document metadata with classification info
 */
export interface DocumentMetadata {
  classification?: ClassificationResult;
  classifiedAt?: string;
  extractedText?: string;
  pageCount?: number;
  ocrConfidence?: number;
  processingTime?: number;
  [key: string]: unknown;
}

/**
 * AI Classification result
 */
export interface ClassificationResult {
  type: DocumentType;
  confidence: number;
  extractedData: ExtractedDocumentData;
  autoCategorizationRecommended: boolean;
}

/**
 * Extracted data from document classification
 */
export interface ExtractedDocumentData {
  // Common fields
  date?: string;
  amount?: number;
  currency?: string;

  // Invoice/Receipt fields
  invoiceNumber?: string;
  receiptNumber?: string;
  vendor?: string;
  customerName?: string;
  paymentMethod?: string;

  // Contract fields
  contractType?: string;
  parties?: string[];
  startDate?: string;
  endDate?: string;
  value?: number;

  // Form fields
  formType?: string;
  formNumber?: string;
  applicantName?: string;

  // Certificate fields
  certificateType?: string;
  issuer?: string;
  recipient?: string;
  issueDate?: string;
  expiryDate?: string;

  // Report fields
  reportType?: string;
  period?: string;
  author?: string;

  // Additional dynamic fields
  [key: string]: unknown;
}

/**
 * Upload progress tracking
 */
export interface DocumentUploadProgress {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  bytesUploaded: number;
  status: UploadStatus;
  error?: string;
  startTime: number;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number; // bytes per second
}

export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'classifying'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * Chunked upload configuration
 */
export interface ChunkedUploadConfig {
  chunkSize: number; // bytes
  maxRetries: number;
  retryDelay: number; // ms
  concurrentChunks: number;
}

/**
 * Document query parameters
 */
export interface DocumentQueryParams {
  search?: string;
  type?: DocumentType | 'ALL';
  status?: DocumentStatus | 'ALL';
  folderId?: string;
  tags?: string[];
  uploadedBy?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'fileSize' | 'type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated document response
 */
export interface PaginatedDocuments {
  data: Document[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Document upload request
 */
export interface DocumentUploadRequest {
  file: File;
  name?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  autoClassify?: boolean;
}

/**
 * Document type configuration for UI
 */
export interface DocumentTypeConfig {
  type: DocumentType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Document type configurations
 */
export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, Omit<DocumentTypeConfig, 'type'>> = {
  CONTRACT: {
    label: 'Contract',
    icon: 'FileText',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  INVOICE: {
    label: 'Invoice',
    icon: 'Receipt',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  RECEIPT: {
    label: 'Receipt',
    icon: 'Receipt',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  REPORT: {
    label: 'Report',
    icon: 'FileBarChart',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  POLICY: {
    label: 'Policy',
    icon: 'FileCheck',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  FORM: {
    label: 'Form',
    icon: 'FileCog',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  CERTIFICATE: {
    label: 'Certificate',
    icon: 'Award',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  OTHER: {
    label: 'Other',
    icon: 'File',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
};

/**
 * Helper to get confidence level from score
 */
export function getConfidenceLevel(confidence: number): ClassificationConfidence {
  if (confidence >= 0.8) return 'HIGH';
  if (confidence >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Helper to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Helper to get mime type category
 */
export function getMimeTypeCategory(mimeType: string): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'other';
}
