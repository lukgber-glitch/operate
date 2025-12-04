/**
 * JP-PINT Validator
 *
 * Validates Japanese-specific business identifiers and invoice requirements
 * - Corporate Number (法人番号) validation with check digit algorithm
 * - Invoice Registry Number validation (T + 13 digits)
 * - Japanese address validation
 * - Tax category validation
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  JP_CORPORATE_NUMBER_LENGTH,
  JP_CORPORATE_NUMBER_REGEX,
  JP_INVOICE_REGISTRY_REGEX,
  JP_INVOICE_REGISTRY_PREFIX,
  JP_TAX_CATEGORIES,
  JP_TAX_RATES,
  JP_ADDRESS_FORMAT,
  JP_PINT_ERROR_CODES,
  JP_PEPPOL_SCHEME,
} from './jp-pint.constants';
import {
  CorporateNumberValidation,
  InvoiceRegistryValidation,
  JPPINTValidationResult,
  JPPINTValidationError,
  JapaneseAddress,
  JPPINTInvoice,
} from './jp-pint.types';

/**
 * JP-PINT Validator Service
 */
@Injectable()
export class JPPINTValidator {
  private readonly logger = new Logger(JPPINTValidator.name);

  /**
   * Validate Corporate Number (法人番号)
   * Uses check digit algorithm specified by Japan's National Tax Agency
   *
   * Algorithm:
   * 1. Take first 12 digits
   * 2. Multiply each digit by its position weight (1-12 from left)
   * 3. Sum all products
   * 4. Calculate: 9 - (sum % 9)
   * 5. If result is 9, check digit is 0; otherwise use the result
   */
  validateCorporateNumber(corporateNumber: string): CorporateNumberValidation {
    // Remove any spaces or hyphens
    const cleaned = corporateNumber.replace(/[\s-]/g, '');

    // Check format
    if (!JP_CORPORATE_NUMBER_REGEX.test(cleaned)) {
      return {
        isValid: false,
        number: corporateNumber,
        checkDigit: -1,
        calculatedCheckDigit: -1,
        error: 'Corporate number must be exactly 13 digits',
      };
    }

    // Extract digits
    const digits = cleaned.split('').map(Number);
    const checkDigit = digits[0]; // First digit is the check digit
    const baseDigits = digits.slice(1); // Remaining 12 digits

    // Calculate check digit
    const calculatedCheckDigit = this.calculateCorporateNumberCheckDigit(baseDigits);

    // Validate
    const isValid = checkDigit === calculatedCheckDigit;

    return {
      isValid,
      number: cleaned,
      checkDigit,
      calculatedCheckDigit,
      error: isValid
        ? undefined
        : `Check digit mismatch: expected ${calculatedCheckDigit}, got ${checkDigit}`,
    };
  }

  /**
   * Calculate Corporate Number check digit
   * Algorithm from Japan's National Tax Agency
   */
  private calculateCorporateNumberCheckDigit(digits: number[]): number {
    if (digits.length !== 12) {
      throw new Error('Corporate number must have 12 base digits');
    }

    // Position weights: 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

    // Calculate sum of products
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const product = digits[i] * weights[i];
      // If product is 2 digits, sum the digits
      sum += product < 10 ? product : Math.floor(product / 10) + (product % 10);
    }

    // Calculate check digit
    const remainder = sum % 9;
    const checkDigit = remainder === 0 ? 0 : 9 - remainder;

    return checkDigit;
  }

  /**
   * Validate Invoice Registry Number (適格請求書発行事業者登録番号)
   * Format: T + 13-digit Corporate Number
   */
  validateInvoiceRegistryNumber(registryNumber: string): InvoiceRegistryValidation {
    // Remove any spaces or hyphens
    const cleaned = registryNumber.replace(/[\s-]/g, '').toUpperCase();

    // Check format
    if (!JP_INVOICE_REGISTRY_REGEX.test(cleaned)) {
      return {
        isValid: false,
        registryNumber,
        corporateNumber: '',
        hasPrefix: cleaned.startsWith(JP_INVOICE_REGISTRY_PREFIX),
        error: 'Invoice registry number must be T followed by 13 digits',
      };
    }

    // Extract corporate number (remove 'T' prefix)
    const corporateNumber = cleaned.substring(1);

    // Validate corporate number
    const corporateValidation = this.validateCorporateNumber(corporateNumber);

    if (!corporateValidation.isValid) {
      return {
        isValid: false,
        registryNumber: cleaned,
        corporateNumber,
        hasPrefix: true,
        error: `Invalid corporate number: ${corporateValidation.error}`,
      };
    }

    return {
      isValid: true,
      registryNumber: cleaned,
      corporateNumber,
      hasPrefix: true,
    };
  }

  /**
   * Validate Japanese address
   */
  validateJapaneseAddress(address: JapaneseAddress): JPPINTValidationError[] {
    const errors: JPPINTValidationError[] = [];

    // Validate postal code
    if (!address.postalCode) {
      errors.push({
        field: 'address.postalCode',
        message: 'Postal code is required',
        severity: 'ERROR',
        code: 'JP_ADDRESS_001',
        jpSpecific: true,
        japaneseMessage: '郵便番号は必須です',
      });
    } else if (!JP_ADDRESS_FORMAT.POSTAL_CODE_REGEX.test(address.postalCode)) {
      errors.push({
        field: 'address.postalCode',
        message: 'Invalid postal code format (expected: xxx-xxxx)',
        severity: 'ERROR',
        code: 'JP_ADDRESS_002',
        jpSpecific: true,
        japaneseMessage: '郵便番号の形式が不正です（xxx-xxxx形式）',
      });
    }

    // Validate prefecture
    if (!address.prefecture) {
      errors.push({
        field: 'address.prefecture',
        message: 'Prefecture is required',
        severity: 'ERROR',
        code: 'JP_ADDRESS_003',
        jpSpecific: true,
        japaneseMessage: '都道府県は必須です',
      });
    }

    // Validate city
    if (!address.city) {
      errors.push({
        field: 'address.city',
        message: 'City is required',
        severity: 'ERROR',
        code: 'JP_ADDRESS_004',
        jpSpecific: true,
        japaneseMessage: '市区町村は必須です',
      });
    }

    // Validate address line 1
    if (!address.addressLine1) {
      errors.push({
        field: 'address.addressLine1',
        message: 'Address line 1 is required',
        severity: 'ERROR',
        code: 'JP_ADDRESS_005',
        jpSpecific: true,
        japaneseMessage: '番地は必須です',
      });
    }

    // Validate country code
    if (address.countryCode !== 'JP') {
      errors.push({
        field: 'address.countryCode',
        message: 'Country code must be JP for Japanese addresses',
        severity: 'ERROR',
        code: 'JP_ADDRESS_006',
        jpSpecific: true,
        japaneseMessage: '国コードはJPである必要があります',
      });
    }

    return errors;
  }

  /**
   * Validate Japanese tax category
   */
  validateTaxCategory(category: string, rate: number): JPPINTValidationError[] {
    const errors: JPPINTValidationError[] = [];

    // Check if category is valid
    const validCategories = Object.values(JP_TAX_CATEGORIES);
    if (!validCategories.includes(category)) {
      errors.push({
        field: 'taxCategory',
        message: `Invalid tax category: ${category}`,
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.INVALID_TAX_CATEGORY,
        jpSpecific: true,
        japaneseMessage: `不正な税区分: ${category}`,
      });
      return errors;
    }

    // Validate tax rate matches category
    if (category === JP_TAX_CATEGORIES.STANDARD && rate !== JP_TAX_RATES.STANDARD) {
      errors.push({
        field: 'taxRate',
        message: `Standard tax rate should be ${JP_TAX_RATES.STANDARD}%, got ${rate}%`,
        severity: 'WARNING',
        code: 'JP_TAX_001',
        jpSpecific: true,
        japaneseMessage: `標準税率は${JP_TAX_RATES.STANDARD}%である必要があります`,
      });
    }

    if (category === JP_TAX_CATEGORIES.REDUCED && rate !== JP_TAX_RATES.REDUCED) {
      errors.push({
        field: 'taxRate',
        message: `Reduced tax rate should be ${JP_TAX_RATES.REDUCED}%, got ${rate}%`,
        severity: 'WARNING',
        code: 'JP_TAX_002',
        jpSpecific: true,
        japaneseMessage: `軽減税率は${JP_TAX_RATES.REDUCED}%である必要があります`,
      });
    }

    return errors;
  }

  /**
   * Validate JP-PINT Invoice
   */
  validateJPPINTInvoice(invoice: JPPINTInvoice): JPPINTValidationResult {
    const errors: JPPINTValidationError[] = [];
    const warnings: JPPINTValidationError[] = [];

    // Validate timestamp (required for Japanese invoices)
    if (!invoice.timestamp) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required for Japanese invoices',
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.MISSING_TIMESTAMP,
        jpSpecific: true,
        japaneseMessage: 'タイムスタンプは必須です',
      });
    }

    // Validate currency
    if (invoice.currency !== 'JPY') {
      errors.push({
        field: 'currency',
        message: 'Currency must be JPY for Japanese invoices',
        severity: 'ERROR',
        code: 'JP_INVOICE_001',
        jpSpecific: true,
        japaneseMessage: '通貨は日本円（JPY）である必要があります',
      });
    }

    // Validate supplier
    if (invoice.supplier.participantId.scheme !== JP_PEPPOL_SCHEME) {
      errors.push({
        field: 'supplier.participantId.scheme',
        message: `Supplier participant scheme must be ${JP_PEPPOL_SCHEME} for Japan`,
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.INVALID_PARTICIPANT_SCHEME,
        jpSpecific: true,
        japaneseMessage: `供給者の参加者スキームは${JP_PEPPOL_SCHEME}である必要があります`,
      });
    }

    // Validate supplier corporate number
    const supplierCorpValidation = this.validateCorporateNumber(
      invoice.supplier.corporateNumber,
    );
    if (!supplierCorpValidation.isValid) {
      errors.push({
        field: 'supplier.corporateNumber',
        message: supplierCorpValidation.error || 'Invalid corporate number',
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.INVALID_CORPORATE_NUMBER,
        jpSpecific: true,
        japaneseMessage: '供給者の法人番号が不正です',
      });
    }

    // Validate supplier invoice registry number
    if (invoice.invoiceRegistryNumberSupplier) {
      const registryValidation = this.validateInvoiceRegistryNumber(
        invoice.invoiceRegistryNumberSupplier,
      );
      if (!registryValidation.isValid) {
        errors.push({
          field: 'supplier.invoiceRegistryNumber',
          message: registryValidation.error || 'Invalid invoice registry number',
          severity: 'ERROR',
          code: JP_PINT_ERROR_CODES.INVALID_INVOICE_REGISTRY,
          jpSpecific: true,
          japaneseMessage: '供給者の適格請求書発行事業者登録番号が不正です',
        });
      }
    }

    // Validate supplier address
    const supplierAddressErrors = this.validateJapaneseAddress(invoice.supplier.address);
    errors.push(...supplierAddressErrors);

    // Validate customer
    if (invoice.customer.participantId.scheme !== JP_PEPPOL_SCHEME) {
      errors.push({
        field: 'customer.participantId.scheme',
        message: `Customer participant scheme must be ${JP_PEPPOL_SCHEME} for Japan`,
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.INVALID_PARTICIPANT_SCHEME,
        jpSpecific: true,
        japaneseMessage: `顧客の参加者スキームは${JP_PEPPOL_SCHEME}である必要があります`,
      });
    }

    // Validate customer corporate number
    const customerCorpValidation = this.validateCorporateNumber(
      invoice.customer.corporateNumber,
    );
    if (!customerCorpValidation.isValid) {
      errors.push({
        field: 'customer.corporateNumber',
        message: customerCorpValidation.error || 'Invalid corporate number',
        severity: 'ERROR',
        code: JP_PINT_ERROR_CODES.INVALID_CORPORATE_NUMBER,
        jpSpecific: true,
        japaneseMessage: '顧客の法人番号が不正です',
      });
    }

    // Validate customer address
    const customerAddressErrors = this.validateJapaneseAddress(invoice.customer.address);
    errors.push(...customerAddressErrors);

    // Validate invoice lines - tax categories
    invoice.lines.forEach((line, index) => {
      const taxErrors = this.validateTaxCategory(
        line.taxCategory || 'S',
        line.taxPercent,
      );
      taxErrors.forEach((error) => {
        errors.push({
          ...error,
          field: `lines[${index}].${error.field}`,
        });
      });
    });

    // Validate tax breakdown
    if (!invoice.taxBreakdown || invoice.taxBreakdown.length === 0) {
      warnings.push({
        field: 'taxBreakdown',
        message: 'Tax breakdown is recommended for Japanese invoices',
        severity: 'WARNING',
        code: 'JP_INVOICE_002',
        jpSpecific: true,
        japaneseMessage: '税内訳の記載を推奨します',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      jpSpecificErrors: errors.filter((e) => e.jpSpecific),
    };
  }

  /**
   * Format corporate number with separators
   * Format: 1234-56-789012
   */
  formatCorporateNumber(corporateNumber: string): string {
    const cleaned = corporateNumber.replace(/[\s-]/g, '');
    if (cleaned.length !== JP_CORPORATE_NUMBER_LENGTH) {
      return corporateNumber;
    }
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6)}`;
  }

  /**
   * Format postal code
   * Format: xxx-xxxx
   */
  formatPostalCode(postalCode: string): string {
    const cleaned = postalCode.replace(/[\s-]/g, '');
    if (cleaned.length !== 7) {
      return postalCode;
    }
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
}
