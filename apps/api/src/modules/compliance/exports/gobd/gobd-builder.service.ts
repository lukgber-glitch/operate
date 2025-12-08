import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import * as path from 'path';
import {
  GobdIndex,
  TableDefinition,
  DataSupplier,
  MediaDefinition,
} from './interfaces/gobd-index.interface';
import {
  DataTables,
  AccountData,
  TransactionData,
  InvoiceData,
  CustomerData,
  SupplierData,
  ChecksumFile,
  DocumentMetadata,
  DocumentPackage,
} from './interfaces/gobd-document.interface';
import { DateRange, GobdConfig } from './interfaces/gobd-config.interface';
import { GobdXmlBuilder } from './utils/gobd-xml-builder.util';
import { GobdHashUtil } from './utils/gobd-hash.util';
import { GobdPackagerUtil } from './utils/gobd-packager.util';

/**
 * GoBD Builder Service
 * Handles construction of GoBD export components
 */
@Injectable()
export class GobdBuilderService {
  private readonly logger = new Logger(GobdBuilderService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Build complete index.xml
   */
  async buildIndexXml(
    config: GobdConfig,
    orgInfo: any,
  ): Promise<string> {
    this.logger.log(`Building index.xml for org: ${config.orgId}`);

    const dataSupplier: DataSupplier = {
      name: orgInfo.name || 'Unknown Company',
      location: this.formatAddress(orgInfo.address),
      contact: orgInfo.email || '',
      comment: `GoBD Export created by Operate - ${config.metadata?.notes || ''}`,
    };

    const tables = this.buildTableDefinitions(config.dateRange);

    const media: MediaDefinition = {
      name: 'GoBD Export',
      tables,
    };

    const gobdIndex: GobdIndex = {
      version: '1.0',
      dataSupplier,
      media,
      createdAt: new Date(),
      dateRange: {
        from: config.dateRange.startDate,
        to: config.dateRange.endDate,
      },
    };

    return GobdXmlBuilder.buildIndexXml(gobdIndex);
  }

  /**
   * Build table definitions for index.xml
   */
  private buildTableDefinitions(dateRange: DateRange): TableDefinition[] {
    const tables: TableDefinition[] = [];

    // Accounts table
    tables.push({
      name: 'accounts',
      url: 'data/accounts.csv',
      description: 'Kontenplan (Chart of Accounts)',
      decimalSymbol: ',',
      digitGroupingSymbol: '.',
      columnDelimiter: ';',
      textEncapsulator: '"',
      recordDelimiter: '&#10;',
      primaryKey: ['accountNumber'],
      columns: [
        {
          name: 'accountNumber',
          description: 'Kontonummer',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'accountName',
          description: 'Kontenbezeichnung',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'accountType',
          description: 'Kontenart',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'openingBalance',
          description: 'Eröffnungsbilanzwert',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'closingBalance',
          description: 'Schlussbilanzwert',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'currency',
          description: 'Währung',
          dataType: 'AlphaNumeric',
        },
      ],
    });

    // Transactions table
    tables.push({
      name: 'transactions',
      url: 'data/transactions.csv',
      description: 'Buchungssätze (Journal Entries)',
      decimalSymbol: ',',
      digitGroupingSymbol: '.',
      columnDelimiter: ';',
      textEncapsulator: '"',
      recordDelimiter: '&#10;',
      primaryKey: ['id'],
      columns: [
        {
          name: 'id',
          description: 'Buchungs-ID',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'date',
          description: 'Buchungsdatum',
          dataType: 'Date',
          format: 'DD.MM.YYYY',
        },
        {
          name: 'debitAccount',
          description: 'Sollkonto',
          dataType: 'AlphaNumeric',
          map: 'accounts.accountNumber',
        },
        {
          name: 'creditAccount',
          description: 'Habenkonto',
          dataType: 'AlphaNumeric',
          map: 'accounts.accountNumber',
        },
        {
          name: 'amount',
          description: 'Betrag',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'currency',
          description: 'Währung',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'text',
          description: 'Buchungstext',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'documentNumber',
          description: 'Belegnummer',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'documentReference',
          description: 'Belegspeicherort',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'costCenter',
          description: 'Kostenstelle',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'taxCode',
          description: 'Steuerschlüssel',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'taxAmount',
          description: 'Steuerbetrag',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
      ],
      foreignKeys: [
        {
          name: 'fk_debit_account',
          referencedTable: 'accounts',
          referencedColumn: 'accountNumber',
        },
        {
          name: 'fk_credit_account',
          referencedTable: 'accounts',
          referencedColumn: 'accountNumber',
        },
      ],
    });

    // Invoices table
    tables.push({
      name: 'invoices',
      url: 'data/invoices.csv',
      description: 'Rechnungen (Invoices)',
      decimalSymbol: ',',
      digitGroupingSymbol: '.',
      columnDelimiter: ';',
      textEncapsulator: '"',
      recordDelimiter: '&#10;',
      primaryKey: ['id'],
      columns: [
        {
          name: 'id',
          description: 'Rechnungs-ID',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'invoiceNumber',
          description: 'Rechnungsnummer',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'date',
          description: 'Rechnungsdatum',
          dataType: 'Date',
          format: 'DD.MM.YYYY',
        },
        {
          name: 'dueDate',
          description: 'Fälligkeitsdatum',
          dataType: 'Date',
          format: 'DD.MM.YYYY',
        },
        {
          name: 'customerId',
          description: 'Kunden-ID',
          dataType: 'AlphaNumeric',
          map: 'customers.id',
        },
        {
          name: 'netAmount',
          description: 'Nettobetrag',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'taxAmount',
          description: 'Steuerbetrag',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'grossAmount',
          description: 'Bruttobetrag',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'currency',
          description: 'Währung',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'taxRate',
          description: 'Steuersatz',
          dataType: 'Numeric',
          numeric: { accuracy: 2 },
        },
        {
          name: 'status',
          description: 'Status',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'documentPath',
          description: 'Dokumentpfad',
          dataType: 'AlphaNumeric',
        },
      ],
      foreignKeys: [
        {
          name: 'fk_customer',
          referencedTable: 'customers',
          referencedColumn: 'id',
        },
      ],
    });

    // Customers table
    tables.push({
      name: 'customers',
      url: 'data/customers.csv',
      description: 'Kundenstammdaten (Customer Master Data)',
      decimalSymbol: ',',
      digitGroupingSymbol: '.',
      columnDelimiter: ';',
      textEncapsulator: '"',
      recordDelimiter: '&#10;',
      primaryKey: ['id'],
      columns: [
        {
          name: 'id',
          description: 'Kunden-ID',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'customerNumber',
          description: 'Kundennummer',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'name',
          description: 'Firmenname',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'taxId',
          description: 'Steuernummer/USt-IdNr',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'street',
          description: 'Straße',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'postalCode',
          description: 'PLZ',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'city',
          description: 'Stadt',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'country',
          description: 'Land',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'email',
          description: 'E-Mail',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'phone',
          description: 'Telefon',
          dataType: 'AlphaNumeric',
        },
      ],
    });

    // Suppliers table
    tables.push({
      name: 'suppliers',
      url: 'data/suppliers.csv',
      description: 'Lieferantenstammdaten (Supplier Master Data)',
      decimalSymbol: ',',
      digitGroupingSymbol: '.',
      columnDelimiter: ';',
      textEncapsulator: '"',
      recordDelimiter: '&#10;',
      primaryKey: ['id'],
      columns: [
        {
          name: 'id',
          description: 'Lieferanten-ID',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'supplierNumber',
          description: 'Lieferantennummer',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'name',
          description: 'Firmenname',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'taxId',
          description: 'Steuernummer/USt-IdNr',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'street',
          description: 'Straße',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'postalCode',
          description: 'PLZ',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'city',
          description: 'Stadt',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'country',
          description: 'Land',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'email',
          description: 'E-Mail',
          dataType: 'AlphaNumeric',
        },
        {
          name: 'phone',
          description: 'Telefon',
          dataType: 'AlphaNumeric',
        },
      ],
    });

    return tables;
  }

  /**
   * Export data tables from database
   */
  async exportDataTables(
    orgId: string,
    dateRange: DateRange,
  ): Promise<DataTables> {
    this.logger.log(`Exporting data tables for org: ${orgId}`);

    const [accounts, transactions, invoices, customers, suppliers] = await Promise.all([
      this.exportAccounts(orgId),
      this.exportTransactions(orgId, dateRange),
      this.exportInvoices(orgId, dateRange),
      this.exportCustomers(orgId),
      this.exportSuppliers(orgId),
    ]);

    return {
      accounts,
      transactions,
      invoices,
      customers,
      suppliers,
    };
  }

  /**
   * Export accounts (chart of accounts)
   */
  private async exportAccounts(orgId: string): Promise<AccountData[]> {
    // Note: This implementation assumes you have an accounts or chartOfAccounts table
    // If not yet implemented, this will return empty array
    // You can add the schema later when implementing the accounting module

    try {
      // Check if accounts table exists by trying to query it
      // This is a placeholder - replace with actual account model when available
      const accounts = await (this.prisma as Prisma.InputJsonValue).account?.findMany({
        where: {
          orgId,
        },
        select: {
          accountNumber: true,
          name: true,
          type: true,
          openingBalance: true,
          closingBalance: true,
          currency: true,
        },
      });

      if (!accounts) {
        this.logger.warn('Account table not yet implemented, returning empty array');
        return [];
      }

      return accounts.map((acc: any) => ({
        accountNumber: acc.accountNumber || '',
        accountName: acc.name || '',
        accountType: acc.type || 'Asset',
        openingBalance: Number(acc.openingBalance || 0),
        closingBalance: Number(acc.closingBalance || 0),
        currency: acc.currency || 'EUR',
      }));
    } catch (error) {
      this.logger.warn(`Failed to export accounts: ${error.message}`);
      return [];
    }
  }

  /**
   * Export transactions
   */
  private async exportTransactions(
    orgId: string,
    dateRange: DateRange,
  ): Promise<TransactionData[]> {
    // Query actual transactions from database
    const transactions = await this.prisma.transaction.findMany({
      where: {
        orgId,
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return transactions.map((txn) => ({
      id: txn.id,
      date: this.formatDate(txn.date),
      debitAccount: '', // Note: These fields require journal entry model
      creditAccount: '', // Will be implemented when accounting module is added
      amount: Number(txn.amount),
      currency: txn.currency,
      text: txn.description || '',
      documentNumber: txn.id.substring(0, 10),
      documentReference: '',
      costCenter: '',
      taxCode: '',
      taxAmount: 0,
    }));
  }

  /**
   * Export invoices
   */
  private async exportInvoices(
    orgId: string,
    dateRange: DateRange,
  ): Promise<InvoiceData[]> {
    // Note: Invoice table not yet in schema - will return empty until implemented
    try {
      const invoices = await (this.prisma as Prisma.InputJsonValue).invoice?.findMany({
        where: {
          orgId,
          date: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      if (!invoices) {
        this.logger.warn('Invoice table not yet implemented, returning empty array');
        return [];
      }

      return invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id,
        date: this.formatDate(inv.date),
        dueDate: inv.dueDate ? this.formatDate(inv.dueDate) : '',
        customerId: inv.customerId || '',
        netAmount: Number(inv.netAmount || 0),
        taxAmount: Number(inv.taxAmount || 0),
        grossAmount: Number(inv.grossAmount || 0),
        currency: inv.currency || 'EUR',
        taxRate: Number(inv.taxRate || 0),
        status: inv.status || 'DRAFT',
        documentPath: inv.documentPath || '',
      }));
    } catch (error) {
      this.logger.warn(`Failed to export invoices: ${error.message}`);
      return [];
    }
  }

  /**
   * Export customers
   */
  private async exportCustomers(orgId: string): Promise<CustomerData[]> {
    // Note: Customer table not yet in schema - will return empty until implemented
    try {
      const customers = await (this.prisma as Prisma.InputJsonValue).customer?.findMany({
        where: {
          orgId,
        },
        orderBy: {
          customerNumber: 'asc',
        },
      });

      if (!customers) {
        this.logger.warn('Customer table not yet implemented, returning empty array');
        return [];
      }

      return customers.map((cust: any) => ({
        id: cust.id,
        customerNumber: cust.customerNumber || cust.id,
        name: cust.name || '',
        taxId: cust.taxId || '',
        street: cust.street || '',
        postalCode: cust.postalCode || '',
        city: cust.city || '',
        country: cust.country || 'DE',
        email: cust.email || '',
        phone: cust.phone || '',
      }));
    } catch (error) {
      this.logger.warn(`Failed to export customers: ${error.message}`);
      return [];
    }
  }

  /**
   * Export suppliers
   */
  private async exportSuppliers(orgId: string): Promise<SupplierData[]> {
    // Note: Supplier table not yet in schema - will return empty until implemented
    try {
      const suppliers = await (this.prisma as Prisma.InputJsonValue).supplier?.findMany({
        where: {
          orgId,
        },
        orderBy: {
          supplierNumber: 'asc',
        },
      });

      if (!suppliers) {
        this.logger.warn('Supplier table not yet implemented, returning empty array');
        return [];
      }

      return suppliers.map((supp: any) => ({
        id: supp.id,
        supplierNumber: supp.supplierNumber || supp.id,
        name: supp.name || '',
        taxId: supp.taxId || '',
        street: supp.street || '',
        postalCode: supp.postalCode || '',
        city: supp.city || '',
        country: supp.country || 'DE',
        email: supp.email || '',
        phone: supp.phone || '',
      }));
    } catch (error) {
      this.logger.warn(`Failed to export suppliers: ${error.message}`);
      return [];
    }
  }

  /**
   * Package documents for export
   */
  async packageDocuments(
    orgId: string,
    dateRange: DateRange,
    baseDir: string,
  ): Promise<DocumentPackage> {
    this.logger.log(`Packaging documents for org: ${orgId}`);

    // TODO: Implement actual document retrieval from storage
    // This is a placeholder implementation

    return {
      baseDir,
      categories: {
        invoices: [],
        receipts: [],
        contracts: [],
      },
      totalCount: 0,
      totalSize: 0,
    };
  }

  /**
   * Generate checksums for all files
   */
  async generateChecksums(baseDir: string): Promise<ChecksumFile> {
    this.logger.log(`Generating checksums for: ${baseDir}`);
    return GobdHashUtil.generateChecksums(baseDir);
  }

  /**
   * Format address for data supplier
   */
  private formatAddress(address: any): string {
    if (!address) return 'N/A';

    const parts = [
      address.street,
      address.postalCode,
      address.city,
      address.country,
    ].filter(Boolean);

    return parts.join(', ') || 'N/A';
  }

  /**
   * Format date for CSV (DD.MM.YYYY)
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Format number for CSV (German format: comma as decimal separator)
   */
  formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals).replace('.', ',');
  }
}
