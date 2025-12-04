import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  LexofficeMigrationType,
  ParsedMigrationData,
  LexofficeContact,
  LexofficeInvoice,
  LexofficeVoucher,
  LexofficeProduct,
  MigrationError,
  MigrationWarning,
  LexofficeInvoiceItem,
} from './lexoffice.types';
import {
  FIELD_MAPPINGS,
  DATE_FORMATS,
  CSV_PARSE_OPTIONS,
  STATUS_MAPPINGS,
  CONTACT_TYPE_MAPPINGS,
  VOUCHER_TYPE_MAPPINGS,
  DEFAULT_VALUES,
} from './lexoffice.constants';

dayjs.extend(customParseFormat);

@Injectable()
export class LexofficeParserService {
  private readonly logger = new Logger(LexofficeParserService.name);

  /**
   * Parse CSV or Excel file and extract structured data
   */
  async parseFile(
    buffer: Buffer,
    filename: string,
    migrationType: LexofficeMigrationType,
  ): Promise<ParsedMigrationData> {
    this.logger.log(`Parsing ${filename} for ${migrationType}`);

    try {
      const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');
      const rows = isExcel
        ? this.parseExcel(buffer)
        : this.parseCsv(buffer);

      if (!rows || rows.length === 0) {
        throw new Error('No data found in file');
      }

      this.logger.log(`Parsed ${rows.length} rows from file`);

      // Parse based on migration type
      switch (migrationType) {
        case LexofficeMigrationType.CONTACTS:
          return this.parseContacts(rows);
        case LexofficeMigrationType.INVOICES:
          return this.parseInvoices(rows);
        case LexofficeMigrationType.VOUCHERS:
          return this.parseVouchers(rows);
        case LexofficeMigrationType.PRODUCTS:
          return this.parseProducts(rows);
        default:
          throw new Error(`Unknown migration type: ${migrationType}`);
      }
    } catch (error) {
      this.logger.error(`Error parsing file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse Excel file to array of objects
   */
  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, {
      raw: false,
      defval: '',
    });
  }

  /**
   * Parse CSV file to array of objects
   */
  private parseCsv(buffer: Buffer): any[] {
    const csvString = buffer.toString('utf-8');
    const result = Papa.parse(csvString, {
      header: true,
      ...CSV_PARSE_OPTIONS,
    });

    if (result.errors.length > 0) {
      this.logger.warn(`CSV parsing warnings: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Parse contacts data
   */
  private parseContacts(rows: any[]): ParsedMigrationData {
    const contacts: LexofficeContact[] = [];
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    const fieldMapping = FIELD_MAPPINGS[LexofficeMigrationType.CONTACTS];

    rows.forEach((row, index) => {
      try {
        const mapped = this.mapFields(row, fieldMapping);

        // Validate required fields - at least one name field
        if (!mapped.companyName && !mapped.firstName && !mapped.lastName) {
          errors.push({
            row: index + 2, // +2 for header and 0-index
            message: 'Missing company name or personal name',
          });
          return;
        }

        // Map contact type
        if (mapped.type && typeof mapped.type === 'string') {
          mapped.type = CONTACT_TYPE_MAPPINGS[mapped.type] || mapped.type;
        } else {
          mapped.type = 'customer'; // Default
        }

        const contact: LexofficeContact = {
          contactNumber: mapped.contactNumber,
          companyName: mapped.companyName,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          type: mapped.type as any,
          email: mapped.email,
          phone: mapped.phone,
          mobile: mapped.mobile,
          website: mapped.website,
          street: mapped.street,
          zip: mapped.zip,
          city: mapped.city,
          country: mapped.country || DEFAULT_VALUES.country,
          vatId: this.cleanVatId(mapped.vatId),
          taxNumber: mapped.taxNumber,
          iban: this.cleanIban(mapped.iban),
          bic: mapped.bic,
          bankName: mapped.bankName,
          notes: mapped.notes,
          _rawData: row,
        };

        // Validate email format
        if (contact.email && !this.isValidEmail(contact.email)) {
          warnings.push({
            row: index + 2,
            field: 'email',
            message: 'Invalid email format',
            value: contact.email,
          });
          contact.email = undefined;
        }

        contacts.push(contact);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    return {
      type: LexofficeMigrationType.CONTACTS,
      contacts,
      errors,
      warnings,
    };
  }

  /**
   * Parse invoices data
   */
  private parseInvoices(rows: any[]): ParsedMigrationData {
    const invoices: LexofficeInvoice[] = [];
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    const fieldMapping = FIELD_MAPPINGS[LexofficeMigrationType.INVOICES];

    rows.forEach((row, index) => {
      try {
        const mapped = this.mapFields(row, fieldMapping);

        // Validate required fields
        if (!mapped.invoiceNumber) {
          errors.push({
            row: index + 2,
            field: 'invoiceNumber',
            message: 'Missing invoice number',
          });
          return;
        }

        if (!mapped.customerName) {
          errors.push({
            row: index + 2,
            field: 'customerName',
            message: 'Missing customer name',
          });
          return;
        }

        // Parse dates
        const invoiceDate = this.parseDate(mapped.invoiceDate);
        if (!invoiceDate) {
          errors.push({
            row: index + 2,
            field: 'invoiceDate',
            message: 'Invalid invoice date',
            value: mapped.invoiceDate,
          });
          return;
        }

        // Parse amounts
        const subtotal = this.parseGermanNumber(mapped.subtotal);
        const taxAmount = this.parseGermanNumber(mapped.taxAmount);
        const totalAmount = this.parseGermanNumber(mapped.totalAmount);

        if (totalAmount === null || totalAmount === undefined) {
          errors.push({
            row: index + 2,
            field: 'totalAmount',
            message: 'Invalid total amount',
            value: mapped.totalAmount,
          });
          return;
        }

        // Parse status
        let status = mapped.status;
        if (status && STATUS_MAPPINGS.invoices[status]) {
          status = STATUS_MAPPINGS.invoices[status];
        }

        const invoice: LexofficeInvoice = {
          invoiceNumber: mapped.invoiceNumber,
          status: status as any || 'open',
          customerNumber: mapped.customerNumber,
          customerName: mapped.customerName,
          customerAddress: mapped.customerAddress,
          customerEmail: mapped.customerEmail,
          customerVatId: this.cleanVatId(mapped.customerVatId),
          invoiceDate: invoiceDate,
          dueDate: this.parseDate(mapped.dueDate) || invoiceDate,
          deliveryDate: this.parseDate(mapped.deliveryDate),
          paidDate: this.parseDate(mapped.paidDate),
          subtotal: subtotal || 0,
          taxAmount: taxAmount || 0,
          totalAmount,
          currency: mapped.currency || DEFAULT_VALUES.currency,
          paymentTerms: mapped.paymentTerms,
          paymentMethod: mapped.paymentMethod,
          introduction: mapped.introduction,
          notes: mapped.notes,
          items: [], // Will be populated if line items are in separate rows
          _rawData: row,
        };

        // Create default line item if we have amounts but no items
        if (invoice.totalAmount > 0) {
          const item: LexofficeInvoiceItem = {
            position: 1,
            description: invoice.notes || 'Imported from lexoffice',
            quantity: 1,
            unitPrice: invoice.subtotal,
            taxRate: invoice.subtotal > 0
              ? (invoice.taxAmount / invoice.subtotal) * 100
              : DEFAULT_VALUES.taxRate,
            amount: invoice.subtotal,
            taxAmount: invoice.taxAmount,
          };
          invoice.items.push(item);
        }

        invoices.push(invoice);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    return {
      type: LexofficeMigrationType.INVOICES,
      invoices,
      errors,
      warnings,
    };
  }

  /**
   * Parse vouchers/expenses data
   */
  private parseVouchers(rows: any[]): ParsedMigrationData {
    const vouchers: LexofficeVoucher[] = [];
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    const fieldMapping = FIELD_MAPPINGS[LexofficeMigrationType.VOUCHERS];

    rows.forEach((row, index) => {
      try {
        const mapped = this.mapFields(row, fieldMapping);

        // Parse date
        const date = this.parseDate(mapped.date);
        if (!date) {
          errors.push({
            row: index + 2,
            field: 'date',
            message: 'Invalid date',
            value: mapped.date,
          });
          return;
        }

        // Parse amount
        const amount = this.parseGermanNumber(mapped.amount);
        if (amount === null || amount === undefined) {
          errors.push({
            row: index + 2,
            field: 'amount',
            message: 'Invalid amount',
            value: mapped.amount,
          });
          return;
        }

        // Validate description
        if (!mapped.description) {
          errors.push({
            row: index + 2,
            field: 'description',
            message: 'Missing description',
          });
          return;
        }

        // Map voucher type
        let type = mapped.type;
        if (type && VOUCHER_TYPE_MAPPINGS[type]) {
          type = VOUCHER_TYPE_MAPPINGS[type];
        } else {
          type = 'expense'; // Default
        }

        const voucher: LexofficeVoucher = {
          voucherNumber: mapped.voucherNumber,
          receiptNumber: mapped.receiptNumber,
          type: type as any,
          vendorName: mapped.vendorName,
          vendorVatId: this.cleanVatId(mapped.vendorVatId),
          date,
          amount,
          currency: mapped.currency || DEFAULT_VALUES.currency,
          taxAmount: this.parseGermanNumber(mapped.taxAmount) || 0,
          taxRate: this.parseGermanNumber(mapped.taxRate) || DEFAULT_VALUES.taxRate,
          category: mapped.category,
          description: mapped.description,
          paymentMethod: mapped.paymentMethod,
          status: mapped.status || 'pending',
          attachmentUrl: mapped.attachmentUrl,
          _rawData: row,
        };

        vouchers.push(voucher);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    return {
      type: LexofficeMigrationType.VOUCHERS,
      vouchers,
      errors,
      warnings,
    };
  }

  /**
   * Parse products data
   */
  private parseProducts(rows: any[]): ParsedMigrationData {
    const products: LexofficeProduct[] = [];
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    const fieldMapping = FIELD_MAPPINGS[LexofficeMigrationType.PRODUCTS];

    rows.forEach((row, index) => {
      try {
        const mapped = this.mapFields(row, fieldMapping);

        // Validate required fields
        if (!mapped.name) {
          errors.push({
            row: index + 2,
            field: 'name',
            message: 'Missing product name',
          });
          return;
        }

        // Parse unit price
        const unitPrice = this.parseGermanNumber(mapped.unitPrice);
        if (unitPrice === null || unitPrice === undefined) {
          errors.push({
            row: index + 2,
            field: 'unitPrice',
            message: 'Invalid unit price',
            value: mapped.unitPrice,
          });
          return;
        }

        const product: LexofficeProduct = {
          productNumber: mapped.productNumber,
          name: mapped.name,
          description: mapped.description,
          unitPrice,
          currency: mapped.currency || DEFAULT_VALUES.currency,
          taxRate: this.parseGermanNumber(mapped.taxRate) || DEFAULT_VALUES.taxRate,
          unit: mapped.unit || DEFAULT_VALUES.unit,
          category: mapped.category,
          stockQuantity: mapped.stockQuantity ? parseInt(mapped.stockQuantity, 10) : undefined,
          isActive: this.parseBoolean(mapped.isActive, true),
          _rawData: row,
        };

        products.push(product);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    });

    return {
      type: LexofficeMigrationType.PRODUCTS,
      products,
      errors,
      warnings,
    };
  }

  /**
   * Map CSV/Excel fields to internal field names
   */
  private mapFields(row: any, fieldMapping: Record<string, string>): any {
    const mapped: any = {};

    for (const [csvField, internalField] of Object.entries(fieldMapping)) {
      if (row[csvField] !== undefined && row[csvField] !== '') {
        mapped[internalField] = row[csvField];
      }
    }

    return mapped;
  }

  /**
   * Parse German date format (DD.MM.YYYY)
   */
  private parseDate(dateString: string): string | undefined {
    if (!dateString) return undefined;

    for (const format of DATE_FORMATS) {
      const parsed = dayjs(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }

    return undefined;
  }

  /**
   * Parse German number format (comma as decimal separator)
   */
  private parseGermanNumber(value: string | number): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    // Remove thousand separators (. or space) and replace comma with dot
    const cleaned = value
      .toString()
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse boolean value
   */
  private parseBoolean(value: any, defaultValue: boolean): boolean {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const str = value.toString().toLowerCase();
    if (['ja', 'yes', 'true', '1', 'aktiv'].includes(str)) {
      return true;
    }
    if (['nein', 'no', 'false', '0', 'inaktiv'].includes(str)) {
      return false;
    }

    return defaultValue;
  }

  /**
   * Clean and validate VAT ID
   */
  private cleanVatId(vatId: string | undefined): string | undefined {
    if (!vatId) return undefined;

    // Remove spaces and make uppercase
    const cleaned = vatId.replace(/\s/g, '').toUpperCase();

    // Basic validation: should start with 2 letter country code
    if (cleaned.length >= 4 && /^[A-Z]{2}/.test(cleaned)) {
      return cleaned;
    }

    return undefined;
  }

  /**
   * Clean and validate IBAN
   */
  private cleanIban(iban: string | undefined): string | undefined {
    if (!iban) return undefined;

    // Remove spaces and make uppercase
    const cleaned = iban.replace(/\s/g, '').toUpperCase();

    // Basic validation: should start with 2 letter country code + 2 digits
    if (cleaned.length >= 15 && /^[A-Z]{2}\d{2}/.test(cleaned)) {
      return cleaned;
    }

    return undefined;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
