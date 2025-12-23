import { Injectable, Logger } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { Prisma } from '@prisma/client';
import {
  FreeFinanceMigrationType,
  ParsedMigrationData,
  MigrationError,
  MigrationWarning,
  FreeFinanceCustomer,
  FreeFinanceVendor,
  FreeFinanceOutgoingInvoice,
  FreeFinanceIncomingInvoice,
  FreeFinanceProduct,
  FreeFinanceFileInfo,
} from './freefinance.types';
import {
  FIELD_MAPPINGS,
  CSV_PARSE_OPTIONS,
  DATE_FORMATS,
  GERMAN_NUMBER_FORMAT,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_EXTENSIONS,
} from './freefinance.constants';

/**
 * Service for parsing FreeFinance CSV/Excel files
 * Handles Austrian-specific formats and data structures
 */
@Injectable()
export class FreeFinanceParserService {
  private readonly logger = new Logger(FreeFinanceParserService.name);

  /**
   * Detect file type and structure
   */
  async detectFileInfo(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<FreeFinanceFileInfo> {
    this.logger.log(`Detecting file info for: ${originalName}`);

    const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new Error(`Unsupported file extension: ${extension}`);
    }

    const fileInfo: FreeFinanceFileInfo = {
      originalName,
      mimeType,
      size: buffer.length,
    };

    try {
      if (extension === '.csv') {
        // Detect CSV encoding and delimiter
        const encoding = this.detectEncoding(buffer);
        const delimiter = this.detectDelimiter(buffer, encoding);

        fileInfo.encoding = encoding;
        fileInfo.delimiter = delimiter;

        // Parse CSV to count rows
        const content = buffer.toString(encoding);
        const records = csvParse(content, {
          ...CSV_PARSE_OPTIONS,
          delimiter,
          columns: true,
        });

        fileInfo.rowCount = records.length;
        fileInfo.columnCount = records.length > 0 ? Object.keys(records[0]).length : 0;
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);

        fileInfo.rowCount = data.length;
        fileInfo.columnCount = data.length > 0 ? Object.keys(data[0]).length : 0;
      }

      // Detect migration type based on columns
      fileInfo.detectedType = this.detectMigrationType(buffer, extension);

      return fileInfo;
    } catch (error) {
      this.logger.error(`Error detecting file info: ${error.message}`);
      throw new Error(`Failed to analyze file: ${error.message}`);
    }
  }

  /**
   * Parse CSV/Excel file
   */
  async parseFile(
    buffer: Buffer,
    originalName: string,
    migrationType: FreeFinanceMigrationType,
    customFieldMapping?: Record<string, string>,
  ): Promise<ParsedMigrationData> {
    this.logger.log(`Parsing file: ${originalName} as ${migrationType}`);

    const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    try {
      let rawRecords: any[] = [];

      if (extension === '.csv') {
        rawRecords = await this.parseCSV(buffer);
      } else {
        rawRecords = await this.parseExcel(buffer);
      }

      this.logger.log(`Parsed ${rawRecords.length} raw records`);

      // Get field mapping
      const fieldMapping = customFieldMapping || FIELD_MAPPINGS[migrationType];

      // Parse records based on type
      const result: ParsedMigrationData = {
        type: migrationType,
        errors,
        warnings,
      };

      switch (migrationType) {
        case FreeFinanceMigrationType.CUSTOMERS:
          result.customers = this.parseCustomers(rawRecords, fieldMapping, errors, warnings);
          break;
        case FreeFinanceMigrationType.VENDORS:
          result.vendors = this.parseVendors(rawRecords, fieldMapping, errors, warnings);
          break;
        case FreeFinanceMigrationType.OUTGOING_INVOICES:
          result.outgoingInvoices = this.parseOutgoingInvoices(rawRecords, fieldMapping, errors, warnings);
          break;
        case FreeFinanceMigrationType.INCOMING_INVOICES:
          result.incomingInvoices = this.parseIncomingInvoices(rawRecords, fieldMapping, errors, warnings);
          break;
        case FreeFinanceMigrationType.PRODUCTS:
          result.products = this.parseProducts(rawRecords, fieldMapping, errors, warnings);
          break;
      }

      this.logger.log(
        `Parsing completed: ${errors.length} errors, ${warnings.length} warnings`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error parsing file: ${error.message}`, error.stack);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    const encoding = this.detectEncoding(buffer);
    const delimiter = this.detectDelimiter(buffer, encoding);
    const content = buffer.toString(encoding);

    const records = csvParse(content, {
      ...CSV_PARSE_OPTIONS,
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const records = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    return records;
  }

  /**
   * Detect file encoding
   */
  private detectEncoding(buffer: Buffer): BufferEncoding {
    // Check for BOM
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'utf8';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'utf16le';
    }
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE is not a standard Node.js BufferEncoding, fallback to utf16le
      return 'utf16le';
    }

    // Default to UTF-8 for Austrian/German files
    return 'utf8';
  }

  /**
   * Detect CSV delimiter
   */
  private detectDelimiter(buffer: Buffer, encoding: BufferEncoding): string {
    const content = buffer.toString(encoding).substring(0, 1000); // Check first 1000 chars
    const delimiters = [';', ',', '\t', '|'];
    let maxCount = 0;
    let detectedDelimiter = ';'; // Default for German/Austrian

    for (const delimiter of delimiters) {
      const count = (content.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    }

    return detectedDelimiter;
  }

  /**
   * Detect migration type based on column headers
   */
  private detectMigrationType(buffer: Buffer, extension: string): FreeFinanceMigrationType | undefined {
    try {
      let headers: string[] = [];

      if (extension === '.csv') {
        const encoding = this.detectEncoding(buffer);
        const content = buffer.toString(encoding);
        const firstLine = content.split('\n')[0];
        headers = firstLine.split(';').map(h => h.trim().replace(/"/g, ''));
      } else {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        headers = (data[0] as string[]) || [];
      }

      const headerSet = new Set(headers.map(h => h.toLowerCase()));

      // Detect based on distinctive headers
      if (headerSet.has('kundennummer') || headerSet.has('kunden-nr')) {
        if (headerSet.has('rechnungsnummer') || headerSet.has('rechnungsdatum')) {
          return FreeFinanceMigrationType.OUTGOING_INVOICES;
        }
        return FreeFinanceMigrationType.CUSTOMERS;
      }

      if (headerSet.has('lieferantennummer') || headerSet.has('lieferanten-nr')) {
        if (headerSet.has('rechnungsnummer') || headerSet.has('eingangsdatum')) {
          return FreeFinanceMigrationType.INCOMING_INVOICES;
        }
        return FreeFinanceMigrationType.VENDORS;
      }

      if (headerSet.has('artikelnummer') || headerSet.has('produktnummer')) {
        return FreeFinanceMigrationType.PRODUCTS;
      }

      return undefined;
    } catch (error) {
      this.logger.warn(`Could not detect migration type: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Parse customers
   */
  private parseCustomers(
    records: any[],
    fieldMapping: Record<string, string>,
    errors: MigrationError[],
    warnings: MigrationWarning[],
  ): FreeFinanceCustomer[] {
    const customers: FreeFinanceCustomer[] = [];

    records.forEach((record, index) => {
      try {
        const customer = this.mapRecord<FreeFinanceCustomer>(record, fieldMapping);
        customer._rawData = record;

        // Validate required fields
        if (!customer.customerNumber) {
          errors.push({
            row: index + 2, // +2 for header and 0-index
            field: 'customerNumber',
            message: 'Customer number is required',
            severity: 'error',
          });
          return;
        }

        // Parse and validate
        if (customer.country) {
          customer.country = this.normalizeCountryCode(customer.country);
        }

        customers.push(customer);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: `Error parsing customer: ${error.message}`,
          severity: 'error',
        });
      }
    });

    return customers;
  }

  /**
   * Parse vendors
   */
  private parseVendors(
    records: any[],
    fieldMapping: Record<string, string>,
    errors: MigrationError[],
    warnings: MigrationWarning[],
  ): FreeFinanceVendor[] {
    const vendors: FreeFinanceVendor[] = [];

    records.forEach((record, index) => {
      try {
        const vendor = this.mapRecord<FreeFinanceVendor>(record, fieldMapping);
        vendor._rawData = record;

        if (!vendor.vendorNumber) {
          errors.push({
            row: index + 2,
            field: 'vendorNumber',
            message: 'Vendor number is required',
            severity: 'error',
          });
          return;
        }

        if (vendor.country) {
          vendor.country = this.normalizeCountryCode(vendor.country);
        }

        vendors.push(vendor);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: `Error parsing vendor: ${error.message}`,
          severity: 'error',
        });
      }
    });

    return vendors;
  }

  /**
   * Parse outgoing invoices
   */
  private parseOutgoingInvoices(
    records: any[],
    fieldMapping: Record<string, string>,
    errors: MigrationError[],
    warnings: MigrationWarning[],
  ): FreeFinanceOutgoingInvoice[] {
    const invoices: FreeFinanceOutgoingInvoice[] = [];

    records.forEach((record, index) => {
      try {
        const invoice = this.mapRecord<FreeFinanceOutgoingInvoice>(record, fieldMapping);
        invoice._rawData = record;
        invoice.items = []; // Would need separate parsing for line items

        // Parse amounts
        if (typeof invoice.netAmount === 'string') {
          invoice.netAmount = this.parseGermanNumber(invoice.netAmount);
        }
        if (typeof invoice.vatAmount === 'string') {
          invoice.vatAmount = this.parseGermanNumber(invoice.vatAmount);
        }
        if (typeof invoice.grossAmount === 'string') {
          invoice.grossAmount = this.parseGermanNumber(invoice.grossAmount);
        }

        // Parse dates
        invoice.invoiceDate = this.parseAustrianDate(invoice.invoiceDate);
        if (invoice.dueDate) {
          invoice.dueDate = this.parseAustrianDate(invoice.dueDate);
        }

        invoices.push(invoice);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: `Error parsing outgoing invoice: ${error.message}`,
          severity: 'error',
        });
      }
    });

    return invoices;
  }

  /**
   * Parse incoming invoices
   */
  private parseIncomingInvoices(
    records: any[],
    fieldMapping: Record<string, string>,
    errors: MigrationError[],
    warnings: MigrationWarning[],
  ): FreeFinanceIncomingInvoice[] {
    const invoices: FreeFinanceIncomingInvoice[] = [];

    records.forEach((record, index) => {
      try {
        const invoice = this.mapRecord<FreeFinanceIncomingInvoice>(record, fieldMapping);
        invoice._rawData = record;

        // Parse amounts
        if (typeof invoice.netAmount === 'string') {
          invoice.netAmount = this.parseGermanNumber(invoice.netAmount);
        }
        if (typeof invoice.vatAmount === 'string') {
          invoice.vatAmount = this.parseGermanNumber(invoice.vatAmount);
        }
        if (typeof invoice.grossAmount === 'string') {
          invoice.grossAmount = this.parseGermanNumber(invoice.grossAmount);
        }

        // Parse dates
        invoice.invoiceDate = this.parseAustrianDate(invoice.invoiceDate);

        invoices.push(invoice);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: `Error parsing incoming invoice: ${error.message}`,
          severity: 'error',
        });
      }
    });

    return invoices;
  }

  /**
   * Parse products
   */
  private parseProducts(
    records: any[],
    fieldMapping: Record<string, string>,
    errors: MigrationError[],
    warnings: MigrationWarning[],
  ): FreeFinanceProduct[] {
    const products: FreeFinanceProduct[] = [];

    records.forEach((record, index) => {
      try {
        const product = this.mapRecord<FreeFinanceProduct>(record, fieldMapping);
        product._rawData = record;

        // Parse amounts
        if (typeof product.unitPrice === 'string') {
          product.unitPrice = this.parseGermanNumber(product.unitPrice);
        }

        products.push(product);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: `Error parsing product: ${error.message}`,
          severity: 'error',
        });
      }
    });

    return products;
  }

  /**
   * Map raw record to typed object using field mapping
   */
  private mapRecord<T>(record: any, fieldMapping: Record<string, string>): T {
    const mapped: any = {};

    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      const value = record[sourceField];
      if (value !== undefined && value !== null && value !== '') {
        mapped[targetField] = value;
      }
    }

    return mapped as T;
  }

  /**
   * Parse German number format (1.234,56 -> 1234.56)
   */
  private parseGermanNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = value.toString().trim();

    // Remove thousands separator (.)
    let normalized = str.replace(/\./g, '');

    // Replace decimal separator (,) with (.)
    normalized = normalized.replace(',', '.');

    return parseFloat(normalized) || 0;
  }

  /**
   * Parse Austrian date format (DD.MM.YYYY)
   */
  private parseAustrianDate(value: string | Date): string {
    if (!value) return '';
    if (value instanceof Date) {
      return moment(value).format('YYYY-MM-DD');
    }

    const str = value.toString().trim();

    // Try each date format
    for (const format of DATE_FORMATS) {
      const parsed = moment(str, format, true);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }

    // Return original if can't parse
    return str;
  }

  /**
   * Normalize country code (Austria -> AT, Deutschland -> DE, etc.)
   */
  private normalizeCountryCode(value: string): string {
    if (!value) return 'AT';

    const normalized = value.trim().toUpperCase();

    // If already 2-letter code
    if (normalized.length === 2) return normalized;

    // Map common German names to codes
    const countryMap: Record<string, string> = {
      'ÖSTERREICH': 'AT',
      'AUSTRIA': 'AT',
      'DEUTSCHLAND': 'DE',
      'GERMANY': 'DE',
      'SCHWEIZ': 'CH',
      'SWITZERLAND': 'CH',
      'ITALIEN': 'IT',
      'ITALY': 'IT',
      'FRANKREICH': 'FR',
      'FRANCE': 'FR',
      'NIEDERLANDE': 'NL',
      'NETHERLANDS': 'NL',
      'BELGIEN': 'BE',
      'BELGIUM': 'BE',
    };

    return countryMap[normalized] || normalized.substring(0, 2);
  }

  /**
   * Get detected columns from file
   */
  async getDetectedColumns(buffer: Buffer, originalName: string): Promise<string[]> {
    const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';

    if (extension === '.csv') {
      const encoding = this.detectEncoding(buffer);
      const delimiter = this.detectDelimiter(buffer, encoding);
      const content = buffer.toString(encoding);
      const firstLine = content.split('\n')[0];
      return firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      return (data[0] as string[]) || [];
    }
  }
}
