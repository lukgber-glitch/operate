import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../database/prisma.service';
import { StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { CreateBmdExportDto } from './dto/create-bmd-export.dto';
import {
  BmdExportResponseDto,
  BmdExportListResponseDto,
  BmdExportListItemDto,
} from './dto/bmd-export-response.dto';
import {
  ExportStatus,
  BmdConfig,
  BmdExportType,
  BmdBookingEntry,
  BmdAccountEntry,
  BmdCustomerEntry,
  BmdSupplierEntry,
  BmdExportFormat,
} from './interfaces/bmd-config.interface';
import {
  formatBmdDate,
  formatBmdNumber,
  formatBmdAccountNumber,
  formatBmdVatId,
  formatBmdCurrency,
  formatBmdCountryCode,
  formatBmdTaxCode,
  formatBmdPercentage,
  createBmdCsvLine,
  sanitizeBmdText,
  mapAccountTypeToBmd,
  generateBmdFilename,
} from './utils/bmd-formatter.util';
import { BmdPackagerUtil } from './utils/bmd-packager.util';

const stat = promisify(fs.stat);

/**
 * BMD Export Service
 * Handles export generation for Austrian BMD accounting software
 */
@Injectable()
export class BmdExportService {
  private readonly logger = new Logger(BmdExportService.name);
  private readonly exportDir: string;
  private readonly tempDir: string;
  private readonly retentionDays: number = 30;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Configure directories from environment
    this.exportDir =
      this.configService.get<string>('storage.bmdExportDir') ||
      this.configService.get<string>('storage.gobdExportDir') ||
      '/tmp/bmd-exports';
    this.tempDir = this.configService.get<string>('storage.tempDir') || '/tmp';
    this.retentionDays =
      this.configService.get<number>('compliance.bmdRetentionDays') || 30;
  }

  /**
   * Create new BMD export
   */
  async createExport(dto: CreateBmdExportDto): Promise<BmdExportResponseDto> {
    this.logger.log(`Creating BMD export for org: ${dto.orgId}`);

    // Validate date range
    if (dto.dateRange.startDate >= dto.dateRange.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Verify organization exists
    const org = await this.prisma.organisation.findUnique({
      where: { id: dto.orgId },
      include: {
        settings: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${dto.orgId}`);
    }

    // Verify organization is Austrian
    if (org.countryCode !== 'AT') {
      throw new BadRequestException(
        'BMD export is only available for Austrian organizations',
      );
    }

    // Create export record
    const exportId = this.generateExportId();
    const filename = generateBmdFilename(
      dto.orgId,
      dto.dateRange.startDate.getFullYear(),
    );

    // Create database record (reuse GobdExport table for now)
    const exportRecord = await this.createExportRecord(
      exportId,
      dto.orgId,
      filename,
      dto.dateRange.startDate,
      dto.dateRange.endDate,
      dto.exportTypes,
    );

    // Start export generation asynchronously
    this.generateExportAsync(exportId, dto, org);

    return new BmdExportResponseDto({
      id: exportRecord.id,
      orgId: exportRecord.orgId,
      status: ExportStatus.PENDING,
      filename: exportRecord.filename,
      createdAt: exportRecord.createdAt,
      startDate: exportRecord.startDate,
      endDate: exportRecord.endDate,
    });
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<BmdExportResponseDto> {
    const exportRecord = await this.findExportRecord(exportId);

    const response: BmdExportResponseDto = new BmdExportResponseDto({
      id: exportRecord.id,
      orgId: exportRecord.orgId,
      status: exportRecord.status as ExportStatus,
      filename: exportRecord.filename,
      createdAt: exportRecord.createdAt,
      completedAt: exportRecord.completedAt,
      startDate: exportRecord.startDate,
      endDate: exportRecord.endDate,
      errorMessage: exportRecord.errorMessage,
      fileSize: exportRecord.fileSize,
    });

    // Add download URL if ready
    if (
      exportRecord.status === ExportStatus.READY ||
      exportRecord.status === ExportStatus.COMPLETED
    ) {
      response.downloadUrl = `/api/compliance/exports/bmd/${exportId}/download`;
    }

    return response;
  }

  /**
   * Download export
   */
  async downloadExport(exportId: string): Promise<StreamableFile> {
    const exportRecord = await this.findExportRecord(exportId);

    if (
      exportRecord.status !== ExportStatus.READY &&
      exportRecord.status !== ExportStatus.COMPLETED
    ) {
      throw new BadRequestException('Export is not ready for download');
    }

    const filePath = path.join(this.exportDir, exportRecord.filename);

    try {
      const fileStats = await stat(filePath);
      const fileStream = fs.createReadStream(filePath);

      // Update status to downloaded
      await this.updateExportStatus(exportId, ExportStatus.DOWNLOADED);

      this.logger.log(`Export downloaded: ${exportId}`);

      return new StreamableFile(fileStream, {
        type: 'application/zip',
        disposition: `attachment; filename="${exportRecord.filename}"`,
        length: fileStats.size,
      });
    } catch (error) {
      this.logger.error(`Failed to download export ${exportId}:`, error);
      throw new NotFoundException('Export file not found');
    }
  }

  /**
   * List exports for organization
   */
  async listExports(
    orgId: string,
    limit: number = 50,
  ): Promise<BmdExportListResponseDto> {
    // Use GobdExport table with type filter for BMD
    const exports = await this.prisma.gobdExport.findMany({
      where: {
        orgId,
        // Filter for BMD exports (metadata field or separate table in future)
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const total = await this.prisma.gobdExport.count({
      where: {
        orgId,
      },
    });

    const items: BmdExportListItemDto[] = exports.map((exp) => ({
      id: exp.id,
      status: exp.status as ExportStatus,
      filename: exp.filename,
      createdAt: exp.createdAt,
      startDate: exp.startDate,
      endDate: exp.endDate,
      fileSize: exp.fileSize,
    }));

    return new BmdExportListResponseDto(items, total);
  }

  /**
   * Delete export
   */
  async deleteExport(exportId: string): Promise<void> {
    const exportRecord = await this.findExportRecord(exportId);

    // Delete file from filesystem
    const filePath = path.join(this.exportDir, exportRecord.filename);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete export file ${filePath}:`,
        error.message,
      );
    }

    // Delete record
    await this.prisma.gobdExport.delete({
      where: { id: exportId },
    });

    this.logger.log(`Export deleted: ${exportId}`);
  }

  /**
   * Generate export asynchronously
   */
  private async generateExportAsync(
    exportId: string,
    dto: CreateBmdExportDto,
    org: any,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportStatus(exportId, ExportStatus.PROCESSING);

      // Create temporary directory
      const tempDirName = BmdPackagerUtil.generateTempDirName(exportId);
      const tempExportDir = path.join(this.tempDir, tempDirName);

      // Create export structure
      await BmdPackagerUtil.createExportStructure(tempExportDir);

      // Build configuration
      const config: BmdConfig = {
        orgId: dto.orgId,
        exportTypes: dto.exportTypes,
        dateRange: dto.dateRange,
        format: dto.format || BmdExportFormat.CSV,
        options: {
          useSemicolon: dto.options?.useSemicolon ?? true,
          includeHeader: dto.options?.includeHeader ?? true,
          useIsoEncoding: dto.options?.useIsoEncoding ?? false,
          postedOnly: dto.options?.postedOnly ?? true,
          accountingFramework: dto.options?.accountingFramework || 'EKR',
        },
        includeArchived: dto.includeArchived ?? false,
      };

      // Generate exports based on requested types
      for (const exportType of dto.exportTypes) {
        await this.generateExportByType(
          exportType,
          config,
          org,
          tempExportDir,
        );
      }

      // Generate README file
      const readmeContent = BmdPackagerUtil.generateReadmeContent({
        orgName: org.name,
        dateRange: dto.dateRange,
        exportTypes: dto.exportTypes,
        exportDate: new Date(),
      });
      await BmdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'README.txt'),
        readmeContent,
        config.options.useIsoEncoding,
      );

      // Validate export structure
      const validation =
        await BmdPackagerUtil.validateExportStructure(tempExportDir);
      if (!validation.valid) {
        throw new Error(
          `Export validation failed: ${validation.errors.join(', ')}`,
        );
      }

      // Create ZIP archive
      const exportRecord = await this.findExportRecord(exportId);
      const zipPath = path.join(this.exportDir, exportRecord.filename);
      await BmdPackagerUtil.createZipArchive(tempExportDir, zipPath);

      // Calculate metadata
      const fileStats = await stat(zipPath);
      const totalFiles = await BmdPackagerUtil.countFiles(tempExportDir);

      // Update export record
      await this.prisma.gobdExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.READY,
          completedAt: new Date(),
          fileSize: fileStats.size,
        },
      });

      // Cleanup temporary directory
      await BmdPackagerUtil.cleanupDirectory(tempExportDir);

      this.logger.log(`BMD export completed successfully: ${exportId}`);
    } catch (error) {
      this.logger.error(
        `BMD export generation failed for ${exportId}:`,
        error,
      );

      // Update status to failed
      await this.prisma.gobdExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Generate export by type
   */
  private async generateExportByType(
    exportType: BmdExportType,
    config: BmdConfig,
    org: any,
    tempExportDir: string,
  ): Promise<void> {
    switch (exportType) {
      case BmdExportType.BOOKING_JOURNAL:
        await this.exportBookingJournal(config, tempExportDir);
        break;
      case BmdExportType.CHART_OF_ACCOUNTS:
        await this.exportChartOfAccounts(config, tempExportDir);
        break;
      case BmdExportType.CUSTOMERS:
        await this.exportCustomers(config, tempExportDir);
        break;
      case BmdExportType.SUPPLIERS:
        await this.exportSuppliers(config, tempExportDir);
        break;
      case BmdExportType.TAX_ACCOUNTS:
        await this.exportTaxAccounts(config, tempExportDir);
        break;
      default:
        this.logger.warn(`Unknown export type: ${exportType}`);
    }
  }

  /**
   * Export booking journal (Buchungsjournal)
   */
  async exportBookingJournal(
    config: BmdConfig,
    tempExportDir: string,
  ): Promise<void> {
    this.logger.log('Generating booking journal export...');

    // Query transactions from database
    const transactions = await this.prisma.transaction.findMany({
      where: {
        orgId: config.orgId,
        date: {
          gte: config.dateRange.startDate,
          lte: config.dateRange.endDate,
        },
        ...(config.options.postedOnly && { status: 'POSTED' }),
      },
      include: {
        entries: {
          include: {
            account: true,
          },
        },
        invoice: true,
        taxInfo: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Generate CSV content
    const lines: string[] = [];

    // Add header if requested
    if (config.options.includeHeader) {
      lines.push(
        createBmdCsvLine([
          'Buchungsnummer',
          'Belegdatum',
          'Buchungsdatum',
          'Sollkonto',
          'Habenkonto',
          'Betrag',
          'Währung',
          'Steuercode',
          'Steuersatz',
          'Steuerbetrag',
          'Kostenstellennummer',
          'Belegnummer',
          'Belegtext',
          'UID-Nummer',
          'Gegenkontotyp',
          'Gegenkontonummer',
        ]),
      );
    }

    // Add transaction data
    for (const transaction of transactions) {
      // Process each journal entry pair
      for (let i = 0; i < transaction.entries.length; i += 2) {
        const debitEntry = transaction.entries[i];
        const creditEntry = transaction.entries[i + 1];

        if (!debitEntry || !creditEntry) continue;

        const bookingEntry: BmdBookingEntry = {
          buchungsnummer: transaction.transactionNumber || transaction.id,
          belegdatum: formatBmdDate(transaction.date),
          buchungsdatum: formatBmdDate(transaction.bookingDate || transaction.date),
          sollkonto: formatBmdAccountNumber(debitEntry.account.code),
          habenkonto: formatBmdAccountNumber(creditEntry.account.code),
          betrag: formatBmdNumber(Math.abs(debitEntry.amount)),
          waehrung: formatBmdCurrency(transaction.currency),
          steuercode: transaction.taxInfo
            ? formatBmdTaxCode(transaction.taxInfo.rate)
            : '',
          steuersatz: transaction.taxInfo
            ? formatBmdPercentage(transaction.taxInfo.rate)
            : '',
          steuerbetrag: transaction.taxInfo
            ? formatBmdNumber(transaction.taxInfo.amount)
            : '',
          kostenstelleId: transaction.costCenterId || '',
          belegnummer: transaction.invoice?.invoiceNumber || transaction.documentNumber || '',
          belegtext: sanitizeBmdText(transaction.description, 255),
          uidNummer: transaction.invoice?.customer?.vatId
            ? formatBmdVatId(transaction.invoice.customer.vatId)
            : '',
          gegenkontoTyp: transaction.invoice ? 'K' : '',
          gegenkontoNummer: transaction.invoice?.customerId || '',
        };

        lines.push(
          createBmdCsvLine([
            bookingEntry.buchungsnummer,
            bookingEntry.belegdatum,
            bookingEntry.buchungsdatum,
            bookingEntry.sollkonto,
            bookingEntry.habenkonto,
            bookingEntry.betrag,
            bookingEntry.waehrung,
            bookingEntry.steuercode,
            bookingEntry.steuersatz,
            bookingEntry.steuerbetrag,
            bookingEntry.kostenstelleId,
            bookingEntry.belegnummer,
            bookingEntry.belegtext,
            bookingEntry.uidNummer,
            bookingEntry.gegenkontoTyp,
            bookingEntry.gegenkontoNummer,
          ]),
        );
      }
    }

    // Write to file
    const csvContent = lines.join('\n');
    const filePath = path.join(tempExportDir, 'buchungsjournal', 'buchungsjournal.csv');
    await BmdPackagerUtil.writeCsvFile(
      filePath,
      csvContent,
      config.options.useIsoEncoding,
    );

    this.logger.log(`Booking journal exported: ${transactions.length} transactions`);
  }

  /**
   * Export chart of accounts (Kontenstamm)
   */
  async exportChartOfAccounts(
    config: BmdConfig,
    tempExportDir: string,
  ): Promise<void> {
    this.logger.log('Generating chart of accounts export...');

    // Query accounts from database
    const accounts = await this.prisma.account.findMany({
      where: {
        orgId: config.orgId,
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Generate CSV content
    const lines: string[] = [];

    // Add header
    if (config.options.includeHeader) {
      lines.push(
        createBmdCsvLine([
          'Kontonummer',
          'Kontobezeichnung',
          'Kontotyp',
          'Eröffnungsbilanz',
          'Steuercode',
          'Kostenstellenzuordnung',
          'Automatikkonto',
          'Saldovortrag',
        ]),
      );
    }

    // Add account data
    for (const account of accounts) {
      const accountEntry: BmdAccountEntry = {
        kontonummer: formatBmdAccountNumber(account.code),
        kontobezeichnung: sanitizeBmdText(account.name, 100),
        kontotyp: mapAccountTypeToBmd(account.type),
        eroeffnungsbilanz: formatBmdNumber(account.openingBalance || 0),
        steuercode: account.defaultTaxCode || '',
        kostenstelleZuordnung: account.allowCostCenter || false,
        automatikKonto: account.isAutomatic || false,
        saldoVortrag: formatBmdNumber(account.balanceCarryForward || 0),
      };

      lines.push(
        createBmdCsvLine([
          accountEntry.kontonummer,
          accountEntry.kontobezeichnung,
          accountEntry.kontotyp,
          accountEntry.eroeffnungsbilanz,
          accountEntry.steuercode,
          accountEntry.kostenstelleZuordnung ? '1' : '0',
          accountEntry.automatikKonto ? '1' : '0',
          accountEntry.saldoVortrag,
        ]),
      );
    }

    // Write to file
    const csvContent = lines.join('\n');
    const filePath = path.join(tempExportDir, 'stammdaten', 'konten.csv');
    await BmdPackagerUtil.writeCsvFile(
      filePath,
      csvContent,
      config.options.useIsoEncoding,
    );

    this.logger.log(`Chart of accounts exported: ${accounts.length} accounts`);
  }

  /**
   * Export customers (Kundenstamm)
   */
  async exportCustomers(
    config: BmdConfig,
    tempExportDir: string,
  ): Promise<void> {
    this.logger.log('Generating customers export...');

    // Query customers from database
    const customers = await this.prisma.customer.findMany({
      where: {
        orgId: config.orgId,
      },
      include: {
        billingAddress: true,
      },
      orderBy: {
        customerNumber: 'asc',
      },
    });

    // Generate CSV content
    const lines: string[] = [];

    // Add header
    if (config.options.includeHeader) {
      lines.push(
        createBmdCsvLine([
          'Kundennummer',
          'Name',
          'Adresse',
          'PLZ',
          'Ort',
          'Land',
          'UID-Nummer',
          'Debitorenkonto',
          'Zahlungsziel',
          'Steuerzone',
          'Währung',
          'E-Mail',
          'Telefon',
        ]),
      );
    }

    // Add customer data
    for (const customer of customers) {
      const address = customer.billingAddress;

      const customerEntry: BmdCustomerEntry = {
        kundennummer: customer.customerNumber,
        name: sanitizeBmdText(customer.name, 100),
        adresse: sanitizeBmdText(address?.street || '', 100),
        plz: address?.postalCode || '',
        ort: sanitizeBmdText(address?.city || '', 50),
        land: formatBmdCountryCode(address?.country),
        uidNummer: formatBmdVatId(customer.vatId),
        debitorenkonto: formatBmdAccountNumber(customer.accountsReceivableAccount || '1400'),
        zahlungsziel: customer.paymentTermsDays || 30,
        steuerzone: customer.taxZone || 'AT',
        waehrung: formatBmdCurrency(customer.currency),
        email: customer.email || '',
        telefon: customer.phone || '',
      };

      lines.push(
        createBmdCsvLine([
          customerEntry.kundennummer,
          customerEntry.name,
          customerEntry.adresse,
          customerEntry.plz,
          customerEntry.ort,
          customerEntry.land,
          customerEntry.uidNummer,
          customerEntry.debitorenkonto,
          customerEntry.zahlungsziel.toString(),
          customerEntry.steuerzone,
          customerEntry.waehrung,
          customerEntry.email,
          customerEntry.telefon,
        ]),
      );
    }

    // Write to file
    const csvContent = lines.join('\n');
    const filePath = path.join(tempExportDir, 'stammdaten', 'kunden.csv');
    await BmdPackagerUtil.writeCsvFile(
      filePath,
      csvContent,
      config.options.useIsoEncoding,
    );

    this.logger.log(`Customers exported: ${customers.length} customers`);
  }

  /**
   * Export suppliers (Lieferantenstamm)
   */
  async exportSuppliers(
    config: BmdConfig,
    tempExportDir: string,
  ): Promise<void> {
    this.logger.log('Generating suppliers export...');

    // Query suppliers from database
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        orgId: config.orgId,
      },
      include: {
        address: true,
      },
      orderBy: {
        supplierNumber: 'asc',
      },
    });

    // Generate CSV content
    const lines: string[] = [];

    // Add header
    if (config.options.includeHeader) {
      lines.push(
        createBmdCsvLine([
          'Lieferantennummer',
          'Name',
          'Adresse',
          'PLZ',
          'Ort',
          'Land',
          'UID-Nummer',
          'Kreditorenkonto',
          'Zahlungsziel',
          'Steuerzone',
          'Währung',
          'E-Mail',
          'Telefon',
          'IBAN',
          'BIC',
        ]),
      );
    }

    // Add supplier data
    for (const supplier of suppliers) {
      const address = supplier.address;

      const supplierEntry: BmdSupplierEntry = {
        lieferantennummer: supplier.supplierNumber,
        name: sanitizeBmdText(supplier.name, 100),
        adresse: sanitizeBmdText(address?.street || '', 100),
        plz: address?.postalCode || '',
        ort: sanitizeBmdText(address?.city || '', 50),
        land: formatBmdCountryCode(address?.country),
        uidNummer: formatBmdVatId(supplier.vatId),
        kreditorenkonto: formatBmdAccountNumber(supplier.accountsPayableAccount || '3300'),
        zahlungsziel: supplier.paymentTermsDays || 30,
        steuerzone: supplier.taxZone || 'AT',
        waehrung: formatBmdCurrency(supplier.currency),
        email: supplier.email || '',
        telefon: supplier.phone || '',
        iban: supplier.iban || '',
        bic: supplier.bic || '',
      };

      lines.push(
        createBmdCsvLine([
          supplierEntry.lieferantennummer,
          supplierEntry.name,
          supplierEntry.adresse,
          supplierEntry.plz,
          supplierEntry.ort,
          supplierEntry.land,
          supplierEntry.uidNummer,
          supplierEntry.kreditorenkonto,
          supplierEntry.zahlungsziel.toString(),
          supplierEntry.steuerzone,
          supplierEntry.waehrung,
          supplierEntry.email,
          supplierEntry.telefon,
          supplierEntry.iban,
          supplierEntry.bic,
        ]),
      );
    }

    // Write to file
    const csvContent = lines.join('\n');
    const filePath = path.join(tempExportDir, 'stammdaten', 'lieferanten.csv');
    await BmdPackagerUtil.writeCsvFile(
      filePath,
      csvContent,
      config.options.useIsoEncoding,
    );

    this.logger.log(`Suppliers exported: ${suppliers.length} suppliers`);
  }

  /**
   * Export tax accounts (Steuerkonto-Zuordnung)
   */
  async exportTaxAccounts(
    config: BmdConfig,
    tempExportDir: string,
  ): Promise<void> {
    this.logger.log('Generating tax accounts export...');

    // Query tax configurations
    const taxConfigs = await this.prisma.taxConfiguration.findMany({
      where: {
        orgId: config.orgId,
        countryCode: 'AT',
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Generate CSV content
    const lines: string[] = [];

    // Add header
    if (config.options.includeHeader) {
      lines.push(
        createBmdCsvLine([
          'Steuercode',
          'Steuersatz',
          'Vorsteuerkonto',
          'Umsatzsteuerkonto',
          'Beschreibung',
        ]),
      );
    }

    // Add tax account data
    for (const taxConfig of taxConfigs) {
      lines.push(
        createBmdCsvLine([
          formatBmdTaxCode(taxConfig.rate),
          formatBmdPercentage(taxConfig.rate),
          formatBmdAccountNumber(taxConfig.inputTaxAccount || '2500'),
          formatBmdAccountNumber(taxConfig.outputTaxAccount || '3500'),
          sanitizeBmdText(taxConfig.name, 100),
        ]),
      );
    }

    // Write to file
    const csvContent = lines.join('\n');
    const filePath = path.join(tempExportDir, 'stammdaten', 'steuerkonten.csv');
    await BmdPackagerUtil.writeCsvFile(
      filePath,
      csvContent,
      config.options.useIsoEncoding,
    );

    this.logger.log(`Tax accounts exported: ${taxConfigs.length} configurations`);
  }

  /**
   * Create export record in database
   */
  private async createExportRecord(
    id: string,
    orgId: string,
    filename: string,
    startDate: Date,
    endDate: Date,
    exportTypes: BmdExportType[],
  ): Promise<any> {
    return this.prisma.gobdExport.create({
      data: {
        id,
        orgId,
        filename,
        status: ExportStatus.PENDING,
        startDate,
        endDate,
        year: startDate.getFullYear(),
        // Store export types in metadata or separate field
        exportType: 'BMD',
      },
    });
  }

  /**
   * Find export record
   */
  private async findExportRecord(exportId: string): Promise<any> {
    const exportRecord = await this.prisma.gobdExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export not found: ${exportId}`);
    }

    return exportRecord;
  }

  /**
   * Update export status
   */
  private async updateExportStatus(
    exportId: string,
    status: ExportStatus,
  ): Promise<void> {
    await this.prisma.gobdExport.update({
      where: { id: exportId },
      data: { status },
    });
  }

  /**
   * Generate unique export ID
   */
  private generateExportId(): string {
    return `bmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired exports (run as cron job)
   */
  async cleanupExpiredExports(): Promise<void> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.retentionDays);

    const expiredExports = await this.prisma.gobdExport.findMany({
      where: {
        exportType: 'BMD',
        createdAt: {
          lt: expirationDate,
        },
      },
    });

    this.logger.log(`Cleaning up ${expiredExports.length} expired BMD exports`);

    for (const exp of expiredExports) {
      try {
        await this.deleteExport(exp.id);
      } catch (error) {
        this.logger.error(`Failed to cleanup export ${exp.id}:`, error);
      }
    }
  }
}
