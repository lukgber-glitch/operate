/**
 * BMD Formatter Utility
 * Handles Austrian-specific formatting for BMD exports
 */

/**
 * Format date for BMD (DD.MM.YYYY)
 */
export function formatBmdDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format number for BMD (Austrian locale: 1.234,56)
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatBmdNumber(value: number, decimals: number = 2): string {
  // Handle null/undefined
  if (value === null || value === undefined || isNaN(value)) {
    return '0' + ',00'.padEnd(decimals + 1, '0');
  }

  // Round to specified decimals
  const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Convert to Austrian format
  const parts = Math.abs(rounded).toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separator (dot)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Combine with comma as decimal separator
  let result = `${formattedInteger},${decimalPart}`;

  // Add minus sign if negative
  if (rounded < 0) {
    result = `-${result}`;
  }

  return result;
}

/**
 * Format Austrian account number (4-digit with leading zeros)
 */
export function formatBmdAccountNumber(accountNumber: string | number): string {
  const numStr = String(accountNumber).replace(/\D/g, '');
  return numStr.padStart(4, '0').substring(0, 4);
}

/**
 * Format Austrian VAT ID (UID-Nummer)
 * Format: ATU12345678
 */
export function formatBmdVatId(vatId: string | null | undefined): string {
  if (!vatId) return '';

  // Remove spaces, dashes, and convert to uppercase
  let cleaned = vatId.toUpperCase().replace(/[\s\-]/g, '');

  // Ensure AT prefix
  if (!cleaned.startsWith('AT')) {
    // If it starts with U and has digits, add AT
    if (cleaned.startsWith('U') && /U\d{8}/.test(cleaned)) {
      cleaned = 'AT' + cleaned;
    } else if (/^\d{8}$/.test(cleaned)) {
      // If it's just 8 digits, add ATU
      cleaned = 'ATU' + cleaned;
    } else {
      // Otherwise just add AT
      cleaned = 'AT' + cleaned;
    }
  }

  // Validate format: ATU followed by 8 digits
  if (!/^ATU\d{8}$/.test(cleaned)) {
    return '';
  }

  return cleaned;
}

/**
 * Format percentage for BMD (20.00 for 20%)
 */
export function formatBmdPercentage(percentage: number): string {
  return formatBmdNumber(percentage, 2);
}

/**
 * Escape CSV field for BMD export
 * Handles quotes, semicolons, and line breaks
 */
export function escapeBmdCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const str = String(field);

  // If field contains semicolon, quote, or line break, wrap in quotes
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape existing quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str;
}

/**
 * Create CSV line for BMD export (semicolon-separated)
 */
export function createBmdCsvLine(fields: (string | number | null | undefined)[]): string {
  const escapedFields = fields.map(field => {
    if (typeof field === 'number') {
      return formatBmdNumber(field);
    }
    return escapeBmdCsvField(String(field ?? ''));
  });

  return escapedFields.join(';');
}

/**
 * Format currency code for BMD
 */
export function formatBmdCurrency(currency: string | null | undefined): string {
  if (!currency) return 'EUR';
  return currency.toUpperCase();
}

/**
 * Map country code to BMD format
 * ISO 3166-1 alpha-2 codes
 */
export function formatBmdCountryCode(countryCode: string | null | undefined): string {
  if (!countryCode) return 'AT';
  return countryCode.toUpperCase().substring(0, 2);
}

/**
 * Format tax code for BMD
 * Common Austrian tax codes:
 * - V20: 20% standard VAT
 * - V13: 13% reduced VAT
 * - V10: 10% reduced VAT (old rate)
 * - V0: 0% VAT
 * - VF: Tax-free
 */
export function formatBmdTaxCode(taxRate: number | null | undefined): string {
  if (taxRate === null || taxRate === undefined) {
    return '';
  }

  // Map common Austrian VAT rates
  if (taxRate === 20) return 'V20';
  if (taxRate === 13) return 'V13';
  if (taxRate === 10) return 'V10';
  if (taxRate === 0) return 'V0';

  // For other rates, format as V + percentage
  return `V${Math.round(taxRate)}`;
}

/**
 * Map account type to BMD format
 * A = Asset (Aktiva)
 * L = Liability (Passiva)
 * E = Equity (Eigenkapital)
 * I = Income (Ertrag)
 * X = Expense (Aufwand)
 */
export function mapAccountTypeToBmd(accountType: string | null | undefined): string {
  if (!accountType) return 'A';

  const type = accountType.toUpperCase();

  // Map common account types
  const typeMap: Record<string, string> = {
    'ASSET': 'A',
    'ASSETS': 'A',
    'LIABILITY': 'L',
    'LIABILITIES': 'L',
    'EQUITY': 'E',
    'INCOME': 'I',
    'REVENUE': 'I',
    'EXPENSE': 'X',
    'EXPENSES': 'X',
  };

  return typeMap[type] || 'A';
}

/**
 * Convert encoding from UTF-8 to ISO-8859-1
 * BMD supports both but ISO-8859-1 is sometimes preferred
 */
export function convertToIso88591(text: string): Buffer {
  // Node.js supports latin1 which is equivalent to ISO-8859-1
  return Buffer.from(text, 'latin1');
}

/**
 * Sanitize text for BMD export
 * Remove or replace problematic characters
 */
export function sanitizeBmdText(text: string | null | undefined, maxLength?: number): string {
  if (!text) return '';

  let sanitized = String(text)
    // Remove control characters except tab, newline, carriage return
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Replace problematic characters
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2026/g, '...') // Ellipsis
    // Normalize whitespace
    .trim();

  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Generate BMD export filename
 */
export function generateBmdFilename(orgId: string, year?: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const orgSuffix = orgId.substring(0, 8);
  const yearSuffix = year ? `_${year}` : '';
  return `bmd_export${yearSuffix}_${timestamp}_${orgSuffix}.zip`;
}
