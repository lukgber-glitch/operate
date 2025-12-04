/**
 * DATEV Import Mapper Service
 * Maps DATEV account numbers and structures to Operate schema
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatevSKRType } from '../../compliance/exports/datev/dto/datev-export.dto';
import { SKRMappingService } from '../../compliance/exports/datev/account-mapping/skr-mapping.service';
import {
  DatevImportMapping,
  ParsedDatevBooking,
  ParsedDatevAccountLabel,
  ParsedDatevBusinessPartner,
} from './datev-import.types';
import {
  getReverseMappingForSKR,
  TAX_KEY_VAT_RATE_MAP,
  ADDRESS_TYPE_MAP,
} from './datev-import.constants';

@Injectable()
export class DatevImportMapperService {
  private readonly logger = new Logger(DatevImportMapperService.name);

  constructor(private readonly skrMappingService: SKRMappingService) {}

  /**
   * Generate import mapping for DATEV accounts
   */
  async generateMapping(
    skrType: DatevSKRType,
    accounts: ParsedDatevAccountLabel[],
  ): Promise<DatevImportMapping> {
    const reverseMapping = getReverseMappingForSKR(skrType);
    const accountMappings: DatevImportMapping['accountMappings'] = [];
    const unmappedAccounts: DatevImportMapping['unmappedAccounts'] = [];

    for (const account of accounts) {
      const datevAccount = account.accountNumber;
      const datevAccountName = account.accountName;

      // Try exact mapping first
      const internalCode = reverseMapping[datevAccount];

      if (internalCode) {
        // Direct mapping found
        accountMappings.push({
          datevAccount,
          datevAccountName,
          operateAccountCode: internalCode,
          operateAccountName: this.getOperateAccountName(internalCode),
          confidence: 1.0,
          mappingType: 'automatic',
        });
      } else {
        // Try suggestion based on account name
        const suggestions = this.suggestOperateAccount(
          datevAccountName,
          skrType,
        );

        if (suggestions.length > 0) {
          // Use best suggestion as automatic mapping if confidence is high
          if (suggestions[0].confidence >= 0.8) {
            accountMappings.push({
              datevAccount,
              datevAccountName,
              operateAccountCode: suggestions[0].operateAccountCode,
              operateAccountName: suggestions[0].operateAccountName,
              confidence: suggestions[0].confidence,
              mappingType: 'automatic',
            });
          } else {
            unmappedAccounts.push({
              datevAccount,
              datevAccountName,
              suggestions,
            });
          }
        } else {
          unmappedAccounts.push({
            datevAccount,
            datevAccountName,
            suggestions: [],
          });
        }
      }
    }

    this.logger.log(
      `Generated mapping: ${accountMappings.length} mapped, ${unmappedAccounts.length} unmapped`,
    );

    return {
      skrType,
      accountMappings,
      unmappedAccounts,
    };
  }

  /**
   * Map DATEV booking to Operate transaction format
   */
  mapBookingToTransaction(
    booking: ParsedDatevBooking,
    mapping: DatevImportMapping,
    orgId: string,
  ): any {
    // Find account mappings
    const accountMapping = mapping.accountMappings.find(
      (m) => m.datevAccount === booking.accountNumber,
    );
    const offsetAccountMapping = mapping.accountMappings.find(
      (m) => m.datevAccount === booking.offsetAccount,
    );

    if (!accountMapping || !offsetAccountMapping) {
      throw new Error(
        `Missing account mapping for booking on line ${booking.lineNumber}`,
      );
    }

    // Determine transaction type based on accounts
    const transactionType = this.determineTransactionType(
      accountMapping.operateAccountCode,
      offsetAccountMapping.operateAccountCode,
    );

    // Calculate amount (apply debit/credit)
    const amount = booking.debitCredit === 'H' ? -booking.amount : booking.amount;

    // Parse VAT rate from tax key
    const vatRate = booking.taxKey
      ? TAX_KEY_VAT_RATE_MAP[booking.taxKey]
      : null;

    return {
      orgId,
      type: transactionType,
      amount,
      currency: booking.currency,
      date: this.parseBookingDate(booking.bookingDate, booking.documentDate),
      description: booking.postingText || `Import: ${booking.documentNumber}`,
      reference: booking.documentNumber,
      category: this.determineCategoryFromAccount(
        accountMapping.operateAccountCode,
      ),
      accountCode: accountMapping.operateAccountCode,
      offsetAccountCode: offsetAccountMapping.operateAccountCode,
      vatRate,
      metadata: {
        source: 'DATEV_IMPORT',
        datevAccountNumber: booking.accountNumber,
        datevOffsetAccount: booking.offsetAccount,
        taxKey: booking.taxKey,
        documentField2: booking.documentField2,
        costCenter1: booking.costCenter1,
        costCenter2: booking.costCenter2,
        serviceDate: booking.serviceDate,
        importLineNumber: booking.lineNumber,
      },
    };
  }

  /**
   * Map DATEV business partner to Operate customer/supplier
   */
  mapBusinessPartnerToEntity(
    partner: ParsedDatevBusinessPartner,
    orgId: string,
  ): { type: 'customer' | 'supplier'; data: any } {
    const addressType = ADDRESS_TYPE_MAP[partner.addressType || '1'];
    const type = addressType === 'CUSTOMER' ? 'customer' : 'supplier';

    const data = {
      orgId,
      name: partner.name,
      email: partner.email || undefined,
      phone: partner.phone || undefined,
      address: partner.street || undefined,
      city: partner.city || undefined,
      postalCode: partner.postalCode || undefined,
      country: partner.country || undefined,
      vatId: partner.euVatId || undefined,
      isActive: true,
      metadata: {
        source: 'DATEV_IMPORT',
        datevAccountNumber: partner.accountNumber,
        shortName: partner.shortName,
        salutation: partner.salutation,
        title: partner.title,
        firstName: partner.firstName,
        lastName: partner.lastName,
        euCountry: partner.euCountry,
        importLineNumber: partner.lineNumber,
      },
    };

    return { type, data };
  }

  /**
   * Suggest Operate account based on DATEV account name
   */
  private suggestOperateAccount(
    accountName: string,
    skrType: DatevSKRType,
  ): Array<{
    operateAccountCode: string;
    operateAccountName: string;
    confidence: number;
    reason: string;
  }> {
    // Use SKR mapping service to suggest account
    const suggestion = this.skrMappingService.suggestAccount(
      accountName,
      skrType === DatevSKRType.SKR03 ? 'SKR03' : 'SKR04',
    );

    if (!suggestion) {
      return [];
    }

    // Try to find internal code for suggested account
    const reverseMapping = getReverseMappingForSKR(skrType);
    const internalCode = reverseMapping[suggestion.accountNumber];

    if (!internalCode) {
      return [];
    }

    return [
      {
        operateAccountCode: internalCode,
        operateAccountName: this.getOperateAccountName(internalCode),
        confidence: suggestion.confidence,
        reason: suggestion.reason,
      },
    ];
  }

  /**
   * Get Operate account name from internal code
   */
  private getOperateAccountName(internalCode: string): string {
    // This could be enhanced with a proper lookup table
    const nameMap: Record<string, string> = {
      CASH: 'Cash',
      BANK: 'Bank',
      BANK_EUR: 'Bank (EUR)',
      RECEIVABLES: 'Trade Receivables',
      RECEIVABLES_EU: 'EU Receivables',
      INVENTORY: 'Inventory',
      INPUT_VAT: 'Input VAT',
      PAYABLES: 'Trade Payables',
      PAYABLES_EU: 'EU Payables',
      VAT_PAYABLE: 'VAT Payable',
      VAT_PAYABLE_19: 'VAT 19% Payable',
      VAT_PAYABLE_7: 'VAT 7% Payable',
      CAPITAL: 'Share Capital',
      RETAINED_EARNINGS: 'Retained Earnings',
      SALARIES: 'Wages and Salaries',
      SOCIAL_SECURITY: 'Social Security',
      RENT: 'Rent',
      ELECTRICITY: 'Electricity',
      TELECOMMUNICATIONS: 'Telecommunications',
      OFFICE_SUPPLIES: 'Office Supplies',
      COGS: 'Cost of Goods Sold',
      VEHICLE_COSTS: 'Vehicle Costs',
      FUEL: 'Fuel',
      ADVERTISING: 'Advertising',
      INSURANCE: 'Insurance',
      LEGAL_CONSULTING: 'Legal & Consulting',
      DEPRECIATION: 'Depreciation',
      INTEREST_EXPENSE: 'Interest Expense',
      REVENUE: 'Revenue',
      REVENUE_19: 'Revenue (19% VAT)',
      REVENUE_7: 'Revenue (7% VAT)',
      REVENUE_TAX_FREE: 'Tax-Free Revenue',
      REVENUE_EU: 'EU Revenue',
      REVENUE_EXPORT: 'Export Revenue',
      SERVICE_REVENUE_19: 'Service Revenue (19% VAT)',
      SERVICE_REVENUE_7: 'Service Revenue (7% VAT)',
    };

    return nameMap[internalCode] || internalCode;
  }

  /**
   * Determine transaction type based on account codes
   */
  private determineTransactionType(
    accountCode: string,
    offsetAccountCode: string,
  ): string {
    // Revenue accounts
    if (
      accountCode.startsWith('REVENUE') ||
      accountCode.startsWith('SERVICE_REVENUE')
    ) {
      return 'INCOME';
    }

    // Expense accounts
    if (
      accountCode.includes('COGS') ||
      accountCode.includes('SALARIES') ||
      accountCode.includes('RENT') ||
      accountCode.includes('COSTS') ||
      accountCode.includes('EXPENSE') ||
      accountCode.includes('ADVERTISING') ||
      accountCode.includes('INSURANCE') ||
      accountCode.includes('DEPRECIATION')
    ) {
      return 'EXPENSE';
    }

    // Bank/Cash transfers
    if (
      (accountCode === 'BANK' || accountCode === 'CASH') &&
      (offsetAccountCode === 'BANK' || offsetAccountCode === 'CASH')
    ) {
      return 'TRANSFER';
    }

    // Receivables/Payables
    if (accountCode.includes('RECEIVABLES') || accountCode.includes('PAYABLES')) {
      return 'INVOICE';
    }

    // Default
    return 'OTHER';
  }

  /**
   * Determine category from account code
   */
  private determineCategoryFromAccount(accountCode: string): string {
    if (accountCode.startsWith('REVENUE') || accountCode.startsWith('SERVICE_REVENUE')) {
      return 'SALES';
    }

    if (accountCode.includes('SALARIES') || accountCode.includes('SOCIAL_SECURITY')) {
      return 'PAYROLL';
    }

    if (accountCode === 'RENT') return 'RENT';
    if (accountCode.includes('VEHICLE') || accountCode === 'FUEL') return 'VEHICLE';
    if (accountCode === 'ADVERTISING') return 'MARKETING';
    if (accountCode.includes('TELECOMMUNICATIONS')) return 'TELECOMMUNICATIONS';
    if (accountCode === 'INSURANCE') return 'INSURANCE';
    if (accountCode === 'COGS') return 'PURCHASES';

    return 'OTHER';
  }

  /**
   * Parse booking date from DATEV format
   */
  private parseBookingDate(
    bookingDate: string,
    documentDate?: string,
  ): Date {
    // Prefer document date (TTMMJJ) if available, otherwise use booking date (DDMM)
    const dateStr = documentDate || bookingDate;

    if (!dateStr) {
      return new Date();
    }

    // Parse TTMMJJ format (DDMMYY)
    if (dateStr.length === 6) {
      const day = parseInt(dateStr.substring(0, 2), 10);
      const month = parseInt(dateStr.substring(2, 4), 10);
      const yy = parseInt(dateStr.substring(4, 6), 10);
      const year = yy < 50 ? 2000 + yy : 1900 + yy;
      return new Date(year, month - 1, day);
    }

    // Parse DDMM format (assume current year)
    if (dateStr.length === 4) {
      const day = parseInt(dateStr.substring(0, 2), 10);
      const month = parseInt(dateStr.substring(2, 4), 10);
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day);
    }

    return new Date();
  }

  /**
   * Validate mapping completeness
   */
  validateMapping(mapping: DatevImportMapping): {
    isComplete: boolean;
    missingMappings: string[];
    warnings: string[];
  } {
    const missingMappings: string[] = [];
    const warnings: string[] = [];

    // Check for unmapped accounts
    for (const unmapped of mapping.unmappedAccounts) {
      missingMappings.push(
        `${unmapped.datevAccount}: ${unmapped.datevAccountName || 'Unknown'}`,
      );
    }

    // Check for low-confidence automatic mappings
    for (const mapped of mapping.accountMappings) {
      if (mapped.confidence < 0.9 && mapped.mappingType === 'automatic') {
        warnings.push(
          `Low confidence mapping for ${mapped.datevAccount}: ${mapped.datevAccountName} -> ${mapped.operateAccountName} (${Math.round(mapped.confidence * 100)}%)`,
        );
      }
    }

    return {
      isComplete: missingMappings.length === 0,
      missingMappings,
      warnings,
    };
  }
}
