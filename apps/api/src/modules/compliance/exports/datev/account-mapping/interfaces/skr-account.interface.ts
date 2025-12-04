/**
 * SKR Account Interfaces
 * Defines types for German standard chart of accounts (Kontenrahmen)
 */

/**
 * Account category types
 */
export enum AccountCategory {
  ASSETS = 'assets',
  LIABILITIES = 'liabilities',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSES = 'expenses',
}

/**
 * Account subcategory for more granular classification
 */
export enum AccountSubcategory {
  // Assets
  CASH = 'cash',
  BANK = 'bank',
  RECEIVABLES = 'receivables',
  INVENTORY = 'inventory',
  FIXED_ASSETS = 'fixed_assets',
  INTANGIBLE_ASSETS = 'intangible_assets',

  // Liabilities
  PAYABLES = 'payables',
  SHORT_TERM_DEBT = 'short_term_debt',
  LONG_TERM_DEBT = 'long_term_debt',
  TAX_LIABILITIES = 'tax_liabilities',

  // Equity
  CAPITAL = 'capital',
  RESERVES = 'reserves',
  RETAINED_EARNINGS = 'retained_earnings',

  // Revenue
  SALES_REVENUE = 'sales_revenue',
  SERVICE_REVENUE = 'service_revenue',
  OTHER_REVENUE = 'other_revenue',

  // Expenses
  COST_OF_GOODS = 'cost_of_goods',
  PERSONNEL_COSTS = 'personnel_costs',
  OFFICE_COSTS = 'office_costs',
  VEHICLE_COSTS = 'vehicle_costs',
  MARKETING_COSTS = 'marketing_costs',
  OTHER_EXPENSES = 'other_expenses',
}

/**
 * SKR type (standard chart of accounts)
 */
export enum SKRType {
  SKR03 = 'SKR03',
  SKR04 = 'SKR04',
}

/**
 * Tax key (BU-Schlüssel) for German VAT
 */
export interface TaxKey {
  key: string;
  vatRate: number;
  description: string;
  type: 'input' | 'output';
}

/**
 * SKR Account definition
 */
export interface SKRAccount {
  accountNumber: string;
  accountName: string;
  category: AccountCategory;
  subcategory: AccountSubcategory;
  description?: string;
  isActive: boolean;
}

/**
 * Account mapping between internal and SKR
 */
export interface AccountMapping {
  internalCode: string;
  skr03Account: string;
  skr04Account: string;
  category: AccountCategory;
  subcategory: AccountSubcategory;
  description: string;
}

/**
 * Suggestion result for account classification
 */
export interface AccountSuggestion {
  accountNumber: string;
  accountName: string;
  confidence: number;
  reason: string;
}
