/**
 * SKR Mapping Service
 * Maps internal account codes to German standard chart of accounts (SKR03/SKR04)
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AccountCategory,
  AccountSubcategory,
  SKRType,
  AccountMapping,
  AccountSuggestion,
} from './interfaces/skr-account.interface';
import {
  SKR03_ACCOUNTS,
  getSKR03Account,
  getSKR03AccountsByCategory,
  getSKR03AccountsBySubcategory,
} from './skr03-accounts';
import {
  SKR04_ACCOUNTS,
  getSKR04Account,
  getSKR04AccountsByCategory,
  getSKR04AccountsBySubcategory,
} from './skr04-accounts';
import { getTaxKey, getTaxKeyDescription } from './tax-key-mapping';

@Injectable()
export class SKRMappingService {
  private readonly logger = new Logger(SKRMappingService.name);

  /**
   * Standard account mappings between internal codes and SKR accounts
   */
  private readonly accountMappings: AccountMapping[] = [
    // Assets - Cash & Bank
    {
      internalCode: 'CASH',
      skr03Account: '1000',
      skr04Account: '1600',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.CASH,
      description: 'Cash register / petty cash',
    },
    {
      internalCode: 'BANK',
      skr03Account: '1200',
      skr04Account: '1800',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.BANK,
      description: 'Bank account',
    },
    {
      internalCode: 'BANK_EUR',
      skr03Account: '1240',
      skr04Account: '1840',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.BANK,
      description: 'Bank account in EUR',
    },

    // Assets - Receivables
    {
      internalCode: 'RECEIVABLES',
      skr03Account: '1400',
      skr04Account: '1200',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.RECEIVABLES,
      description: 'Trade receivables',
    },
    {
      internalCode: 'RECEIVABLES_EU',
      skr03Account: '1406',
      skr04Account: '1205',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.RECEIVABLES,
      description: 'Receivables from EU transactions',
    },

    // Assets - Inventory
    {
      internalCode: 'INVENTORY',
      skr03Account: '1580',
      skr04Account: '3300',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.INVENTORY,
      description: 'Merchandise',
    },

    // Liabilities - Payables
    {
      internalCode: 'PAYABLES',
      skr03Account: '1600',
      skr04Account: '3300',
      category: AccountCategory.LIABILITIES,
      subcategory: AccountSubcategory.PAYABLES,
      description: 'Trade payables',
    },
    {
      internalCode: 'PAYABLES_EU',
      skr03Account: '1610',
      skr04Account: '3310',
      category: AccountCategory.LIABILITIES,
      subcategory: AccountSubcategory.PAYABLES,
      description: 'Payables from EU acquisitions',
    },

    // Liabilities - Tax
    {
      internalCode: 'VAT_PAYABLE',
      skr03Account: '1780',
      skr04Account: '1770',
      category: AccountCategory.LIABILITIES,
      subcategory: AccountSubcategory.TAX_LIABILITIES,
      description: 'VAT payable',
    },
    {
      internalCode: 'VAT_PAYABLE_19',
      skr03Account: '1781',
      skr04Account: '1771',
      category: AccountCategory.LIABILITIES,
      subcategory: AccountSubcategory.TAX_LIABILITIES,
      description: 'VAT 19% payable',
    },
    {
      internalCode: 'VAT_PAYABLE_7',
      skr03Account: '1776',
      skr04Account: '1776',
      category: AccountCategory.LIABILITIES,
      subcategory: AccountSubcategory.TAX_LIABILITIES,
      description: 'VAT 7% payable',
    },
    {
      internalCode: 'INPUT_VAT',
      skr03Account: '1570',
      skr04Account: '1570',
      category: AccountCategory.ASSETS,
      subcategory: AccountSubcategory.RECEIVABLES,
      description: 'Input VAT deductible',
    },

    // Equity
    {
      internalCode: 'CAPITAL',
      skr03Account: '2800',
      skr04Account: '0800',
      category: AccountCategory.EQUITY,
      subcategory: AccountSubcategory.CAPITAL,
      description: 'Share capital',
    },
    {
      internalCode: 'RETAINED_EARNINGS',
      skr03Account: '2850',
      skr04Account: '0850',
      category: AccountCategory.EQUITY,
      subcategory: AccountSubcategory.RESERVES,
      description: 'Retained earnings',
    },

    // Revenue - Sales
    {
      internalCode: 'REVENUE',
      skr03Account: '8000',
      skr04Account: '4000',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Revenue',
    },
    {
      internalCode: 'REVENUE_19',
      skr03Account: '8100',
      skr04Account: '4100',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Revenue with 19% VAT',
    },
    {
      internalCode: 'REVENUE_7',
      skr03Account: '8300',
      skr04Account: '4300',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Revenue with 7% VAT',
    },
    {
      internalCode: 'REVENUE_TAX_FREE',
      skr03Account: '8400',
      skr04Account: '4400',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Tax-free revenue',
    },
    {
      internalCode: 'REVENUE_EU',
      skr03Account: '8338',
      skr04Account: '4338',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Intra-community supplies',
    },
    {
      internalCode: 'REVENUE_EXPORT',
      skr03Account: '8125',
      skr04Account: '4120',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SALES_REVENUE,
      description: 'Export sales',
    },

    // Revenue - Services
    {
      internalCode: 'SERVICE_REVENUE_19',
      skr03Account: '8500',
      skr04Account: '4500',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SERVICE_REVENUE,
      description: 'Service revenue with 19% VAT',
    },
    {
      internalCode: 'SERVICE_REVENUE_7',
      skr03Account: '8600',
      skr04Account: '4600',
      category: AccountCategory.REVENUE,
      subcategory: AccountSubcategory.SERVICE_REVENUE,
      description: 'Service revenue with 7% VAT',
    },

    // Expenses - Cost of Goods
    {
      internalCode: 'COGS',
      skr03Account: '4400',
      skr04Account: '5400',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.COST_OF_GOODS,
      description: 'Cost of goods sold',
    },

    // Expenses - Personnel
    {
      internalCode: 'SALARIES',
      skr03Account: '4120',
      skr04Account: '6000',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.PERSONNEL_COSTS,
      description: 'Wages and salaries',
    },
    {
      internalCode: 'SOCIAL_SECURITY',
      skr03Account: '4130',
      skr04Account: '6100',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.PERSONNEL_COSTS,
      description: 'Social security contributions',
    },

    // Expenses - Office
    {
      internalCode: 'RENT',
      skr03Account: '4210',
      skr04Account: '6210',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OFFICE_COSTS,
      description: 'Rent',
    },
    {
      internalCode: 'ELECTRICITY',
      skr03Account: '4240',
      skr04Account: '6240',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OFFICE_COSTS,
      description: 'Electricity',
    },
    {
      internalCode: 'TELECOMMUNICATIONS',
      skr03Account: '4300',
      skr04Account: '6300',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OFFICE_COSTS,
      description: 'Telecommunications',
    },

    // Expenses - Vehicle
    {
      internalCode: 'VEHICLE_COSTS',
      skr03Account: '4500',
      skr04Account: '6500',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.VEHICLE_COSTS,
      description: 'Vehicle costs',
    },
    {
      internalCode: 'FUEL',
      skr03Account: '4530',
      skr04Account: '6530',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.VEHICLE_COSTS,
      description: 'Fuel',
    },

    // Expenses - Marketing
    {
      internalCode: 'ADVERTISING',
      skr03Account: '4600',
      skr04Account: '6600',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.MARKETING_COSTS,
      description: 'Advertising costs',
    },

    // Expenses - Other
    {
      internalCode: 'INSURANCE',
      skr03Account: '4700',
      skr04Account: '6700',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OTHER_EXPENSES,
      description: 'Insurance',
    },
    {
      internalCode: 'LEGAL_CONSULTING',
      skr03Account: '4710',
      skr04Account: '6710',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OTHER_EXPENSES,
      description: 'Legal and consulting fees',
    },
    {
      internalCode: 'DEPRECIATION',
      skr03Account: '4760',
      skr04Account: '6760',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OTHER_EXPENSES,
      description: 'Depreciation',
    },
    {
      internalCode: 'INTEREST_EXPENSE',
      skr03Account: '4780',
      skr04Account: '6780',
      category: AccountCategory.EXPENSES,
      subcategory: AccountSubcategory.OTHER_EXPENSES,
      description: 'Interest and similar expenses',
    },
  ];

  /**
   * Map internal account code to SKR03 account
   */
  mapToSKR03(internalAccountCode: string): string | null {
    const mapping = this.accountMappings.find(
      (m) => m.internalCode === internalAccountCode,
    );

    if (mapping) {
      this.logger.debug(
        `Mapped ${internalAccountCode} to SKR03: ${mapping.skr03Account}`,
      );
      return mapping.skr03Account;
    }

    this.logger.warn(
      `No SKR03 mapping found for internal code: ${internalAccountCode}`,
    );
    return null;
  }

  /**
   * Map internal account code to SKR04 account
   */
  mapToSKR04(internalAccountCode: string): string | null {
    const mapping = this.accountMappings.find(
      (m) => m.internalCode === internalAccountCode,
    );

    if (mapping) {
      this.logger.debug(
        `Mapped ${internalAccountCode} to SKR04: ${mapping.skr04Account}`,
      );
      return mapping.skr04Account;
    }

    this.logger.warn(
      `No SKR04 mapping found for internal code: ${internalAccountCode}`,
    );
    return null;
  }

  /**
   * Get account name by SKR type and account number
   */
  getAccountName(skrType: SKRType, accountCode: string): string | null {
    if (skrType === SKRType.SKR03) {
      const account = getSKR03Account(accountCode);
      return account ? account.accountName : null;
    } else {
      const account = getSKR04Account(accountCode);
      return account ? account.accountName : null;
    }
  }

  /**
   * Get tax key for given VAT rate
   */
  getTaxKey(vatRate: number, type: 'input' | 'output' = 'output'): string {
    const key = getTaxKey(vatRate, type);
    if (!key) {
      this.logger.warn(`No tax key found for VAT rate: ${vatRate}%`);
      return '';
    }
    return key;
  }

  /**
   * Get tax key description
   */
  getTaxKeyDescription(taxKey: string): string | null {
    return getTaxKeyDescription(taxKey);
  }

  /**
   * Suggest account based on description
   * Uses simple keyword matching to suggest appropriate accounts
   */
  suggestAccount(
    description: string,
    skrType: SKRType,
  ): AccountSuggestion | null {
    const lowerDesc = description.toLowerCase();

    // Keywords for different account types
    const keywords = {
      cash: ['kasse', 'bargeld', 'cash'],
      bank: ['bank', 'giro', 'konto'],
      receivables: ['forderung', 'debitor', 'receivable', 'kunde'],
      payables: ['verbindlich', 'kreditor', 'payable', 'lieferant'],
      revenue: [
        'erlös',
        'umsatz',
        'revenue',
        'verkauf',
        'einnahme',
        'rechnung',
      ],
      expenses: ['aufwand', 'kosten', 'expense', 'ausgabe'],
      salary: ['lohn', 'gehalt', 'salary', 'personal'],
      rent: ['miete', 'rent'],
      vehicle: ['kfz', 'auto', 'fahrzeug', 'vehicle', 'treibstoff', 'fuel'],
      advertising: ['werbung', 'marketing', 'advertising'],
      insurance: ['versicherung', 'insurance'],
    };

    // Check for matches
    for (const [key, words] of Object.entries(keywords)) {
      if (words.some((word) => lowerDesc.includes(word))) {
        return this.getSuggestionForKeyword(key, skrType);
      }
    }

    this.logger.debug(`No account suggestion found for: ${description}`);
    return null;
  }

  /**
   * Get account suggestion for keyword
   */
  private getSuggestionForKeyword(
    keyword: string,
    skrType: SKRType,
  ): AccountSuggestion | null {
    const isSKR03 = skrType === SKRType.SKR03;

    const suggestions: Record<string, AccountSuggestion> = {
      cash: {
        accountNumber: isSKR03 ? '1000' : '1600',
        accountName: 'Kasse',
        confidence: 0.9,
        reason: 'Cash-related keywords detected',
      },
      bank: {
        accountNumber: isSKR03 ? '1200' : '1800',
        accountName: 'Bank',
        confidence: 0.9,
        reason: 'Bank-related keywords detected',
      },
      receivables: {
        accountNumber: isSKR03 ? '1400' : '1200',
        accountName: 'Forderungen aus Lieferungen und Leistungen',
        confidence: 0.85,
        reason: 'Receivables-related keywords detected',
      },
      payables: {
        accountNumber: isSKR03 ? '1600' : '3300',
        accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen',
        confidence: 0.85,
        reason: 'Payables-related keywords detected',
      },
      revenue: {
        accountNumber: isSKR03 ? '8100' : '4100',
        accountName: 'Erlöse 19% USt',
        confidence: 0.8,
        reason: 'Revenue-related keywords detected',
      },
      expenses: {
        accountNumber: isSKR03 ? '4900' : '6900',
        accountName: 'Sonstige Aufwendungen',
        confidence: 0.7,
        reason: 'Expense-related keywords detected',
      },
      salary: {
        accountNumber: isSKR03 ? '4120' : '6000',
        accountName: 'Löhne und Gehälter',
        confidence: 0.9,
        reason: 'Salary-related keywords detected',
      },
      rent: {
        accountNumber: isSKR03 ? '4210' : '6210',
        accountName: 'Miete',
        confidence: 0.95,
        reason: 'Rent-related keywords detected',
      },
      vehicle: {
        accountNumber: isSKR03 ? '4500' : '6500',
        accountName: 'KFZ-Kosten',
        confidence: 0.85,
        reason: 'Vehicle-related keywords detected',
      },
      advertising: {
        accountNumber: isSKR03 ? '4600' : '6600',
        accountName: 'Werbekosten',
        confidence: 0.85,
        reason: 'Advertising-related keywords detected',
      },
      insurance: {
        accountNumber: isSKR03 ? '4700' : '6700',
        accountName: 'Versicherungen',
        confidence: 0.85,
        reason: 'Insurance-related keywords detected',
      },
    };

    return suggestions[keyword] || null;
  }

  /**
   * Get all accounts for a specific category
   */
  getAccountsByCategory(
    category: AccountCategory,
    skrType: SKRType,
  ): string[] {
    if (skrType === SKRType.SKR03) {
      return getSKR03AccountsByCategory(category).map((a) => a.accountNumber);
    } else {
      return getSKR04AccountsByCategory(category).map((a) => a.accountNumber);
    }
  }

  /**
   * Get all accounts for a specific subcategory
   */
  getAccountsBySubcategory(
    subcategory: AccountSubcategory,
    skrType: SKRType,
  ): string[] {
    if (skrType === SKRType.SKR03) {
      return getSKR03AccountsBySubcategory(subcategory).map(
        (a) => a.accountNumber,
      );
    } else {
      return getSKR04AccountsBySubcategory(subcategory).map(
        (a) => a.accountNumber,
      );
    }
  }

  /**
   * Get account mapping by internal code
   */
  getAccountMapping(internalCode: string): AccountMapping | null {
    return (
      this.accountMappings.find((m) => m.internalCode === internalCode) || null
    );
  }

  /**
   * Get all account mappings
   */
  getAllMappings(): AccountMapping[] {
    return [...this.accountMappings];
  }

  /**
   * Get default account for transaction category
   */
  getDefaultAccountForCategory(
    category: string,
    skrType: SKRType,
  ): string | null {
    const isSKR03 = skrType === SKRType.SKR03;
    const categoryMap: Record<string, { skr03: string; skr04: string }> = {
      sales: { skr03: '8100', skr04: '4100' },
      purchases: { skr03: '4400', skr04: '5400' },
      salary: { skr03: '4120', skr04: '6000' },
      rent: { skr03: '4210', skr04: '6210' },
      utilities: { skr03: '4240', skr04: '6240' },
      vehicle: { skr03: '4500', skr04: '6500' },
      marketing: { skr03: '4600', skr04: '6600' },
      office: { skr03: '4280', skr04: '6280' },
    };

    const mapping = categoryMap[category.toLowerCase()];
    if (!mapping) {
      return null;
    }

    return isSKR03 ? mapping.skr03 : mapping.skr04;
  }
}
