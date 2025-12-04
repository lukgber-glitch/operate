import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  ConflictException,
} from '@nestjs/common';
import { SiiErrorCode } from './constants/sii.constants';
import { SiiSoapFault } from './interfaces/sii-response.interface';

/**
 * SII Error Handler Service
 * Handles and maps SII-specific error codes to appropriate exceptions
 */
@Injectable()
export class SiiErrorHandlerService {
  private readonly logger = new Logger(SiiErrorHandlerService.name);

  /**
   * Error code mappings from AEAT documentation
   */
  private readonly ERROR_MESSAGES: Record<string, string> = {
    // Authentication/Certificate errors (1xxx)
    '1001': 'Invalid certificate',
    '1002': 'Certificate has expired',
    '1003': 'Certificate has been revoked',
    '1004': 'Unauthorized access - certificate not recognized',
    '1005': 'Invalid NIF in certificate',

    // Validation errors (2xxx)
    '2001': 'Invalid NIF format',
    '2002': 'Invalid invoice number format',
    '2003': 'Invalid date format or date out of range',
    '2004': 'Invalid amount - must be positive and properly formatted',
    '2005': 'Duplicate invoice - invoice already exists in SII',
    '2006': 'Invoice not found in SII registry',
    '2007': 'Invalid VAT key code',
    '2008': 'Invalid operation type',
    '2009': 'Invalid invoice type',
    '2010': 'Missing required field',
    '2011': 'Invalid period format',
    '2012': 'Invalid counterparty data',

    // Business logic errors (3xxx)
    '3001': 'Invoice submitted outside 4-day window',
    '3002': 'Period is closed for submissions',
    '3003': 'Cannot submit rectification without original invoice',
    '3004': 'Inconsistent data - totals do not match line items',
    '3005': 'Invalid rectification type for this invoice',
    '3006': 'Cannot delete invoice that has been processed',

    // System errors (5xxx)
    '5001': 'SII service temporarily unavailable',
    '5002': 'Request timeout',
    '5003': 'Internal SII error',
    '5004': 'Rate limit exceeded - too many requests',
    '5005': 'Service maintenance in progress',
  };

  /**
   * Handle SII error and throw appropriate exception
   */
  handleError(errorCode: string, errorMessage?: string): never {
    const message =
      errorMessage ||
      this.ERROR_MESSAGES[errorCode] ||
      `SII error: ${errorCode}`;

    this.logger.error(`SII Error [${errorCode}]: ${message}`);

    // Authentication errors
    if (errorCode.startsWith('1')) {
      throw new UnauthorizedException(message);
    }

    // Validation errors
    if (errorCode.startsWith('2')) {
      // Duplicate invoice is a conflict
      if (errorCode === SiiErrorCode.DUPLICATE_INVOICE) {
        throw new ConflictException(message);
      }
      throw new BadRequestException(message);
    }

    // Business logic errors
    if (errorCode.startsWith('3')) {
      throw new BadRequestException(message);
    }

    // System errors
    if (errorCode.startsWith('5')) {
      throw new ServiceUnavailableException(message);
    }

    // Unknown error
    throw new ServiceUnavailableException(
      `Unexpected SII error: ${errorCode} - ${message}`,
    );
  }

  /**
   * Handle SOAP fault
   */
  handleSoapFault(fault: SiiSoapFault): never {
    const errorCode = this.extractErrorCodeFromFault(fault);
    const errorMessage = fault.faultString || fault.detail?.errorDescription;

    this.logger.error(
      `SOAP Fault [${fault.faultCode}]: ${fault.faultString}`,
      fault.detail,
    );

    if (errorCode) {
      this.handleError(errorCode, errorMessage);
    }

    // Generic SOAP fault handling
    if (fault.faultCode.includes('Client')) {
      throw new BadRequestException(
        `Invalid SOAP request: ${fault.faultString}`,
      );
    }

    if (fault.faultCode.includes('Server')) {
      throw new ServiceUnavailableException(
        `SII server error: ${fault.faultString}`,
      );
    }

    throw new ServiceUnavailableException(
      `SOAP communication error: ${fault.faultString}`,
    );
  }

  /**
   * Validate invoice before submission
   */
  validateInvoice(invoice: any): void {
    const errors: string[] = [];

    // Check NIF format
    if (!this.isValidNif(invoice.issuer?.nif)) {
      errors.push('Invalid issuer NIF');
    }
    if (!this.isValidNif(invoice.recipient?.nif)) {
      errors.push('Invalid recipient NIF');
    }

    // Check invoice number
    if (!invoice.invoiceId?.invoiceNumber || invoice.invoiceId.invoiceNumber.length > 60) {
      errors.push('Invalid invoice number (max 60 characters)');
    }

    // Check dates
    if (!invoice.invoiceId?.issueDate || !this.isValidDate(invoice.invoiceId.issueDate)) {
      errors.push('Invalid issue date');
    }

    // Check submission window (4 days)
    if (invoice.invoiceId?.issueDate) {
      const daysDiff = this.getDaysDifference(
        new Date(invoice.invoiceId.issueDate),
        new Date(),
      );
      if (daysDiff > 4) {
        errors.push(
          `Invoice must be submitted within 4 days of issue date (${daysDiff} days elapsed)`,
        );
      }
    }

    // Check amounts
    if (invoice.totalInvoiceAmount < 0) {
      errors.push('Total invoice amount must be positive');
    }

    // Validate VAT lines
    if (!invoice.vatLines || invoice.vatLines.length === 0) {
      errors.push('At least one VAT line is required');
    } else {
      invoice.vatLines.forEach((line: any, index: number) => {
        if (line.taxableBase < 0) {
          errors.push(`VAT line ${index + 1}: taxable base must be positive`);
        }
        if (line.vatRate < 0 || line.vatRate > 100) {
          errors.push(`VAT line ${index + 1}: VAT rate must be between 0 and 100`);
        }
        if (line.vatAmount < 0) {
          errors.push(`VAT line ${index + 1}: VAT amount must be positive`);
        }
      });

      // Validate totals
      const calculatedTotal = invoice.vatLines.reduce(
        (sum: number, line: any) => sum + line.taxableBase + line.vatAmount,
        0,
      );
      const diff = Math.abs(calculatedTotal - invoice.totalInvoiceAmount);
      if (diff > 0.01) {
        // Allow 1 cent rounding difference
        errors.push(
          `Total invoice amount (${invoice.totalInvoiceAmount}) does not match sum of VAT lines (${calculatedTotal})`,
        );
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Invoice validation failed',
        errors,
      });
    }
  }

  /**
   * Validate NIF (Spanish tax ID)
   */
  private isValidNif(nif: string): boolean {
    if (!nif) return false;

    // Remove spaces and convert to uppercase
    const cleanNif = nif.replace(/\s/g, '').toUpperCase();

    // DNI: 8 digits + 1 letter
    const dniPattern = /^[0-9]{8}[A-Z]$/;
    // NIE: X/Y/Z + 7 digits + 1 letter
    const niePattern = /^[XYZ][0-9]{7}[A-Z]$/;
    // CIF: 1 letter + 7 digits + 1 letter/digit
    const cifPattern = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;

    return (
      dniPattern.test(cleanNif) ||
      niePattern.test(cleanNif) ||
      cifPattern.test(cleanNif)
    );
  }

  /**
   * Validate date
   */
  private isValidDate(date: any): boolean {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * Get days difference between two dates
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor(
      Math.abs((date2.getTime() - date1.getTime()) / oneDay),
    );
  }

  /**
   * Extract error code from SOAP fault
   */
  private extractErrorCodeFromFault(fault: SiiSoapFault): string | null {
    // Check if error code is in detail
    if (fault.detail?.errorCode) {
      return fault.detail.errorCode;
    }

    // Try to extract from fault string
    const match = fault.faultString?.match(/\[(\d+)\]/);
    if (match) {
      return match[1];
    }

    // Map common SOAP fault codes to SII error codes
    if (fault.faultCode.includes('Unauthorized')) {
      return SiiErrorCode.UNAUTHORIZED;
    }
    if (fault.faultCode.includes('InvalidData')) {
      return SiiErrorCode.INVALID_AMOUNT;
    }

    return null;
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorCode: string): string {
    return (
      this.ERROR_MESSAGES[errorCode] || `Unknown error code: ${errorCode}`
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(errorCode: string): boolean {
    const retryableCodes = [
      SiiErrorCode.SERVICE_UNAVAILABLE,
      SiiErrorCode.TIMEOUT,
      SiiErrorCode.RATE_LIMIT_EXCEEDED,
    ];
    return retryableCodes.includes(errorCode as SiiErrorCode);
  }
}
