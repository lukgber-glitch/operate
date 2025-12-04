/**
 * Registrierkasse Types
 * TypeScript type definitions for Austrian RKSV (Registrierkassensicherheitsverordnung) compliance
 *
 * Based on:
 * - RKSV 2017 (Registrierkassensicherheitsverordnung 2017)
 * - DEP7 Format Specification
 * - BMF Cash Register Requirements
 *
 * Documentation: https://www.bmf.gv.at/themen/steuern/elektronische-aufzeichnungspflichten.html
 */

/**
 * Cash register types
 */
export enum CashRegisterType {
  /** Individual cash register */
  INDIVIDUAL = 'INDIVIDUAL',
  /** Central cash register system */
  CENTRAL = 'CENTRAL',
  /** Mobile cash register */
  MOBILE = 'MOBILE',
  /** Online cash register */
  ONLINE = 'ONLINE',
}

/**
 * Cash register status
 */
export enum CashRegisterStatus {
  /** Active and operational */
  ACTIVE = 'ACTIVE',
  /** Temporarily inactive */
  INACTIVE = 'INACTIVE',
  /** Deregistered */
  DEREGISTERED = 'DEREGISTERED',
  /** Failed/defective */
  FAILED = 'FAILED',
}

/**
 * Receipt type
 */
export enum ReceiptType {
  /** Standard receipt (Normalbeleg) */
  STANDARD = 'STANDARD',
  /** Training receipt (Schulungsbeleg) */
  TRAINING = 'TRAINING',
  /** Void receipt (Stornierung) */
  VOID = 'VOID',
  /** Null receipt (Nullbeleg) */
  NULL = 'NULL',
  /** Start receipt (Startbeleg) */
  START = 'START',
  /** Daily closing (Tagesabschluss) */
  DAILY_CLOSING = 'DAILY_CLOSING',
  /** Monthly closing (Monatsabschluss) */
  MONTHLY_CLOSING = 'MONTHLY_CLOSING',
  /** Annual closing (Jahresabschluss) */
  ANNUAL_CLOSING = 'ANNUAL_CLOSING',
}

/**
 * VAT rate categories
 */
export enum VATRate {
  /** Standard rate (20%) */
  STANDARD = 20,
  /** Reduced rate 1 (10%) */
  REDUCED_1 = 10,
  /** Reduced rate 2 (13%) */
  REDUCED_2 = 13,
  /** Special rate (19%) - for certain agricultural products */
  SPECIAL = 19,
  /** Zero rate (0%) */
  ZERO = 0,
}

/**
 * Signature algorithm types
 */
export enum SignatureAlgorithm {
  /** ECDSA with SHA-256 */
  ES256 = 'ES256',
  /** RSA with SHA-256 */
  RS256 = 'RS256',
}

/**
 * Signature creation device type
 */
export enum SignatureDeviceType {
  /** Hardware Security Module */
  HSM = 'HSM',
  /** A-Trust signature card */
  ATRUST = 'ATRUST',
  /** Software signature (for testing only) */
  SOFTWARE = 'SOFTWARE',
}

/**
 * Cash register registration data
 */
export interface CashRegisterRegistration {
  /** Organization ID */
  organizationId: string;
  /** Cash register ID (Kassen-ID) */
  cashRegisterId: string;
  /** Type of cash register */
  type: CashRegisterType;
  /** Serial number */
  serialNumber?: string;
  /** AES key for receipt signing (256-bit, Base64 encoded) */
  aesKey: string;
  /** Tax number (Steuernummer) */
  taxNumber: string;
  /** VAT ID (UID-Nummer) */
  vatId?: string;
  /** Company name */
  companyName: string;
  /** Location/branch name */
  locationName?: string;
  /** Signature device configuration */
  signatureDevice: SignatureDeviceConfig;
  /** Registration date */
  registeredAt?: Date;
  /** Status */
  status: CashRegisterStatus;
}

/**
 * Signature device configuration
 */
export interface SignatureDeviceConfig {
  /** Device type */
  type: SignatureDeviceType;
  /** Device serial number */
  deviceSerial: string;
  /** Signature algorithm */
  algorithm: SignatureAlgorithm;
  /** Certificate serial number */
  certificateSerial?: string;
  /** Public key (Base64 encoded) */
  publicKey?: string;
  /** Connection details (for HSM/A-Trust) */
  connection?: {
    host?: string;
    port?: number;
    apiKey?: string;
    certificatePath?: string;
  };
}

/**
 * Receipt item
 */
export interface ReceiptItem {
  /** Item description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (gross, in cents) */
  unitPrice: number;
  /** VAT rate */
  vatRate: VATRate;
  /** Total amount (gross, in cents) */
  totalAmount: number;
  /** Item category/product code */
  productCode?: string;
}

/**
 * VAT breakdown
 */
export interface VATBreakdown {
  /** VAT rate */
  rate: VATRate;
  /** Net amount in cents */
  netAmount: number;
  /** VAT amount in cents */
  vatAmount: number;
  /** Gross amount in cents */
  grossAmount: number;
}

/**
 * Receipt data (before signing)
 */
export interface ReceiptData {
  /** Cash register ID */
  cashRegisterId: string;
  /** Receipt number (sequential per cash register) */
  receiptNumber: number;
  /** Date and time */
  dateTime: Date;
  /** Receipt type */
  type: ReceiptType;
  /** Items */
  items: ReceiptItem[];
  /** Total amount (gross, in cents) */
  totalAmount: number;
  /** VAT breakdown */
  vatBreakdown: VATBreakdown[];
  /** Payment method */
  paymentMethod?: PaymentMethod;
  /** Currency code (default: EUR) */
  currency?: string;
  /** Training mode flag */
  trainingMode?: boolean;
  /** Reference to previous receipt (for void/corrections) */
  previousReceiptId?: string;
  /** Customer reference */
  customerReference?: string;
  /** Notes */
  notes?: string;
}

/**
 * Payment method
 */
export enum PaymentMethod {
  /** Cash */
  CASH = 'CASH',
  /** Debit card */
  DEBIT_CARD = 'DEBIT_CARD',
  /** Credit card */
  CREDIT_CARD = 'CREDIT_CARD',
  /** Bank transfer */
  TRANSFER = 'TRANSFER',
  /** Online payment */
  ONLINE = 'ONLINE',
  /** Voucher */
  VOUCHER = 'VOUCHER',
  /** Other */
  OTHER = 'OTHER',
}

/**
 * RKSV signature data
 */
export interface RKSVSignature {
  /** JWS (JSON Web Signature) compact serialization */
  jws: string;
  /** Certificate serial number */
  certificateSerial: string;
  /** Signature algorithm */
  algorithm: SignatureAlgorithm;
  /** Signature counter (Signaturzähler) */
  signatureCounter: number;
  /** Turnover counter (Umsatzzähler) in cents */
  turnoverCounter: number;
  /** Signature creation timestamp */
  timestamp: Date;
}

/**
 * Signed receipt (complete)
 */
export interface SignedReceipt {
  /** Unique receipt ID */
  id: string;
  /** Organization ID */
  organizationId: string;
  /** Cash register ID */
  cashRegisterId: string;
  /** Receipt number */
  receiptNumber: number;
  /** Date and time */
  dateTime: Date;
  /** Receipt type */
  type: ReceiptType;
  /** Items */
  items: ReceiptItem[];
  /** Total amount (gross, in cents) */
  totalAmount: number;
  /** VAT breakdown */
  vatBreakdown: VATBreakdown[];
  /** Payment method */
  paymentMethod?: PaymentMethod;
  /** Currency */
  currency: string;
  /** Training mode */
  trainingMode: boolean;
  /** RKSV signature */
  signature: RKSVSignature;
  /** QR code data (machine-readable format) */
  qrCode: string;
  /** OCR code (human-readable backup) */
  ocrCode: string;
  /** DEP export format */
  depFormat: string;
  /** Previous receipt hash (chain verification) */
  previousReceiptHash?: string;
  /** Reference receipts */
  previousReceiptId?: string;
  customerReference?: string;
  notes?: string;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Receipt signing request
 */
export interface SignReceiptRequest {
  /** Cash register ID */
  cashRegisterId: string;
  /** Receipt data */
  receiptData: ReceiptData;
}

/**
 * Start receipt request
 */
export interface StartReceiptRequest {
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization ID */
  organizationId: string;
}

/**
 * Null receipt request (Nullbeleg)
 */
export interface NullReceiptRequest {
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization ID */
  organizationId: string;
}

/**
 * Closing receipt request (Tagesabschluss, Monatsabschluss, Jahresabschluss)
 */
export interface ClosingReceiptRequest {
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization ID */
  organizationId: string;
  /** Closing type */
  closingType: ReceiptType.DAILY_CLOSING | ReceiptType.MONTHLY_CLOSING | ReceiptType.ANNUAL_CLOSING;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
}

/**
 * Closing receipt data
 */
export interface ClosingReceiptData {
  /** Total number of receipts in period */
  totalReceipts: number;
  /** Total turnover in period (in cents) */
  totalTurnover: number;
  /** VAT breakdown for period */
  vatBreakdown: VATBreakdown[];
  /** Start counter value */
  startCounter: number;
  /** End counter value */
  endCounter: number;
  /** Period statistics */
  statistics?: {
    cashPayments?: number;
    cardPayments?: number;
    voidReceipts?: number;
    trainingReceipts?: number;
  };
}

/**
 * DEP (Datenerfassungsprotokoll) export format
 */
export interface DEPExport {
  /** DEP format version (current: DEP7) */
  version: string;
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization/company name */
  companyName: string;
  /** Tax number */
  taxNumber: string;
  /** VAT ID */
  vatId?: string;
  /** Export period start */
  periodStart: Date;
  /** Export period end */
  periodEnd: Date;
  /** Certificate serial number */
  certificateSerial: string;
  /** Receipts */
  receipts: DEPReceipt[];
  /** Export metadata */
  metadata: DEPMetadata;
  /** Export timestamp */
  exportedAt: Date;
}

/**
 * DEP receipt format
 */
export interface DEPReceipt {
  /** Receipt ID */
  id: string;
  /** Receipt number */
  receiptNumber: number;
  /** Date and time (ISO 8601) */
  dateTime: string;
  /** Receipt type */
  type: string;
  /** Total amount in cents */
  totalAmount: number;
  /** VAT breakdown */
  vatBreakdown: {
    rate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }[];
  /** JWS signature */
  jws: string;
  /** Certificate serial */
  certificateSerial: string;
  /** Signature counter */
  signatureCounter: number;
  /** Turnover counter */
  turnoverCounter: number;
  /** Training mode */
  trainingMode: boolean;
  /** Previous receipt hash */
  previousReceiptHash?: string;
}

/**
 * DEP export metadata
 */
export interface DEPMetadata {
  /** Total number of receipts */
  totalReceipts: number;
  /** Total turnover in cents */
  totalTurnover: number;
  /** First receipt number */
  firstReceiptNumber: number;
  /** Last receipt number */
  lastReceiptNumber: number;
  /** First signature counter */
  firstSignatureCounter: number;
  /** Last signature counter */
  lastSignatureCounter: number;
  /** Export format */
  format: string;
  /** Software version */
  softwareVersion: string;
  /** Software manufacturer */
  softwareManufacturer: string;
}

/**
 * QR code format (simplified machine-readable code)
 */
export interface QRCodeData {
  /** Cash register ID */
  cashRegisterId: string;
  /** Receipt number */
  receiptNumber: number;
  /** Date and time */
  dateTime: string;
  /** Total amount */
  totalAmount: number;
  /** JWS signature */
  jws: string;
  /** Certificate serial */
  certificateSerial: string;
}

/**
 * OCR code format (human-readable backup code)
 */
export interface OCRCodeData {
  /** Cash register ID */
  cashRegisterId: string;
  /** Receipt number */
  receiptNumber: number;
  /** Date code (YYMMDD) */
  dateCode: string;
  /** Time code (HHMM) */
  timeCode: string;
  /** Amount code */
  amountCode: string;
  /** Signature checksum */
  signatureChecksum: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  /** Verification success */
  valid: boolean;
  /** Receipt ID */
  receiptId: string;
  /** Verification timestamp */
  verifiedAt: Date;
  /** Verification details */
  details: {
    /** JWS signature valid */
    jwsValid: boolean;
    /** Certificate valid */
    certificateValid: boolean;
    /** Chain valid (previous hash) */
    chainValid: boolean;
    /** Counter valid */
    counterValid: boolean;
    /** Turnover valid */
    turnoverValid: boolean;
  };
  /** Error messages (if any) */
  errors?: string[];
}

/**
 * Cash register statistics
 */
export interface CashRegisterStatistics {
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization ID */
  organizationId: string;
  /** Period start */
  periodStart: Date;
  /** Period end */
  periodEnd: Date;
  /** Total receipts */
  totalReceipts: number;
  /** Total turnover in cents */
  totalTurnover: number;
  /** Receipts by type */
  receiptsByType: {
    [key in ReceiptType]?: number;
  };
  /** Turnover by VAT rate */
  turnoverByVATRate: {
    [key in VATRate]?: number;
  };
  /** Payment methods breakdown */
  paymentMethods: {
    [key in PaymentMethod]?: {
      count: number;
      amount: number;
    };
  };
  /** Daily statistics */
  dailyStats?: {
    date: string;
    receipts: number;
    turnover: number;
  }[];
}

/**
 * FinanzOnline registration request
 */
export interface FinanzOnlineRegistrationRequest {
  /** FinanzOnline session ID */
  sessionId: string;
  /** Organization ID */
  organizationId: string;
  /** Cash register registration data */
  cashRegister: CashRegisterRegistration;
}

/**
 * FinanzOnline registration response
 */
export interface FinanzOnlineRegistrationResponse {
  /** Registration success */
  success: boolean;
  /** Confirmation number */
  confirmationNumber?: string;
  /** Registration timestamp */
  registeredAt: Date;
  /** Cash register ID (confirmed) */
  cashRegisterId: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * DEP export request
 */
export interface DEPExportRequest {
  /** Cash register ID */
  cashRegisterId: string;
  /** Organization ID */
  organizationId: string;
  /** Export period start */
  periodStart: Date;
  /** Export period end */
  periodEnd: Date;
  /** Export format (default: DEP7) */
  format?: string;
}
