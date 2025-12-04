/**
 * GST Invoice Registration Portal (IRP) Types
 *
 * Type definitions for India's e-invoicing system
 * Reference: https://einvoice.nat.gov.in/
 */

/**
 * IRP Environment Types
 */
export enum IrpEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * Invoice Types as per GST
 */
export enum GstInvoiceType {
  INVOICE = 'INV',
  CREDIT_NOTE = 'CRN',
  DEBIT_NOTE = 'DBN',
}

/**
 * Document Status
 */
export enum DocumentStatus {
  ACTIVE = 'ACT',
  CANCELLED = 'CNL',
  PENDING = 'PND',
  FAILED = 'FLD',
}

/**
 * Supply Type
 */
export enum SupplyType {
  B2B = 'B2B',      // Business to Business
  B2C = 'B2C',      // Business to Consumer
  SEZWP = 'SEZWP',  // SEZ with payment
  SEZWOP = 'SEZWOP', // SEZ without payment
  EXPWP = 'EXPWP',  // Export with payment
  EXPWOP = 'EXPWOP', // Export without payment
  DEXP = 'DEXP',    // Deemed export
}

/**
 * GST Error Codes
 */
export enum GstErrorCode {
  SUCCESS = '0000',
  INVALID_GSTIN = '2150',
  DUPLICATE_IRN = '2283',
  INVALID_JSON = '2271',
  AUTHENTICATION_FAILED = '2001',
  RATE_LIMIT_EXCEEDED = '2999',
  INVOICE_NOT_FOUND = '2280',
  CANCELLATION_NOT_ALLOWED = '2284',
  INVALID_SIGNATURE = '2003',
}

/**
 * Address Details
 */
export interface IrpAddress {
  buildingNo?: string;
  buildingName?: string;
  location?: string;
  pincode: string;
  stateCode: string; // 2-digit state code
  street?: string;
  district?: string;
  locality?: string;
}

/**
 * Party Details (Buyer/Seller)
 */
export interface IrpPartyDetails {
  gstin: string; // 15-character GSTIN
  legalName: string;
  tradeName?: string;
  address: IrpAddress;
  contact?: {
    phone?: string;
    email?: string;
  };
}

/**
 * Item Details
 */
export interface IrpItemDetails {
  slNo: string; // Serial number
  productDescription: string;
  isService: 'Y' | 'N';
  hsnCode: string; // HSN/SAC code
  barcodes?: string[];
  quantity: number;
  freeQuantity?: number;
  unit: string; // UQC (Unit Quantity Code)
  unitPrice: number;
  totAmount: number;
  discount?: number;
  preTaxValue?: number;
  assAmount: number; // Assessable amount
  gstRate: number; // GST rate percentage
  igstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  cessRate?: number;
  cessAmount?: number;
  cessNonAdvol?: number;
  stateCess?: number;
  totItemValue: number; // Total item value
  ordLineRef?: string;
  orgCountry?: string;
  prdSlNo?: string;
  bchDetails?: {
    name?: string;
    expDate?: string;
    warrantyDate?: string;
  };
  attribDetails?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Document Details
 */
export interface IrpDocumentDetails {
  typ: GstInvoiceType;
  no: string; // Invoice/Document number
  dt: string; // Date in DD/MM/YYYY format
}

/**
 * Value Details
 */
export interface IrpValueDetails {
  assVal: number; // Assessable value
  cgstVal?: number;
  sgstVal?: number;
  igstVal?: number;
  cessVal?: number;
  stCesVal?: number;
  discount?: number;
  otherCharge?: number;
  roundOff?: number;
  totInvVal: number; // Total invoice value
}

/**
 * E-Invoice Request (IRN Generation)
 */
export interface IrpEInvoiceRequest {
  version: string; // Schema version (e.g., '1.1')
  tranDtls: {
    taxSch: 'GST'; // Tax scheme
    supTyp: SupplyType;
    regRev?: 'Y' | 'N'; // Reverse charge
    ecmGstin?: string; // E-commerce GSTIN
    igstOnIntra?: 'Y' | 'N'; // IGST on intra-state
  };
  docDtls: IrpDocumentDetails;
  sellerDtls: IrpPartyDetails;
  buyerDtls: IrpPartyDetails;
  dispDtls?: IrpPartyDetails; // Dispatch details
  shipDtls?: IrpPartyDetails; // Shipping details
  itemList: IrpItemDetails[];
  valDtls: IrpValueDetails;
  payDtls?: {
    nm?: string; // Payee name
    accDet?: string; // Account details
    mode?: string; // Payment mode
    finInsBr?: string; // Financial institution branch
    payTerm?: string; // Payment terms
    payInstr?: string; // Payment instructions
    crTrn?: string; // Credit transfer
    dirDr?: string; // Direct debit
    crDay?: number; // Credit days
    paidAmt?: number; // Paid amount
    payDue?: number; // Payment due
  };
  refDtls?: {
    invRm?: string; // Invoice remarks
    docPerdDtls?: {
      invStDt?: string; // Invoice start date
      invEndDt?: string; // Invoice end date
    };
    precDocDtls?: Array<{
      invNo?: string;
      invDt?: string;
      othRefNo?: string;
    }>;
    contrDtls?: Array<{
      recAdvRefr?: string;
      recAdvDt?: string;
      tendRefr?: string;
      contrRefr?: string;
      extRefr?: string;
      projRefr?: string;
      poRefr?: string;
      poRefDt?: string;
    }>;
  };
  addlDocDtls?: Array<{
    url?: string;
    docs?: string;
    info?: string;
  }>;
  expDtls?: {
    shipBNo?: string; // Shipping bill number
    shipBDt?: string; // Shipping bill date
    port?: string;
    refClm?: 'Y' | 'N'; // Refund claim
    forCur?: string; // Foreign currency
    cntCode?: string; // Country code
    expDuty?: number;
  };
  ewbDtls?: {
    transId?: string;
    transName?: string;
    transMode?: string;
    distance?: number;
    transDocNo?: string;
    transDocDt?: string;
    vehNo?: string;
    vehType?: 'R' | 'O'; // Regular or Over Dimensional Cargo
  };
}

/**
 * IRN Response
 */
export interface IrpIrnResponse {
  irn: string; // 64-character IRN hash
  ackNo: string; // Acknowledgement number
  ackDt: string; // Acknowledgement date
  signedInvoice: string; // Digitally signed invoice (Base64)
  signedQrCode: string; // QR code data (Base64)
  status: DocumentStatus;
  ewbNo?: string; // E-Way Bill number (if generated)
  ewbDt?: string; // E-Way Bill date
  ewbValidTill?: string; // E-Way Bill valid till
}

/**
 * IRN Details Response
 */
export interface IrpIrnDetailsResponse extends IrpIrnResponse {
  invoiceData: IrpEInvoiceRequest;
}

/**
 * Cancel IRN Request
 */
export interface IrpCancelRequest {
  irn: string;
  cnlRsn: string; // Cancellation reason code (1-4)
  cnlRem: string; // Cancellation remarks
}

/**
 * Cancel IRN Response
 */
export interface IrpCancelResponse {
  irn: string;
  cancelDate: string;
  status: DocumentStatus;
}

/**
 * Authentication Request
 */
export interface IrpAuthRequest {
  username: string;
  password: string;
  gstin: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Authentication Response
 */
export interface IrpAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  jti?: string;
}

/**
 * Error Response
 */
export interface IrpErrorResponse {
  errorCode: string;
  errorMessage: string;
  errorDetails?: Array<{
    errorCode: string;
    errorMessage: string;
    errorField?: string;
  }>;
}

/**
 * API Response Wrapper
 */
export interface IrpApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: IrpErrorResponse;
}

/**
 * Bulk Request
 */
export interface IrpBulkRequest {
  invoices: IrpEInvoiceRequest[];
}

/**
 * Bulk Response
 */
export interface IrpBulkResponse {
  results: Array<{
    invoiceNo: string;
    status: 'success' | 'error';
    data?: IrpIrnResponse;
    error?: IrpErrorResponse;
  }>;
}

/**
 * GSP Configuration
 */
export interface GspConfig {
  environment: IrpEnvironment;
  gstin: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  gspApiUrl: string;
  certificatePath?: string; // Path to digital signature certificate
  certificatePassword?: string;
  timeout?: number; // Request timeout in ms
  maxRetries?: number;
}

/**
 * IRP Rate Limits
 */
export interface IrpRateLimits {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  dailyLimit: number;
}

/**
 * Audit Log Entry
 */
export interface IrpAuditLog {
  id: string;
  gstin: string;
  invoiceNo: string;
  irn?: string;
  operation: 'generate' | 'cancel' | 'fetch';
  status: 'success' | 'error';
  request: any;
  response: any;
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
}

/**
 * IRN Hash Input
 */
export interface IrnHashInput {
  supplyType: SupplyType;
  documentType: GstInvoiceType;
  documentNumber: string;
  documentDate: string; // DD/MM/YYYY
  sellerGstin: string;
  buyerGstin: string;
  totalInvoiceValue: number;
}

/**
 * QR Code Data
 */
export interface IrpQrCodeData {
  sellerGstin: string;
  buyerGstin: string;
  documentNumber: string;
  documentDate: string;
  totalInvoiceValue: number;
  itemCount: number;
  hsnCode: string;
  irn: string;
  ackNo: string;
  ackDt: string;
}

/**
 * Certificate Details
 */
export interface DigitalCertificate {
  certificatePath: string;
  password: string;
  validFrom: Date;
  validTo: Date;
  issuer: string;
  subject: string;
  serialNumber: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}
