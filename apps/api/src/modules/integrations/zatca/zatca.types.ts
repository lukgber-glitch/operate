/**
 * ZATCA FATOORAH Type Definitions
 * Saudi Arabian E-Invoicing System Types
 */

/**
 * ZATCA Invoice Type Enum
 */
export enum ZatcaInvoiceType {
  STANDARD_INVOICE = 'STANDARD_INVOICE', // B2B Tax Invoice
  STANDARD_DEBIT_NOTE = 'STANDARD_DEBIT_NOTE',
  STANDARD_CREDIT_NOTE = 'STANDARD_CREDIT_NOTE',
  SIMPLIFIED_INVOICE = 'SIMPLIFIED_INVOICE', // B2C Tax Invoice
  SIMPLIFIED_DEBIT_NOTE = 'SIMPLIFIED_DEBIT_NOTE',
  SIMPLIFIED_CREDIT_NOTE = 'SIMPLIFIED_CREDIT_NOTE',
}

/**
 * ZATCA Configuration Interface
 */
export interface ZatcaConfig {
  environment: 'sandbox' | 'production';
  complianceCSID?: string; // Compliance Cryptographic Stamp ID
  productionCSID?: string; // Production Cryptographic Stamp ID
  apiKey?: string; // API authentication key
  organizationIdentifier: string; // TRN (Tax Registration Number)
  organizationName: string;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string; // 'SA' for Saudi Arabia
  privateKey: string; // ECDSA private key (PEM format)
  publicKey: string; // ECDSA public key (PEM format)
  certificateSerial: string; // Certificate serial number
  enableRateLimiting?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Party Address (Seller/Buyer)
 */
export interface ZatcaAddress {
  buildingNumber: string; // 4-digit building number
  streetName: string;
  districtName: string;
  cityName: string;
  postalCode: string; // 5-digit postal code
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'SA')
  additionalNumber?: string; // 4-digit additional number
  additionalStreetName?: string;
  provinceName?: string;
}

/**
 * Party Identification (Seller/Buyer)
 */
export interface ZatcaParty {
  registrationName: string; // Legal name
  vatRegistrationNumber?: string; // TRN (15 digits starting with 3)
  nationalId?: string; // Iqama or National ID (10 digits)
  commercialRegistrationNumber?: string; // CR number (10 digits)
  address: ZatcaAddress;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * Invoice Line Item
 */
export interface ZatcaInvoiceLine {
  id: string; // Line number
  name: string; // Item name (Arabic/English)
  quantity: number;
  unitPrice: number; // Price excluding VAT
  netAmount: number; // quantity * unitPrice
  vatRate: number; // 0.15 for 15% VAT
  vatAmount: number; // netAmount * vatRate
  totalAmount: number; // netAmount + vatAmount
  vatCategoryCode: 'S' | 'Z' | 'E' | 'O'; // Standard, Zero, Exempt, Outside scope
  vatExemptionReasonCode?: string; // Required if vatCategoryCode is 'E'
  discountAmount?: number;
  discountReason?: string;
  measurementUnit?: string; // e.g., 'PCE' (piece), 'MTR' (meter)
}

/**
 * Tax Subtotal (VAT breakdown)
 */
export interface ZatcaTaxSubtotal {
  taxableAmount: number; // Amount before VAT
  taxAmount: number; // VAT amount
  vatCategoryCode: 'S' | 'Z' | 'E' | 'O';
  vatRate: number;
  vatExemptionReasonCode?: string;
}

/**
 * Payment Means
 */
export interface ZatcaPaymentMeans {
  paymentMeansCode: string; // UN/ECE 4461 code
  paymentMeansDescription?: string;
  instructionNote?: string;
  paymentTerms?: string;
  paymentDueDate?: Date;
}

/**
 * Document Reference (for credit/debit notes)
 */
export interface ZatcaDocumentReference {
  id: string; // Referenced document number
  uuid?: string; // Referenced document UUID
  issueDate?: Date;
  documentTypeCode?: string;
}

/**
 * Main Invoice Data Interface
 */
export interface ZatcaInvoiceData {
  // Invoice Header
  invoiceNumber: string; // Unique invoice number
  uuid: string; // UUID v4
  issueDate: Date; // Invoice issue date
  issueTime: Date; // Invoice issue time
  invoiceType: ZatcaInvoiceType;
  invoiceTypeCode: string; // UBL type code (388, 381, 383)
  transactionTypeCode: string; // '0100' or '0200'
  currency: string; // ISO 4217 (default: 'SAR')

  // Previous Invoice Hash (for chaining)
  previousInvoiceHash: string; // SHA-256 hash of previous invoice (Base64)

  // Parties
  seller: ZatcaParty;
  buyer?: ZatcaParty; // Optional for simplified invoices

  // Line Items
  lines: ZatcaInvoiceLine[];

  // Totals
  lineExtensionAmount: number; // Sum of line netAmounts (before VAT)
  taxExclusiveAmount: number; // Total before VAT
  taxInclusiveAmount: number; // Total including VAT
  allowanceTotalAmount?: number; // Total discounts
  chargeTotalAmount?: number; // Total charges
  payableAmount: number; // Final amount to pay

  // Tax Breakdown
  taxSubtotals: ZatcaTaxSubtotal[];

  // Payment
  paymentMeans?: ZatcaPaymentMeans;

  // References (for credit/debit notes)
  billingReference?: ZatcaDocumentReference;

  // Notes
  notes?: string[];

  // Delivery
  deliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Purchase Order Reference
  purchaseOrderReference?: string;

  // Contract Reference
  contractReference?: string;
}

/**
 * QR Code Data (TLV encoded)
 */
export interface ZatcaQRCodeData {
  sellerName: string; // Tag 1
  vatRegistrationNumber: string; // Tag 2 (TRN)
  timestamp: string; // Tag 3 (ISO 8601)
  invoiceTotal: string; // Tag 4 (with VAT)
  vatTotal: string; // Tag 5
  invoiceHash: string; // Tag 6 (SHA-256 Base64)
  cryptographicStamp: string; // Tag 7 (ECDSA signature Base64)
  publicKey: string; // Tag 8 (Base64)
  signatureAlgorithm: string; // Tag 9
}

/**
 * TLV (Tag-Length-Value) Entry
 */
export interface TLVEntry {
  tag: number;
  value: string | Buffer;
}

/**
 * Invoice Hash Result
 */
export interface InvoiceHashResult {
  hash: string; // Base64 encoded SHA-256 hash
  canonicalString: string; // Canonical XML string used for hashing
}

/**
 * Cryptographic Stamp Result
 */
export interface CryptographicStampResult {
  signature: string; // Base64 encoded ECDSA signature
  publicKey: string; // Base64 encoded public key
  algorithm: string; // 'ECDSA'
}

/**
 * ZATCA Clearance Response
 */
export interface ZatcaClearanceResponse {
  clearedInvoice: string; // Base64 encoded cleared invoice XML
  clearanceStatus: 'CLEARED' | 'REJECTED' | 'REPORTED';
  validationResults?: ZatcaValidationResult[];
  warnings?: ZatcaWarning[];
  reportingStatus?: string;
  qrCode?: string; // Base64 encoded QR code
}

/**
 * ZATCA Validation Result
 */
export interface ZatcaValidationResult {
  type: 'ERROR' | 'WARNING';
  code: string;
  category: string;
  message: string;
  status: 'PASS' | 'FAIL';
}

/**
 * ZATCA Warning
 */
export interface ZatcaWarning {
  code: string;
  category: string;
  message: string;
}

/**
 * ZATCA Reporting Response
 */
export interface ZatcaReportingResponse {
  reportingStatus: 'REPORTED' | 'REJECTED';
  validationResults?: ZatcaValidationResult[];
  warnings?: ZatcaWarning[];
}

/**
 * CSID Request (Cryptographic Stamp ID)
 */
export interface ZatcaCSIDRequest {
  csr: string; // Certificate Signing Request (Base64 PEM)
}

/**
 * CSID Response
 */
export interface ZatcaCSIDResponse {
  requestId: string;
  dispositionMessage: string;
  binarySecurityToken: string; // Base64 encoded certificate
  secret: string; // API secret for authentication
  expiryDate: string; // ISO 8601 timestamp
}

/**
 * Compliance Check Request
 */
export interface ZatcaComplianceCheckRequest {
  invoiceHash: string; // Base64 SHA-256 hash
  uuid: string; // Invoice UUID
  invoice: string; // Base64 encoded UBL XML
}

/**
 * Compliance Check Response
 */
export interface ZatcaComplianceCheckResponse {
  reportingStatus: string;
  clearanceStatus: string;
  validationResults: ZatcaValidationResult[];
  warnings: ZatcaWarning[];
}

/**
 * ZATCA Error Response
 */
export interface ZatcaErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Invoice Submission Result
 */
export interface InvoiceSubmissionResult {
  success: boolean;
  invoiceHash: string;
  uuid: string;
  clearanceStatus?: 'CLEARED' | 'REJECTED';
  reportingStatus?: 'REPORTED' | 'REJECTED';
  clearedInvoice?: string; // Base64 cleared invoice
  validationResults?: ZatcaValidationResult[];
  warnings?: ZatcaWarning[];
  qrCode?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Rate Limit Info
 */
export interface RateLimitInfo {
  limit: number; // Max requests per hour
  remaining: number; // Remaining requests
  resetTime: Date; // When limit resets
}

/**
 * ZATCA API Request Options
 */
export interface ZatcaRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * UBL Invoice (simplified structure for XML generation)
 */
export interface UBLInvoice {
  ublVersionId: string; // '2.1'
  profileId: string; // 'reporting:1.0' or 'clearance:1.0'
  id: string; // Invoice number
  uuid: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  invoiceTypeCode: string; // '388', '381', '383'
  documentCurrencyCode: string; // 'SAR'
  taxCurrencyCode?: string;
  billingReference?: any;
  additionalDocumentReference?: any[];
  accountingSupplierParty: any;
  accountingCustomerParty?: any;
  delivery?: any;
  paymentMeans?: any;
  taxTotal: any[];
  legalMonetaryTotal: any;
  invoiceLine: any[];
}

/**
 * CSR Configuration for Certificate Generation
 */
export interface CSRConfig {
  commonName: string; // Organization name
  organizationalUnitName: string; // 'Riyad Branch' or similar
  organizationIdentifier: string; // TRN
  countryName: string; // 'SA'
  invoiceType: string; // '1000' for standard, '0100' for simplified
  location: string; // Address
  industry: string; // Business classification
}
