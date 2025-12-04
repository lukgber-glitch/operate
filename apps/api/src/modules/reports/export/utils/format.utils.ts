/**
 * Formatting Utilities for Report Exports
 */

export class FormatUtils {
  /**
   * Format currency value
   */
  static formatCurrency(
    value: number,
    currency: string = 'EUR',
    locale: string = 'de-DE',
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format percentage value
   */
  static formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Format date
   */
  static formatDate(
    date: Date | string,
    locale: string = 'de-DE',
    timezone: string = 'Europe/Berlin',
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  }

  /**
   * Format date and time
   */
  static formatDateTime(
    date: Date | string,
    locale: string = 'de-DE',
    timezone: string = 'Europe/Berlin',
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(dateObj);
  }

  /**
   * Format number
   */
  static formatNumber(
    value: number,
    locale: string = 'de-DE',
    decimals: number = 2,
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format bytes to human readable
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Truncate text
   */
  static truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Capitalize first letter
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Convert to title case
   */
  static toTitleCase(text: string): string {
    return text
      .split(' ')
      .map(word => this.capitalize(word.toLowerCase()))
      .join(' ');
  }

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Convert RGB to hex color
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Get contrast color (black or white) for background
   */
  static getContrastColor(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return '#000000';

    // Calculate luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phone: string, countryCode: string = 'DE'): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    if (countryCode === 'DE') {
      // Format German phone numbers
      if (cleaned.startsWith('49')) {
        const national = cleaned.substring(2);
        return `+49 ${national.substring(0, 3)} ${national.substring(3)}`;
      }
      if (cleaned.startsWith('0')) {
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
      }
    }

    return phone;
  }

  /**
   * Format tax ID
   */
  static formatTaxId(taxId: string, country: string = 'DE'): string {
    const cleaned = taxId.replace(/\s/g, '');

    if (country === 'DE') {
      // German tax ID format: DE123456789
      if (cleaned.startsWith('DE')) {
        return cleaned;
      }
      return `DE${cleaned}`;
    }

    return taxId;
  }

  /**
   * Format IBAN
   */
  static formatIban(iban: string): string {
    // Remove all spaces
    const cleaned = iban.replace(/\s/g, '').toUpperCase();

    // Add space every 4 characters
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Generate unique ID
   */
  static generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }
}
