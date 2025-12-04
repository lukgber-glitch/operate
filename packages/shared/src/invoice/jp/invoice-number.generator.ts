/**
 * Invoice Number Generator for Japanese Invoices
 * Generates invoice numbers in the format: {Prefix}-{YYYYMM}-{Sequence}
 * Example: INV-202403-0001
 */

import { InvoiceNumberFormat, DEFAULT_INVOICE_NUMBER_FORMAT } from './qualified-invoice.types';

/**
 * Generate an invoice number based on the provided format
 *
 * @param sequenceNumber - Current sequence number
 * @param date - Invoice date (defaults to current date)
 * @param format - Invoice number format configuration
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(
  sequenceNumber: number,
  date: Date = new Date(),
  format: InvoiceNumberFormat = DEFAULT_INVOICE_NUMBER_FORMAT,
): string {
  const parts: string[] = [];

  // Add prefix
  if (format.prefix) {
    parts.push(format.prefix);
  }

  // Add date components
  const dateComponents: string[] = [];

  if (format.includeYear) {
    dateComponents.push(date.getFullYear().toString());
  }

  if (format.includeMonth) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    dateComponents.push(month);
  }

  if (dateComponents.length > 0) {
    parts.push(dateComponents.join(''));
  }

  // Add sequence number with padding
  const paddedSequence = sequenceNumber.toString().padStart(format.sequenceLength, '0');
  parts.push(paddedSequence);

  // Join with separator
  return parts.join(format.separator);
}

/**
 * Parse an invoice number to extract its components
 *
 * @param invoiceNumber - Invoice number to parse
 * @param format - Invoice number format configuration
 * @returns Parsed components or null if invalid
 */
export function parseInvoiceNumber(
  invoiceNumber: string,
  format: InvoiceNumberFormat = DEFAULT_INVOICE_NUMBER_FORMAT,
): {
  prefix: string;
  year?: number;
  month?: number;
  sequenceNumber: number;
} | null {
  const parts = invoiceNumber.split(format.separator);
  let partIndex = 0;

  // Extract prefix
  const prefix = parts[partIndex++];
  if (prefix !== format.prefix) {
    return null;
  }

  // Extract date components
  let year: number | undefined;
  let month: number | undefined;

  if (format.includeYear || format.includeMonth) {
    const datePart = parts[partIndex++];
    if (!datePart) {
      return null;
    }

    let dateIndex = 0;

    if (format.includeYear) {
      const yearStr = datePart.substring(dateIndex, dateIndex + 4);
      year = parseInt(yearStr, 10);
      dateIndex += 4;
    }

    if (format.includeMonth) {
      const monthStr = datePart.substring(dateIndex, dateIndex + 2);
      month = parseInt(monthStr, 10);
    }
  }

  // Extract sequence number
  const sequencePart = parts[partIndex];
  if (!sequencePart) {
    return null;
  }

  const sequenceNumber = parseInt(sequencePart, 10);

  return {
    prefix,
    year,
    month,
    sequenceNumber,
  };
}

/**
 * Validate an invoice number format
 *
 * @param invoiceNumber - Invoice number to validate
 * @param format - Invoice number format configuration
 * @returns True if the invoice number matches the format
 */
export function isValidInvoiceNumber(
  invoiceNumber: string,
  format: InvoiceNumberFormat = DEFAULT_INVOICE_NUMBER_FORMAT,
): boolean {
  return parseInvoiceNumber(invoiceNumber, format) !== null;
}

/**
 * Get the next invoice number in sequence
 *
 * @param currentInvoiceNumber - Current invoice number
 * @param format - Invoice number format configuration
 * @returns Next invoice number in sequence, or null if current number is invalid
 */
export function getNextInvoiceNumber(
  currentInvoiceNumber: string,
  format: InvoiceNumberFormat = DEFAULT_INVOICE_NUMBER_FORMAT,
): string | null {
  const parsed = parseInvoiceNumber(currentInvoiceNumber, format);
  if (!parsed) {
    return null;
  }

  // Construct date from parsed components
  const date = new Date();
  if (parsed.year !== undefined) {
    date.setFullYear(parsed.year);
  }
  if (parsed.month !== undefined) {
    date.setMonth(parsed.month - 1);
  }

  return generateInvoiceNumber(parsed.sequenceNumber + 1, date, format);
}

/**
 * Create a custom invoice number format
 *
 * @param options - Partial format configuration
 * @returns Complete invoice number format
 */
export function createInvoiceNumberFormat(
  options: Partial<InvoiceNumberFormat>,
): InvoiceNumberFormat {
  return {
    ...DEFAULT_INVOICE_NUMBER_FORMAT,
    ...options,
  };
}

/**
 * Common Japanese invoice number formats
 */
export const JAPANESE_INVOICE_FORMATS = {
  /**
   * Standard format: INV-202403-0001
   */
  STANDARD: DEFAULT_INVOICE_NUMBER_FORMAT,

  /**
   * Year and month format: INV-2024-03-0001
   */
  YEAR_MONTH_SEPARATED: createInvoiceNumberFormat({
    prefix: 'INV',
    includeYear: true,
    includeMonth: true,
    sequenceLength: 4,
    separator: '-',
  }),

  /**
   * Fiscal year format: FY2024-0001
   * Note: Japanese fiscal year runs from April to March
   */
  FISCAL_YEAR: createInvoiceNumberFormat({
    prefix: 'FY',
    includeYear: true,
    includeMonth: false,
    sequenceLength: 4,
    separator: '-',
  }),

  /**
   * Simple sequential: INV-00001
   */
  SIMPLE_SEQUENTIAL: createInvoiceNumberFormat({
    prefix: 'INV',
    includeYear: false,
    includeMonth: false,
    sequenceLength: 5,
    separator: '-',
  }),

  /**
   * Japanese prefix: 請求-202403-0001
   */
  JAPANESE_PREFIX: createInvoiceNumberFormat({
    prefix: '請求',
    includeYear: true,
    includeMonth: true,
    sequenceLength: 4,
    separator: '-',
  }),
};

/**
 * Get the fiscal year for a given date
 * Japanese fiscal year runs from April 1 to March 31
 *
 * @param date - Date to get fiscal year for
 * @returns Fiscal year (e.g., 2024 for FY2024 which runs from April 2024 to March 2025)
 */
export function getFiscalYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // If month is January (0), February (1), or March (2), fiscal year is previous calendar year
  if (month < 3) {
    return year - 1;
  }

  return year;
}

/**
 * Generate a fiscal year based invoice number
 *
 * @param sequenceNumber - Sequence number within the fiscal year
 * @param date - Invoice date (defaults to current date)
 * @returns Formatted invoice number with fiscal year
 */
export function generateFiscalYearInvoiceNumber(
  sequenceNumber: number,
  date: Date = new Date(),
): string {
  const fiscalYear = getFiscalYear(date);
  const customFormat = createInvoiceNumberFormat({
    prefix: `FY${fiscalYear}`,
    includeYear: false,
    includeMonth: false,
    sequenceLength: 4,
    separator: '-',
  });

  return generateInvoiceNumber(sequenceNumber, date, customFormat);
}
