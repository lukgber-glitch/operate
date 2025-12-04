/**
 * SAF-T Master Files Interfaces
 * Defines master data structures (accounts, customers, suppliers, products, tax codes)
 */

/**
 * Account types per SAF-T standard
 */
export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  REVENUE = 'Revenue',
  EXPENSE = 'Expense',
}

/**
 * General Ledger Account
 */
export interface SaftGeneralLedgerAccount {
  accountID: string;
  accountDescription: string;
  standardAccountID?: string; // SKR03, SKR04, etc.
  groupingCategory?: string;
  groupingCode?: string;
  accountType: AccountType;
  openingDebitBalance?: number;
  openingCreditBalance?: number;
  closingDebitBalance?: number;
  closingCreditBalance?: number;
  accountCreationDate?: string;
  taxonomyReference?: string;
}

/**
 * Tax table entry
 */
export interface SaftTaxTableEntry {
  taxType: string; // VAT, Sales Tax, etc.
  taxCodeDetails: SaftTaxCode[];
}

/**
 * Tax code details
 */
export interface SaftTaxCode {
  taxCode: string;
  description: string;
  taxPercentage?: number;
  country?: string;
  region?: string;
  taxExpirationDate?: string;
  taxAmount?: number;
  baseRate?: number;
  flatTaxRate?: {
    amount: number;
    calculationType?: string;
  };
}

/**
 * Customer master data
 */
export interface SaftCustomer {
  customerID: string;
  accountID: string; // GL account reference
  customerTaxID?: string;
  companyName: string;
  contact?: string;
  billingAddress?: SaftCustomerAddress;
  shipToAddress?: SaftCustomerAddress[];
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;
  selfBillingIndicator?: boolean;
  openingDebitBalance?: number;
  openingCreditBalance?: number;
  closingDebitBalance?: number;
  closingCreditBalance?: number;
}

/**
 * Supplier master data
 */
export interface SaftSupplier {
  supplierID: string;
  accountID: string; // GL account reference
  supplierTaxID?: string;
  companyName: string;
  contact?: string;
  billingAddress?: SaftSupplierAddress;
  shipFromAddress?: SaftSupplierAddress[];
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;
  selfBillingIndicator?: boolean;
  openingDebitBalance?: number;
  openingCreditBalance?: number;
  closingDebitBalance?: number;
  closingCreditBalance?: number;
}

/**
 * Customer/Supplier address
 */
export interface SaftCustomerAddress {
  buildingNumber?: string;
  streetName?: string;
  addressDetail: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string;
}

export interface SaftSupplierAddress extends SaftCustomerAddress {}

/**
 * Product/Service master data
 */
export interface SaftProduct {
  productType: 'P' | 'S' | 'O' | 'E' | 'I'; // Product, Service, Other, Expense, Investment
  productCode: string;
  productGroup?: string;
  productDescription: string;
  productNumberCode?: string;
  customsDetails?: {
    cnCode?: string;
    uccCode?: string;
  };
  productionDate?: string;
  expiryDate?: string;
}

/**
 * UOM (Unit of Measure) table
 */
export interface SaftUnitOfMeasure {
  unitOfMeasure: string;
  description: string;
}

/**
 * Analysis type for dimensions
 */
export interface SaftAnalysisType {
  analysisTypeCode: string;
  analysisTypeDescription: string;
  analysisID: string;
  analysisIDDescription: string;
}

/**
 * Owner information
 */
export interface SaftOwner {
  ownerID: string;
  registrationName: string;
  taxRegistrationNumber: string;
  address: SaftCustomerAddress;
}

/**
 * Complete Master Files structure
 */
export interface SaftMasterFiles {
  generalLedgerAccounts: SaftGeneralLedgerAccount[];
  customers?: SaftCustomer[];
  suppliers?: SaftSupplier[];
  products?: SaftProduct[];
  taxTable?: SaftTaxTableEntry[];
  uomTable?: SaftUnitOfMeasure[];
  analysisTypeTable?: SaftAnalysisType[];
  owners?: SaftOwner[];
}

/**
 * Master files generation options
 */
export interface MasterFilesOptions {
  includeInactive?: boolean;
  includeBalances?: boolean;
  includeProducts?: boolean;
  includeAnalysisCodes?: boolean;
  balanceDate?: Date;
}
