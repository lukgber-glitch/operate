/**
 * LexOffice API Constants
 * Configuration values for LexOffice integration
 */

/**
 * LexOffice API Base URL
 */
export const LEXOFFICE_API_BASE_URL = 'https://api.lexoffice.io/v1';

/**
 * German VAT Rates
 * Standard rates according to German tax law (UStG)
 */
export const VAT_RATES = {
  STANDARD: 19, // Standard rate (Regelsteuersatz)
  REDUCED: 7, // Reduced rate (ermäßigter Steuersatz)
  ZERO: 0, // Zero rate (steuerfreie Umsätze)
} as const;

/**
 * LexOffice VAT Type Mappings
 * Maps to LexOffice's tax type identifiers
 */
export const LEXOFFICE_VAT_TYPES = {
  GROSS: 'gross', // Brutto
  NET: 'net', // Netto
  TAX_FREE: 'taxfree', // Steuerfrei
  INTRAUNION_SUPPLY: 'intraCommunitySupply', // Innergemeinschaftliche Lieferung
  CONSTRUCTION_SERVICE_13B: 'constructionService13b', // Bauleistung §13b UStG
  EXTERNAL_SERVICE_13B: 'externalService13b', // Leistung im Ausland §13b UStG
  THIRD_PARTY_COUNTRY_SERVICE: 'thirdPartyCountryService', // Leistung Drittland
  THIRD_PARTY_COUNTRY_DELIVERY: 'thirdPartyCountryDelivery', // Lieferung Drittland
} as const;

/**
 * LexOffice Document Types
 */
export enum LexOfficeDocumentType {
  INVOICE = 'invoice',
  SALES_INVOICE = 'salesinvoice',
  CREDIT_NOTE = 'creditnote',
  ORDER_CONFIRMATION = 'orderconfirmation',
  QUOTATION = 'quotation',
  DELIVERY_NOTE = 'deliverynote',
  VOUCHER = 'voucher',
}

/**
 * LexOffice Invoice Status
 */
export enum LexOfficeInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  PAIDOFF = 'paidoff',
  VOIDED = 'voided',
  TRANSFERRED = 'transferred',
  SEPADEBIT = 'sepadebit',
}

/**
 * LexOffice Voucher Status
 */
export enum LexOfficeVoucherStatus {
  OPEN = 'open',
  PAID = 'paid',
  PAIDOFF = 'paidoff',
  VOIDED = 'voided',
  TRANSFERRED = 'transferred',
  SEPADEBIT = 'sepadebit',
}

/**
 * LexOffice Contact Types
 */
export enum LexOfficeContactType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

/**
 * LexOffice Contact Roles
 */
export interface ContactRoles {
  customer?: {
    number?: number;
  };
  vendor?: {
    number?: number;
  };
}

/**
 * LexOffice Payment Terms Types
 */
export enum PaymentTermsType {
  NET = 'net',
  CASH_DISCOUNT = 'cashDiscount',
}

/**
 * Rate Limiting Configuration
 * LexOffice allows 60 requests per minute per API key
 */
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 60,
  WINDOW_MS: 60000, // 1 minute in milliseconds
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // Base delay for exponential backoff
} as const;

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 250,
} as const;

/**
 * LexOffice API Version Header
 */
export const API_VERSION_HEADER = 'application/vnd.lexoffice.v1+json';

/**
 * Webhook Event Types
 * Events that LexOffice can send via webhooks
 */
export enum WebhookEventType {
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
  CONTACT_DELETED = 'contact.deleted',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_UPDATED = 'invoice.updated',
  INVOICE_DELETED = 'invoice.deleted',
  VOUCHER_CREATED = 'voucher.created',
  VOUCHER_UPDATED = 'voucher.updated',
  VOUCHER_DELETED = 'voucher.deleted',
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_UPDATED = 'payment.updated',
}

/**
 * Currency codes supported by LexOffice
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;

/**
 * Default currency for German businesses
 */
export const DEFAULT_CURRENCY = 'EUR';

/**
 * LexOffice date format
 * Format: YYYY-MM-DD
 */
export const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Error codes specific to LexOffice API
 */
export enum LexOfficeErrorCode {
  INVALID_API_KEY = 'invalid_api_key',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  VALIDATION_ERROR = 'validation_error',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  RESOURCE_CONFLICT = 'resource_conflict',
  INTERNAL_ERROR = 'internal_error',
}
