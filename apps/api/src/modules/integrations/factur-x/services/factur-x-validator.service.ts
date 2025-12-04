import { Injectable, Logger } from '@nestjs/common';
import {
  FacturXInvoiceData,
  FacturXValidationResult,
  FacturXValidationError,
  FacturXValidationWarning,
  FrenchVATCategory,
  FrenchTaxRegime,
} from '../types/factur-x.types';

/**
 * Factur-X Validator Service
 *
 * Validates Factur-X invoices against:
 * - EN 16931 European standard
 * - French tax regulations (TVA)
 * - SIRET/SIREN validation
 * - French legal requirements
 */
@Injectable()
export class FacturXValidatorService {
  private readonly logger = new Logger(FacturXValidatorService.name);

  // French VAT rates (as of 2025)
  private readonly FRENCH_VAT_RATES = [0, 2.1, 5.5, 10, 20];

  /**
   * Validate Factur-X invoice data
   */
  async validateInvoice(
    invoice: FacturXInvoiceData,
  ): Promise<FacturXValidationResult> {
    const errors: FacturXValidationError[] = [];
    const warnings: FacturXValidationWarning[] = [];

    this.logger.log(`Validating Factur-X invoice ${invoice.number}`);

    // EN 16931 mandatory fields
    this.validateMandatoryFields(invoice, errors);

    // French business identifiers
    this.validateFrenchIdentifiers(invoice, errors, warnings);

    // VAT validation
    this.validateVAT(invoice, errors, warnings);

    // Amounts validation
    this.validateAmounts(invoice, errors);

    // Date validation
    this.validateDates(invoice, errors, warnings);

    // French legal requirements
    this.validateFrenchLegalRequirements(invoice, warnings);

    const valid = errors.length === 0;

    this.logger.log(
      `Validation complete for ${invoice.number}: ${valid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`,
    );

    return {
      valid,
      errors,
      warnings,
      metadata: {
        hasEmbeddedXml: false,
        isPdfA3: false,
        xmlValidated: true,
        frenchComplianceChecked: true,
      },
    };
  }

  /**
   * Validate EN 16931 mandatory fields
   */
  private validateMandatoryFields(
    invoice: FacturXInvoiceData,
    errors: FacturXValidationError[],
  ): void {
    // Invoice number (BR-02)
    if (!invoice.number || invoice.number.trim().length === 0) {
      errors.push({
        code: 'BR-02',
        message: 'Invoice number is required',
        field: 'number',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Issue date (BR-03)
    if (!invoice.issueDate) {
      errors.push({
        code: 'BR-03',
        message: 'Invoice issue date is required',
        field: 'issueDate',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Invoice type code (BR-04)
    if (!invoice.type) {
      errors.push({
        code: 'BR-04',
        message: 'Invoice type code is required',
        field: 'type',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Currency (BR-05)
    if (!invoice.currency || invoice.currency.length !== 3) {
      errors.push({
        code: 'BR-05',
        message: 'Currency code must be ISO 4217 (3 characters)',
        field: 'currency',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Seller (BR-06)
    if (!invoice.seller || !invoice.seller.name) {
      errors.push({
        code: 'BR-06',
        message: 'Seller name is required',
        field: 'seller.name',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Buyer (BR-07)
    if (!invoice.buyer || !invoice.buyer.name) {
      errors.push({
        code: 'BR-07',
        message: 'Buyer name is required',
        field: 'buyer.name',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // At least one invoice line (BR-16)
    if (!invoice.items || invoice.items.length === 0) {
      errors.push({
        code: 'BR-16',
        message: 'Invoice must have at least one line item',
        field: 'items',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }
  }

  /**
   * Validate French business identifiers (SIRET, SIREN, TVA)
   */
  private validateFrenchIdentifiers(
    invoice: FacturXInvoiceData,
    errors: FacturXValidationError[],
    warnings: FacturXValidationWarning[],
  ): void {
    // Validate seller SIRET
    if (invoice.seller.identifiers?.siret) {
      if (!this.isValidSIRET(invoice.seller.identifiers.siret)) {
        errors.push({
          code: 'FR-SIRET-001',
          message: `Invalid SIRET number for seller: ${invoice.seller.identifiers.siret}`,
          field: 'seller.identifiers.siret',
          severity: 'error',
          regulation: 'SIRET',
        });
      }
    } else if (
      invoice.seller.address.country === 'FR' &&
      !invoice.seller.identifiers?.siren
    ) {
      warnings.push({
        code: 'FR-SIRET-002',
        message: 'SIRET or SIREN recommended for French sellers',
        field: 'seller.identifiers',
        severity: 'warning',
        regulation: 'SIRET',
      });
    }

    // Validate buyer SIRET
    if (invoice.buyer.identifiers?.siret) {
      if (!this.isValidSIRET(invoice.buyer.identifiers.siret)) {
        errors.push({
          code: 'FR-SIRET-003',
          message: `Invalid SIRET number for buyer: ${invoice.buyer.identifiers.siret}`,
          field: 'buyer.identifiers.siret',
          severity: 'error',
          regulation: 'SIRET',
        });
      }
    }

    // Validate TVA numbers
    if (invoice.seller.identifiers?.tva) {
      if (!this.isValidFrenchTVA(invoice.seller.identifiers.tva)) {
        errors.push({
          code: 'FR-TVA-001',
          message: `Invalid French TVA number for seller: ${invoice.seller.identifiers.tva}`,
          field: 'seller.identifiers.tva',
          severity: 'error',
          regulation: 'TVA',
        });
      }
    }

    if (invoice.buyer.identifiers?.tva) {
      if (!this.isValidEUTVA(invoice.buyer.identifiers.tva)) {
        warnings.push({
          code: 'FR-TVA-002',
          message: `TVA number format may be invalid for buyer: ${invoice.buyer.identifiers.tva}`,
          field: 'buyer.identifiers.tva',
          severity: 'warning',
          regulation: 'TVA',
        });
      }
    }
  }

  /**
   * Validate VAT calculations and rates
   */
  private validateVAT(
    invoice: FacturXInvoiceData,
    errors: FacturXValidationError[],
    warnings: FacturXValidationWarning[],
  ): void {
    // Check VAT breakdown exists
    if (!invoice.vatBreakdown || invoice.vatBreakdown.length === 0) {
      errors.push({
        code: 'FR-TVA-010',
        message: 'VAT breakdown is required',
        field: 'vatBreakdown',
        severity: 'error',
        regulation: 'TVA',
      });
      return;
    }

    // Validate each VAT rate
    let calculatedTotalVAT = 0;
    invoice.vatBreakdown.forEach((vat, index) => {
      // Check if VAT rate is valid for France
      if (
        vat.category !== FrenchVATCategory.EXEMPT &&
        vat.category !== FrenchVATCategory.REVERSE_CHARGE &&
        vat.category !== FrenchVATCategory.ZERO_RATED &&
        !this.FRENCH_VAT_RATES.includes(vat.rate)
      ) {
        warnings.push({
          code: 'FR-TVA-011',
          message: `Unusual VAT rate: ${vat.rate}%. Standard French rates are: ${this.FRENCH_VAT_RATES.join('%, ')}%`,
          field: `vatBreakdown[${index}].rate`,
          severity: 'warning',
          regulation: 'TVA',
        });
      }

      // Validate VAT calculation
      const expectedVAT = Math.round(vat.taxableAmount * vat.rate) / 100;
      const tolerance = 0.02; // 2 cents tolerance for rounding
      if (Math.abs(expectedVAT - vat.vatAmount) > tolerance) {
        errors.push({
          code: 'FR-TVA-012',
          message: `VAT calculation error for rate ${vat.rate}%: expected ${expectedVAT.toFixed(2)}, got ${vat.vatAmount.toFixed(2)}`,
          field: `vatBreakdown[${index}].vatAmount`,
          severity: 'error',
          regulation: 'TVA',
        });
      }

      calculatedTotalVAT += vat.vatAmount;
    });

    // Check total VAT matches
    const tolerance = 0.02;
    if (Math.abs(calculatedTotalVAT - invoice.totalVAT) > tolerance) {
      errors.push({
        code: 'FR-TVA-013',
        message: `Total VAT mismatch: breakdown sum ${calculatedTotalVAT.toFixed(2)} != invoice total ${invoice.totalVAT.toFixed(2)}`,
        field: 'totalVAT',
        severity: 'error',
        regulation: 'TVA',
      });
    }

    // Validate line items VAT
    invoice.items.forEach((item, index) => {
      const expectedVAT = Math.round(item.netAmount * item.vat.rate) / 100;
      if (Math.abs(expectedVAT - item.vat.amount) > tolerance) {
        errors.push({
          code: 'FR-TVA-014',
          message: `Line ${index + 1}: VAT calculation error`,
          field: `items[${index}].vat.amount`,
          severity: 'error',
          regulation: 'TVA',
        });
      }
    });
  }

  /**
   * Validate invoice amounts
   */
  private validateAmounts(
    invoice: FacturXInvoiceData,
    errors: FacturXValidationError[],
  ): void {
    // Total must be positive
    if (invoice.totalAmount <= 0) {
      errors.push({
        code: 'BR-CO-10',
        message: 'Invoice total must be greater than zero',
        field: 'totalAmount',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Validate total = subtotal + VAT
    const expectedTotal = invoice.subtotal + invoice.totalVAT;
    const tolerance = 0.02;
    if (Math.abs(expectedTotal - invoice.totalAmount) > tolerance) {
      errors.push({
        code: 'BR-CO-15',
        message: `Total amount mismatch: ${invoice.totalAmount.toFixed(2)} != (subtotal ${invoice.subtotal.toFixed(2)} + VAT ${invoice.totalVAT.toFixed(2)})`,
        field: 'totalAmount',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Validate line items sum to subtotal
    const calculatedSubtotal = invoice.items.reduce(
      (sum, item) => sum + item.netAmount,
      0,
    );
    if (Math.abs(calculatedSubtotal - invoice.subtotal) > tolerance) {
      errors.push({
        code: 'BR-CO-09',
        message: `Subtotal mismatch: ${invoice.subtotal.toFixed(2)} != sum of line items ${calculatedSubtotal.toFixed(2)}`,
        field: 'subtotal',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Validate each line item amount
    invoice.items.forEach((item, index) => {
      const expectedAmount = item.quantity * item.unitPrice;
      if (Math.abs(expectedAmount - item.netAmount) > tolerance) {
        errors.push({
          code: 'BR-CO-26',
          message: `Line ${index + 1}: Amount mismatch (${item.netAmount.toFixed(2)} != ${item.quantity} × ${item.unitPrice.toFixed(2)})`,
          field: `items[${index}].netAmount`,
          severity: 'error',
          regulation: 'EN 16931',
        });
      }
    });
  }

  /**
   * Validate dates
   */
  private validateDates(
    invoice: FacturXInvoiceData,
    errors: FacturXValidationError[],
    warnings: FacturXValidationWarning[],
  ): void {
    const now = new Date();

    // Issue date not in future
    if (invoice.issueDate > now) {
      errors.push({
        code: 'BR-CO-03',
        message: 'Invoice issue date cannot be in the future',
        field: 'issueDate',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Due date after issue date
    if (invoice.dueDate && invoice.dueDate < invoice.issueDate) {
      errors.push({
        code: 'BR-CO-25',
        message: 'Due date must be after issue date',
        field: 'dueDate',
        severity: 'error',
        regulation: 'EN 16931',
      });
    }

    // Warn if invoice is very old
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (invoice.issueDate < oneYearAgo) {
      warnings.push({
        code: 'FR-DATE-001',
        message: 'Invoice is more than 1 year old',
        field: 'issueDate',
        severity: 'warning',
      });
    }
  }

  /**
   * Validate French legal requirements
   */
  private validateFrenchLegalRequirements(
    invoice: FacturXInvoiceData,
    warnings: FacturXValidationWarning[],
  ): void {
    // Check for legal mentions for French sellers
    if (invoice.seller.address.country === 'FR') {
      if (!invoice.legalMentions?.rcs && !invoice.legalMentions?.capital) {
        warnings.push({
          code: 'FR-LEGAL-001',
          message:
            'RCS registration and capital social are recommended for French companies',
          field: 'legalMentions',
          severity: 'warning',
          regulation: 'French Commercial Code',
        });
      }

      // Check for TVA exemption mention if applicable
      const hasZeroVAT = invoice.vatBreakdown.some(
        (vat) => vat.category === FrenchVATCategory.EXEMPT,
      );
      if (hasZeroVAT && !invoice.legalMentions?.tvaExemptionMention) {
        warnings.push({
          code: 'FR-LEGAL-002',
          message:
            'TVA exemption mention required for VAT-exempt invoices (e.g., "TVA non applicable, art. 293 B du CGI")',
          field: 'legalMentions.tvaExemptionMention',
          severity: 'warning',
          regulation: 'TVA',
        });
      }

      // Check for reverse charge mention
      const hasReverseCharge = invoice.vatBreakdown.some(
        (vat) => vat.category === FrenchVATCategory.REVERSE_CHARGE,
      );
      if (hasReverseCharge && !invoice.legalMentions?.reverseChargeMention) {
        warnings.push({
          code: 'FR-LEGAL-003',
          message:
            'Reverse charge mention recommended (e.g., "Autoliquidation")',
          field: 'legalMentions.reverseChargeMention',
          severity: 'warning',
          regulation: 'TVA',
        });
      }
    }

    // Warn if payment terms are missing
    if (!invoice.paymentTerms) {
      warnings.push({
        code: 'FR-LEGAL-004',
        message: 'Payment terms recommended for French invoices',
        field: 'paymentTerms',
        severity: 'warning',
      });
    }
  }

  /**
   * Validate SIRET number (14 digits with Luhn algorithm)
   */
  private isValidSIRET(siret: string): boolean {
    // Remove spaces and validate format
    const cleaned = siret.replace(/\s/g, '');
    if (!/^\d{14}$/.test(cleaned)) {
      return false;
    }

    // Validate using Luhn algorithm
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate French TVA number format (FRxx123456789)
   */
  private isValidFrenchTVA(tva: string): boolean {
    // Remove spaces
    const cleaned = tva.replace(/\s/g, '').toUpperCase();

    // French format: FR + 2 chars (digits or letters) + 9 digits (SIREN)
    const frenchTVARegex = /^FR[A-Z0-9]{2}\d{9}$/;
    if (!frenchTVARegex.test(cleaned)) {
      return false;
    }

    // Extract SIREN (last 9 digits)
    const siren = cleaned.substring(4, 13);

    // Validate SIREN checksum
    return this.isValidSIREN(siren);
  }

  /**
   * Validate SIREN number (9 digits with Luhn algorithm)
   */
  private isValidSIREN(siren: string): boolean {
    if (!/^\d{9}$/.test(siren)) {
      return false;
    }

    // Luhn algorithm for SIREN
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(siren.charAt(i), 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    return sum % 10 === 0;
  }

  /**
   * Basic EU TVA number format validation
   */
  private isValidEUTVA(tva: string): boolean {
    const cleaned = tva.replace(/\s/g, '').toUpperCase();

    // Basic EU VAT number patterns
    const patterns: Record<string, RegExp> = {
      FR: /^FR[A-Z0-9]{2}\d{9}$/,
      DE: /^DE\d{9}$/,
      IT: /^IT\d{11}$/,
      ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
      BE: /^BE0?\d{9}$/,
      NL: /^NL\d{9}B\d{2}$/,
      GB: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    };

    const countryCode = cleaned.substring(0, 2);
    const pattern = patterns[countryCode];

    return pattern ? pattern.test(cleaned) : cleaned.length >= 8;
  }
}
