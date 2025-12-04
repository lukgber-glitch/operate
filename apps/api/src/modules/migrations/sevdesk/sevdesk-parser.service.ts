import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  SevDeskContact,
  SevDeskInvoice,
  SevDeskExpense,
  SevDeskProduct,
  SevDeskEntityType,
  ParsedSevDeskData,
} from './sevdesk.types';
import { SEVDESK_CSV_HEADERS, SEVDESK_DEFAULTS } from './sevdesk.constants';

/**
 * sevDesk Parser Service
 * Handles parsing of sevDesk CSV and Excel exports
 */
@Injectable()
export class SevDeskParserService {
  private readonly logger = new Logger(SevDeskParserService.name);

  /**
   * Parse sevDesk file (CSV or Excel)
   */
  async parseFile(
    filePath: string,
    entityType: SevDeskEntityType,
  ): Promise<ParsedSevDeskData> {
    const ext = path.extname(filePath).toLowerCase();

    try {
      let rawData: any[];

      if (ext === '.csv') {
        rawData = await this.parseCsv(filePath);
      } else if (ext === '.xlsx' || ext === '.xls') {
        rawData = await this.parseExcel(filePath);
      } else {
        throw new BadRequestException(`Unsupported file format: ${ext}`);
      }

      return this.parseByEntityType(rawData, entityType);
    } catch (error) {
      this.logger.error(`Failed to parse file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCsv(filePath: string): Promise<any[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new BadRequestException('Empty CSV file');
    }

    const headers = this.parseCsvLine(lines[0]);
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }

    return records;
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(filePath: string): Promise<any[]> {
    // Note: In production, use a library like 'xlsx' or 'exceljs'
    // For now, we'll throw a descriptive error
    throw new BadRequestException(
      'Excel parsing requires additional dependencies. Please convert to CSV or install xlsx library.',
    );
  }

  /**
   * Parse data by entity type
   */
  private parseByEntityType(
    rawData: any[],
    entityType: SevDeskEntityType,
  ): ParsedSevDeskData {
    const result: ParsedSevDeskData = {
      contacts: [],
      invoices: [],
      expenses: [],
      products: [],
      rawData,
    };

    switch (entityType) {
      case SevDeskEntityType.CONTACT:
        result.contacts = rawData.map(row => this.parseContact(row));
        break;
      case SevDeskEntityType.INVOICE:
        result.invoices = rawData.map(row => this.parseInvoice(row));
        break;
      case SevDeskEntityType.EXPENSE:
        result.expenses = rawData.map(row => this.parseExpense(row));
        break;
      case SevDeskEntityType.PRODUCT:
        result.products = rawData.map(row => this.parseProduct(row));
        break;
      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }

    return result;
  }

  /**
   * Parse contact from raw data
   */
  private parseContact(row: any): SevDeskContact {
    return {
      id: this.findValue(row, ['id', 'ID', 'Id']),
      name: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.NAME),
      customerNumber: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.CUSTOMER_NUMBER),
      email: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.EMAIL),
      phone: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.PHONE),
      website: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.WEBSITE),
      street: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.STREET),
      zip: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.ZIP),
      city: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.CITY),
      country: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.COUNTRY) || SEVDESK_DEFAULTS.COUNTRY,
      taxNumber: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.TAX_NUMBER),
      vatNumber: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.VAT_NUMBER),
      category: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.CATEGORY),
      description: this.findValue(row, SEVDESK_CSV_HEADERS.CONTACT.DESCRIPTION),
    };
  }

  /**
   * Parse invoice from raw data
   */
  private parseInvoice(row: any): SevDeskInvoice {
    return {
      id: this.findValue(row, ['id', 'ID', 'Id']),
      invoiceNumber: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.INVOICE_NUMBER),
      contactName: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.CONTACT_NAME),
      invoiceDate: this.parseDate(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.INVOICE_DATE)),
      deliveryDate: this.parseDate(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.DELIVERY_DATE)),
      status: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.STATUS) || SEVDESK_DEFAULTS.INVOICE_STATUS,
      header: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.HEADER),
      headText: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.HEAD_TEXT),
      footText: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.FOOT_TEXT),
      addressName: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.ADDRESS_NAME),
      addressStreet: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.ADDRESS_STREET),
      addressZip: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.ADDRESS_ZIP),
      addressCity: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.ADDRESS_CITY),
      addressCountry: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.ADDRESS_COUNTRY) || SEVDESK_DEFAULTS.COUNTRY,
      currency: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.CURRENCY) || SEVDESK_DEFAULTS.CURRENCY,
      sumNet: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.SUM_NET)),
      sumTax: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.SUM_TAX)),
      sumGross: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.SUM_GROSS)),
      sumDiscount: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.SUM_DISCOUNT)),
      customerInternalNote: this.findValue(row, SEVDESK_CSV_HEADERS.INVOICE.CUSTOMER_NOTE),
    };
  }

  /**
   * Parse expense from raw data
   */
  private parseExpense(row: any): SevDeskExpense {
    return {
      id: this.findValue(row, ['id', 'ID', 'Id']),
      date: this.parseDate(this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.DATE)),
      supplier: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.SUPPLIER),
      description: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.DESCRIPTION),
      category: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.CATEGORY),
      amount: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.AMOUNT)),
      taxRate: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.TAX_RATE)),
      taxAmount: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.TAX_AMOUNT)),
      currency: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.CURRENCY) || SEVDESK_DEFAULTS.CURRENCY,
      paymentMethod: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.PAYMENT_METHOD),
      receiptNumber: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.RECEIPT_NUMBER),
      notes: this.findValue(row, SEVDESK_CSV_HEADERS.EXPENSE.NOTES),
    };
  }

  /**
   * Parse product from raw data
   */
  private parseProduct(row: any): SevDeskProduct {
    return {
      id: this.findValue(row, ['id', 'ID', 'Id']),
      name: this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.NAME),
      productNumber: this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.PRODUCT_NUMBER),
      description: this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.DESCRIPTION),
      price: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.PRICE)),
      pricePurchase: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.PRICE_PURCHASE)),
      priceNet: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.PRICE_NET)),
      priceGross: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.PRICE_GROSS)),
      taxRate: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.TAX_RATE)),
      unity: this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.UNITY) || SEVDESK_DEFAULTS.UNITY,
      category: this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.CATEGORY),
      stock: this.parseNumber(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.STOCK)),
      stockEnabled: this.parseBoolean(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.STOCK_ENABLED)),
      active: this.parseBoolean(this.findValue(row, SEVDESK_CSV_HEADERS.PRODUCT.ACTIVE)),
    };
  }

  /**
   * Find value from row by trying multiple possible header names
   */
  private findValue(row: any, possibleKeys: string[]): string | undefined {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
    return undefined;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string | undefined): Date | string {
    if (!dateStr) return new Date();

    try {
      // Try common German date formats
      const patterns = [
        /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern.source.startsWith('^(\\d{4})')) {
            // YYYY-MM-DD
            return new Date(`${match[1]}-${match[2]}-${match[3]}`);
          } else {
            // DD.MM.YYYY or DD/MM/YYYY
            return new Date(`${match[3]}-${match[2]}-${match[1]}`);
          }
        }
      }

      // Fallback to native Date parsing
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return dateStr; // Return as string if cannot parse
    } catch (error) {
      this.logger.warn(`Failed to parse date: ${dateStr}`);
      return dateStr;
    }
  }

  /**
   * Parse number from string
   */
  private parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;

    try {
      // Remove currency symbols, spaces, and convert German decimal separator
      const cleaned = value
        .replace(/[€$£\s]/g, '')
        .replace(/\./g, '') // Remove thousand separator
        .replace(',', '.'); // Convert decimal separator

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: string | undefined): boolean | undefined {
    if (!value) return undefined;

    const lowerValue = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'ja', 'aktiv', 'active'].includes(lowerValue)) {
      return true;
    }
    if (['false', '0', 'no', 'nein', 'inaktiv', 'inactive'].includes(lowerValue)) {
      return false;
    }

    return undefined;
  }
}
