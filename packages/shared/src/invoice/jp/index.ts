/**
 * Japan Qualified Invoice System (インボイス制度) Utilities
 *
 * This module provides utilities for working with Japan's Qualified Invoice System,
 * implemented on October 1, 2023.
 *
 * Features:
 * - Registration number validation (T + 13 digits with check digit)
 * - Invoice number generation in Japanese formats
 * - Type definitions for qualified invoices
 * - Support for multiple tax rates (10% standard, 8% reduced)
 */

// Types
export * from './qualified-invoice.types';

// Registration Number Validation
export {
  calculateCheckDigit as calculateJPRegistrationCheckDigit,
  isValidFormat as isValidJPRegistrationFormat,
  isValidCheckDigit as isValidJPRegistrationCheckDigit,
  validateRegistrationNumber,
  parseRegistrationNumber,
  generateRegistrationNumber,
  formatRegistrationNumber,
} from './registration-number.validator';

// Invoice Number Generation
export {
  generateInvoiceNumber,
  parseInvoiceNumber,
  isValidInvoiceNumber,
  getNextInvoiceNumber,
  createInvoiceNumberFormat,
  getFiscalYear,
  generateFiscalYearInvoiceNumber,
  JAPANESE_INVOICE_FORMATS,
} from './invoice-number.generator';
