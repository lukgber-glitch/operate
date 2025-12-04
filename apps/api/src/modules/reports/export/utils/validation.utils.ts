/**
 * Validation Utilities for Report Exports
 */

export class ValidationUtils {
  /**
   * Validate report data structure
   */
  static validateReportData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('Report data is required');
      return { valid: false, errors };
    }

    if (typeof data !== 'object') {
      errors.push('Report data must be an object');
      return { valid: false, errors };
    }

    // Validate date range if present
    if (data.dateRange) {
      if (!data.dateRange.from || !data.dateRange.to) {
        errors.push('Date range must have both from and to dates');
      }

      if (data.dateRange.from && data.dateRange.to) {
        const from = new Date(data.dateRange.from);
        const to = new Date(data.dateRange.to);

        if (isNaN(from.getTime())) {
          errors.push('Invalid from date in date range');
        }

        if (isNaN(to.getTime())) {
          errors.push('Invalid to date in date range');
        }

        if (from > to) {
          errors.push('From date must be before to date');
        }
      }
    }

    // Validate columns and rows if present
    if (data.columns) {
      if (!Array.isArray(data.columns)) {
        errors.push('Columns must be an array');
      } else {
        data.columns.forEach((col: any, index: number) => {
          if (!col.key) {
            errors.push(`Column at index ${index} missing required field: key`);
          }
          if (!col.header) {
            errors.push(`Column at index ${index} missing required field: header`);
          }
        });
      }
    }

    if (data.rows) {
      if (!Array.isArray(data.rows)) {
        errors.push('Rows must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file size
   */
  static validateFileSize(sizeBytes: number, maxSizeMb: number): boolean {
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    return sizeBytes <= maxSizeBytes;
  }

  /**
   * Validate hex color
   */
  static isValidHexColor(color: string): boolean {
    return /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(color);
  }

  /**
   * Validate email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date
   */
  static isValidDate(date: any): boolean {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  }

  /**
   * Validate currency code
   */
  static isValidCurrencyCode(code: string): boolean {
    const validCurrencies = [
      'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'AUD', 'CAD',
      'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
    ];
    return validCurrencies.includes(code.toUpperCase());
  }

  /**
   * Validate language code
   */
  static isValidLanguageCode(code: string): boolean {
    const validLanguages = ['de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'cs'];
    return validLanguages.includes(code.toLowerCase());
  }

  /**
   * Validate timezone
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate page size
   */
  static isValidPageSize(size: string): boolean {
    const validSizes = ['A4', 'A3', 'LETTER', 'LEGAL'];
    return validSizes.includes(size.toUpperCase());
  }

  /**
   * Validate orientation
   */
  static isValidOrientation(orientation: string): boolean {
    return ['portrait', 'landscape'].includes(orientation.toLowerCase());
  }

  /**
   * Sanitize input string
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[^\w\s\-\.@]/gi, '') // Keep only alphanumeric, spaces, hyphens, dots, @
      .trim();
  }

  /**
   * Validate numeric range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate array not empty
   */
  static isNonEmptyArray(value: any): boolean {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Validate object not empty
   */
  static isNonEmptyObject(value: any): boolean {
    return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
  }

  /**
   * Deep clone object (for validation purposes)
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if value is numeric
   */
  static isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  /**
   * Validate file extension
   */
  static hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }

  /**
   * Validate MIME type
   */
  static isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }
}
