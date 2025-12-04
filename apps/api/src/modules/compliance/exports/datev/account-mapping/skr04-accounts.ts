/**
 * SKR04 Account Definitions
 * German standard chart of accounts for service providers
 * (Standardkontenrahmen für Dienstleistungsunternehmen)
 */

import {
  SKRAccount,
  AccountCategory,
  AccountSubcategory,
} from './interfaces/skr-account.interface';

/**
 * SKR04 Complete Account List
 * Range: 0000-9999
 * Structure (different from SKR03):
 * - 0-1: Liabilities & Equity (Passiva)
 * - 2-3: Assets (Aktiva)
 * - 4: Revenue (Erlöse)
 * - 5: Expenses (Aufwendungen)
 * - 6-7: (Reserved/Special)
 * - 8-9: (Reserved)
 */
export const SKR04_ACCOUNTS: SKRAccount[] = [
  // ===== LIABILITIES & EQUITY (0-1) =====

  // Equity (0800-0999)
  {
    accountNumber: '0800',
    accountName: 'Gezeichnetes Kapital',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.CAPITAL,
    description: 'Share capital',
    isActive: true,
  },
  {
    accountNumber: '0850',
    accountName: 'Gewinnrücklagen',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.RESERVES,
    description: 'Retained earnings',
    isActive: true,
  },
  {
    accountNumber: '0890',
    accountName: 'Jahresüberschuss/Jahresfehlbetrag',
    category: AccountCategory.EQUITY,
    subcategory: AccountSubcategory.RETAINED_EARNINGS,
    description: 'Annual profit/loss',
    isActive: true,
  },

  // ===== ASSETS (2-3) =====

  // Receivables (1200-1299)
  {
    accountNumber: '1200',
    accountName: 'Forderungen aus Lieferungen und Leistungen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Trade receivables',
    isActive: true,
  },
  {
    accountNumber: '1205',
    accountName: 'Forderungen aus Lieferungen und Leistungen aus im Inland steuerpflichtigen EG-Lieferungen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from EU transactions',
    isActive: true,
  },
  {
    accountNumber: '1230',
    accountName: 'Forderungen an Gesellschafter',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from shareholders',
    isActive: true,
  },
  {
    accountNumber: '1240',
    accountName: 'Forderungen an verbundene Unternehmen',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.RECEIVABLES,
    description: 'Receivables from affiliated companies',
    isActive: true,
  },

  // Cash & Bank (1600-1799)
  {
    accountNumber: '1600',
    accountName: 'Kasse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.CASH,
    description: 'Cash register / petty cash',
    isActive: true,
  },
  {
    accountNumber: '1800',
    accountName: 'Bank',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Bank account',
    isActive: true,
  },
  {
    accountNumber: '1810',
    accountName: 'Bundesbank',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Federal bank account',
    isActive: true,
  },
  {
    accountNumber: '1840',
    accountName: 'Bank (EUR)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Bank account in EUR',
    isActive: true,
  },
  {
    accountNumber: '1860',
    accountName: 'Bank (Fremdwährung)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.BANK,
    description: 'Foreign currency bank account',
    isActive: true,
  },

  // Inventory (3000-3999)
  {
    accountNumber: '3000',
    accountName: 'Vorräte (Roh-, Hilfs- und Betriebsstoffe)',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Raw materials and supplies',
    isActive: true,
  },
  {
    accountNumber: '3100',
    accountName: 'Unfertige Erzeugnisse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Work in progress',
    isActive: true,
  },
  {
    accountNumber: '3200',
    accountName: 'Fertige Erzeugnisse',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Finished goods',
    isActive: true,
  },
  {
    accountNumber: '3300',
    accountName: 'Waren',
    category: AccountCategory.ASSETS,
    subcategory: AccountSubcategory.INVENTORY,
    description: 'Merchandise',
    isActive: true,
  },

  // Payables (3300-3499)
  {
    accountNumber: '3300',
    accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.PAYABLES,
    description: 'Trade payables',
    isActive: true,
  },
  {
    accountNumber: '3310',
    accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen aus im Inland steuerpflichtigen EG-Erwerben',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.PAYABLES,
    description: 'Payables from EU acquisitions',
    isActive: true,
  },

  // Tax Liabilities (1770-1789)
  {
    accountNumber: '1770',
    accountName: 'Umsatzsteuer',
    category: AccountCategory.LIABILITIES,
    subcategory: AccountSubcategory.TAX_LIABILITIES,
    description: 'VAT payable',
    isActive: true,
  },
  {
    accountNumber: '1771',
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

  // ===== REVENUE (4000-4999) =====

  // Sales Revenue (4000-4399)
  {
    accountNumber: '4000',
    accountName: 'Erlöse',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue',
    isActive: true,
  },
  {
    accountNumber: '4100',
    accountName: 'Erlöse 19% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue with 19% VAT',
    isActive: true,
  },
  {
    accountNumber: '4300',
    accountName: 'Erlöse 7% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Revenue with 7% VAT',
    isActive: true,
  },
  {
    accountNumber: '4400',
    accountName: 'Erlöse steuerfrei',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Tax-free revenue',
    isActive: true,
  },
  {
    accountNumber: '4338',
    accountName: 'Innergemeinschaftliche Lieferungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Intra-community supplies',
    isActive: true,
  },
  {
    accountNumber: '4120',
    accountName: 'Ausfuhrlieferungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SALES_REVENUE,
    description: 'Export sales',
    isActive: true,
  },

  // Service Revenue (4500-4699)
  {
    accountNumber: '4500',
    accountName: 'Erlöse aus Dienstleistungen 19% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SERVICE_REVENUE,
    description: 'Service revenue with 19% VAT',
    isActive: true,
  },
  {
    accountNumber: '4600',
    accountName: 'Erlöse aus Dienstleistungen 7% USt',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.SERVICE_REVENUE,
    description: 'Service revenue with 7% VAT',
    isActive: true,
  },

  // Other Revenue (4700-4999)
  {
    accountNumber: '4700',
    accountName: 'Erträge aus Beteiligungen',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Investment income',
    isActive: true,
  },
  {
    accountNumber: '4800',
    accountName: 'Zinsen und ähnliche Erträge',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Interest and similar income',
    isActive: true,
  },
  {
    accountNumber: '4900',
    accountName: 'Sonstige Erträge',
    category: AccountCategory.REVENUE,
    subcategory: AccountSubcategory.OTHER_REVENUE,
    description: 'Other income',
    isActive: true,
  },

  // ===== EXPENSES (5000-5999) =====

  // Cost of Goods (5000-5399)
  {
    accountNumber: '5000',
    accountName: 'Materialaufwand',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Material costs',
    isActive: true,
  },
  {
    accountNumber: '5100',
    accountName: 'Wareneinkauf',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Merchandise purchases',
    isActive: true,
  },
  {
    accountNumber: '5400',
    accountName: 'Waren',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.COST_OF_GOODS,
    description: 'Goods purchased',
    isActive: true,
  },

  // Personnel Costs (6000-6199)
  {
    accountNumber: '6000',
    accountName: 'Löhne und Gehälter',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Wages and salaries',
    isActive: true,
  },
  {
    accountNumber: '6100',
    accountName: 'Gesetzliche soziale Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Social security contributions',
    isActive: true,
  },
  {
    accountNumber: '6110',
    accountName: 'Freiwillige soziale Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.PERSONNEL_COSTS,
    description: 'Voluntary social benefits',
    isActive: true,
  },

  // Office & Administration (6200-6399)
  {
    accountNumber: '6200',
    accountName: 'Raumkosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Premises costs',
    isActive: true,
  },
  {
    accountNumber: '6210',
    accountName: 'Miete',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Rent',
    isActive: true,
  },
  {
    accountNumber: '6220',
    accountName: 'Heizung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Heating',
    isActive: true,
  },
  {
    accountNumber: '6240',
    accountName: 'Strom',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Electricity',
    isActive: true,
  },
  {
    accountNumber: '6250',
    accountName: 'Reinigung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Cleaning',
    isActive: true,
  },
  {
    accountNumber: '6280',
    accountName: 'Instandhaltung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Maintenance',
    isActive: true,
  },

  // Communication (6300-6399)
  {
    accountNumber: '6300',
    accountName: 'Telekommunikation',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Telecommunications',
    isActive: true,
  },
  {
    accountNumber: '6320',
    accountName: 'Porto',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OFFICE_COSTS,
    description: 'Postage',
    isActive: true,
  },

  // Vehicle Costs (6500-6599)
  {
    accountNumber: '6500',
    accountName: 'KFZ-Kosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle costs',
    isActive: true,
  },
  {
    accountNumber: '6510',
    accountName: 'KFZ-Versicherung',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle insurance',
    isActive: true,
  },
  {
    accountNumber: '6520',
    accountName: 'KFZ-Steuer',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Vehicle tax',
    isActive: true,
  },
  {
    accountNumber: '6530',
    accountName: 'Treibstoff',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.VEHICLE_COSTS,
    description: 'Fuel',
    isActive: true,
  },

  // Marketing & Advertising (6600-6699)
  {
    accountNumber: '6600',
    accountName: 'Werbekosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Advertising costs',
    isActive: true,
  },
  {
    accountNumber: '6630',
    accountName: 'Geschenke',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Business gifts',
    isActive: true,
  },
  {
    accountNumber: '6650',
    accountName: 'Bewirtungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.MARKETING_COSTS,
    description: 'Entertainment expenses',
    isActive: true,
  },

  // Other Operating Expenses (6700-6999)
  {
    accountNumber: '6700',
    accountName: 'Versicherungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Insurance',
    isActive: true,
  },
  {
    accountNumber: '6710',
    accountName: 'Rechts- und Beratungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Legal and consulting fees',
    isActive: true,
  },
  {
    accountNumber: '6730',
    accountName: 'Buchführungskosten',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Bookkeeping costs',
    isActive: true,
  },
  {
    accountNumber: '6760',
    accountName: 'Abschreibungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Depreciation',
    isActive: true,
  },
  {
    accountNumber: '6780',
    accountName: 'Zinsen und ähnliche Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Interest and similar expenses',
    isActive: true,
  },
  {
    accountNumber: '6900',
    accountName: 'Sonstige Aufwendungen',
    category: AccountCategory.EXPENSES,
    subcategory: AccountSubcategory.OTHER_EXPENSES,
    description: 'Other expenses',
    isActive: true,
  },
];

/**
 * Get SKR04 account by number
 */
export function getSKR04Account(accountNumber: string): SKRAccount | undefined {
  return SKR04_ACCOUNTS.find((acc) => acc.accountNumber === accountNumber);
}

/**
 * Get SKR04 accounts by category
 */
export function getSKR04AccountsByCategory(
  category: AccountCategory,
): SKRAccount[] {
  return SKR04_ACCOUNTS.filter((acc) => acc.category === category);
}

/**
 * Get SKR04 accounts by subcategory
 */
export function getSKR04AccountsBySubcategory(
  subcategory: AccountSubcategory,
): SKRAccount[] {
  return SKR04_ACCOUNTS.filter((acc) => acc.subcategory === subcategory);
}
