/**
 * ELSTER ESL (ZM) Service Types
 * EC Sales List (Zusammenfassende Meldung) data structures and types
 *
 * ZM is required for reporting intra-EU B2B transactions (deliveries/services)
 * Filed monthly or quarterly depending on transaction volume
 */

import { TaxPeriod, ValidationError, ValidationWarning } from './elster-vat.types';

/**
 * ZM transaction types
 */
export enum ZMTransactionType {
  GOODS = 'goods', // Warenlieferungen (Kennzahl 1)
  SERVICES = 'services', // Dienstleistungen (Kennzahl 3)
  TRIANGULAR = 'triangular', // Dreiecksgeschäfte (Kennzahl 2)
}

/**
 * Single transaction in EC Sales List
 */
export interface ZMTransaction {
  customerVatId: string; // Customer's EU VAT ID (e.g., FR12345678901)
  countryCode: string; // 2-letter ISO country code (e.g., FR, NL, AT)
  transactionType: ZMTransactionType;
  amount: number; // Total transaction value in cents
}

/**
 * Complete ZM data structure
 * All monetary amounts are in cents to avoid floating-point issues
 */
export interface ZMData {
  // Period information
  period: TaxPeriod;

  // Tax identification
  taxNumber: string; // Steuernummer (format: XXX/XXX/XXXXX)
  vatId: string; // USt-IdNr. (required, must be German: DE...)

  // Transactions list
  transactions: ZMTransaction[];

  // Optional metadata
  correctionPeriod?: TaxPeriod; // If this is a correction for a previous period
  isNilReturn?: boolean; // True if no transactions for the period
}

/**
 * VAT ID validation result from VIES
 */
export interface VatIdValidation {
  vatId: string;
  countryCode: string;
  isValid: boolean;
  requestDate: Date;

  // VIES response data
  name?: string; // Company name (if available)
  address?: string; // Company address (if available)

  // Validation details
  error?: string; // Error message if validation failed
  viesAvailable?: boolean; // Whether VIES service was available
}

/**
 * ZM submission options
 */
export interface ZMSubmitOptions {
  testMode?: boolean; // Submit to ELSTER test environment
  dryRun?: boolean; // Validate only, don't submit
  skipViesValidation?: boolean; // Skip VIES VAT ID validation (default: false)
  autoCalculate?: boolean; // Auto-calculate from invoices (default: true)
}

/**
 * ZM submission result
 */
export interface ZMSubmissionResult {
  success: boolean;
  submissionId: string; // Our internal ID
  transferTicket?: string; // ELSTER transfer ticket
  timestamp: Date;
  status: ZMFilingStatus;
  errors?: string[];
  warnings?: string[];
  data?: ZMData; // Submitted data
  validationResults?: VatIdValidation[]; // VIES validation results
}

/**
 * ZM filing status
 */
export enum ZMFilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * ZM validation result
 */
export interface ZMValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  vatIdValidations?: VatIdValidation[]; // VIES validation results
}

/**
 * ZM calculation from invoices
 */
export interface ZMCalculation {
  period: TaxPeriod;
  transactions: ZMTransaction[];
  totalAmount: number; // Total value in cents
  customerCount: number; // Number of unique customers
  invoiceCount: number; // Number of invoices included
  byCountry: Record<string, number>; // Total amount by country code
  byType: Record<ZMTransactionType, number>; // Total amount by transaction type
}

/**
 * ZM filing record
 */
export interface ZMFiling {
  id: string;
  organisationId: string;
  type: 'ZM'; // Always ZM for EC Sales List
  year: number;
  period: number; // Month (1-12) or Quarter (1-4)
  periodType: 'MONTHLY' | 'QUARTERLY';
  status: ZMFilingStatus;
  submissionId?: string; // External reference from ELSTER
  transferTicket?: string; // ELSTER transfer ticket
  submittedAt?: Date;
  responseAt?: Date;
  data: ZMData;
  response?: any;
  errors?: any;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Filing history query options
 */
export interface ZMHistoryOptions {
  year?: number;
  periodType?: 'MONTHLY' | 'QUARTERLY';
  status?: ZMFilingStatus;
  limit?: number;
  offset?: number;
}

/**
 * TigerVAT ZM API request structure
 */
export interface TigerVATZMRequest {
  organisationId: string;
  certificateId: string;
  data: ZMData;
  testMode: boolean;
}

/**
 * TigerVAT ZM API response structure
 */
export interface TigerVATZMResponse {
  success: boolean;
  transferTicket?: string;
  status: string;
  errors?: string[];
  warnings?: string[];
  timestamp: Date;
  rawResponse?: any;
}

/**
 * VIES API request
 */
export interface VIESRequest {
  countryCode: string; // 2-letter country code
  vatNumber: string; // VAT number without country code
}

/**
 * VIES API response
 */
export interface VIESResponse {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  requestDate: Date;
  name?: string;
  address?: string;
  error?: string;
}

/**
 * Error types for ELSTER ESL operations
 */
export class ElsterESLError extends Error {
  constructor(
    message: string,
    public readonly code: ElsterESLErrorCode,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ElsterESLError';
  }
}

export enum ElsterESLErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  CERTIFICATE_NOT_FOUND = 'CERTIFICATE_NOT_FOUND',
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  INVALID_PERIOD = 'INVALID_PERIOD',
  DUPLICATE_SUBMISSION = 'DUPLICATE_SUBMISSION',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_VAT_ID = 'INVALID_VAT_ID',
  VIES_UNAVAILABLE = 'VIES_UNAVAILABLE',
  VIES_VALIDATION_FAILED = 'VIES_VALIDATION_FAILED',
  NO_TRANSACTIONS = 'NO_TRANSACTIONS',
}

/**
 * EU country codes for VIES validation
 */
export const EU_COUNTRY_CODES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
] as const;

export type EUCountryCode = typeof EU_COUNTRY_CODES[number];

/**
 * Check if country code is in EU
 */
export function isEUCountry(countryCode: string): boolean {
  return EU_COUNTRY_CODES.includes(countryCode as EUCountryCode);
}
