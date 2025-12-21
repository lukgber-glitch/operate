/**
 * PII Masking Service
 * Detects and masks personally identifiable information in text
 * to prevent sensitive data leakage to external AI services
 */

import { Injectable, Logger } from '@nestjs/common';

export enum MaskingLevel {
  STRICT = 'strict',      // Mask everything aggressively
  MODERATE = 'moderate',  // Balanced masking (default)
  MINIMAL = 'minimal',    // Only mask highly sensitive data
}

export interface MaskingOptions {
  level?: MaskingLevel;
  preserveFormat?: boolean; // Keep similar character count
}

export interface MaskedField {
  type: 'email' | 'phone' | 'iban' | 'tax_id' | 'credit_card' | 'ssn';
  original: string;
  masked: string;
  position: number;
}

export interface MaskedResult {
  maskedText: string;
  maskedFields: MaskedField[];
  originalLength: number;
  maskedCount: number;
}

@Injectable()
export class PiiMaskingService {
  private readonly logger = new Logger(PiiMaskingService.name);

  // Regex patterns for PII detection
  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    germanTaxId: /\b\d{11}\b/g, // German tax ID (11 digits)
    usTaxId: /\b\d{3}-\d{2}-\d{4}\b/g, // US SSN format
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    // Additional patterns
    ukNationalInsurance: /\b[A-Z]{2}\d{6}[A-D]\b/g,
  };

  /**
   * Mask PII in text according to specified options
   */
  maskPII(text: string, options: MaskingOptions = {}): MaskedResult {
    const level = options.level || MaskingLevel.MODERATE;
    const preserveFormat = options.preserveFormat !== false;

    const maskedFields: MaskedField[] = [];
    let maskedText = text;
    let maskedCount = 0;

    // Email masking
    maskedText = this.maskEmails(maskedText, level, preserveFormat, maskedFields);

    // Phone number masking
    maskedText = this.maskPhones(maskedText, level, preserveFormat, maskedFields);

    // IBAN masking
    maskedText = this.maskIBANs(maskedText, level, preserveFormat, maskedFields);

    // Tax ID masking
    maskedText = this.maskTaxIds(maskedText, level, preserveFormat, maskedFields);

    // Credit card masking
    maskedText = this.maskCreditCards(maskedText, level, preserveFormat, maskedFields);

    maskedCount = maskedFields.length;

    if (maskedCount > 0) {
      this.logger.debug(`Masked ${maskedCount} PII fields in text`);
    }

    return {
      maskedText,
      maskedFields,
      originalLength: text.length,
      maskedCount,
    };
  }

  /**
   * Mask email addresses
   */
  private maskEmails(
    text: string,
    level: MaskingLevel,
    preserveFormat: boolean,
    maskedFields: MaskedField[],
  ): string {
    return text.replace(this.patterns.email, (match, offset) => {
      const masked = this.getMaskedEmail(match, level, preserveFormat);
      maskedFields.push({
        type: 'email',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });
  }

  /**
   * Get masked email based on level
   */
  private getMaskedEmail(email: string, level: MaskingLevel, preserveFormat: boolean): string {
    const parts = email.split('@');
    const local = parts[0] || '';
    const domain = parts[1] || '';

    switch (level) {
      case MaskingLevel.STRICT:
        return '***@***.***';

      case MaskingLevel.MINIMAL:
        // Keep first 2 chars of local and full domain
        const maskedLocal = local.length > 2
          ? local.substring(0, 2) + '*'.repeat(Math.min(local.length - 2, 3))
          : '***';
        return `${maskedLocal}@${domain}`;

      case MaskingLevel.MODERATE:
      default:
        // Keep first char of local and domain TLD
        const firstChar = local.charAt(0) || '*';
        const domainParts = domain.split('.');
        const domainName = domainParts[0] || '';
        const tld = domainParts[1] || '***';
        if (preserveFormat) {
          return `${firstChar}${'*'.repeat(Math.min(Math.max(local.length - 1, 0), 5))}@${'*'.repeat(Math.min(domainName.length || 3, 3))}.${tld}`;
        }
        return '***@***.com';
    }
  }

  /**
   * Mask phone numbers
   */
  private maskPhones(
    text: string,
    level: MaskingLevel,
    preserveFormat: boolean,
    maskedFields: MaskedField[],
  ): string {
    return text.replace(this.patterns.phone, (match, offset) => {
      const masked = this.getMaskedPhone(match, level, preserveFormat);
      maskedFields.push({
        type: 'phone',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });
  }

  /**
   * Get masked phone number
   */
  private getMaskedPhone(phone: string, level: MaskingLevel, preserveFormat: boolean): string {
    // Remove all non-digits to get raw number
    const digits = phone.replace(/\D/g, '');

    switch (level) {
      case MaskingLevel.STRICT:
        return '***-***-****';

      case MaskingLevel.MINIMAL:
        // Keep last 4 digits
        if (digits.length >= 4) {
          return '***-***-' + digits.slice(-4);
        }
        return '***-****';

      case MaskingLevel.MODERATE:
      default:
        // Keep last 2 digits if preserveFormat
        if (preserveFormat && digits.length >= 2) {
          return '***-***-**' + digits.slice(-2);
        }
        return '***-****';
    }
  }

  /**
   * Mask IBAN numbers
   */
  private maskIBANs(
    text: string,
    level: MaskingLevel,
    preserveFormat: boolean,
    maskedFields: MaskedField[],
  ): string {
    return text.replace(this.patterns.iban, (match, offset) => {
      const masked = this.getMaskedIBAN(match, level, preserveFormat);
      maskedFields.push({
        type: 'iban',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });
  }

  /**
   * Get masked IBAN
   */
  private getMaskedIBAN(iban: string, level: MaskingLevel, preserveFormat: boolean): string {
    const countryCode = iban.substring(0, 2);
    const lastFour = iban.slice(-4);

    switch (level) {
      case MaskingLevel.STRICT:
        return '********************';

      case MaskingLevel.MINIMAL:
        // Keep country code and last 4
        return `${countryCode}${'*'.repeat(Math.max(iban.length - 6, 10))}${lastFour}`;

      case MaskingLevel.MODERATE:
      default:
        // Keep country code and last 4
        if (preserveFormat) {
          return `${countryCode}${'*'.repeat(Math.max(iban.length - 6, 10))}${lastFour}`;
        }
        return `${countryCode}**************${lastFour}`;
    }
  }

  /**
   * Mask tax IDs (US SSN and German tax ID)
   */
  private maskTaxIds(
    text: string,
    level: MaskingLevel,
    preserveFormat: boolean,
    maskedFields: MaskedField[],
  ): string {
    // US SSN format
    text = text.replace(this.patterns.usTaxId, (match, offset) => {
      const masked = level === MaskingLevel.STRICT
        ? '***-**-****'
        : preserveFormat
        ? '***-**-' + match.slice(-4)
        : '***-**-****';

      maskedFields.push({
        type: 'tax_id',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });

    // German tax ID (11 digits)
    text = text.replace(this.patterns.germanTaxId, (match, offset) => {
      const masked = level === MaskingLevel.STRICT
        ? '***********'
        : preserveFormat
        ? '*******' + match.slice(-4)
        : '***********';

      maskedFields.push({
        type: 'tax_id',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });

    // UK National Insurance
    text = text.replace(this.patterns.ukNationalInsurance, (match, offset) => {
      const masked = level === MaskingLevel.STRICT
        ? '**********'
        : match.substring(0, 2) + '******' + match.slice(-1);

      maskedFields.push({
        type: 'tax_id',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });

    return text;
  }

  /**
   * Mask credit card numbers
   */
  private maskCreditCards(
    text: string,
    level: MaskingLevel,
    preserveFormat: boolean,
    maskedFields: MaskedField[],
  ): string {
    return text.replace(this.patterns.creditCard, (match, offset) => {
      const masked = this.getMaskedCreditCard(match, level, preserveFormat);
      maskedFields.push({
        type: 'credit_card',
        original: match,
        masked,
        position: offset,
      });
      return masked;
    });
  }

  /**
   * Get masked credit card number
   */
  private getMaskedCreditCard(cardNumber: string, level: MaskingLevel, preserveFormat: boolean): string {
    const digits = cardNumber.replace(/\D/g, '');
    const separator = cardNumber.includes('-') ? '-' : cardNumber.includes(' ') ? ' ' : '';

    switch (level) {
      case MaskingLevel.STRICT:
        return separator ? `****${separator}****${separator}****${separator}****` : '****************';

      case MaskingLevel.MINIMAL:
      case MaskingLevel.MODERATE:
      default:
        // Keep last 4 digits
        if (digits.length >= 4 && preserveFormat) {
          const lastFour = digits.slice(-4);
          return separator
            ? `****${separator}****${separator}****${separator}${lastFour}`
            : `************${lastFour}`;
        }
        return separator ? `****${separator}****${separator}****${separator}****` : '****************';
    }
  }

  /**
   * Check if text contains any PII (without masking)
   */
  containsPII(text: string): boolean {
    return (
      this.patterns.email.test(text) ||
      this.patterns.phone.test(text) ||
      this.patterns.iban.test(text) ||
      this.patterns.germanTaxId.test(text) ||
      this.patterns.usTaxId.test(text) ||
      this.patterns.creditCard.test(text) ||
      this.patterns.ukNationalInsurance.test(text)
    );
  }

  /**
   * Get PII types present in text
   */
  detectPIITypes(text: string): string[] {
    const types: string[] = [];

    if (this.patterns.email.test(text)) types.push('email');
    if (this.patterns.phone.test(text)) types.push('phone');
    if (this.patterns.iban.test(text)) types.push('iban');
    if (this.patterns.germanTaxId.test(text) || this.patterns.usTaxId.test(text)) {
      types.push('tax_id');
    }
    if (this.patterns.creditCard.test(text)) types.push('credit_card');

    return types;
  }
}
