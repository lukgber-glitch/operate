import * as iconv from 'iconv-lite';

/**
 * DATEV Encoding Utility
 * Handles conversion to CP1252 (Windows-1252) encoding required by DATEV
 */
export class DatevEncodingUtil {
  /**
   * Convert UTF-8 string to CP1252 (Windows-1252) Buffer
   * DATEV requires CP1252 encoding for German special characters
   *
   * @param text UTF-8 string
   * @returns Buffer in CP1252 encoding
   */
  static convertToCP1252(text: string): Buffer {
    return iconv.encode(text, 'win1252');
  }

  /**
   * Convert CP1252 Buffer back to UTF-8 string
   * Useful for reading DATEV files
   *
   * @param buffer CP1252 encoded buffer
   * @returns UTF-8 string
   */
  static convertFromCP1252(buffer: Buffer): string {
    return iconv.decode(buffer, 'win1252');
  }

  /**
   * Escape special characters for CSV
   * Double quotes inside fields must be escaped as double-double-quotes
   *
   * @param value Field value
   * @returns Escaped value
   */
  static escapeCsvField(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If field contains semicolon, double quote, or newline, it must be quoted
    if (
      stringValue.includes(';') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape double quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return stringValue;
  }

  /**
   * Format a CSV line with proper field escaping
   * Uses semicolon as delimiter (DATEV standard)
   *
   * @param fields Array of field values
   * @returns CSV line string
   */
  static formatCsvLine(
    fields: Array<string | number | null | undefined>,
  ): string {
    return fields.map((field) => this.escapeCsvField(field)).join(';');
  }

  /**
   * Sanitize text for DATEV export
   * Removes or replaces characters that might cause issues
   *
   * @param text Input text
   * @returns Sanitized text
   */
  static sanitizeText(text: string): string {
    if (!text) return '';

    return (
      text
        // Remove control characters except tab and newline
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Trim whitespace
        .trim()
        // Limit length (DATEV has field length limits)
        .substring(0, 255)
    );
  }

  /**
   * Format decimal number for DATEV
   * DATEV uses comma as decimal separator
   *
   * @param value Decimal value
   * @param decimals Number of decimal places (default: 2)
   * @returns Formatted string
   */
  static formatDecimal(value: number, decimals: number = 2): string {
    return value.toFixed(decimals).replace('.', ',');
  }

  /**
   * Format date for DATEV (DDMM or TTMMJJ)
   *
   * @param date Date object
   * @param format 'DDMM' or 'TTMMJJ' (default: DDMM)
   * @returns Formatted date string
   */
  static formatDate(date: Date, format: 'DDMM' | 'TTMMJJ' = 'DDMM'): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    if (format === 'DDMM') {
      return `${day}${month}`;
    } else {
      // TTMMJJ - day, month, 2-digit year
      const year = String(date.getFullYear()).slice(-2);
      return `${day}${month}${year}`;
    }
  }

  /**
   * Format date for DATEV header (YYYYMMDD)
   *
   * @param date Date object
   * @returns Formatted date as number (YYYYMMDD)
   */
  static formatHeaderDate(date: Date): number {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`, 10);
  }

  /**
   * Pad account number to specified length
   *
   * @param accountNumber Account number
   * @param length Target length (default: 4)
   * @returns Padded account number
   */
  static padAccountNumber(accountNumber: string, length: number = 4): string {
    return accountNumber.padStart(length, '0');
  }

  /**
   * Validate account number format
   *
   * @param accountNumber Account number
   * @returns true if valid
   */
  static isValidAccountNumber(accountNumber: string): boolean {
    // DATEV account numbers are typically 4-8 digits
    return /^\d{4,8}$/.test(accountNumber);
  }
}
