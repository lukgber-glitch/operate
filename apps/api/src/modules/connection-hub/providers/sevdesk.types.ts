/**
 * SevDesk API Types
 * TypeScript interfaces for SevDesk cloud accounting integration
 *
 * API Documentation: https://api.sevdesk.de/
 */

import {
  SevDeskContactType,
  SevDeskInvoiceStatus,
  SevDeskVoucherStatus,
  SevDeskVoucherType,
  SevDeskTaxType,
  SevDeskPaymentMethod,
  WebhookEventType,
  SevDeskAccountType,
  SevDeskBookingSide,
} from './sevdesk.constants';

/**
 * SevDesk OAuth2 Credentials
 */
export interface SevDeskCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
}

/**
 * OAuth2 Token Response
 */
export interface SevDeskTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Common SevDesk API Response Wrapper
 */
export interface SevDeskApiResponse<T> {
  objects?: T[];
  total?: number;
}

/**
 * SevDesk Model Reference
 * Used for linking related entities
 */
export interface SevDeskModelRef {
  id: string | number;
  objectName: string;
}

/**
 * SevDesk Address
 */
export interface SevDeskAddress {
  id?: number;
  objectName?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: SevDeskModelRef;
  category?: SevDeskModelRef;
}

/**
 * SevDesk Communication Way (Email, Phone, etc.)
 */
export interface SevDeskCommunicationWay {
  id?: number;
  objectName?: string;
  contact?: SevDeskModelRef;
  type: 'EMAIL' | 'PHONE' | 'MOBILE' | 'FAX' | 'WEB';
  value: string;
  key: SevDeskModelRef;
  main?: boolean;
}

/**
 * SevDesk Contact (Customer/Supplier)
 */
export interface SevDeskContact {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  name?: string;
  name2?: string;
  customerNumber?: string;
  supplierNumber?: string;
  description?: string;
  academicTitle?: string;
  gender?: 'm' | 'f' | 'd';
  familyname?: string;
  firstname?: string;
  category?: SevDeskModelRef;
  addresses?: SevDeskAddress[];
  communicationWays?: SevDeskCommunicationWay[];
  taxNumber?: string;
  vatNumber?: string;
  taxType?: SevDeskTaxType;
  taxSet?: SevDeskModelRef;
  exempt?: boolean;
  defaultCashbackTime?: number;
  defaultCashbackPercent?: number;
  defaultTimeToPay?: number;
  bankAccount?: string;
  bankNumber?: string;
}

/**
 * Contact List Parameters
 */
export interface ContactListParams {
  depth?: string;
  limit?: number;
  offset?: number;
  customerNumber?: string;
  name?: string;
  embed?: string[];
}

/**
 * SevDesk Invoice Line Item (Position)
 */
export interface SevDeskInvoicePos {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  invoice?: SevDeskModelRef;
  part?: SevDeskModelRef;
  quantity: number;
  price?: number;
  priceNet?: number;
  priceTax?: number;
  priceGross?: number;
  name?: string;
  unity?: SevDeskModelRef;
  positionNumber?: number;
  text?: string;
  discount?: number;
  optional?: boolean;
  taxRate: number;
  sumNet?: number;
  sumGross?: number;
  sumDiscount?: number;
  sumTax?: number;
  sumNetAccounting?: number;
  sumTaxAccounting?: number;
  sumGrossAccounting?: number;
}

/**
 * SevDesk Invoice
 */
export interface SevDeskInvoice {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  invoiceNumber?: string;
  contact?: SevDeskModelRef;
  contactPerson?: SevDeskModelRef;
  invoiceDate?: string;
  header?: string;
  headText?: string;
  footText?: string;
  timeToPay?: number;
  discount?: number;
  discountTime?: number;
  address?: string;
  addressCountry?: SevDeskModelRef;
  status?: SevDeskInvoiceStatus;
  smallSettlement?: boolean;
  taxType?: SevDeskTaxType;
  taxSet?: SevDeskModelRef;
  taxRate?: number;
  taxText?: string;
  taxRule?: SevDeskModelRef;
  paymentMethod?: SevDeskModelRef;
  costCentre?: SevDeskModelRef;
  sendDate?: string;
  origin?: SevDeskModelRef;
  invoiceType?: 'RE' | 'GU' | 'MA';
  currency?: string;
  sumNet?: number;
  sumTax?: number;
  sumGross?: number;
  sumDiscounts?: number;
  sumNetForeignCurrency?: number;
  sumTaxForeignCurrency?: number;
  sumGrossForeignCurrency?: number;
  sumDiscountsForeignCurrency?: number;
  customerInternalNote?: string;
  showNet?: boolean;
  enshrined?: boolean;
  sendType?: 'VPR' | 'VPDF' | 'VM' | 'VP';
  deliveryDate?: string;
  deliveryDateUntil?: string;
  datevConnectOnline?: any;
  sendPaymentReceivedNotificationDate?: string;
  invoicePositions?: SevDeskInvoicePos[];
}

/**
 * Create Invoice Request
 */
export interface CreateSevDeskInvoiceRequest {
  invoice: Omit<SevDeskInvoice, 'id' | 'objectName' | 'create' | 'update'>;
  invoicePosSave?: SevDeskInvoicePos[];
  invoicePosDelete?: { id: number }[];
  takeDefaultAddress?: boolean;
}

/**
 * Invoice List Parameters
 */
export interface InvoiceListParams {
  status?: SevDeskInvoiceStatus;
  contactId?: number;
  contactObjectName?: string;
  invoiceNumber?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  embed?: string[];
}

/**
 * SevDesk Voucher Position
 */
export interface SevDeskVoucherPos {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  voucher?: SevDeskModelRef;
  accountingType?: SevDeskModelRef;
  estimatedAccountingType?: SevDeskModelRef;
  taxRate: number;
  net?: boolean;
  isAsset?: boolean;
  sumNet?: number;
  sumTax?: number;
  sumGross?: number;
  sumNetAccounting?: number;
  sumTaxAccounting?: number;
  sumGrossAccounting?: number;
  comment?: string;
}

/**
 * SevDesk Voucher (Expense/Receipt)
 */
export interface SevDeskVoucher {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  voucherDate?: string;
  supplier?: SevDeskModelRef;
  supplierName?: string;
  description?: string;
  document?: SevDeskModelRef;
  resultDisdar?: number;
  documentPreview?: SevDeskModelRef;
  payDate?: string;
  status?: SevDeskVoucherStatus;
  sumNet?: number;
  sumTax?: number;
  sumGross?: number;
  sumNetAccounting?: number;
  sumTaxAccounting?: number;
  sumGrossAccounting?: number;
  sumDiscounts?: number;
  sumDiscountsForeignCurrency?: number;
  paidAmount?: number;
  taxType?: SevDeskTaxType;
  creditDebit?: 'C' | 'D';
  voucherType?: SevDeskVoucherType;
  currency?: string;
  propertyForeignCurrencyDeadline?: string;
  propertyExchangeRate?: number;
  taxSet?: SevDeskModelRef;
  paymentDeadline?: string;
  deliveryDate?: string;
  deliveryDateUntil?: string;
  costCentre?: SevDeskModelRef;
  voucherPositions?: SevDeskVoucherPos[];
}

/**
 * Create Voucher Request
 */
export interface CreateSevDeskVoucherRequest {
  voucher: Omit<SevDeskVoucher, 'id' | 'objectName' | 'create' | 'update'>;
  voucherPosSave?: SevDeskVoucherPos[];
  voucherPosDelete?: { id: number }[];
  filename?: string;
}

/**
 * Voucher List Parameters
 */
export interface VoucherListParams {
  status?: SevDeskVoucherStatus;
  creditDebit?: 'C' | 'D';
  voucherType?: SevDeskVoucherType;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  embed?: string[];
}

/**
 * SevDesk Bank Transaction
 */
export interface SevDeskTransaction {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  checkAccount?: SevDeskModelRef;
  valueDate?: string;
  entryDate?: string;
  amount?: number;
  payeePayerName?: string;
  payeePayerAcctNo?: string;
  payeePayerBankCode?: string;
  payeePayerIban?: string;
  payeePayerBic?: string;
  checkAccountTransaction?: SevDeskModelRef;
  status?: number;
  score?: number;
  paymtPurpose?: string;
  sourceTransaction?: SevDeskModelRef;
  targetTransaction?: SevDeskModelRef;
  gvCode?: string;
  entryType?: string;
  enshrined?: boolean;
  compareHash?: string;
  paymentAccountNumber?: string;
  importDate?: string;
}

/**
 * Transaction List Parameters
 */
export interface TransactionListParams {
  checkAccountId?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
  payeePayerName?: string;
  limit?: number;
  offset?: number;
}

/**
 * SevDesk Account (Chart of Accounts)
 */
export interface SevDeskAccount {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  name?: string;
  type?: SevDeskAccountType;
  systemAccount?: boolean;
  accountNumber?: number;
  saldoType?: SevDeskBookingSide;
  description?: string;
  status?: number;
}

/**
 * Account List Parameters
 */
export interface AccountListParams {
  type?: SevDeskAccountType;
  accountNumber?: number;
  limit?: number;
  offset?: number;
}

/**
 * SevDesk Category (Expense/Income categories)
 */
export interface SevDeskCategory {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  name?: string;
  priority?: number;
  translationCode?: string;
  color?: string;
}

/**
 * File Upload Response
 */
export interface SevDeskFileUploadResponse {
  objects: Array<{
    id: number;
    objectName: string;
    filename: string;
    mimeType: string;
  }>;
}

/**
 * Webhook Event Payload
 */
export interface SevDeskWebhookEvent {
  eventType: WebhookEventType;
  eventDate: string;
  objectId: number;
  objectName: string;
  data?: any;
}

/**
 * Webhook Registration
 */
export interface SevDeskWebhookRegistration {
  id?: number;
  objectName?: string;
  targetUrl: string;
  events: WebhookEventType[];
  active?: boolean;
}

/**
 * SevDesk Error Response
 */
export interface SevDeskErrorResponse {
  error?: {
    message: string;
    code?: string | number;
    errors?: Array<{
      field?: string;
      message: string;
    }>;
  };
  message?: string;
}

/**
 * Rate Limiting Information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  embed?: string[];
}

/**
 * Export Response (for CSV/PDF exports)
 */
export interface SevDeskExportResponse {
  content: Buffer;
  filename: string;
  contentType: string;
}

/**
 * SevDesk Part (Product/Service)
 */
export interface SevDeskPart {
  id?: number;
  objectName?: string;
  create?: string;
  update?: string;
  name: string;
  partNumber?: string;
  text?: string;
  category?: SevDeskModelRef;
  stock?: number;
  stockEnabled?: boolean;
  unity?: SevDeskModelRef;
  price?: number;
  priceNet?: number;
  priceGross?: number;
  pricePurchase?: number;
  taxRate?: number;
  status?: number;
  internalComment?: string;
}

/**
 * Tax Rule
 */
export interface SevDeskTaxRule {
  id?: number;
  objectName?: string;
  name?: string;
  taxRate?: number;
  taxType?: SevDeskTaxType;
}

/**
 * Unity (Unit of measurement)
 */
export interface SevDeskUnity {
  id?: number;
  objectName?: string;
  name?: string;
  translationCode?: string;
}
