/**
 * DATEV Import Parser Service
 * Parses DATEV ASCII CSV files and validates format
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatevEncodingUtil } from '../../compliance/exports/datev/utils/datev-encoding.util';
import {
  DatevImportFileType,
  ParsedDatevHeader,
  ParsedDatevBooking,
  ParsedDatevAccountLabel,
  ParsedDatevBusinessPartner,
  DatevImportAnalysis,
} from './datev-import.types';
import {
  DATEV_CATEGORY_FILE_TYPE_MAP,
  DATEV_CSV_DELIMITER,
  DATEV_ENCODING,
  DATEV_DECIMAL_SEPARATOR,
  DATEV_DATE_FORMATS,
  BUCHUNGSSTAPEL_COLUMNS,
  KONTENBESCHRIFTUNG_COLUMNS,
  STAMMDATEN_COLUMNS,
  ACCOUNT_NUMBER_REGEX,
  TAX_KEY_VAT_RATE_MAP,
  ADDRESS_TYPE_MAP,
} from './datev-import.constants';
import { DatevSKRType } from '../../compliance/exports/datev/dto/datev-export.dto';
import * as iconv from 'iconv-lite';

@Injectable()
export class DatevImportParserService {
  private readonly logger = new Logger(DatevImportParserService.name);

  /**
   * Parse DATEV CSV file from buffer
   */
  async parseFile(
    buffer: Buffer,
    filename: string,
  ): Promise<{
    header: ParsedDatevHeader;
    columnNames: string[];
    records: Array<
      ParsedDatevBooking | ParsedDatevAccountLabel | ParsedDatevBusinessPartner
    >;
    fileType: DatevImportFileType;
  }> {
    try {
      // Convert from CP1252 to UTF-8
      const content = iconv.decode(buffer, DATEV_ENCODING);

      // Split into lines (handle both \r\n and \n)
      const lines = content.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length < 2) {
        throw new BadRequestException(
          'Invalid DATEV file: Insufficient lines',
        );
      }

      // Parse header (first line)
      const header = this.parseHeader(lines[0]);
      const fileType =
        DATEV_CATEGORY_FILE_TYPE_MAP[header.dataCategory] ||
        DatevImportFileType.UNKNOWN;

      // Parse column names (second line)
      const columnNames = this.parseCsvLine(lines[1]);

      // Validate column structure
      this.validateColumns(columnNames, fileType);

      // Parse data records (remaining lines)
      const records: Array<
        | ParsedDatevBooking
        | ParsedDatevAccountLabel
        | ParsedDatevBusinessPartner
      > = [];

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const fields = this.parseCsvLine(line);
          const record = this.parseRecord(fields, fileType, i + 1, header);
          records.push(record);
        } catch (error) {
          this.logger.warn(
            `Failed to parse line ${i + 1}: ${error.message}`,
            error,
          );
        }
      }

      this.logger.log(
        `Successfully parsed ${records.length} records from ${filename}`,
      );

      return {
        header,
        columnNames,
        records,
        fileType,
      };
    } catch (error) {
      this.logger.error(`Failed to parse DATEV file: ${filename}`, error);
      throw new BadRequestException(
        `Failed to parse DATEV file: ${error.message}`,
      );
    }
  }

  /**
   * Parse DATEV header line
   */
  parseHeader(headerLine: string): ParsedDatevHeader {
    const fields = this.parseCsvLine(headerLine);

    if (fields.length < 21) {
      throw new BadRequestException(
        'Invalid DATEV header: Insufficient fields',
      );
    }

    // Validate DATEV format identifier
    if (fields[0] !== 'DATEV' && fields[0] !== 'EXTF') {
      throw new BadRequestException(
        'Invalid DATEV file: Missing DATEV/EXTF identifier',
      );
    }

    const header: ParsedDatevHeader = {
      formatName: fields[0],
      formatVersion: fields[1],
      dataCategory: parseInt(fields[2], 10),
      formatType: fields[3] || '',
      formatVersion2: fields[4] || '',
      reserved1: fields[5] || '',
      createdBy: fields[6] || '',
      exportedBy: fields[7] || '',
      consultantNumber: parseInt(fields[8], 10) || 0,
      clientNumber: parseInt(fields[9], 10) || 0,
      fiscalYearStart: parseInt(fields[10], 10) || 0,
      accountLength: parseInt(fields[11], 10) || 4,
      dateFrom: parseInt(fields[12], 10) || 0,
      dateTo: parseInt(fields[13], 10) || 0,
      label: fields[14] || '',
      reserved2: fields[15] || '',
      reserved3: fields[16] || '',
      reserved4: fields[17] || '',
      skr: (fields[18] as DatevSKRType) || DatevSKRType.SKR03,
      reserved5: fields[19] || '',
      reserved6: fields[20] || '',
      origin: fields[21] || '',
      reserved7: fields[22] || '',
      reserved8: fields[23] || '',
      raw: fields,
    };

    // Validate SKR type
    if (header.skr !== DatevSKRType.SKR03 && header.skr !== DatevSKRType.SKR04) {
      this.logger.warn(
        `Unknown SKR type: ${header.skr}, defaulting to SKR03`,
      );
      header.skr = DatevSKRType.SKR03;
    }

    return header;
  }

  /**
   * Parse CSV line (handles quoted fields with semicolons)
   */
  parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === DATEV_CSV_DELIMITER && !inQuotes) {
        // Field separator
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Add last field
    fields.push(currentField.trim());

    return fields;
  }

  /**
   * Parse individual record based on file type
   */
  private parseRecord(
    fields: string[],
    fileType: DatevImportFileType,
    lineNumber: number,
    header: ParsedDatevHeader,
  ):
    | ParsedDatevBooking
    | ParsedDatevAccountLabel
    | ParsedDatevBusinessPartner {
    switch (fileType) {
      case DatevImportFileType.BUCHUNGSSTAPEL:
        return this.parseBookingRecord(fields, lineNumber, header);
      case DatevImportFileType.KONTENBESCHRIFTUNG:
        return this.parseAccountLabelRecord(fields, lineNumber);
      case DatevImportFileType.STAMMDATEN:
      case DatevImportFileType.DEBITOREN:
      case DatevImportFileType.KREDITOREN:
        return this.parseBusinessPartnerRecord(fields, lineNumber);
      default:
        throw new BadRequestException(
          `Unsupported file type: ${fileType}`,
        );
    }
  }

  /**
   * Parse booking record (Buchungsstapel)
   */
  private parseBookingRecord(
    fields: string[],
    lineNumber: number,
    header: ParsedDatevHeader,
  ): ParsedDatevBooking {
    const validationErrors: string[] = [];

    // Parse amount (field 0)
    const amountStr = fields[0]?.replace(DATEV_DECIMAL_SEPARATOR, '.') || '0';
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      validationErrors.push('Invalid amount');
    }

    // Debit/Credit indicator (field 1)
    const debitCredit = (fields[1]?.toUpperCase() || 'S') as 'S' | 'H';
    if (debitCredit !== 'S' && debitCredit !== 'H') {
      validationErrors.push('Invalid debit/credit indicator');
    }

    // Account numbers (fields 6, 7)
    const accountNumber = fields[6] || '';
    const offsetAccount = fields[7] || '';

    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
      validationErrors.push(`Invalid account number: ${accountNumber}`);
    }
    if (!ACCOUNT_NUMBER_REGEX.test(offsetAccount)) {
      validationErrors.push(`Invalid offset account: ${offsetAccount}`);
    }

    // Booking date (field 9) - DDMM format
    const bookingDate = fields[9] || '';
    if (!this.isValidDatevDate(bookingDate, 'DDMM', header)) {
      validationErrors.push(`Invalid booking date: ${bookingDate}`);
    }

    // Document number (field 10)
    const documentNumber = fields[10] || '';
    if (!documentNumber) {
      validationErrors.push('Missing document number');
    }

    const record: ParsedDatevBooking = {
      amount,
      debitCredit,
      currency: fields[2] || 'EUR',
      exchangeRate: fields[3] ? parseFloat(fields[3].replace(',', '.')) : undefined,
      baseAmount: fields[4] ? parseFloat(fields[4].replace(',', '.')) : undefined,
      baseCurrency: fields[5] || undefined,
      accountNumber,
      offsetAccount,
      taxKey: fields[8] || undefined,
      bookingDate,
      documentNumber,
      documentField2: fields[11] || undefined,
      discount: fields[12] ? parseFloat(fields[12].replace(',', '.')) : undefined,
      postingText: fields[13] || '',
      postingLock: fields[14] || undefined,
      diverseAccountNumber: fields[15] || undefined,
      businessPartnerBank: fields[16] || undefined,
      sachverhalt: fields[17] || undefined,
      interestLock: fields[18] || undefined,
      documentLink: fields[19] || undefined,
      costCenter1: fields[36] || undefined,
      costCenter2: fields[37] || undefined,
      costAmount: fields[38] ? parseFloat(fields[38].replace(',', '.')) : undefined,
      euCountryVatId: fields[39] || undefined,
      euTaxRate: fields[40] ? parseFloat(fields[40].replace(',', '.')) : undefined,
      documentDate: fields[113] || undefined,
      serviceDate: fields[114] || undefined,
      taxPeriodDate: fields[115] || undefined,
      raw: fields,
      lineNumber,
      validationErrors,
    };

    return record;
  }

  /**
   * Parse account label record (Kontenbeschriftung)
   */
  private parseAccountLabelRecord(
    fields: string[],
    lineNumber: number,
  ): ParsedDatevAccountLabel {
    const validationErrors: string[] = [];

    const accountNumber = fields[0] || '';
    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
      validationErrors.push(`Invalid account number: ${accountNumber}`);
    }

    const accountName = fields[1] || '';
    if (!accountName) {
      validationErrors.push('Missing account name');
    }

    return {
      accountNumber,
      accountName,
      languageId: fields[2] || 'de-DE',
      raw: fields,
      lineNumber,
      validationErrors,
    };
  }

  /**
   * Parse business partner record (Stammdaten)
   */
  private parseBusinessPartnerRecord(
    fields: string[],
    lineNumber: number,
  ): ParsedDatevBusinessPartner {
    const validationErrors: string[] = [];

    const accountNumber = fields[0] || '';
    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
      validationErrors.push(`Invalid account number: ${accountNumber}`);
    }

    const name = fields[1] || '';
    if (!name) {
      validationErrors.push('Missing business partner name');
    }

    const email = fields[15] || '';
    if (email && !this.isValidEmail(email)) {
      validationErrors.push(`Invalid email: ${email}`);
    }

    return {
      accountNumber,
      name,
      addressType: fields[2] || undefined,
      shortName: fields[3] || undefined,
      euCountry: fields[4] || undefined,
      euVatId: fields[5] || undefined,
      salutation: fields[6] || undefined,
      title: fields[7] || undefined,
      firstName: fields[8] || undefined,
      lastName: fields[9] || name,
      street: fields[10] || undefined,
      postalCode: fields[11] || undefined,
      city: fields[12] || undefined,
      country: fields[13] || undefined,
      phone: fields[14] || undefined,
      email,
      raw: fields,
      lineNumber,
      validationErrors,
    };
  }

  /**
   * Validate column names against expected format
   */
  private validateColumns(
    columns: string[],
    fileType: DatevImportFileType,
  ): void {
    let expectedColumns: string[] = [];

    switch (fileType) {
      case DatevImportFileType.BUCHUNGSSTAPEL:
        expectedColumns = BUCHUNGSSTAPEL_COLUMNS;
        break;
      case DatevImportFileType.KONTENBESCHRIFTUNG:
        expectedColumns = KONTENBESCHRIFTUNG_COLUMNS;
        break;
      case DatevImportFileType.STAMMDATEN:
        expectedColumns = STAMMDATEN_COLUMNS;
        break;
      default:
        this.logger.warn(`Unknown file type for validation: ${fileType}`);
        return;
    }

    // Check if at least the first few key columns match
    const minColumnsToCheck = Math.min(5, expectedColumns.length);
    for (let i = 0; i < minColumnsToCheck; i++) {
      if (columns[i] !== expectedColumns[i]) {
        this.logger.warn(
          `Column mismatch at position ${i}: expected "${expectedColumns[i]}", got "${columns[i]}"`,
        );
      }
    }
  }

  /**
   * Validate DATEV date format
   */
  private isValidDatevDate(
    dateStr: string,
    format: 'DDMM' | 'TTMMJJ' | 'YYYYMMDD',
    header: ParsedDatevHeader,
  ): boolean {
    if (!dateStr) return false;

    const pattern = DATEV_DATE_FORMATS[format];
    if (!pattern.test(dateStr)) {
      return false;
    }

    try {
      const date = this.parseDatevDate(dateStr, format, header);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Parse DATEV date string to Date object
   */
  parseDatevDate(
    dateStr: string,
    format: 'DDMM' | 'TTMMJJ' | 'YYYYMMDD',
    header: ParsedDatevHeader,
  ): Date {
    if (!dateStr) {
      throw new Error('Empty date string');
    }

    let day: number, month: number, year: number;

    if (format === 'DDMM') {
      // DDMM format - need to infer year from fiscal year
      const match = dateStr.match(DATEV_DATE_FORMATS.DDMM);
      if (!match) throw new Error(`Invalid DDMM date: ${dateStr}`);

      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10);

      // Infer year from fiscal year start
      const fiscalYearStr = header.fiscalYearStart.toString();
      year = parseInt(fiscalYearStr.substring(0, 4), 10);

      // Adjust year if month suggests different fiscal year
      const fiscalMonth = parseInt(fiscalYearStr.substring(4, 6), 10);
      if (month < fiscalMonth) {
        year += 1;
      }
    } else if (format === 'TTMMJJ') {
      // TTMMJJ format - 2-digit year
      const match = dateStr.match(DATEV_DATE_FORMATS.TTMMJJ);
      if (!match) throw new Error(`Invalid TTMMJJ date: ${dateStr}`);

      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      const yy = parseInt(match[3], 10);

      // Convert 2-digit year to 4-digit (assume 2000s for 00-49, 1900s for 50-99)
      year = yy < 50 ? 2000 + yy : 1900 + yy;
    } else {
      // YYYYMMDD format
      const match = dateStr.match(DATEV_DATE_FORMATS.YYYYMMDD);
      if (!match) throw new Error(`Invalid YYYYMMDD date: ${dateStr}`);

      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
    }

    return new Date(year, month - 1, day);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Analyze DATEV file and return metadata
   */
  async analyzeFile(buffer: Buffer, filename: string): Promise<DatevImportAnalysis> {
    const parsed = await this.parseFile(buffer, filename);

    const analysis: DatevImportAnalysis = {
      fileType: parsed.fileType,
      header: parsed.header,
      columnNames: parsed.columnNames,
      recordCount: parsed.records.length,
      skrType: parsed.header.skr,
      dateRange: {
        from: this.parseDatevDate(
          parsed.header.dateFrom.toString(),
          'YYYYMMDD',
          parsed.header,
        ),
        to: this.parseDatevDate(
          parsed.header.dateTo.toString(),
          'YYYYMMDD',
          parsed.header,
        ),
      },
      companyConfig: {
        consultantNumber: parsed.header.consultantNumber,
        clientNumber: parsed.header.clientNumber,
        fiscalYearStart: parsed.header.fiscalYearStart,
      },
      estimatedImportTime: Math.ceil(parsed.records.length / 100) * 2, // ~2 seconds per 100 records
      warnings: [],
      errors: [],
    };

    // Collect validation warnings and errors
    for (const record of parsed.records) {
      if ('validationErrors' in record && record.validationErrors.length > 0) {
        analysis.errors.push(
          `Line ${record.lineNumber}: ${record.validationErrors.join(', ')}`,
        );
      }
    }

    if (analysis.errors.length > 0) {
      analysis.warnings.push(
        `Found ${analysis.errors.length} validation errors`,
      );
    }

    return analysis;
  }
}
