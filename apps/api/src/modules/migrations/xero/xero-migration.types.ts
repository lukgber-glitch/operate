/**
 * Xero Migration Types
 * Comprehensive type definitions for full Xero data migration
 */

/**
 * Migration status enum
 */
export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Entity types supported for migration
 */
export enum XeroEntityType {
  CONTACTS = 'CONTACTS',
  ITEMS = 'ITEMS',
  INVOICES = 'INVOICES',
  CREDIT_NOTES = 'CREDIT_NOTES',
  PAYMENTS = 'PAYMENTS',
  BANK_TRANSACTIONS = 'BANK_TRANSACTIONS',
  ACCOUNTS = 'ACCOUNTS',
  TAX_RATES = 'TAX_RATES',
  TRACKING_CATEGORIES = 'TRACKING_CATEGORIES',
}

/**
 * Conflict resolution strategies
 */
export enum ConflictStrategy {
  SKIP = 'SKIP', // Skip conflicting records
  OVERWRITE = 'OVERWRITE', // Overwrite existing with Xero data
  CREATE_NEW = 'CREATE_NEW', // Create new record with different identifier
  MERGE = 'MERGE', // Attempt to merge data
}

/**
 * Entity mapping configuration
 */
export interface EntityMappingConfig {
  entityType: XeroEntityType;
  enabled: boolean;
  conflictStrategy: ConflictStrategy;
  fieldMappings?: Record<string, string>; // Custom field mappings
  filters?: Record<string, any>; // Filter which entities to migrate
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  xeroTenantId: string;
  orgId: string;
  entityMappings: EntityMappingConfig[];
  startDate?: Date; // Only migrate records after this date
  batchSize?: number; // Number of records per API call
  parallelRequests?: number; // Number of parallel API requests
}

/**
 * Migration progress for each entity type
 */
export interface EntityMigrationProgress {
  entityType: XeroEntityType;
  status: MigrationStatus;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt?: Date;
  completedAt?: Date;
  errors: MigrationError[];
}

/**
 * Migration error details
 */
export interface MigrationError {
  entityType: XeroEntityType;
  xeroId: string;
  errorMessage: string;
  errorCode?: string;
  xeroData?: any; // Original Xero data for debugging
  timestamp: Date;
}

/**
 * Overall migration progress
 */
export interface MigrationProgress {
  migrationId: string;
  status: MigrationStatus;
  config: MigrationConfig;
  entityProgress: EntityMigrationProgress[];
  overallProgress: number; // 0-100%
  startedAt: Date;
  estimatedCompletionAt?: Date;
  completedAt?: Date;
  totalEntitiesProcessed: number;
  totalEntitiesSucceeded: number;
  totalEntitiesFailed: number;
  totalEntitiesSkipped: number;
  errors: MigrationError[];
  warnings: string[];
  metadata: Record<string, any>;
}

/**
 * Entity mapping result
 */
export interface MappedEntity {
  xeroId: string;
  operateId?: string;
  entityType: XeroEntityType;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string;
  xeroData: any;
  operateData?: any;
  conflictDetected?: boolean;
  conflictResolution?: ConflictStrategy;
}

/**
 * Xero Contact (Customer/Supplier)
 */
export interface XeroContact {
  ContactID: string;
  ContactNumber?: string;
  AccountNumber?: string;
  ContactStatus: 'ACTIVE' | 'ARCHIVED';
  Name: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  BankAccountDetails?: string;
  TaxNumber?: string;
  Addresses?: XeroAddress[];
  Phones?: XeroPhone[];
  UpdatedDateUTC: string;
  IsSupplier: boolean;
  IsCustomer: boolean;
  DefaultCurrency?: string;
  ContactGroups?: any[];
  SalesDefaultAccountCode?: string;
  PurchasesDefaultAccountCode?: string;
}

/**
 * Xero Address
 */
export interface XeroAddress {
  AddressType: 'POBOX' | 'STREET' | 'DELIVERY';
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  AddressLine4?: string;
  City?: string;
  Region?: string;
  PostalCode?: string;
  Country?: string;
  AttentionTo?: string;
}

/**
 * Xero Phone
 */
export interface XeroPhone {
  PhoneType: 'DEFAULT' | 'DDI' | 'MOBILE' | 'FAX';
  PhoneNumber: string;
  PhoneAreaCode?: string;
  PhoneCountryCode?: string;
}

/**
 * Xero Item (Product/Service)
 */
export interface XeroItem {
  ItemID: string;
  Code: string;
  Name: string;
  Description?: string;
  PurchaseDescription?: string;
  IsSold: boolean;
  IsPurchased: boolean;
  SalesDetails?: {
    UnitPrice?: number;
    AccountCode?: string;
    TaxType?: string;
  };
  PurchaseDetails?: {
    UnitPrice?: number;
    AccountCode?: string;
    TaxType?: string;
  };
  IsTrackedAsInventory: boolean;
  InventoryAssetAccountCode?: string;
  TotalCostPool?: number;
  QuantityOnHand?: number;
  UpdatedDateUTC: string;
}

/**
 * Xero Invoice
 */
export interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber?: string;
  Type: 'ACCPAY' | 'ACCREC';
  Contact: XeroContact;
  Date: string;
  DueDate?: string;
  Status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax';
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountDue: number;
  AmountPaid: number;
  AmountCredited: number;
  CurrencyCode: string;
  CurrencyRate?: number;
  Reference?: string;
  BrandingThemeID?: string;
  Url?: string;
  SentToContact?: boolean;
  UpdatedDateUTC: string;
}

/**
 * Xero Line Item
 */
export interface XeroLineItem {
  LineItemID?: string;
  Description: string;
  Quantity: number;
  UnitAmount: number;
  ItemCode?: string;
  AccountCode: string;
  TaxType?: string;
  TaxAmount: number;
  LineAmount: number;
  DiscountRate?: number;
  Tracking?: XeroTracking[];
}

/**
 * Xero Tracking Category
 */
export interface XeroTracking {
  TrackingCategoryID: string;
  TrackingOptionID: string;
  Name: string;
  Option: string;
}

/**
 * Xero Credit Note
 */
export interface XeroCreditNote {
  CreditNoteID: string;
  CreditNoteNumber?: string;
  Type: 'ACCPAYCREDIT' | 'ACCRECCREDIT';
  Contact: XeroContact;
  Date: string;
  Status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax';
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  CurrencyCode: string;
  UpdatedDateUTC: string;
}

/**
 * Xero Payment
 */
export interface XeroPayment {
  PaymentID: string;
  Invoice?: { InvoiceID: string; InvoiceNumber: string };
  CreditNote?: { CreditNoteID: string; CreditNoteNumber: string };
  Account: { AccountID: string; Code: string };
  Date: string;
  Amount: number;
  CurrencyRate?: number;
  Reference?: string;
  IsReconciled: boolean;
  Status: 'AUTHORISED' | 'DELETED';
  PaymentType: 'ACCRECPAYMENT' | 'ACCPAYPAYMENT' | 'ARCREDITPAYMENT' | 'APCREDITPAYMENT';
  UpdatedDateUTC: string;
}

/**
 * Xero Bank Transaction
 */
export interface XeroBankTransaction {
  BankTransactionID: string;
  Type: 'RECEIVE' | 'SPEND';
  Contact?: XeroContact;
  BankAccount: { AccountID: string; Code: string };
  Date: string;
  Status: 'AUTHORISED' | 'DELETED';
  LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax';
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  CurrencyCode: string;
  Reference?: string;
  IsReconciled: boolean;
  UpdatedDateUTC: string;
}

/**
 * Xero Account (Chart of Accounts)
 */
export interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type:
    | 'BANK'
    | 'CURRENT'
    | 'CURRLIAB'
    | 'DEPRECIATN'
    | 'DIRECTCOSTS'
    | 'EQUITY'
    | 'EXPENSE'
    | 'FIXED'
    | 'INVENTORY'
    | 'LIABILITY'
    | 'NONCURRENT'
    | 'OTHERINCOME'
    | 'OVERHEADS'
    | 'PREPAYMENT'
    | 'REVENUE'
    | 'SALES'
    | 'TERMLIAB'
    | 'PAYGLIABILITY';
  TaxType?: string;
  Description?: string;
  Class?: 'ASSET' | 'EQUITY' | 'EXPENSE' | 'LIABILITY' | 'REVENUE';
  SystemAccount?: string;
  EnablePaymentsToAccount?: boolean;
  ShowInExpenseClaims?: boolean;
  Status: 'ACTIVE' | 'ARCHIVED';
  BankAccountNumber?: string;
  CurrencyCode?: string;
  ReportingCode?: string;
  ReportingCodeName?: string;
  UpdatedDateUTC: string;
}

/**
 * Xero Tax Rate
 */
export interface XeroTaxRate {
  Name: string;
  TaxType: string;
  TaxComponents: Array<{
    Name: string;
    Rate: number;
    IsCompound: boolean;
  }>;
  Status: 'ACTIVE' | 'DELETED';
  ReportTaxType?: string;
  CanApplyToAssets?: boolean;
  CanApplyToEquity?: boolean;
  CanApplyToExpenses?: boolean;
  CanApplyToLiabilities?: boolean;
  CanApplyToRevenue?: boolean;
  DisplayTaxRate: number;
  EffectiveRate: number;
}

/**
 * Xero Tracking Category
 */
export interface XeroTrackingCategory {
  TrackingCategoryID: string;
  TrackingCategoryName: string;
  Status: 'ACTIVE' | 'ARCHIVED';
  Options?: Array<{
    TrackingOptionID: string;
    Name: string;
    Status: 'ACTIVE' | 'ARCHIVED';
  }>;
}

/**
 * Xero Organization info
 */
export interface XeroOrganization {
  OrganisationID: string;
  APIKey?: string;
  Name: string;
  LegalName?: string;
  PaysTax: boolean;
  Version: 'AU' | 'NZ' | 'GLOBAL' | 'UK' | 'US' | 'AUONRAMP';
  OrganisationType?: string;
  BaseCurrency: string;
  CountryCode: string;
  IsDemoCompany: boolean;
  OrganisationStatus?: string;
  RegistrationNumber?: string;
  TaxNumber?: string;
  FinancialYearEndDay?: number;
  FinancialYearEndMonth?: number;
  SalesTaxBasis?: 'ACCRUALS' | 'CASH' | 'FLATRATECASH' | 'INVOICE' | 'NONE' | 'PAYMENTS';
  SalesTaxPeriod?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONEMONTHS' | 'TWOMONTHS' | 'SIXMONTHS';
  DefaultSalesTax?: string;
  DefaultPurchasesTax?: string;
  PeriodLockDate?: string;
  EndOfYearLockDate?: string;
  CreatedDateUTC: string;
  Timezone?: string;
  OrganisationEntityType?: string;
  ShortCode?: string;
  LineOfBusiness?: string;
  Addresses?: XeroAddress[];
  Phones?: XeroPhone[];
  ExternalLinks?: any[];
  PaymentTerms?: any;
}

/**
 * WebSocket progress update message
 */
export interface MigrationProgressUpdate {
  migrationId: string;
  event: 'started' | 'progress' | 'entity_complete' | 'completed' | 'paused' | 'failed' | 'error';
  timestamp: Date;
  data: {
    status?: MigrationStatus;
    overallProgress?: number;
    currentEntity?: XeroEntityType;
    entityProgress?: EntityMigrationProgress;
    error?: MigrationError;
    message?: string;
  };
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  requestsThisMinute: number;
  minuteStartTime: number;
  requestQueue: Array<() => Promise<any>>;
}

/**
 * Migration resume context
 */
export interface MigrationResumeContext {
  migrationId: string;
  lastCompletedEntity?: XeroEntityType;
  lastProcessedId?: string;
  entityStates: Map<XeroEntityType, {
    completed: boolean;
    lastProcessedId?: string;
    processedCount: number;
  }>;
}
