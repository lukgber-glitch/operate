/**
 * SKR03 Account Definitions
 * German standard chart of accounts for industrial companies
 * (Standardkontenrahmen für Industrieunternehmen)
 */

import {
  SKRAccount,
  AccountCategory,
  AccountSubcategory,
} from './interfaces/skr-account.interface';

/**
 * SKR03 Complete Account List
 * Range: 0000-9999
 * Structure:
 * - 0-1: Assets (Aktiva)
 * - 2-3: Liabilities & Equity (Passiva)
 * - 4: Expenses (Aufwendungen)
 * - 5-7: (Reserved/Special)
 * - 8-9: Revenue (Erlöse)
 */
export const SKR03_ACCOUNTS: SKRAccount[] = [
  // ===== ASSETS (0-1) =====

  // Cash & Bank Accounts (1000-1999)
  {
    accountNumber: '1000',
    accountName: 'Kasse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.CASH,
    description: 'Cash register / petty cash',
    isActive: true,
  },
  {
    accountNumber: '1200',
    accountName: 'Bank',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Bank account',
    isActive: true,
  },
  {
    accountNumber: '1210',
    accountName: 'Bundesbank',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Federal bank account',
    isActive: true,
  },
  {
    accountNumber: '1240',
    accountName: 'Bank (EUR)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Bank account in EUR',
    isActive: true,
  },
  {
    accountNumber: '1260',
    accountName: 'Bank (Fremdwährung)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Foreign currency bank account',
    isActive: true,
  },

  // Receivables (1400-1499)
  {
    accountNumber: '1400',
    accountName: 'Forderungen aus Lieferungen und Leistungen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Trade receivables',
    isActive: true,
  },
  {
    accountNumber: '1406',
    accountName: 'Forderungen aus Lieferungen und Leistungen aus im Inland steuerpflichtigen EG-Lieferungen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from EU transactions',
    isActive: true,
  },
  {
    accountNumber: '1430',
    accountName: 'Forderungen an Gesellschafter',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from shareholders',
    isActive: true,
  },
  {
    accountNumber: '1440',
    accountName: 'Forderungen an verbundene Unternehmen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from affiliated companies',
    isActive: true,
  },

  // Inventory (1500-1599)
  {
    accountNumber: '1500',
    accountName: 'Vorräte (Roh-, Hilfs- und Betriebsstoffe)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Raw materials and supplies',
    isActive: true,
  },
  {
    accountNumber: '1540',
    accountName: 'Unfertige Erzeugnisse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Work in progress',
    isActive: true,
  },
  {
    accountNumber: '1570',
    accountName: 'Fertige Erzeugnisse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Finished goods',
    isActive: true,
  },
  {
    accountNumber: '1580',
    accountName: 'Waren',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Merchandise',
    isActive: true,
  },

  // ===== LIABILITIES & EQUITY (2-3) =====

  // Payables (1600-1799)
  {
    accountNumber: '1600',
    accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.PAYABLES,
    description: 'Trade payables',
    isActive: true,
  },
  {
    accountNumber: '1610',
    accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen aus im Inland steuerpflichtigen EG-Erwerben',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.PAYABLES,
    description: 'Payables from EU acquisitions',
    isActive: true,
  },

  // Equity (2800-2999)
  {
    accountNumber: '2800',
    accountName: 'Gezeichnetes Kapital',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.CAPITAL,
    description: 'Share capital',
    isActive: true,
  },
  {
    accountNumber: '2850',
    accountName: 'Gewinnrücklagen',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.RESERVES,
    description: 'Retained earnings',
    isActive: true,
  },
  {
    accountNumber: '2880',
    accountName: 'Jahresüberschuss/Jahresfehlbetrag',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.RETAINED_EARNINGS,
    description: 'Annual profit/loss',
    isActive: true,
  },

  // Tax Liabilities (1780-1799)
  {
    accountNumber: '1780',
    accountName: 'Umsatzsteuer',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.TAX_LIABILITIES,
    description: 'VAT payable',
    isActive: true,
  },
  {
    accountNumber: '1781',
    accountName: 'Umsatzsteuer 19%',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.TAX_LIABILITIES,
    description: 'VAT 19% payable',
    isActive: true,
  },
  {
    accountNumber: '1776',
    accountName: 'Umsatzsteuer 7%',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.TAX_LIABILITIES,
    description: 'VAT 7% payable',
    isActive: true,
  },
  {
    accountNumber: '1570',
    accountName: 'Abziehbare Vorsteuer',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Input VAT deductible',
    isActive: true,
  },
  {
    accountNumber: '1571',
    accountName: 'Abziehbare Vorsteuer 19%',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Input VAT 19% deductible',
    isActive: true,
  },
  {
    accountNumber: '1576',
    accountName: 'Abziehbare Vorsteuer 7%',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Input VAT 7% deductible',
    isActive: true,
  },

  // ===== EXPENSES (4000-4999) =====

  // Cost of Goods (4000-4399)
  {
    accountNumber: '4000',
    accountName: 'Materialaufwand',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Material costs',
    isActive: true,
  },
  {
    accountNumber: '4100',
    accountName: 'Wareneinkauf',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Merchandise purchases',
    isActive: true,
  },
  {
    accountNumber: '4400',
    accountName: 'Waren',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Goods purchased',
    isActive: true,
  },

  // Personnel Costs (4100-4199)
  {
    accountNumber: '4120',
    accountName: 'Löhne und Gehälter',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Wages and salaries',
    isActive: true,
  },
  {
    accountNumber: '4130',
    accountName: 'Gesetzliche soziale Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Social security contributions',
    isActive: true,
  },
  {
    accountNumber: '4140',
    accountName: 'Freiwillige soziale Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Voluntary social benefits',
    isActive: true,
  },

  // Office & Administration (4200-4299)
  {
    accountNumber: '4200',
    accountName: 'Raumkosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Premises costs',
    isActive: true,
  },
  {
    accountNumber: '4210',
    accountName: 'Miete',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Rent',
    isActive: true,
  },
  {
    accountNumber: '4220',
    accountName: 'Heizung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Heating',
    isActive: true,
  },
  {
    accountNumber: '4240',
    accountName: 'Strom',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Electricity',
    isActive: true,
  },
  {
    accountNumber: '4250',
    accountName: 'Reinigung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Cleaning',
    isActive: true,
  },
  {
    accountNumber: '4280',
    accountName: 'Instandhaltung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Maintenance',
    isActive: true,
  },

  // Communication (4300-4399)
  {
    accountNumber: '4300',
    accountName: 'Telekommunikation',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Telecommunications',
    isActive: true,
  },
  {
    accountNumber: '4320',
    accountName: 'Porto',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Postage',
    isActive: true,
  },

  // Vehicle Costs (4500-4599)
  {
    accountNumber: '4500',
    accountName: 'KFZ-Kosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle costs',
    isActive: true,
  },
  {
    accountNumber: '4510',
    accountName: 'KFZ-Versicherung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle insurance',
    isActive: true,
  },
  {
    accountNumber: '4520',
    accountName: 'KFZ-Steuer',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle tax',
    isActive: true,
  },
  {
    accountNumber: '4530',
    accountName: 'Treibstoff',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Fuel',
    isActive: true,
  },

  // Marketing & Advertising (4600-4699)
  {
    accountNumber: '4600',
    accountName: 'Werbekosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Advertising costs',
    isActive: true,
  },
  {
    accountNumber: '4630',
    accountName: 'Geschenke',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Business gifts',
    isActive: true,
  },
  {
    accountNumber: '4650',
    accountName: 'Bewirtungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Entertainment expenses',
    isActive: true,
  },

  // Other Operating Expenses (4700-4999)
  {
    accountNumber: '4700',
    accountName: 'Versicherungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Insurance',
    isActive: true,
  },
  {
    accountNumber: '4710',
    accountName: 'Rechts- und Beratungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Legal and consulting fees',
    isActive: true,
  },
  {
    accountNumber: '4730',
    accountName: 'Buchführungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Bookkeeping costs',
    isActive: true,
  },
  {
    accountNumber: '4760',
    accountName: 'Abschreibungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Depreciation',
    isActive: true,
  },
  {
    accountNumber: '4780',
    accountName: 'Zinsen und ähnliche Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Interest and similar expenses',
    isActive: true,
  },
  {
    accountNumber: '4900',
    accountName: 'Sonstige Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Other expenses',
    isActive: true,
  },

  // ===== REVENUE (8000-8999) =====

  // Sales Revenue (8000-8499)
  {
    accountNumber: '8000',
    accountName: 'Erlöse',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue',
    isActive: true,
  },
  {
    accountNumber: '8100',
    accountName: 'Erlöse 19% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue with 19% VAT',
    isActive: true,
  },
  {
    accountNumber: '8300',
    accountName: 'Erlöse 7% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue with 7% VAT',
    isActive: true,
  },
  {
    accountNumber: '8400',
    accountName: 'Erlöse steuerfrei',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Tax-free revenue',
    isActive: true,
  },
  {
    accountNumber: '8338',
    accountName: 'Innergemeinschaftliche Lieferungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Intra-community supplies',
    isActive: true,
  },
  {
    accountNumber: '8125',
    accountName: 'Ausfuhrlieferungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Export sales',
    isActive: true,
  },

  // Service Revenue (8500-8699)
  {
    accountNumber: '8500',
    accountName: 'Erlöse aus Dienstleistungen 19% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SERVICE_REVENUE,
    description: 'Service revenue with 19% VAT',
    isActive: true,
  },
  {
    accountNumber: '8600',
    accountName: 'Erlöse aus Dienstleistungen 7% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SERVICE_REVENUE,
    description: 'Service revenue with 7% VAT',
    isActive: true,
  },

  // Other Revenue (8700-8999)
  {
    accountNumber: '8700',
    accountName: 'Erträge aus Beteiligungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Investment income',
    isActive: true,
  },
  {
    accountNumber: '8800',
    accountName: 'Zinsen und ähnliche Erträge',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Interest and similar income',
    isActive: true,
  },
  {
    accountNumber: '8900',
    accountName: 'Sonstige Erträge',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Other income',
    isActive: true,
  },
];

/**
 * Get SKR03 account by number
 */
export function getSKR03Account(accountNumber: string): SKRAccount | undefined {
  return SKR03_ACCOUNTS.find((acc) => acc.accountNumber === accountNumber);
}

/**
 * Get SKR03 accounts by category
 */
export function getSKR03AccountsByCategory(
  category: AccountCategory,
): SKRAccount[] {
  return SKR03_ACCOUNTS.filter((acc) => acc.category === category);
}

/**
 * Get SKR03 accounts by subcategory
 */
export function getSKR03AccountsBySubcategory(
  subcategory: AccountSubcategory,
): SKRAccount[] {
  return SKR03_ACCOUNTS.filter((acc) => acc.subcategory === subcategory);
}
