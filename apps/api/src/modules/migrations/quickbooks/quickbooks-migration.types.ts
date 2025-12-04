/**
 * QuickBooks Migration Types
 * Type definitions for QuickBooks to Operate data migration
 */

export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLING_BACK = 'ROLLING_BACK',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum MigrationEntityType {
  CUSTOMERS = 'CUSTOMERS',
  VENDORS = 'VENDORS',
  ITEMS = 'ITEMS',
  INVOICES = 'INVOICES',
  BILLS = 'BILLS',
  PAYMENTS = 'PAYMENTS',
  ACCOUNTS = 'ACCOUNTS',
  TAX_RATES = 'TAX_RATES',
}

export enum ConflictResolutionStrategy {
  SKIP = 'SKIP',           // Skip if exists
  OVERWRITE = 'OVERWRITE', // Overwrite existing
  MERGE = 'MERGE',         // Merge data
  CREATE_NEW = 'CREATE_NEW', // Create new with suffix
}

export interface MigrationConfig {
  entities: MigrationEntityType[];
  conflictResolution: ConflictResolutionStrategy;
  batchSize: number;
  rateLimitDelay: number; // ms between API calls
  includeInactive: boolean;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  fieldMappings?: Record<string, string>; // Custom field mappings
}

export interface EntityMigrationProgress {
  entityType: MigrationEntityType;
  status: MigrationStatus;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;
  currentBatch: number;
  totalBatches: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  lastProcessedId?: string;
}

export interface MigrationState {
  id: string;
  orgId: string;
  status: MigrationStatus;
  config: MigrationConfig;
  progress: EntityMigrationProgress[];
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;
  currentEntity?: MigrationEntityType;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  estimatedCompletionTime?: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface MigrationError {
  entityType: MigrationEntityType;
  entityId: string;
  entityData: any;
  error: string;
  errorCode?: string;
  timestamp: Date;
}

export interface RollbackPoint {
  entityType: MigrationEntityType;
  operateIds: string[];
  quickbooksIds: string[];
  mappingIds: string[];
  timestamp: Date;
}

export interface MigrationResult {
  migrationId: string;
  status: MigrationStatus;
  summary: {
    totalEntities: number;
    successfulEntities: number;
    failedEntities: number;
    skippedEntities: number;
    duration: number;
  };
  entityResults: EntityMigrationProgress[];
  errors: MigrationError[];
}

// QuickBooks API Response Types for Migration
export interface QBCustomerResponse {
  QueryResponse: {
    Customer: QBCustomer[];
    maxResults: number;
    startPosition: number;
  };
}

export interface QBCustomer {
  Id: string;
  SyncToken: string;
  DisplayName: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
  CompanyName?: string;
  PrintOnCheckName?: string;
  Active: boolean;
  PrimaryPhone?: { FreeFormNumber: string };
  AlternatePhone?: { FreeFormNumber: string };
  Mobile?: { FreeFormNumber: string };
  Fax?: { FreeFormNumber: string };
  PrimaryEmailAddr?: { Address: string };
  WebAddr?: { URI: string };
  BillAddr?: QBAddress;
  ShipAddr?: QBAddress;
  TaxIdentifier?: string;
  Balance: number;
  BalanceWithJobs: number;
  CurrencyRef?: { value: string; name?: string };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBVendor {
  Id: string;
  SyncToken: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  Active: boolean;
  PrimaryPhone?: { FreeFormNumber: string };
  Mobile?: { FreeFormNumber: string };
  PrimaryEmailAddr?: { Address: string };
  WebAddr?: { URI: string };
  BillAddr?: QBAddress;
  TaxIdentifier?: string;
  Balance: number;
  AcctNum?: string;
  Vendor1099?: boolean;
  CurrencyRef?: { value: string; name?: string };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBItem {
  Id: string;
  SyncToken: string;
  Name: string;
  Description?: string;
  Active: boolean;
  Type: 'Service' | 'Inventory' | 'NonInventory' | 'Category';
  UnitPrice?: number;
  PurchaseCost?: number;
  QtyOnHand?: number;
  InvStartDate?: string;
  IncomeAccountRef?: { value: string; name?: string };
  ExpenseAccountRef?: { value: string; name?: string };
  AssetAccountRef?: { value: string; name?: string };
  TrackQtyOnHand?: boolean;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBInvoice {
  Id: string;
  SyncToken: string;
  DocNumber: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: { value: string; name?: string };
  CustomerMemo?: { value: string };
  Line: QBInvoiceLine[];
  TxnTaxDetail?: {
    TotalTax: number;
    TaxLine: Array<{
      DetailType: string;
      TaxLineDetail?: {
        TaxRateRef: { value: string; name?: string };
        TaxPercent: number;
      };
    }>;
  };
  TotalAmt: number;
  Balance: number;
  HomeTotalAmt?: number;
  CurrencyRef?: { value: string; name?: string };
  ExchangeRate?: number;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBInvoiceLine {
  Id: string;
  LineNum: number;
  Description?: string;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef: { value: string; name?: string };
    Qty: number;
    UnitPrice: number;
    TaxCodeRef?: { value: string };
  };
}

export interface QBBill {
  Id: string;
  SyncToken: string;
  DocNumber?: string;
  TxnDate: string;
  DueDate?: string;
  VendorRef: { value: string; name?: string };
  Line: QBBillLine[];
  TotalAmt: number;
  Balance: number;
  CurrencyRef?: { value: string; name?: string };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBBillLine {
  Id: string;
  LineNum: number;
  Description?: string;
  Amount: number;
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
  AccountBasedExpenseLineDetail?: {
    AccountRef: { value: string; name?: string };
    TaxCodeRef?: { value: string };
  };
  ItemBasedExpenseLineDetail?: {
    ItemRef: { value: string; name?: string };
    Qty: number;
    UnitPrice: number;
  };
}

export interface QBPayment {
  Id: string;
  SyncToken: string;
  TxnDate: string;
  CustomerRef: { value: string; name?: string };
  TotalAmt: number;
  UnappliedAmt: number;
  ProcessPayment: boolean;
  PaymentMethodRef?: { value: string; name?: string };
  DepositToAccountRef?: { value: string; name?: string };
  Line?: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
  CurrencyRef?: { value: string; name?: string };
  ExchangeRate?: number;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBAccount {
  Id: string;
  SyncToken: string;
  Name: string;
  AcctNum?: string;
  AccountType: string;
  AccountSubType: string;
  Classification: 'Asset' | 'Equity' | 'Expense' | 'Liability' | 'Revenue';
  CurrentBalance: number;
  CurrentBalanceWithSubAccounts: number;
  Active: boolean;
  ParentRef?: { value: string; name?: string };
  CurrencyRef?: { value: string; name?: string };
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBTaxRate {
  Id: string;
  SyncToken: string;
  Name: string;
  Description?: string;
  RateValue: number;
  Active: boolean;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QBAddress {
  Line1?: string;
  Line2?: string;
  Line3?: string;
  Line4?: string;
  Line5?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}

// WebSocket Event Types
export interface MigrationProgressEvent {
  migrationId: string;
  status: MigrationStatus;
  currentEntity?: MigrationEntityType;
  progress: EntityMigrationProgress[];
  percentComplete: number;
  estimatedTimeRemaining?: number;
}

export interface MigrationErrorEvent {
  migrationId: string;
  error: MigrationError;
}

export interface MigrationCompleteEvent {
  migrationId: string;
  result: MigrationResult;
}
