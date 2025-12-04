/**
 * SevDesk API Constants
 * Configuration values for SevDesk cloud accounting integration
 *
 * API Documentation: https://api.sevdesk.de/
 */

/**
 * SevDesk API Base URL
 */
export const SEVDESK_API_BASE_URL = 'https://my.sevdesk.de/api/v1';

/**
 * OAuth2 Configuration
 */
export const SEVDESK_OAUTH = {
  AUTHORIZE_URL: 'https://my.sevdesk.de/api/v1/OAuth/authorization',
  TOKEN_URL: 'https://my.sevdesk.de/api/v1/OAuth/token',
  REVOKE_URL: 'https://my.sevdesk.de/api/v1/OAuth/revoke',
} as const;

/**
 * OAuth2 Scopes
 */
export const SEVDESK_SCOPES = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
} as const;

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
 * SevDesk Tax Types
 */
export enum SevDeskTaxType {
  DEFAULT = 'default',
  EU = 'eu',
  NOTEU = 'noteu',
  CUSTOM = 'custom',
  SS = 'ss', // Kleinunternehmerregelung (Small business regulation)
}

/**
 * SevDesk Tax Set Configuration
 */
export const TAX_SETS = {
  STANDARD_19: 0, // 19% standard rate
  REDUCED_7: 1, // 7% reduced rate
  ZERO: 2, // 0% zero rate
  EU_REVERSE_CHARGE: 3, // EU reverse charge
  THIRD_COUNTRY: 4, // Third country
} as const;

/**
 * SevDesk Contact Types
 */
export enum SevDeskContactType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  PARTNER = 'partner',
  PROSPECT = 'prospect',
}

/**
 * SevDesk Invoice Status
 */
export enum SevDeskInvoiceStatus {
  DRAFT = '100', // Draft
  OPEN = '200', // Open (sent to customer)
  PAID = '1000', // Paid
  CANCELLED = '750', // Cancelled
  PARTIAL = '50', // Partially paid
  DUNNED = '300', // Dunned (reminder sent)
}

/**
 * SevDesk Voucher Status
 */
export enum SevDeskVoucherStatus {
  DRAFT = '50',
  UNPAID = '100',
  PAID = '1000',
  PARTIAL = '750',
}

/**
 * SevDesk Voucher Types
 */
export enum SevDeskVoucherType {
  VOU = 'VOU', // Voucher (expense)
  RE = 'RE', // Invoice (Rechnung)
  AN = 'AN', // Offer (Angebot)
  AB = 'AB', // Order confirmation (Auftragsbestätigung)
  LI = 'LI', // Delivery note (Lieferschein)
  GU = 'GU', // Credit note (Gutschrift)
  MA = 'MA', // Dunning (Mahnung)
  ER = 'ER', // Incoming invoice (Eingangsrechnung)
}

/**
 * SevDesk Object Names (API entity identifiers)
 */
export const SEVDESK_OBJECTS = {
  CONTACT: 'Contact',
  INVOICE: 'Invoice',
  VOUCHER: 'Voucher',
  INVOICE_POS: 'InvoicePos',
  VOUCHER_POS: 'VoucherPos',
  ACCOUNT: 'Account',
  TRANSACTION: 'CheckAccountTransaction',
  CATEGORY: 'Category',
  COST_CENTRE: 'CostCentre',
  TAX_RULE: 'TaxRule',
  PART: 'Part', // Products/services
} as const;

/**
 * SevDesk Payment Methods
 */
export enum SevDeskPaymentMethod {
  BANK_TRANSFER = '1',
  CASH = '2',
  PAYPAL = '3',
  CREDIT_CARD = '4',
  DIRECT_DEBIT = '5',
  CHEQUE = '6',
  OTHER = '9',
}

/**
 * Rate Limiting Configuration
 * SevDesk allows 300 requests per minute
 */
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 300,
  WINDOW_MS: 60000, // 1 minute in milliseconds
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // Base delay for exponential backoff
} as const;

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 100,
  MAX_LIMIT: 1000,
  OFFSET: 0,
} as const;

/**
 * Webhook Event Types
 */
export enum WebhookEventType {
  CONTACT_CREATE = 'Contact.create',
  CONTACT_UPDATE = 'Contact.update',
  CONTACT_DELETE = 'Contact.delete',
  INVOICE_CREATE = 'Invoice.create',
  INVOICE_UPDATE = 'Invoice.update',
  INVOICE_DELETE = 'Invoice.delete',
  VOUCHER_CREATE = 'Voucher.create',
  VOUCHER_UPDATE = 'Voucher.update',
  VOUCHER_DELETE = 'Voucher.delete',
  TRANSACTION_CREATE = 'CheckAccountTransaction.create',
  TRANSACTION_UPDATE = 'CheckAccountTransaction.update',
}

/**
 * Currency codes supported by SevDesk
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'PLN'] as const;

/**
 * Default currency for German businesses
 */
export const DEFAULT_CURRENCY = 'EUR';

/**
 * SevDesk date format
 * Format: Unix timestamp or ISO 8601
 */
export const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Error codes specific to SevDesk API
 */
export enum SevDeskErrorCode {
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INTERNAL_ERROR = 'internal_error',
  RESOURCE_CONFLICT = 'conflict',
}

/**
 * Account Types for Chart of Accounts
 */
export enum SevDeskAccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

/**
 * Account Booking Sides
 */
export enum SevDeskBookingSide {
  DEBIT = 'D',
  CREDIT = 'C',
}
