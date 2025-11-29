/**
 * SAF-T Export Configuration Interface
 * Defines configuration options for SAF-T export generation
 */

/**
 * SAF-T variant/country-specific format
 */
export enum SaftVariant {
  INTERNATIONAL = 'INTERNATIONAL', // OECD 2.0
  PORTUGAL = 'PT', // SAF-T PT
  NORWAY = 'NO', // SAF-T NO
  AUSTRIA = 'AT', // SAF-T AT
  POLAND = 'PL', // JPK
  LUXEMBOURG = 'LU', // SAF-T LU
}

/**
 * Export scope options
 */
export enum ExportScope {
  FULL = 'FULL', // Complete audit file
  MASTER_FILES = 'MASTER_FILES', // Only master data
  TRANSACTIONS = 'TRANSACTIONS', // Only transactions
  SOURCE_DOCUMENTS = 'SOURCE_DOCUMENTS', // Only source documents
}

/**
 * Export status
 */
export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Date range for export
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * SAF-T export options
 */
export interface SaftOptions {
  variant: SaftVariant;
  scope: ExportScope;
  dateRange: DateRange;
  includeOpeningBalances?: boolean;
  includeClosingBalances?: boolean;
  includeTaxDetails?: boolean;
  includeCustomerSupplierDetails?: boolean;
  compression?: boolean; // ZIP output
  validation?: boolean; // Validate against XSD
  countrySpecificExtensions?: Record<string, any>;
}

/**
 * Fiscal period information
 */
export interface FiscalPeriod {
  year: number;
  startDate: Date;
  endDate: Date;
  periodNumber?: number;
}

/**
 * Export result metadata
 */
export interface ExportMetadata {
  exportId: string;
  organizationId: string;
  variant: SaftVariant;
  scope: ExportScope;
  dateRange: DateRange;
  fileSize: number;
  numberOfEntries: number;
  totalDebit: number;
  totalCredit: number;
  createdAt: Date;
  createdBy: string;
  status: ExportStatus;
  validationErrors?: string[];
  checksum?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  schemaVersion: string;
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  line?: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
}
