/**
 * InvoiceNow Integration Types (Singapore Peppol Network)
 *
 * InvoiceNow is Singapore's nationwide e-invoicing network based on Peppol.
 * Regulated by IMDA (Info-communications Media Development Authority).
 *
 * Standards:
 * - Peppol BIS Billing 3.0
 * - PINT-SG (Peppol International Model for Singapore)
 * - UBL 2.1
 * - AS4 Profile (CEF eDelivery)
 * - ISO/IEC 6523 (Participant ID: 0195 for Singapore UEN)
 */

/**
 * Singapore UEN (Unique Entity Number)
 * Format: 9-10 digit alphanumeric
 * Examples: 201234567A, 53012345D, T08PQ1234A
 */
export interface SingaporeUen {
  value: string;
  isValid: boolean;
  type?: 'BUSINESS' | 'LOCAL_COMPANY' | 'FOREIGN_COMPANY' | 'OTHER';
}

/**
 * Singapore GST Registration Number
 * Format: M followed by 8 digits and 1 check letter (e.g., M12345678X)
 * Or: Standard UEN for GST registered entities
 */
export interface SingaporeGstNumber {
  value: string;
  isValid: boolean;
  registrationDate?: Date;
}

/**
 * InvoiceNow Participant Identifier
 * Uses Peppol scheme 0195 for Singapore UEN
 */
export interface InvoiceNowParticipant {
  uen: string; // Singapore UEN
  scheme: '0195'; // Fixed scheme for Singapore
  participantId: string; // Formatted as "0195:UEN"
  name: string;
  address: {
    streetName?: string;
    cityName: string;
    postalCode: string;
    countryCode: 'SG'; // Always Singapore
  };
  gstRegistrationNumber?: string;
  contact?: {
    name?: string;
    telephone?: string;
    email?: string;
  };
}

/**
 * InvoiceNow Document Types
 */
export enum InvoiceNowDocumentType {
  INVOICE = 'Invoice',
  CREDIT_NOTE = 'CreditNote',
  DEBIT_NOTE = 'DebitNote',
  SELF_BILLED_INVOICE = 'SelfBilledInvoice',
}

/**
 * Singapore GST Tax Categories
 */
export enum SingaporeGstCategory {
  STANDARD_RATED = 'SR', // 8% (as of 2024)
  ZERO_RATED = 'ZR', // 0% - Exports, international services
  EXEMPT = 'E', // Exempt supplies
  OUT_OF_SCOPE = 'OS', // Out of scope
  DEEMED = 'DS', // Deemed supplies
}

/**
 * Singapore GST Tax Rates (as of 2024)
 */
export const SINGAPORE_GST_RATES = {
  STANDARD: 8.0, // Effective from 1 Jan 2024
  ZERO: 0.0,
  EXEMPT: 0.0,
} as const;

/**
 * InvoiceNow Document
 */
export interface InvoiceNowDocument {
  documentType: InvoiceNowDocumentType;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  currency: 'SGD' | string; // Typically SGD for domestic invoices
  supplier: InvoiceNowParticipant;
  customer: InvoiceNowParticipant;
  lines: InvoiceNowLine[];
  taxTotal: number;
  totalAmount: number;
  paymentTerms?: string;
  paymentMeans?: InvoiceNowPaymentMeans;
  notes?: string;
  billingReference?: string; // Reference to original invoice for credit/debit notes
  projectReference?: string;
}

/**
 * InvoiceNow Line Item
 */
export interface InvoiceNowLine {
  id: string;
  description: string;
  quantity: number;
  unitCode: string; // UN/ECE Rec 20 (e.g., "EA" for each, "HUR" for hour)
  unitPrice: number;
  lineExtensionAmount: number; // Quantity × Unit Price
  taxCategory: SingaporeGstCategory;
  taxPercent: number;
  taxAmount: number;
  itemClassificationCode?: string; // UNSPSC or similar
}

/**
 * InvoiceNow Payment Means
 */
export interface InvoiceNowPaymentMeans {
  paymentMeansCode: string; // UN/CEFACT 4461 (e.g., "30" for credit transfer, "42" for PayNow)
  paymentId?: string; // Payment reference
  payeeAccountId?: string; // Bank account number
  payeeAccountName?: string;
  payeeBankBic?: string; // SWIFT/BIC code
  payNowUen?: string; // PayNow corporate UEN
  payNowMobile?: string; // PayNow mobile number
}

/**
 * Peppol Message Status (InvoiceNow specific)
 */
export enum PeppolMessageStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  VALIDATED = 'VALIDATED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

/**
 * InvoiceNow Transmission
 */
export interface InvoiceNowTransmission {
  id: string;
  organizationId: string;
  messageId: string;
  conversationId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  documentType: InvoiceNowDocumentType;
  invoiceNumber: string;
  fromUen: string;
  toUen: string;
  status: PeppolMessageStatus;
  ublXml: string;
  as4MessageId?: string;
  receiptTimestamp?: Date;
  errorCode?: string;
  errorMessage?: string;
  validationErrors?: InvoiceNowValidationError[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InvoiceNow Validation Error
 */
export interface InvoiceNowValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  code: string; // e.g., "PINT-SG-001"
  suggestion?: string;
}

/**
 * InvoiceNow Response (Message Level Response - MLR)
 */
export interface InvoiceNowResponse {
  messageId: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  timestamp: Date;
  description?: string;
  errors?: InvoiceNowValidationError[];
}

/**
 * Invoice Response Message (IMR)
 * Business-level acknowledgment of invoice
 */
export interface InvoiceResponseMessage {
  responseCode: InvoiceResponseCode;
  invoiceNumber: string;
  issueDate: Date;
  effectiveDate?: Date;
  responseDescription?: string;
  disputedAmount?: number;
  disputeReason?: string;
}

/**
 * Invoice Response Codes (PINT-SG)
 */
export enum InvoiceResponseCode {
  APPROVED = 'AP', // Invoice is approved
  REJECTED = 'RE', // Invoice is rejected
  CONDITIONALLY_ACCEPTED = 'CA', // Accepted with conditions
  UNDER_QUERY = 'UQ', // Invoice is under query
  PAID = 'PD', // Invoice has been paid
}

/**
 * InvoiceNow Error Codes
 */
export enum InvoiceNowErrorCode {
  INVALID_UEN = 'IN_001',
  INVALID_GST_NUMBER = 'IN_002',
  UEN_NOT_REGISTERED = 'IN_003',
  DOCUMENT_VALIDATION_FAILED = 'IN_004',
  GST_CALCULATION_ERROR = 'IN_005',
  PEPPOL_LOOKUP_FAILED = 'IN_006',
  TRANSMISSION_FAILED = 'IN_007',
  RECEIPT_TIMEOUT = 'IN_008',
  UNSUPPORTED_CURRENCY = 'IN_009',
  INVALID_PAYMENT_MEANS = 'IN_010',
}

/**
 * UEN Validation Result
 */
export interface UenValidationResult {
  isValid: boolean;
  uen?: string;
  type?: 'BUSINESS' | 'LOCAL_COMPANY' | 'FOREIGN_COMPANY' | 'OTHER';
  entityName?: string;
  registrationDate?: Date;
  status?: 'ACTIVE' | 'CANCELLED' | 'STRUCK_OFF';
  errors?: string[];
}

/**
 * GST Validation Result
 */
export interface GstValidationResult {
  isValid: boolean;
  gstNumber?: string;
  uen?: string;
  effectiveDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE';
  errors?: string[];
}

/**
 * InvoiceNow Configuration
 */
export interface InvoiceNowConfig {
  enabled: boolean;
  environment: 'production' | 'test';
  peppolAccessPointUrl: string;
  participantUen: string;
  certificatePath: string;
  privateKeyPath: string;
  certificatePassword: string;
  smlDomain: string; // e.g., 'sml.peppol.sg' or 'test-sml.peppol.sg'
  mockMode: boolean;
  validateUen: boolean;
  validateGst: boolean;
  autoAcknowledge: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * InvoiceNow Statistics
 */
export interface InvoiceNowStatistics {
  organizationId: string;
  period: {
    from: Date;
    to: Date;
  };
  totalSent: number;
  totalReceived: number;
  totalDelivered: number;
  totalFailed: number;
  totalRejected: number;
  averageDeliveryTime: number; // milliseconds
  failureRate: number; // percentage
  topErrors: Array<{
    code: string;
    count: number;
    message: string;
  }>;
}

/**
 * PINT-SG Customization
 * Singapore-specific Peppol International Model
 */
export const PINT_SG_CUSTOMIZATION = {
  customizationId:
    'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:peppol.sg:spec:1.0',
  profileId: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
  documentTypeId:
    'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:peppol.sg:spec:1.0::2.1',
} as const;

/**
 * Singapore-specific Peppol Participant ID Scheme
 */
export const SINGAPORE_PEPPOL_SCHEME = '0195' as const;

/**
 * Singapore Country Code
 */
export const SINGAPORE_COUNTRY_CODE = 'SG' as const;

/**
 * InvoiceNow Webhook Event
 */
export interface InvoiceNowWebhookEvent {
  eventType: InvoiceNowEventType;
  messageId: string;
  invoiceNumber: string;
  uen: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * InvoiceNow Event Types
 */
export enum InvoiceNowEventType {
  INVOICE_RECEIVED = 'invoice:received',
  INVOICE_DELIVERED = 'invoice:delivered',
  INVOICE_FAILED = 'invoice:failed',
  INVOICE_ACKNOWLEDGED = 'invoice:acknowledged',
  INVOICE_REJECTED = 'invoice:rejected',
  CREDIT_NOTE_RECEIVED = 'credit_note:received',
}
