/**
 * UAE E-invoicing Type Definitions
 * Federal Tax Authority (FTA) integration types
 */

import { UAEInvoiceType, UAEInvoiceStatus, UAEVATRateCode, FTAEnvironment } from '../constants/uae.constants';

/**
 * UAE Configuration
 */
export interface UAEConfig {
  environment: FTAEnvironment;
  clientId: string;
  clientSecret: string;
  trn: string; // Tax Registration Number
  companyName: string;
  enableRetry?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * FTA OAuth2 Token Response
 */
export interface FTATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * FTA API Response
 */
export interface FTAResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: FTAError[];
  warnings?: FTAWarning[];
  submissionId?: string;
  timestamp?: string;
}

/**
 * FTA Error
 */
export interface FTAError {
  code: string;
  message: string;
  field?: string;
  severity: 'ERROR' | 'FATAL';
}

/**
 * FTA Warning
 */
export interface FTAWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * UAE Invoice Data
 */
export interface UAEInvoiceData {
  // Invoice Identification
  invoiceNumber: string;
  invoiceType: UAEInvoiceType;
  issueDate: Date;
  dueDate?: Date;

  // Document References
  orderReference?: string;
  contractReference?: string;
  originalInvoiceReference?: string; // For credit/debit notes

  // Supplier (Seller) Information
  supplier: UAEPartyInfo;

  // Customer (Buyer) Information
  customer: UAEPartyInfo;

  // Line Items
  lineItems: UAEInvoiceLineItem[];

  // Totals
  totals: UAEInvoiceTotals;

  // Payment Information
  payment?: UAEPaymentInfo;

  // Delivery Information
  delivery?: UAEDeliveryInfo;

  // Additional Information
  notes?: string[];
  attachments?: UAEAttachment[];

  // Tax Information
  taxCurrency?: string; // If different from document currency
  accountingCost?: string;

  // Status
  status?: UAEInvoiceStatus;
  submissionId?: string;
}

/**
 * UAE Party Information (Supplier/Customer)
 */
export interface UAEPartyInfo {
  // Tax Registration
  trn?: string; // Tax Registration Number

  // Legal Name and Trade Name
  legalName: string;
  tradeName?: string;

  // Address
  address: UAEAddress;

  // Contact Information
  contactName?: string;
  phone?: string;
  email?: string;

  // Business Information
  vatRegistered: boolean;
  emiratesId?: string;
  businessActivityCode?: string;

  // Additional IDs
  commercialRegistration?: string;
  establishmentId?: string;
}

/**
 * UAE Address
 */
export interface UAEAddress {
  streetName: string;
  additionalStreet?: string;
  buildingNumber?: string;
  plotIdentification?: string;
  cityName: string;
  postalZone?: string;
  emirate: string; // Abu Dhabi, Dubai, etc.
  country: string; // ISO 3166-1 alpha-2 code (AE for UAE)
}

/**
 * UAE Invoice Line Item
 */
export interface UAEInvoiceLineItem {
  id: string; // Line number
  description: string;
  quantity: number;
  unitCode: string; // UN/ECE Recommendation 20 (e.g., 'C62' for unit/piece)
  unitPrice: number;

  // Discounts/Charges at line level
  lineDiscounts?: UAEAllowanceCharge[];
  lineCharges?: UAEAllowanceCharge[];

  // Line Total (before tax)
  lineExtensionAmount: number;

  // Tax Information
  taxCategory: UAEVATRateCode;
  taxRate: number;
  taxAmount: number;

  // Item Classification
  itemClassificationCode?: string;
  originCountry?: string;

  // Additional Item Information
  sellersItemId?: string;
  buyersItemId?: string;
  manufacturersItemId?: string;
}

/**
 * UAE Allowance/Charge (Discount/Fee)
 */
export interface UAEAllowanceCharge {
  type: 'ALLOWANCE' | 'CHARGE'; // Discount or additional charge
  reason?: string;
  reasonCode?: string;
  amount: number;
  baseAmount?: number;
  percentage?: number;
  taxCategory?: UAEVATRateCode;
  taxRate?: number;
  taxAmount?: number;
}

/**
 * UAE Invoice Totals
 */
export interface UAEInvoiceTotals {
  // Currency
  currency: string; // ISO 4217 (e.g., 'AED')

  // Line totals
  lineExtensionAmount: number; // Sum of line amounts

  // Document level allowances/charges
  allowances?: UAEAllowanceCharge[];
  charges?: UAEAllowanceCharge[];

  // Totals before tax
  allowanceTotalAmount?: number;
  chargeTotalAmount?: number;
  taxExclusiveAmount: number; // Amount before VAT

  // Tax breakdown
  taxBreakdown: UAETaxBreakdown[];
  taxTotalAmount: number; // Total VAT

  // Total with tax
  taxInclusiveAmount: number; // Amount including VAT

  // Prepaid and rounding
  prepaidAmount?: number;
  roundingAmount?: number;

  // Payable amount
  payableAmount: number; // Final amount to pay
}

/**
 * UAE Tax Breakdown by Category
 */
export interface UAETaxBreakdown {
  taxCategory: UAEVATRateCode;
  taxRate: number;
  taxableAmount: number; // Amount subject to this tax rate
  taxAmount: number; // Tax for this category

  // Additional tax info
  exemptionReason?: string;
  exemptionReasonCode?: string;
}

/**
 * UAE Payment Information
 */
export interface UAEPaymentInfo {
  paymentMeans?: string; // Payment method code
  paymentMeansCode?: string; // UN/CEFACT code list 4461
  paymentId?: string;

  // Bank transfer details
  payeeFinancialAccount?: {
    accountId: string; // IBAN
    accountName?: string;
    financialInstitution?: {
      bic?: string; // SWIFT/BIC
      name?: string;
    };
  };

  // Payment terms
  paymentTerms?: string;
  paymentDueDate?: Date;

  // Installments
  installments?: UAEPaymentInstallment[];
}

/**
 * UAE Payment Installment
 */
export interface UAEPaymentInstallment {
  id: string;
  amount: number;
  dueDate: Date;
  paid?: boolean;
}

/**
 * UAE Delivery Information
 */
export interface UAEDeliveryInfo {
  actualDeliveryDate?: Date;
  deliveryLocation?: UAEAddress;
  deliveryParty?: {
    name: string;
    contact?: string;
  };
}

/**
 * UAE Attachment
 */
export interface UAEAttachment {
  id: string;
  description?: string;
  mimeType: string;
  filename: string;
  data: string; // Base64 encoded
}

/**
 * TRN Validation Result
 */
export interface UAETRNValidation {
  trn: string;
  valid: boolean;
  registered?: boolean;
  companyName?: string;
  registrationDate?: Date;
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  errors?: string[];
}

/**
 * Invoice Submission Result
 */
export interface UAEInvoiceSubmissionResult {
  success: boolean;
  submissionId?: string;
  invoiceNumber: string;
  status: UAEInvoiceStatus;
  validationErrors?: FTAError[];
  validationWarnings?: FTAWarning[];
  submittedAt?: Date;
  clearanceStatus?: 'CLEARED' | 'NOT_CLEARED' | 'PENDING';
}

/**
 * Invoice Status Query Result
 */
export interface UAEInvoiceStatusResult {
  invoiceNumber: string;
  submissionId: string;
  status: UAEInvoiceStatus;
  submittedAt: Date;
  processedAt?: Date;
  clearanceStatus: 'CLEARED' | 'NOT_CLEARED' | 'PENDING';
  errors?: FTAError[];
  warnings?: FTAWarning[];
}

/**
 * VAT Calculation Result
 */
export interface UAEVATCalculation {
  taxExclusiveAmount: number;
  taxBreakdown: UAETaxBreakdown[];
  taxTotalAmount: number;
  taxInclusiveAmount: number;
  currency: string;
}

/**
 * VAT Return Data
 */
export interface UAEVATReturn {
  period: {
    startDate: Date;
    endDate: Date;
    filingPeriod: 'MONTHLY' | 'QUARTERLY';
  };

  // Box 1: VAT on sales and all other outputs
  outputVAT: number;

  // Box 2: VAT on expenses and all other inputs
  inputVAT: number;

  // Box 3: Net VAT due (Box 1 - Box 2)
  netVAT: number;

  // Additional information
  totalSales: number;
  totalPurchases: number;
  zeroRatedSales: number;
  exemptSales: number;

  // Adjustments
  adjustments?: number;

  // Payment/Refund
  amountDue?: number;
  refundDue?: number;

  // Status
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'PAID';
  submittedAt?: Date;
  dueDate: Date;
}

/**
 * UBL Invoice Document
 */
export interface UBLInvoiceDocument {
  xml: string;
  hash?: string;
  signature?: string;
}

/**
 * FTA Submission Options
 */
export interface FTASubmissionOptions {
  validateOnly?: boolean; // Only validate without submitting
  clearanceRequired?: boolean; // Request clearance from FTA
  notifyCustomer?: boolean; // Send notification to customer
  language?: 'en' | 'ar'; // Document language
}

/**
 * Rate Limit Status
 */
export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number; // Seconds to wait
}

/**
 * Batch Submission Result
 */
export interface BatchSubmissionResult {
  totalInvoices: number;
  successful: number;
  failed: number;
  results: UAEInvoiceSubmissionResult[];
  errors?: string[];
}

/**
 * Emirates ID Validation Result
 */
export interface EmiratesIDValidation {
  emiratesId: string;
  valid: boolean;
  errors?: string[];
}

/**
 * Currency Exchange Rate
 */
export interface CurrencyExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source?: string;
}
