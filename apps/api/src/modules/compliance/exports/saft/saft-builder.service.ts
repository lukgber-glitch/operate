/**
 * SAF-T Builder Service
 * Responsible for building complete SAF-T XML structures
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  SaftOptions,
  SaftHeader,
  SaftMasterFiles,
  SaftGeneralLedgerEntries,
  SaftSourceDocuments,
  SaftAuditFile,
  SaftVariant,
  FiscalPeriod,
  SaftGeneralLedgerAccount,
  AccountType,
  SaftCustomer,
  SaftSupplier,
  SaftTaxTableEntry,
  SaftJournal,
  JournalType,
  SaftTransaction,
  SaftTransactionLine,
  DebitCreditIndicator,
  TransactionType,
  SaftSalesInvoice,
  InvoiceStatus,
  InvoiceType,
  SaftInvoiceLine,
} from './interfaces';
import { SaftXmlBuilder } from './utils/saft-xml-builder.util';

/**
 * SAF-T Builder Service
 */
@Injectable()
export class SaftBuilderService {
  private readonly logger = new Logger(SaftBuilderService.name);
  private readonly xmlBuilder: SaftXmlBuilder;

  constructor(private readonly prisma: PrismaService) {
    this.xmlBuilder = new SaftXmlBuilder();
  }

  /**
   * Build complete SAF-T XML
   */
  async buildSaftXml(
    organizationId: string,
    options: SaftOptions,
  ): Promise<string> {
    this.logger.log(
      `Building SAF-T XML for organization ${organizationId} with variant ${options.variant}`,
    );

    // Build audit file structure
    const auditFile = await this.buildAuditFile(organizationId, options);

    // Generate XML
    const xml = this.xmlBuilder.buildXml(auditFile);

    this.logger.log(`SAF-T XML generated successfully`);
    return xml;
  }

  /**
   * Build complete audit file structure
   */
  private async buildAuditFile(
    organizationId: string,
    options: SaftOptions,
  ): Promise<SaftAuditFile> {
    const fiscalPeriod: FiscalPeriod = {
      year: options.dateRange.startDate.getFullYear(),
      startDate: options.dateRange.startDate,
      endDate: options.dateRange.endDate,
    };

    const auditFile: SaftAuditFile = {
      header: await this.buildHeader(organizationId, fiscalPeriod, options),
      masterFiles: await this.buildMasterFiles(organizationId, options),
    };

    // Add general ledger entries if in scope
    if (
      options.scope === 'FULL' ||
      options.scope === 'TRANSACTIONS'
    ) {
      auditFile.generalLedgerEntries = await this.buildGeneralLedgerEntries(
        organizationId,
        options.dateRange,
      );
    }

    // Add source documents if in scope
    if (
      options.scope === 'FULL' ||
      options.scope === 'SOURCE_DOCUMENTS'
    ) {
      auditFile.sourceDocuments = await this.buildSourceDocuments(
        organizationId,
        options.dateRange,
      );
    }

    return auditFile;
  }

  /**
   * Build Header section
   */
  async buildHeader(
    organizationId: string,
    period: FiscalPeriod,
    options: SaftOptions,
  ): Promise<SaftHeader> {
    this.logger.log(`Building header for organization ${organizationId}`);

    // Fetch organization details
    const organization = await this.prisma.organisation.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const countryCode = organization.country || 'DE';

    const header: SaftHeader = {
      auditFileVersion: '2.00',
      auditFileCountry: countryCode,
      auditFileDateCreated: new Date().toISOString().split('T')[0],
      company: {
        companyID: organization.id,
        taxRegistrationNumber: organization.id,
        companyName: organization.name,
        companyAddress: {
          streetName: '',
          addressDetail: '',
          city: '',
          postalCode: '',
          region: '',
          country: countryCode,
        },
        contact: undefined,
        vatNumber: undefined,
        taxAccountingBasis: 'I', // Invoice basis
      },
      software: {
        softwareCompanyName: 'Operate',
        softwareID: 'OPERATE-COACHOS',
        softwareVersion: '1.0.0',
        productID: 'OPERATE-SAFT',
        productVersion: '1.0.0',
      },
      defaultCurrencyCode: organization.currency || 'EUR',
      selectionCriteria: {
        periodStart: period.startDate.toISOString().split('T')[0],
        periodEnd: period.endDate.toISOString().split('T')[0],
        periodStartYear: period.year,
        periodEndYear: period.endDate.getFullYear(),
      },
      taxAccountingBasis: 'I',
      email: undefined,
      telephone: undefined,
    };

    // Add country-specific extensions
    if (options.countrySpecificExtensions) {
      header.extensions = options.countrySpecificExtensions;
    }

    return header;
  }

  /**
   * Build Master Files section
   */
  async buildMasterFiles(
    organizationId: string,
    options: SaftOptions,
  ): Promise<SaftMasterFiles> {
    this.logger.log(`Building master files for organization ${organizationId}`);

    const masterFiles: SaftMasterFiles = {
      generalLedgerAccounts: await this.buildGeneralLedgerAccounts(
        organizationId,
        options,
      ),
    };

    if (options.includeCustomerSupplierDetails) {
      masterFiles.customers = await this.buildCustomers(organizationId, options);
      masterFiles.suppliers = await this.buildSuppliers(organizationId, options);
    }

    if (options.includeTaxDetails) {
      masterFiles.taxTable = await this.buildTaxTable(organizationId);
    }

    return masterFiles;
  }

  /**
   * Build General Ledger Accounts
   */
  private async buildGeneralLedgerAccounts(
    organizationId: string,
    options: SaftOptions,
  ): Promise<SaftGeneralLedgerAccount[]> {
    // For now, return sample data structure
    // TODO: Integrate with actual chart of accounts from database
    this.logger.log('Building general ledger accounts');

    // Placeholder - should fetch from actual database
    const accounts: SaftGeneralLedgerAccount[] = [
      {
        accountID: '1000',
        accountDescription: 'Cash',
        accountType: AccountType.ASSET,
        openingDebitBalance: options.includeOpeningBalances ? 10000 : undefined,
        closingDebitBalance: options.includeClosingBalances ? 15000 : undefined,
      },
      {
        accountID: '1200',
        accountDescription: 'Accounts Receivable',
        accountType: AccountType.ASSET,
        openingDebitBalance: options.includeOpeningBalances ? 25000 : undefined,
        closingDebitBalance: options.includeClosingBalances ? 30000 : undefined,
      },
      {
        accountID: '2000',
        accountDescription: 'Accounts Payable',
        accountType: AccountType.LIABILITY,
        openingCreditBalance: options.includeOpeningBalances ? 15000 : undefined,
        closingCreditBalance: options.includeClosingBalances ? 18000 : undefined,
      },
      {
        accountID: '3000',
        accountDescription: 'Equity',
        accountType: AccountType.EQUITY,
        openingCreditBalance: options.includeOpeningBalances ? 20000 : undefined,
        closingCreditBalance: options.includeClosingBalances ? 27000 : undefined,
      },
      {
        accountID: '4000',
        accountDescription: 'Sales Revenue',
        accountType: AccountType.REVENUE,
      },
      {
        accountID: '5000',
        accountDescription: 'Cost of Goods Sold',
        accountType: AccountType.EXPENSE,
      },
    ];

    return accounts;
  }

  /**
   * Build Customers
   */
  private async buildCustomers(
    organizationId: string,
    options: SaftOptions,
  ): Promise<SaftCustomer[]> {
    this.logger.log('Building customers');

    // Placeholder - should fetch from actual database
    const customers: SaftCustomer[] = [
      {
        customerID: 'CUST001',
        accountID: '1200',
        companyName: 'Sample Customer GmbH',
        billingAddress: {
          streetName: 'Hauptstrasse',
          addressDetail: '123',
          city: 'Berlin',
          postalCode: '10115',
          country: 'DE',
        },
        email: 'customer@example.com',
        openingDebitBalance: options.includeOpeningBalances ? 5000 : undefined,
      },
    ];

    return customers;
  }

  /**
   * Build Suppliers
   */
  private async buildSuppliers(
    organizationId: string,
    options: SaftOptions,
  ): Promise<SaftSupplier[]> {
    this.logger.log('Building suppliers');

    // Placeholder - should fetch from actual database
    const suppliers: SaftSupplier[] = [
      {
        supplierID: 'SUPP001',
        accountID: '2000',
        companyName: 'Sample Supplier GmbH',
        billingAddress: {
          streetName: 'Musterstrasse',
          addressDetail: '456',
          city: 'Munich',
          postalCode: '80331',
          country: 'DE',
        },
        email: 'supplier@example.com',
        openingCreditBalance: options.includeOpeningBalances ? 8000 : undefined,
      },
    ];

    return suppliers;
  }

  /**
   * Build Tax Table
   */
  private async buildTaxTable(
    organizationId: string,
  ): Promise<SaftTaxTableEntry[]> {
    this.logger.log('Building tax table');

    // Placeholder - should fetch from actual tax configuration
    const taxTable: SaftTaxTableEntry[] = [
      {
        taxType: 'VAT',
        taxCodeDetails: [
          {
            taxCode: 'STANDARD',
            description: 'Standard VAT Rate',
            taxPercentage: 19.0,
            country: 'DE',
          },
          {
            taxCode: 'REDUCED',
            description: 'Reduced VAT Rate',
            taxPercentage: 7.0,
            country: 'DE',
          },
          {
            taxCode: 'EXEMPT',
            description: 'VAT Exempt',
            taxPercentage: 0.0,
            country: 'DE',
          },
        ],
      },
    ];

    return taxTable;
  }

  /**
   * Build General Ledger Entries
   */
  async buildGeneralLedgerEntries(
    organizationId: string,
    dateRange: { startDate: Date; endDate: Date },
  ): Promise<SaftGeneralLedgerEntries> {
    this.logger.log('Building general ledger entries');

    // Placeholder - should fetch from actual journal entries
    const journals: SaftJournal[] = [
      {
        journalID: 'SALES',
        description: 'Sales Journal',
        type: JournalType.SALES,
        transactions: [
          {
            transactionID: 'TXN001',
            period: '1',
            periodYear: dateRange.startDate.getFullYear().toString(),
            transactionDate: '2024-01-15',
            description: 'Sales Invoice INV-001',
            customerID: 'CUST001',
            transactionType: TransactionType.NORMAL,
            lines: [
              {
                recordID: 'LINE001',
                accountID: '1200',
                description: 'Sales Invoice INV-001',
                debitAmount: 1190,
              },
              {
                recordID: 'LINE002',
                accountID: '4000',
                description: 'Sales Revenue',
                creditAmount: 1000,
              },
              {
                recordID: 'LINE003',
                accountID: '2300',
                description: 'VAT Payable',
                creditAmount: 190,
              },
            ],
          },
        ],
      },
    ];

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    let numberOfEntries = 0;

    journals.forEach((journal) => {
      journal.transactions.forEach((transaction) => {
        numberOfEntries++;
        transaction.lines.forEach((line) => {
          totalDebit += line.debitAmount || 0;
          totalCredit += line.creditAmount || 0;
        });
      });
    });

    return {
      numberOfEntries,
      totalDebit,
      totalCredit,
      journal: journals,
    };
  }

  /**
   * Build Source Documents
   */
  async buildSourceDocuments(
    organizationId: string,
    dateRange: { startDate: Date; endDate: Date },
  ): Promise<SaftSourceDocuments> {
    this.logger.log('Building source documents');

    // Placeholder - should fetch from actual invoices
    const salesInvoices: SaftSalesInvoice[] = [
      {
        invoiceNo: 'INV-001',
        documentStatus: {
          invoiceStatus: InvoiceStatus.NORMAL,
          invoiceStatusDate: '2024-01-15',
          sourceID: 'USER001',
          sourceBilling: 'I',
        },
        invoiceDate: '2024-01-15',
        invoiceType: InvoiceType.INVOICE,
        customerID: 'CUST001',
        line: [
          {
            lineNumber: 1,
            productCode: 'PROD001',
            productDescription: 'Consulting Services',
            quantity: 10,
            unitOfMeasure: 'hours',
            unitPrice: 100,
            debitAmount: 1000,
            tax: {
              taxType: 'VAT',
              taxCountryRegion: 'DE',
              taxCode: 'STANDARD',
              taxPercentage: 19,
              taxBase: 1000,
              taxAmount: 190,
            },
          },
        ],
        documentTotals: {
          taxPayable: 190,
          netTotal: 1000,
          grossTotal: 1190,
        },
      },
    ];

    return {
      salesInvoices: {
        numberOfEntries: salesInvoices.length,
        totalDebit: 1190,
        totalCredit: 1190,
        invoice: salesInvoices,
      },
    };
  }

  /**
   * Build variant-specific SAF-T
   */
  async buildVariantSpecific(
    organizationId: string,
    variant: SaftVariant,
    options: SaftOptions,
  ): Promise<string> {
    this.logger.log(`Building SAF-T for variant ${variant}`);

    // Apply variant-specific transformations
    switch (variant) {
      case SaftVariant.PORTUGAL:
        return this.buildPortugalSaft(organizationId, options);
      case SaftVariant.NORWAY:
        return this.buildNorwaySaft(organizationId, options);
      case SaftVariant.AUSTRIA:
        return this.buildAustriaSaft(organizationId, options);
      case SaftVariant.POLAND:
        return this.buildPolandSaft(organizationId, options);
      default:
        return this.buildSaftXml(organizationId, options);
    }
  }

  /**
   * Build Portugal-specific SAF-T
   */
  private async buildPortugalSaft(
    organizationId: string,
    options: SaftOptions,
  ): Promise<string> {
    // Portugal requires invoice hash and certification
    this.logger.log('Building Portugal SAF-T (SAF-T PT)');
    // Add Portugal-specific logic
    return this.buildSaftXml(organizationId, options);
  }

  /**
   * Build Norway-specific SAF-T
   */
  private async buildNorwaySaft(
    organizationId: string,
    options: SaftOptions,
  ): Promise<string> {
    this.logger.log('Building Norway SAF-T (SAF-T NO)');
    // Add Norway-specific logic
    return this.buildSaftXml(organizationId, options);
  }

  /**
   * Build Austria-specific SAF-T
   */
  private async buildAustriaSaft(
    organizationId: string,
    options: SaftOptions,
  ): Promise<string> {
    this.logger.log('Building Austria SAF-T (SAF-T AT)');
    // Add Austria-specific logic
    return this.buildSaftXml(organizationId, options);
  }

  /**
   * Build Poland-specific SAF-T (JPK)
   */
  private async buildPolandSaft(
    organizationId: string,
    options: SaftOptions,
  ): Promise<string> {
    this.logger.log('Building Poland SAF-T (JPK)');
    // Add Poland-specific logic
    return this.buildSaftXml(organizationId, options);
  }
}
