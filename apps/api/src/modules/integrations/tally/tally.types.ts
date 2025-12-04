/**
 * Tally ERP Integration Type Definitions
 *
 * Tally uses XML-based communication via HTTP POST to Tally Gateway Server (default port 9000).
 * Supports Tally Prime and Tally ERP 9.
 *
 * Reference: Tally Developer Documentation
 */

/**
 * Tally connection configuration
 */
export interface TallyConfig {
  host: string; // Tally Gateway Server host (default: localhost)
  port: number; // Tally Gateway Server port (default: 9000)
  timeout?: number; // Request timeout in ms (default: 30000)
  companyName?: string; // Default company to connect to
}

/**
 * Tally connection status enum
 */
export enum TallyConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

/**
 * Tally voucher types
 * Reference: Tally TDL voucher type enumeration
 */
export enum TallyVoucherType {
  SALES = 'Sales',
  PURCHASE = 'Purchase',
  PAYMENT = 'Payment',
  RECEIPT = 'Receipt',
  CONTRA = 'Contra',
  JOURNAL = 'Journal',
  DEBIT_NOTE = 'Debit Note',
  CREDIT_NOTE = 'Credit Note',
  PHYSICAL_STOCK = 'Physical Stock',
  STOCK_JOURNAL = 'Stock Journal',
  DELIVERY_NOTE = 'Delivery Note',
  RECEIPT_NOTE = 'Receipt Note',
  REJECTION_OUT = 'Rejection Out',
  REJECTION_IN = 'Rejection In',
}

/**
 * Tally ledger types
 */
export enum TallyLedgerType {
  SUNDRY_DEBTORS = 'Sundry Debtors',
  SUNDRY_CREDITORS = 'Sundry Creditors',
  BANK_ACCOUNTS = 'Bank Accounts',
  CASH = 'Cash-in-Hand',
  BANK_OD = 'Bank OD A/c',
  SECURED_LOANS = 'Secured Loans',
  UNSECURED_LOANS = 'Unsecured Loans',
  DUTIES_AND_TAXES = 'Duties & Taxes',
  PROVISIONS = 'Provisions',
  RESERVES_AND_SURPLUS = 'Reserves & Surplus',
  CAPITAL_ACCOUNT = 'Capital Account',
  CURRENT_ASSETS = 'Current Assets',
  FIXED_ASSETS = 'Fixed Assets',
  INVESTMENTS = 'Investments',
  LOANS_AND_ADVANCES = 'Loans & Advances (Asset)',
  DEPOSITS = 'Deposits (Asset)',
  MISC_EXPENSES = 'Misc. Expenses (ASSET)',
  PURCHASE_ACCOUNTS = 'Purchase Accounts',
  SALES_ACCOUNTS = 'Sales Accounts',
  DIRECT_EXPENSES = 'Direct Expenses',
  DIRECT_INCOMES = 'Direct Incomes',
  INDIRECT_EXPENSES = 'Indirect Expenses',
  INDIRECT_INCOMES = 'Indirect Incomes',
}

/**
 * Tally Company Information
 */
export interface TallyCompany {
  guid: string; // Company GUID
  name: string; // Company name
  mailingName?: string; // Mailing name
  address?: string; // Company address
  country?: string; // Country
  state?: string; // State
  pincode?: string; // PIN/ZIP code
  email?: string; // Email address
  phone?: string; // Phone number
  fax?: string; // Fax number
  website?: string; // Website URL
  gstRegistrationType?: string; // GST registration type (for India)
  gstin?: string; // GSTIN number (for India)
  pan?: string; // PAN number (for India)
  tan?: string; // TAN number (for India)
  financialYearBegin?: string; // Financial year start date (YYYYMMDD)
  financialYearEnd?: string; // Financial year end date (YYYYMMDD)
  booksBeginningFrom?: string; // Books beginning from date (YYYYMMDD)
  currency?: string; // Base currency
  currencySymbol?: string; // Currency symbol
}

/**
 * Tally Ledger (Account)
 */
export interface TallyLedger {
  guid: string; // Ledger GUID
  name: string; // Ledger name
  parent: string; // Parent group name
  alias?: string; // Alias name
  openingBalance?: number; // Opening balance
  isDeemedPositive?: boolean; // Whether opening balance is Dr (true) or Cr (false)
  mailingName?: string; // Mailing name (for party ledgers)
  address?: string; // Address
  state?: string; // State
  country?: string; // Country
  pincode?: string; // PIN/ZIP code
  email?: string; // Email
  phone?: string; // Phone
  mobile?: string; // Mobile
  gstin?: string; // GSTIN (for India)
  gstRegistrationType?: string; // GST registration type
  pan?: string; // PAN number
  partyGstInApplicableFrom?: string; // GST applicable from date
  isRevenue?: boolean; // Whether it's a revenue/expense ledger
  isCostCentersOn?: boolean; // Whether cost centers are enabled
  affectsStock?: boolean; // Whether it affects stock
  usedForInterest?: boolean; // Whether used for interest calculation
  useForVat?: boolean; // Whether used for VAT
  useForGst?: boolean; // Whether used for GST
  vatTaxClassification?: string; // VAT tax classification
  gstTypeOfSupply?: string; // GST type of supply (Goods/Services)
  gstHsnCode?: string; // HSN/SAC code
  bankAccountHolder?: string; // Bank account holder name
  bankAccountNumber?: string; // Bank account number
  bankIfscCode?: string; // Bank IFSC code
  bankName?: string; // Bank name
  bankBranch?: string; // Bank branch
  bankSwiftCode?: string; // SWIFT code
}

/**
 * Tally Voucher (Transaction)
 */
export interface TallyVoucher {
  guid: string; // Voucher GUID
  voucherType: TallyVoucherType; // Voucher type
  voucherNumber: string; // Voucher number
  date: string; // Date (YYYYMMDD)
  referenceNumber?: string; // Reference/invoice number
  referenceDate?: string; // Reference date (YYYYMMDD)
  narration?: string; // Narration/description
  partyLedgerName?: string; // Party ledger (for sales/purchase)
  effectiveDate?: string; // Effective date (YYYYMMDD)
  isCancelled?: boolean; // Whether voucher is cancelled
  isOptional?: boolean; // Whether voucher is optional
  commonNarration?: string; // Common narration
  ledgerEntries: TallyLedgerEntry[]; // Ledger entries (Dr/Cr)
  inventoryEntries?: TallyInventoryEntry[]; // Inventory entries (for stock items)
  gstDetails?: TallyGstDetails; // GST details (for India)
}

/**
 * Tally Ledger Entry (part of voucher)
 */
export interface TallyLedgerEntry {
  ledgerName: string; // Ledger name
  ledgerGuid?: string; // Ledger GUID
  amount: number; // Amount (positive for Dr, negative for Cr)
  isDeemedPositive?: boolean; // Whether amount is Dr (true) or Cr (false)
  isPartyLedger?: boolean; // Whether it's a party ledger
  narration?: string; // Entry-specific narration
  costCentreName?: string; // Cost centre allocation
  costCentreAmount?: number; // Cost centre amount
  billAllocations?: TallyBillAllocation[]; // Bill-wise allocations
}

/**
 * Tally Bill Allocation (bill-wise details)
 */
export interface TallyBillAllocation {
  name: string; // Bill name/number
  type: 'New Ref' | 'Agst Ref' | 'On Account' | 'Advance'; // Bill type
  amount: number; // Amount allocated
  billDate?: string; // Bill date (YYYYMMDD)
  billCreditPeriod?: string; // Credit period
  billDueDate?: string; // Due date (YYYYMMDD)
}

/**
 * Tally Inventory Entry (stock item allocation)
 */
export interface TallyInventoryEntry {
  stockItemName: string; // Stock item name
  stockItemGuid?: string; // Stock item GUID
  quantity: number; // Quantity
  rate: number; // Rate per unit
  amount: number; // Total amount
  unit?: string; // Unit of measure
  godownName?: string; // Godown/warehouse name
  batchAllocations?: TallyBatchAllocation[]; // Batch allocations
  accountingAllocations?: TallyAccountingAllocation[]; // Accounting allocations
}

/**
 * Tally Batch Allocation (for batch tracking)
 */
export interface TallyBatchAllocation {
  batchName: string; // Batch name
  godownName?: string; // Godown name
  quantity: number; // Quantity
  rate: number; // Rate
  amount: number; // Amount
}

/**
 * Tally Accounting Allocation (ledger allocation for inventory)
 */
export interface TallyAccountingAllocation {
  ledgerName: string; // Ledger name
  amount: number; // Amount allocated
  rate?: number; // Rate (if applicable)
  gstDetails?: TallyGstDetails; // GST details
}

/**
 * Tally GST Details (for India)
 */
export interface TallyGstDetails {
  gstHsnCode?: string; // HSN/SAC code
  gstRate?: number; // GST rate (percentage)
  cgstRate?: number; // CGST rate
  sgstRate?: number; // SGST rate
  igstRate?: number; // IGST rate
  cessRate?: number; // Cess rate
  gstApplicable?: string; // GST applicability
  gstTypeOfSupply?: string; // Type of supply (Goods/Services)
  taxableValue?: number; // Taxable value
  cgstAmount?: number; // CGST amount
  sgstAmount?: number; // SGST amount
  igstAmount?: number; // IGST amount
  cessAmount?: number; // Cess amount
  totalGstAmount?: number; // Total GST amount
}

/**
 * Tally Stock Item
 */
export interface TallyStockItem {
  guid: string; // Stock item GUID
  name: string; // Stock item name
  alias?: string; // Alias name
  parent?: string; // Parent group
  category?: string; // Category
  unit?: string; // Base unit
  alternateUnit?: string; // Alternate unit
  openingBalance?: number; // Opening stock
  openingValue?: number; // Opening stock value
  openingRate?: number; // Opening rate
  gstHsnCode?: string; // HSN code (for India)
  gstApplicable?: string; // GST applicability
  gstTypeOfSupply?: string; // Type of supply
  gstRate?: number; // GST rate
  igstRate?: number; // IGST rate
  cgstRate?: number; // CGST rate
  sgstRate?: number; // SGST rate
  cessRate?: number; // Cess rate
  isBatchWiseOn?: boolean; // Whether batch tracking is enabled
  description?: string; // Description
  narration?: string; // Narration
  costingMethod?: string; // Costing method (Avg Cost/FIFO/LIFO)
  valuationMethod?: string; // Valuation method
}

/**
 * Tally Stock Group
 */
export interface TallyStockGroup {
  guid: string; // Stock group GUID
  name: string; // Stock group name
  parent?: string; // Parent group
  alias?: string; // Alias
  shouldAppearInIndent?: boolean; // Whether should appear in indent
  isAddable?: boolean; // Whether items can be added
  isSubledger?: boolean; // Whether it's a sub-ledger
}

/**
 * Tally XML Request Envelope
 */
export interface TallyXmlRequest {
  envelope: {
    header: {
      version: string; // TDL version
      tallyRequest: string; // Request type (Export/Import)
    };
    body: {
      desc: {
        staticVariables?: Record<string, any>; // Static variables
        tdl?: {
          tdlMessage: any; // TDL message content
        };
      };
      data: any; // Request data
    };
  };
}

/**
 * Tally XML Response Envelope
 */
export interface TallyXmlResponse {
  envelope?: {
    header?: any;
    body?: {
      data?: any;
      desc?: any;
    };
  };
  error?: string; // Error message if request failed
}

/**
 * Tally sync configuration
 */
export interface TallySyncConfig {
  orgId: string; // Organization ID in Operate
  tallyCompanyName: string; // Tally company name to sync
  tallyHost?: string; // Tally Gateway host
  tallyPort?: number; // Tally Gateway port
  syncDirection: 'import' | 'export' | 'bidirectional'; // Sync direction
  syncEntities: TallySyncEntity[]; // Entities to sync
  autoSync?: boolean; // Whether to enable auto-sync
  syncInterval?: number; // Sync interval in minutes
  lastSyncAt?: Date; // Last sync timestamp
}

/**
 * Tally sync entities
 */
export enum TallySyncEntity {
  COMPANIES = 'companies',
  LEDGERS = 'ledgers',
  GROUPS = 'groups',
  VOUCHERS = 'vouchers',
  STOCK_ITEMS = 'stock_items',
  STOCK_GROUPS = 'stock_groups',
  COST_CENTRES = 'cost_centres',
  GODOWNS = 'godowns',
}

/**
 * Tally sync result
 */
export interface TallySyncResult {
  success: boolean;
  entity: TallySyncEntity;
  direction: 'import' | 'export';
  recordsSynced: number;
  recordsFailed: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  duration: number; // Duration in milliseconds
}

/**
 * Tally sync status
 */
export interface TallySyncStatus {
  isRunning: boolean;
  currentEntity?: TallySyncEntity;
  progress?: number; // Percentage (0-100)
  message?: string;
  results: TallySyncResult[];
}

/**
 * Tally connection test result
 */
export interface TallyConnectionTest {
  success: boolean;
  message: string;
  tallyVersion?: string;
  licensedTo?: string;
  availableCompanies?: string[];
  error?: string;
}

/**
 * Tally mapping configuration
 * Maps Tally entities to Operate entities
 */
export interface TallyMapping {
  id: string;
  orgId: string;
  tallyEntity: TallySyncEntity;
  tallyEntityId: string; // Tally GUID
  tallyEntityName: string; // Tally entity name
  operateEntity: string; // Operate entity type (customer/vendor/invoice/etc)
  operateEntityId: string; // Operate entity ID
  mappedAt: Date;
  metadata?: Record<string, any>; // Additional mapping metadata
}

/**
 * Tally API client options
 */
export interface TallyClientOptions {
  host?: string;
  port?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Tally error response
 */
export interface TallyError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Tally authentication credentials (if using authenticated Tally instances)
 */
export interface TallyAuthCredentials {
  username?: string;
  password?: string;
  companyName?: string;
}

/**
 * Tally report request
 */
export interface TallyReportRequest {
  reportName: string; // Report name (e.g., 'Day Book', 'Ledger', 'Balance Sheet')
  fromDate?: string; // From date (YYYYMMDD)
  toDate?: string; // To date (YYYYMMDD)
  ledgerName?: string; // Ledger name (for ledger report)
  groupName?: string; // Group name (for group report)
  companyName?: string; // Company name
  filters?: Record<string, any>; // Additional filters
}

/**
 * Tally export format
 */
export enum TallyExportFormat {
  XML = 'XML',
  JSON = 'JSON',
  CSV = 'CSV',
  HTML = 'HTML',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

/**
 * Tally import result
 */
export interface TallyImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
}

/**
 * Tally export result
 */
export interface TallyExportResult {
  success: boolean;
  exportedCount: number;
  failedCount: number;
  format: TallyExportFormat;
  outputPath?: string; // Path to exported file
  data?: any; // Exported data (if in-memory)
  errors: string[];
}

/**
 * Tally webhook event (for real-time updates if Tally supports webhooks)
 */
export interface TallyWebhookEvent {
  event: string; // Event type (voucher.created, ledger.updated, etc.)
  companyName: string;
  entityType: TallySyncEntity;
  entityGuid: string;
  entityName: string;
  timestamp: Date;
  data: any; // Event data
}
