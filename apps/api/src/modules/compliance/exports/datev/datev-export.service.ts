import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import { StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as archiver from 'archiver';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateDatevExportDto,
  DatevExportResponseDto,
  DatevSKRType,
  DatevFormatVersion,
} from './dto/datev-export.dto';
import {
  DatevConfig,
  DatevHeader,
  DatevBookingEntry,
  DatevAccountLabel,
  DatevBusinessPartner,
  DatevExportStatus,
  DatevDataCategory,
} from './interfaces/datev-config.interface';
import { DatevEncodingUtil } from './utils/datev-encoding.util';

const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

/**
 * DATEV Export Service
 * Exports accounting data in DATEV-compliant ASCII CSV format
 *
 * DATEV Format Specifications:
 * - Encoding: CP1252 (Windows-1252)
 * - Delimiter: Semicolon (;)
 * - Text qualifier: Double quotes (")
 * - Decimal separator: Comma (,)
 * - Date format: DDMM or TTMMJJ
 * - Header format: Fixed structure with metadata
 */
@Injectable()
export class DatevExportService {
  private readonly logger = new Logger(DatevExportService.name);
  private readonly exportDir: string;
  private readonly tempDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.exportDir =
      this.configService.get<string>('storage.datevExportDir') ||
      '/tmp/datev-exports';
    this.tempDir = this.configService.get<string>('storage.tempDir') || '/tmp';

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Create new DATEV export
   */
  async createExport(
    dto: CreateDatevExportDto,
  ): Promise<DatevExportResponseDto> {
    this.logger.log(`Creating DATEV export for org: ${dto.orgId}`);

    // Validate date range
    if (dto.dateRange.startDate >= dto.dateRange.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Verify organization exists
    const org = await this.prisma.organisation.findUnique({
      where: { id: dto.orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${dto.orgId}`);
    }

    // Create export record
    const exportId = this.generateExportId();
    const filename = this.generateFilename(
      dto.dateRange.startDate,
      dto.dateRange.endDate,
    );

    // Set default options
    const options = {
      includeAccountLabels: dto.options?.includeAccountLabels ?? true,
      includeCustomers: dto.options?.includeCustomers ?? true,
      includeSuppliers: dto.options?.includeSuppliers ?? true,
      includeTransactions: dto.options?.includeTransactions ?? true,
      formatVersion: dto.options?.formatVersion ?? DatevFormatVersion.V7_0,
      origin: dto.options?.origin ?? 'CoachOS',
      label: dto.options?.label ?? 'Export',
    };

    // Create database record (reuse GobdExport table or create DatevExport table)
    // For now, we'll create a simple record structure
    const exportRecord = {
      id: exportId,
      orgId: dto.orgId,
      filename,
      status: DatevExportStatus.PENDING,
      createdAt: new Date(),
      startDate: dto.dateRange.startDate,
      endDate: dto.dateRange.endDate,
    };

    // Start export generation asynchronously
    this.generateExportAsync(exportId, dto, org, options);

    return new DatevExportResponseDto({
      id: exportRecord.id,
      orgId: exportRecord.orgId,
      status: exportRecord.status,
      filename: exportRecord.filename,
      createdAt: exportRecord.createdAt,
    });
  }

  /**
   * Generate DATEV export asynchronously
   */
  private async generateExportAsync(
    exportId: string,
    dto: CreateDatevExportDto,
    org: any,
    options: any,
  ): Promise<void> {
    try {
      this.logger.log(`Starting DATEV export generation: ${exportId}`);

      // Create temp directory
      const tempExportDir = path.join(this.tempDir, exportId);
      await mkdir(tempExportDir, { recursive: true });

      const config: DatevConfig = {
        orgId: dto.orgId,
        dateRange: dto.dateRange,
        companyConfig: dto.companyConfig,
        options,
      };

      // Generate Buchungsstapel (booking stack)
      if (options.includeTransactions) {
        const buchungsstapelCsv =
          await this.generateBuchungsstapel(config, org);
        const csvBuffer = DatevEncodingUtil.convertToCP1252(buchungsstapelCsv);
        await writeFile(
          path.join(tempExportDir, 'EXTF_Buchungsstapel.csv'),
          csvBuffer,
        );
      }

      // Generate Kontenbeschriftung (account labels)
      if (options.includeAccountLabels) {
        const accountLabelsCsv = await this.generateAccountLabels(config);
        const csvBuffer = DatevEncodingUtil.convertToCP1252(accountLabelsCsv);
        await writeFile(
          path.join(tempExportDir, 'EXTF_Kontenbeschriftungen.csv'),
          csvBuffer,
        );
      }

      // Generate Debitoren/Kreditoren (customers/suppliers)
      if (options.includeCustomers || options.includeSuppliers) {
        const businessPartnersCsv =
          await this.generateBusinessPartners(config);
        const csvBuffer =
          DatevEncodingUtil.convertToCP1252(businessPartnersCsv);
        await writeFile(
          path.join(tempExportDir, 'EXTF_Stammdaten.csv'),
          csvBuffer,
        );
      }

      // Create ZIP archive
      const zipPath = path.join(this.exportDir, `${exportId}.zip`);
      await this.createZipArchive(tempExportDir, zipPath);

      // Get file size
      const fileStats = await stat(zipPath);

      // Cleanup temp directory
      await fs.promises.rm(tempExportDir, { recursive: true, force: true });

      this.logger.log(
        `DATEV export completed successfully: ${exportId} (${fileStats.size} bytes)`,
      );
    } catch (error) {
      this.logger.error(`DATEV export generation failed: ${exportId}`, error);
      throw error;
    }
  }

  /**
   * Generate Buchungsstapel (booking stack) CSV
   */
  async generateBuchungsstapel(
    config: DatevConfig,
    org: any,
  ): Promise<string> {
    const lines: string[] = [];

    // Header line 1: DATEV metadata
    const header = this.generateDATEVHeader(
      config,
      DatevDataCategory.BUCHUNGSSTAPEL,
    );
    lines.push(this.formatHeaderLine(header));

    // Header line 2: Column names
    const columnNames = [
      'Umsatz (ohne Soll/Haben-Kz)',
      'Soll/Haben-Kennzeichen',
      'WKZ Umsatz',
      'Kurs',
      'Basis-Umsatz',
      'WKZ Basis-Umsatz',
      'Konto',
      'Gegenkonto (ohne BU-Schlüssel)',
      'BU-Schlüssel',
      'Belegdatum',
      'Belegfeld 1',
      'Belegfeld 2',
      'Skonto',
      'Buchungstext',
      'Postensperre',
      'Diverse Adressnummer',
      'Geschäftspartner-Bank',
      'Sachverhalt',
      'Zinssperre',
      'Beleglink',
      'Beleginfo - Art 1',
      'Beleginfo - Inhalt 1',
      'Beleginfo - Art 2',
      'Beleginfo - Inhalt 2',
      'Beleginfo - Art 3',
      'Beleginfo - Inhalt 3',
      'Beleginfo - Art 4',
      'Beleginfo - Inhalt 4',
      'Beleginfo - Art 5',
      'Beleginfo - Inhalt 5',
      'Beleginfo - Art 6',
      'Beleginfo - Inhalt 6',
      'Beleginfo - Art 7',
      'Beleginfo - Inhalt 7',
      'Beleginfo - Art 8',
      'Beleginfo - Inhalt 8',
      'KOST1 - Kostenstelle',
      'KOST2 - Kostenstelle',
      'Kost-Menge',
      'EU-Land u. UStID',
      'EU-Steuersatz',
      'Abw. Versteuerungsart',
      'Sachverhalt L+L',
      'Funktionsergänzung L+L',
      'BU 49 Hauptfunktionstyp',
      'BU 49 Hauptfunktionsnummer',
      'BU 49 Funktionsergänzung',
      'Zusatzinformation - Art 1',
      'Zusatzinformation - Inhalt 1',
      'Zusatzinformation - Art 2',
      'Zusatzinformation - Inhalt 2',
      'Zusatzinformation - Art 3',
      'Zusatzinformation - Inhalt 3',
      'Zusatzinformation - Art 4',
      'Zusatzinformation - Inhalt 4',
      'Zusatzinformation - Art 5',
      'Zusatzinformation - Inhalt 5',
      'Zusatzinformation - Art 6',
      'Zusatzinformation - Inhalt 6',
      'Zusatzinformation - Art 7',
      'Zusatzinformation - Inhalt 7',
      'Zusatzinformation - Art 8',
      'Zusatzinformation - Inhalt 8',
      'Zusatzinformation - Art 9',
      'Zusatzinformation - Inhalt 9',
      'Zusatzinformation - Art 10',
      'Zusatzinformation - Inhalt 10',
      'Zusatzinformation - Art 11',
      'Zusatzinformation - Inhalt 11',
      'Zusatzinformation - Art 12',
      'Zusatzinformation - Inhalt 12',
      'Zusatzinformation - Art 13',
      'Zusatzinformation - Inhalt 13',
      'Zusatzinformation - Art 14',
      'Zusatzinformation - Inhalt 14',
      'Zusatzinformation - Art 15',
      'Zusatzinformation - Inhalt 15',
      'Zusatzinformation - Art 16',
      'Zusatzinformation - Inhalt 16',
      'Zusatzinformation - Art 17',
      'Zusatzinformation - Inhalt 17',
      'Zusatzinformation - Art 18',
      'Zusatzinformation - Inhalt 18',
      'Zusatzinformation - Art 19',
      'Zusatzinformation - Inhalt 19',
      'Zusatzinformation - Art 20',
      'Zusatzinformation - Inhalt 20',
      'Stück',
      'Gewicht',
      'Zahlweise',
      'Forderungsart',
      'Veranlagungsjahr',
      'Zugeordnete Fälligkeit',
      'Skontotyp',
      'Auftragsnummer',
      'Buchungstyp',
      'Ust-Schlüssel (Anzahlungen)',
      'EU-Land (Anzahlungen)',
      'Sachverhalt L+L (Anzahlungen)',
      'EU-Steuersatz (Anzahlungen)',
      'Erlöskonto (Anzahlungen)',
      'Herkunft-Kz',
      'Buchungs-GUID',
      'KOST-Datum',
      'SEPA-Mandatsreferenz',
      'Skontosperre',
      'Gesellschaftername',
      'Beteiligtennummer',
      'Identifikationsnummer',
      'Zeichnernummer',
      'Postensperre bis',
      'Bezeichnung SoBil-Sachverhalt',
      'Kennzeichen SoBil-Buchung',
      'Festschreibung',
      'Leistungsdatum',
      'Datum Zuord. Steuerperiode',
    ];
    lines.push(DatevEncodingUtil.formatCsvLine(columnNames));

    // Fetch transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        orgId: config.orgId,
        date: {
          gte: config.dateRange.startDate,
          lte: config.dateRange.endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch invoices
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: config.orgId,
        issueDate: {
          gte: config.dateRange.startDate,
          lte: config.dateRange.endDate,
        },
        status: {
          in: ['SENT', 'PAID', 'OVERDUE'],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Convert transactions to DATEV booking entries
    for (const tx of transactions) {
      const bookingLine = this.formatBookingLine(
        this.transactionToBookingEntry(tx, config),
      );
      lines.push(bookingLine);
    }

    // Convert invoices to DATEV booking entries
    for (const invoice of invoices) {
      const bookingLine = this.formatBookingLine(
        this.invoiceToBookingEntry(invoice, config),
      );
      lines.push(bookingLine);
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Generate DATEV header
   */
  generateDATEVHeader(
    config: DatevConfig,
    dataCategory: DatevDataCategory,
  ): DatevHeader {
    return {
      formatName: 'DATEV',
      formatVersion: config.options.formatVersion || '7.0',
      dataCategory,
      formatType: this.getFormatType(dataCategory),
      formatVersion2: config.options.formatVersion || '7.0',
      reserved1: '',
      createdBy: config.options.origin || 'CoachOS',
      exportedBy: config.options.origin || 'CoachOS',
      consultantNumber: config.companyConfig.consultantNumber,
      clientNumber: config.companyConfig.clientNumber,
      fiscalYearStart: config.companyConfig.fiscalYearStart,
      accountLength: config.companyConfig.accountLength || 4,
      dateFrom: DatevEncodingUtil.formatHeaderDate(config.dateRange.startDate),
      dateTo: DatevEncodingUtil.formatHeaderDate(config.dateRange.endDate),
      label: config.options.label || 'Export',
      reserved2: '',
      reserved3: '',
      reserved4: '',
      skr: config.companyConfig.skrType,
      reserved5: '',
      reserved6: '',
      origin: config.options.origin || 'CoachOS',
      reserved7: '',
      reserved8: '',
    };
  }

  /**
   * Format header line
   */
  private formatHeaderLine(header: DatevHeader): string {
    const fields = [
      header.formatName,
      header.formatVersion,
      header.dataCategory,
      header.formatType,
      header.formatVersion2,
      header.reserved1,
      header.createdBy,
      header.exportedBy,
      header.consultantNumber,
      header.clientNumber,
      header.fiscalYearStart,
      header.accountLength,
      header.dateFrom,
      header.dateTo,
      header.label,
      header.reserved2,
      header.reserved3,
      header.reserved4,
      header.skr,
      header.reserved5,
      header.reserved6,
      header.origin,
      header.reserved7,
      header.reserved8,
    ];

    return DatevEncodingUtil.formatCsvLine(fields);
  }

  /**
   * Convert Transaction to DATEV booking entry
   */
  private transactionToBookingEntry(
    tx: any,
    config: DatevConfig,
  ): DatevBookingEntry {
    const amount = parseFloat(tx.amount.toString());
    const isDebit = amount > 0;

    return {
      amount: Math.abs(amount),
      debitCredit: isDebit ? 'S' : 'H',
      currency: tx.currency || 'EUR',
      accountNumber: this.determineAccountNumber(tx, config),
      offsetAccount: this.determineOffsetAccount(tx, config),
      bookingDate: DatevEncodingUtil.formatDate(new Date(tx.date)),
      documentNumber: tx.id.substring(0, 36),
      postingText: DatevEncodingUtil.sanitizeText(tx.description || ''),
      documentDate: DatevEncodingUtil.formatDate(new Date(tx.date), 'TTMMJJ'),
    };
  }

  /**
   * Convert Invoice to DATEV booking entry
   */
  private invoiceToBookingEntry(
    invoice: any,
    config: DatevConfig,
  ): DatevBookingEntry {
    const totalAmount = parseFloat(invoice.totalAmount.toString());

    return {
      amount: totalAmount,
      debitCredit: 'S', // Invoices are always debit
      currency: invoice.currency || 'EUR',
      accountNumber: '10000', // Debitor account (SKR03)
      offsetAccount: '8400', // Revenue account (SKR03)
      taxKey: this.determineTaxKey(invoice),
      bookingDate: DatevEncodingUtil.formatDate(new Date(invoice.issueDate)),
      documentNumber: invoice.number,
      postingText: DatevEncodingUtil.sanitizeText(
        `Rechnung ${invoice.number}`,
      ),
      documentDate: DatevEncodingUtil.formatDate(
        new Date(invoice.issueDate),
        'TTMMJJ',
      ),
    };
  }

  /**
   * Format booking line
   */
  formatBookingLine(entry: DatevBookingEntry): string {
    const fields = [
      DatevEncodingUtil.formatDecimal(entry.amount),
      entry.debitCredit,
      entry.currency,
      entry.exchangeRate || '',
      entry.baseAmount ? DatevEncodingUtil.formatDecimal(entry.baseAmount) : '',
      '', // WKZ Basis-Umsatz
      entry.accountNumber,
      entry.offsetAccount,
      entry.taxKey || '',
      entry.bookingDate,
      entry.documentNumber,
      '', // Belegfeld 2
      '', // Skonto
      entry.postingText,
      '', // Postensperre
      entry.diverseAccountNumber || '',
      entry.businessPartner || '',
      '', // Sachverhalt
      '', // Zinssperre
      '', // Beleglink
    ];

    // Add remaining empty fields (up to 116 fields total)
    while (fields.length < 116) {
      fields.push('');
    }

    return DatevEncodingUtil.formatCsvLine(fields);
  }

  /**
   * Generate account labels CSV
   */
  private async generateAccountLabels(config: DatevConfig): Promise<string> {
    const lines: string[] = [];

    // Header
    const header = this.generateDATEVHeader(
      config,
      DatevDataCategory.KONTENBESCHRIFTUNG,
    );
    lines.push(this.formatHeaderLine(header));

    // Column names
    lines.push(
      DatevEncodingUtil.formatCsvLine([
        'Konto',
        'Kontenbeschriftung',
        'Sprach-ID',
      ]),
    );

    // Standard accounts (SKR03 example)
    const standardAccounts: DatevAccountLabel[] = [
      { accountNumber: '1000', accountName: 'Kasse' },
      { accountNumber: '1200', accountName: 'Bank' },
      { accountNumber: '1400', accountName: 'Forderungen' },
      { accountNumber: '1600', accountName: 'Verbindlichkeiten' },
      { accountNumber: '8400', accountName: 'Erlöse' },
      { accountNumber: '4400', accountName: 'Waren' },
    ];

    for (const account of standardAccounts) {
      lines.push(
        DatevEncodingUtil.formatCsvLine([
          account.accountNumber,
          account.accountName,
          'de-DE',
        ]),
      );
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Generate business partners CSV (customers/suppliers)
   */
  private async generateBusinessPartners(config: DatevConfig): Promise<string> {
    const lines: string[] = [];

    // Header
    const header = this.generateDATEVHeader(
      config,
      DatevDataCategory.DEBITOREN_KREDITOREN,
    );
    lines.push(this.formatHeaderLine(header));

    // Column names
    lines.push(
      DatevEncodingUtil.formatCsvLine([
        'Konto',
        'Name',
        'Adresstyp',
        'Kurzbezeichnung',
        'EU-Land',
        'EU-UStID',
        'Anrede',
        'Titel/Akad. Grad',
        'Vorname',
        'Name',
        'Strasse',
        'Postleitzahl',
        'Ort',
        'Land',
        'Telefon',
        'E-Mail',
      ]),
    );

    // Fetch customers
    const customers = await this.prisma.customer.findMany({
      where: {
        orgId: config.orgId,
        isActive: true,
      },
    });

    for (const customer of customers) {
      const customerLine = DatevEncodingUtil.formatCsvLine([
        '10000', // Debitor account
        DatevEncodingUtil.sanitizeText(customer.name),
        '1', // 1 = Customer
        DatevEncodingUtil.sanitizeText(customer.name.substring(0, 15)),
        '', // EU country
        customer.vatId || '',
        '', // Anrede
        '', // Title
        '', // First name
        DatevEncodingUtil.sanitizeText(customer.name),
        DatevEncodingUtil.sanitizeText(customer.address || ''),
        '', // Postal code
        '', // City
        '', // Country
        customer.phone || '',
        customer.email || '',
      ]);
      lines.push(customerLine);
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Helper methods
   */

  private getFormatType(category: DatevDataCategory): string {
    switch (category) {
      case DatevDataCategory.BUCHUNGSSTAPEL:
        return 'Buchungsstapel';
      case DatevDataCategory.KONTENBESCHRIFTUNG:
        return 'Kontenbeschriftungen';
      case DatevDataCategory.DEBITOREN_KREDITOREN:
        return 'Debitoren/Kreditoren';
      default:
        return 'Export';
    }
  }

  private determineAccountNumber(tx: any, config: DatevConfig): string {
    // Simple account mapping based on transaction category
    // In production, this should use a proper account mapping service
    const skr = config.companyConfig.skrType;

    if (skr === DatevSKRType.SKR03) {
      return '1000'; // Default: Cash account
    } else {
      return '1600'; // SKR04: Cash account
    }
  }

  private determineOffsetAccount(tx: any, config: DatevConfig): string {
    // Simple offset account determination
    const skr = config.companyConfig.skrType;

    if (skr === DatevSKRType.SKR03) {
      return '8400'; // Default: Revenue account
    } else {
      return '5000'; // SKR04: Revenue account
    }
  }

  private determineTaxKey(invoice: any): string {
    // Determine tax key based on VAT rate
    if (!invoice.vatRate) return '';

    const vatRate = parseFloat(invoice.vatRate.toString());

    if (vatRate === 19) return '3'; // 19% standard rate
    if (vatRate === 7) return '2'; // 7% reduced rate
    if (vatRate === 0) return '8'; // Tax-free

    return '';
  }

  private generateExportId(): string {
    return `datev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFilename(startDate: Date, endDate: Date): string {
    const start = DatevEncodingUtil.formatHeaderDate(startDate);
    const end = DatevEncodingUtil.formatHeaderDate(endDate);
    return `DATEV_Export_${start}_${end}.zip`;
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await mkdir(this.exportDir, { recursive: true });
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.warn('Failed to create directories:', error);
    }
  }

  private async createZipArchive(
    sourceDir: string,
    targetPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetPath);
      const archive = archiver.default('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        this.logger.log(`Archive created: ${targetPath} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
}
