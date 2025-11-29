/**
 * GoBD Configuration Interface
 * Defines configuration options for GoBD export generation
 */

/**
 * Date range for the export
 */
export interface DateRange {
  /** Start date (inclusive) */
  startDate: Date;
  /** End date (inclusive) */
  endDate: Date;
}

/**
 * Document types to include in the export
 */
export enum DocumentType {
  INVOICES = 'invoices',
  RECEIPTS = 'receipts',
  CONTRACTS = 'contracts',
  BANK_STATEMENTS = 'bank_statements',
  PAYROLL = 'payroll',
  ALL = 'all',
}

/**
 * Export format options
 */
export enum ExportFormat {
  /** CSV with semicolon separator */
  CSV_SEMICOLON = 'csv_semicolon',
  /** CSV with comma separator */
  CSV_COMMA = 'csv_comma',
  /** Tab-delimited */
  TSV = 'tsv',
}

/**
 * Configuration for GoBD export
 */
export interface GobdConfig {
  /** Organization ID */
  orgId: string;

  /** Date range for the export */
  dateRange: DateRange;

  /** Document types to include */
  documentTypes: DocumentType[];

  /** Export format (default: CSV with semicolon) */
  format?: ExportFormat;

  /** Include source documents (PDFs, etc.) */
  includeDocuments?: boolean;

  /** Include digital signature */
  includeSignature?: boolean;

  /** Incremental export (only changes since last export) */
  incremental?: boolean;

  /** Last export date (for incremental exports) */
  lastExportDate?: Date;

  /** Additional metadata */
  metadata?: {
    /** Auditor name */
    auditor?: string;
    /** Audit reference number */
    referenceNumber?: string;
    /** Custom notes */
    notes?: string;
  };
}

/**
 * Export status
 */
export enum ExportStatus {
  /** Export is queued */
  PENDING = 'pending',
  /** Export is being generated */
  PROCESSING = 'processing',
  /** Export completed successfully */
  COMPLETED = 'completed',
  /** Export failed */
  FAILED = 'failed',
  /** Export is ready for download */
  READY = 'ready',
  /** Export has been downloaded */
  DOWNLOADED = 'downloaded',
  /** Export has been deleted */
  DELETED = 'deleted',
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** Total number of files */
  totalFiles: number;
  /** Total size in bytes */
  totalSize: number;
  /** Number of transactions */
  transactionCount: number;
  /** Number of documents */
  documentCount: number;
  /** SHA-256 hash of the export archive */
  archiveHash: string;
}
