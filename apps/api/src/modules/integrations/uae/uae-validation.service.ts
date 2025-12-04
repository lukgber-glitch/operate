import { Injectable, Logger } from '@nestjs/common';
import {
  TRN_REGEX,
  TRN_FORMATTED_REGEX,
  EMIRATES_ID_REGEX,
  UAE_CURRENCIES,
  UAEVATRateCode,
} from './constants/uae.constants';
import {
  UAETRNValidation,
  EmiratesIDValidation,
  UAEInvoiceData,
  FTAError,
} from './interfaces/uae.types';

/**
 * UAE Validation Service
 * Validates TRN, Emirates ID, invoice data, and business rules
 */
@Injectable()
export class UAEValidationService {
  private readonly logger = new Logger(UAEValidationService.name);

  /**
   * Validate TRN (Tax Registration Number)
   * Format: 100XXXXXXXXXXXX (15 digits starting with 100)
   * Or formatted: 100-XXXX-XXXX-XXX-XXX
   */
  validateTRN(trn: string): UAETRNValidation {
    const errors: string[] = [];

    // Remove formatting characters
    const cleanTRN = trn.replace(/[-\s]/g, '');

    // Check if TRN matches the format
    if (!TRN_REGEX.test(cleanTRN)) {
      errors.push('TRN must be 15 digits starting with 100');
    }

    // Validate check digit (simplified - FTA uses proprietary algorithm)
    if (cleanTRN.length === 15) {
      const isValidCheckDigit = this.validateTRNCheckDigit(cleanTRN);
      if (!isValidCheckDigit) {
        errors.push('Invalid TRN check digit');
      }
    }

    return {
      trn: cleanTRN,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Validate TRN check digit using Luhn algorithm (simplified)
   * Note: Actual FTA algorithm may differ
   */
  private validateTRNCheckDigit(trn: string): boolean {
    try {
      const digits = trn.split('').map(Number);
      let sum = 0;

      // Apply Luhn algorithm
      for (let i = digits.length - 2; i >= 0; i--) {
        let digit = digits[i];
        if ((digits.length - 1 - i) % 2 === 0) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        sum += digit;
      }

      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[digits.length - 1];
    } catch (error) {
      this.logger.error(`TRN check digit validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Format TRN with dashes
   */
  formatTRN(trn: string): string {
    const cleanTRN = trn.replace(/[-\s]/g, '');
    if (cleanTRN.length !== 15) {
      return trn;
    }

    return `${cleanTRN.substring(0, 3)}-${cleanTRN.substring(3, 7)}-${cleanTRN.substring(7, 11)}-${cleanTRN.substring(11, 14)}-${cleanTRN.substring(14)}`;
  }

  /**
   * Validate Emirates ID
   * Format: XXX-XXXX-XXXXXXX-X (15 digits)
   */
  validateEmiratesID(emiratesId: string): EmiratesIDValidation {
    const errors: string[] = [];

    if (!EMIRATES_ID_REGEX.test(emiratesId)) {
      errors.push('Emirates ID must be in format XXX-XXXX-XXXXXXX-X');
    }

    // Extract digits for additional validation
    const digits = emiratesId.replace(/-/g, '');
    if (digits.length !== 15) {
      errors.push('Emirates ID must contain exactly 15 digits');
    }

    return {
      emiratesId,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Validate invoice data for FTA compliance
   */
  validateInvoiceData(invoice: UAEInvoiceData): FTAError[] {
    const errors: FTAError[] = [];

    // Required fields
    if (!invoice.invoiceNumber) {
      errors.push({
        code: 'VAL_004',
        message: 'Invoice number is required',
        field: 'invoiceNumber',
        severity: 'ERROR',
      });
    }

    if (!invoice.issueDate) {
      errors.push({
        code: 'VAL_004',
        message: 'Issue date is required',
        field: 'issueDate',
        severity: 'ERROR',
      });
    }

    // Validate supplier
    if (!invoice.supplier) {
      errors.push({
        code: 'VAL_004',
        message: 'Supplier information is required',
        field: 'supplier',
        severity: 'ERROR',
      });
    } else {
      const supplierErrors = this.validateParty(invoice.supplier, 'supplier');
      errors.push(...supplierErrors);
    }

    // Validate customer
    if (!invoice.customer) {
      errors.push({
        code: 'VAL_004',
        message: 'Customer information is required',
        field: 'customer',
        severity: 'ERROR',
      });
    } else {
      const customerErrors = this.validateParty(invoice.customer, 'customer');
      errors.push(...customerErrors);
    }

    // Validate line items
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      errors.push({
        code: 'VAL_004',
        message: 'At least one line item is required',
        field: 'lineItems',
        severity: 'ERROR',
      });
    } else {
      invoice.lineItems.forEach((item, index) => {
        const itemErrors = this.validateLineItem(item, index);
        errors.push(...itemErrors);
      });
    }

    // Validate totals
    if (!invoice.totals) {
      errors.push({
        code: 'VAL_004',
        message: 'Invoice totals are required',
        field: 'totals',
        severity: 'ERROR',
      });
    } else {
      const totalsErrors = this.validateTotals(invoice);
      errors.push(...totalsErrors);
    }

    // Validate currency
    if (invoice.totals?.currency) {
      const currencyValid = Object.values(UAE_CURRENCIES).some(
        (c) => c.code === invoice.totals.currency,
      );
      if (!currencyValid) {
        errors.push({
          code: 'VAL_006',
          message: `Invalid currency code: ${invoice.totals.currency}`,
          field: 'totals.currency',
          severity: 'ERROR',
        });
      }
    }

    // Validate dates
    if (invoice.issueDate && invoice.dueDate) {
      if (new Date(invoice.dueDate) < new Date(invoice.issueDate)) {
        errors.push({
          code: 'VAL_005',
          message: 'Due date cannot be before issue date',
          field: 'dueDate',
          severity: 'ERROR',
        });
      }
    }

    return errors;
  }

  /**
   * Validate party information (supplier/customer)
   */
  private validateParty(party: any, prefix: string): FTAError[] {
    const errors: FTAError[] = [];

    if (!party.legalName) {
      errors.push({
        code: 'VAL_004',
        message: `${prefix} legal name is required`,
        field: `${prefix}.legalName`,
        severity: 'ERROR',
      });
    }

    if (!party.address) {
      errors.push({
        code: 'VAL_004',
        message: `${prefix} address is required`,
        field: `${prefix}.address`,
        severity: 'ERROR',
      });
    } else {
      if (!party.address.cityName) {
        errors.push({
          code: 'VAL_004',
          message: `${prefix} city is required`,
          field: `${prefix}.address.cityName`,
          severity: 'ERROR',
        });
      }
      if (!party.address.country) {
        errors.push({
          code: 'VAL_004',
          message: `${prefix} country is required`,
          field: `${prefix}.address.country`,
          severity: 'ERROR',
        });
      }
    }

    // Validate TRN if VAT registered
    if (party.vatRegistered && party.trn) {
      const trnValidation = this.validateTRN(party.trn);
      if (!trnValidation.valid) {
        errors.push({
          code: 'VAL_001',
          message: `Invalid ${prefix} TRN: ${trnValidation.errors?.join(', ')}`,
          field: `${prefix}.trn`,
          severity: 'ERROR',
        });
      }
    }

    return errors;
  }

  /**
   * Validate line item
   */
  private validateLineItem(item: any, index: number): FTAError[] {
    const errors: FTAError[] = [];
    const prefix = `lineItems[${index}]`;

    if (!item.description) {
      errors.push({
        code: 'VAL_004',
        message: 'Line item description is required',
        field: `${prefix}.description`,
        severity: 'ERROR',
      });
    }

    if (item.quantity === undefined || item.quantity <= 0) {
      errors.push({
        code: 'VAL_007',
        message: 'Line item quantity must be greater than 0',
        field: `${prefix}.quantity`,
        severity: 'ERROR',
      });
    }

    if (item.unitPrice === undefined) {
      errors.push({
        code: 'VAL_004',
        message: 'Line item unit price is required',
        field: `${prefix}.unitPrice`,
        severity: 'ERROR',
      });
    }

    if (!item.taxCategory) {
      errors.push({
        code: 'VAL_004',
        message: 'Line item tax category is required',
        field: `${prefix}.taxCategory`,
        severity: 'ERROR',
      });
    } else {
      const validCategories = Object.values(UAEVATRateCode);
      if (!validCategories.includes(item.taxCategory)) {
        errors.push({
          code: 'VAL_003',
          message: `Invalid tax category: ${item.taxCategory}`,
          field: `${prefix}.taxCategory`,
          severity: 'ERROR',
        });
      }
    }

    if (item.taxRate === undefined) {
      errors.push({
        code: 'VAL_004',
        message: 'Line item tax rate is required',
        field: `${prefix}.taxRate`,
        severity: 'ERROR',
      });
    }

    return errors;
  }

  /**
   * Validate invoice totals and calculations
   */
  private validateTotals(invoice: UAEInvoiceData): FTAError[] {
    const errors: FTAError[] = [];

    // Calculate expected line extension amount
    const calculatedLineTotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.lineExtensionAmount,
      0,
    );

    if (Math.abs(calculatedLineTotal - invoice.totals.lineExtensionAmount) > 0.01) {
      errors.push({
        code: 'VAL_003',
        message: 'Line extension amount does not match sum of line items',
        field: 'totals.lineExtensionAmount',
        severity: 'ERROR',
      });
    }

    // Calculate expected tax total
    const calculatedTaxTotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.taxAmount,
      0,
    );

    if (Math.abs(calculatedTaxTotal - invoice.totals.taxTotalAmount) > 0.01) {
      errors.push({
        code: 'VAL_003',
        message: 'Tax total amount does not match sum of line item taxes',
        field: 'totals.taxTotalAmount',
        severity: 'ERROR',
      });
    }

    // Validate tax inclusive amount
    const expectedTaxInclusive =
      invoice.totals.taxExclusiveAmount + invoice.totals.taxTotalAmount;

    if (Math.abs(expectedTaxInclusive - invoice.totals.taxInclusiveAmount) > 0.01) {
      errors.push({
        code: 'VAL_003',
        message: 'Tax inclusive amount calculation is incorrect',
        field: 'totals.taxInclusiveAmount',
        severity: 'ERROR',
      });
    }

    // Validate payable amount
    let expectedPayable = invoice.totals.taxInclusiveAmount;
    if (invoice.totals.prepaidAmount) {
      expectedPayable -= invoice.totals.prepaidAmount;
    }
    if (invoice.totals.roundingAmount) {
      expectedPayable += invoice.totals.roundingAmount;
    }

    if (Math.abs(expectedPayable - invoice.totals.payableAmount) > 0.01) {
      errors.push({
        code: 'VAL_003',
        message: 'Payable amount calculation is incorrect',
        field: 'totals.payableAmount',
        severity: 'ERROR',
      });
    }

    return errors;
  }

  /**
   * Validate VAT return period
   */
  validateVATReturnPeriod(startDate: Date, endDate: Date, filingPeriod: 'MONTHLY' | 'QUARTERLY'): boolean {
    const monthsDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1;

    if (filingPeriod === 'MONTHLY' && monthsDiff !== 1) {
      return false;
    }

    if (filingPeriod === 'QUARTERLY' && monthsDiff !== 3) {
      return false;
    }

    return true;
  }

  /**
   * Check if date is within invoice retention period
   */
  isWithinRetentionPeriod(date: Date): boolean {
    const retentionYears = 5;
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

    return date >= cutoffDate;
  }
}
