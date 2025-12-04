/**
 * SAF-T XML Builder Utility
 * Generates XML structure for SAF-T exports
 */

import { Builder } from 'xml2js';
import {
  SaftHeader,
  SaftMasterFiles,
  SaftGeneralLedgerEntries,
  SaftSourceDocuments,
  SaftAuditFile,
} from '../interfaces';

/**
 * XML Builder configuration
 */
const XML_BUILDER_OPTIONS = {
  xmldec: {
    version: '1.0',
    encoding: 'UTF-8',
    standalone: undefined,
  },
  renderOpts: {
    pretty: true,
    indent: '  ',
    newline: '\n',
  },
  headless: false,
};

/**
 * SAF-T XML Builder Utility
 */
export class SaftXmlBuilder {
  private builder: Builder;

  constructor() {
    this.builder = new Builder(XML_BUILDER_OPTIONS);
  }

  /**
   * Build complete SAF-T XML
   */
  buildXml(auditFile: SaftAuditFile): string {
    const xmlObject = this.buildXmlObject(auditFile);
    return this.builder.buildObject(xmlObject);
  }

  /**
   * Build XML object structure
   */
  private buildXmlObject(auditFile: SaftAuditFile): any {
    const obj: any = {
      AuditFile: {
        $: {
          xmlns: 'urn:OECD:StandardAuditFile-Tax:2.00',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        },
        Header: this.buildHeaderXml(auditFile.header),
        MasterFiles: this.buildMasterFilesXml(auditFile.masterFiles),
      },
    };

    if (auditFile.generalLedgerEntries) {
      obj.AuditFile.GeneralLedgerEntries = this.buildGeneralLedgerEntriesXml(
        auditFile.generalLedgerEntries,
      );
    }

    if (auditFile.sourceDocuments) {
      obj.AuditFile.SourceDocuments = this.buildSourceDocumentsXml(
        auditFile.sourceDocuments,
      );
    }

    return obj;
  }

  /**
   * Build Header XML
   */
  private buildHeaderXml(header: any): any {
    return {
      AuditFileVersion: header.auditFileVersion,
      AuditFileCountry: header.auditFileCountry,
      AuditFileDateCreated: header.auditFileDateCreated,
      ...(header.auditFileProductCompanyTaxID && {
        AuditFileProductCompanyTaxID: header.auditFileProductCompanyTaxID,
      }),
      ...(header.auditFileProductID && {
        AuditFileProductID: header.auditFileProductID,
      }),
      ...(header.auditFileProductVersion && {
        AuditFileProductVersion: header.auditFileProductVersion,
      }),
      Company: this.buildCompanyXml(header.company),
      DefaultCurrencyCode: header.defaultCurrencyCode,
      SelectionCriteria: {
        PeriodStart: header.selectionCriteria.periodStart,
        PeriodEnd: header.selectionCriteria.periodEnd,
        ...(header.selectionCriteria.periodStartYear && {
          PeriodStartYear: header.selectionCriteria.periodStartYear,
        }),
        ...(header.selectionCriteria.periodEndYear && {
          PeriodEndYear: header.selectionCriteria.periodEndYear,
        }),
      },
      ...(header.headerComment && { HeaderComment: header.headerComment }),
      ...(header.taxAccountingBasis && {
        TaxAccountingBasis: header.taxAccountingBasis,
      }),
      ...(header.taxEntity && { TaxEntity: header.taxEntity }),
    };
  }

  /**
   * Build Company XML
   */
  private buildCompanyXml(company: any): any {
    return {
      RegistrationNumber: company.companyID,
      Name: company.companyName,
      Address: {
        ...(company.companyAddress.buildingNumber && {
          BuildingNumber: company.companyAddress.buildingNumber,
        }),
        StreetName: company.companyAddress.streetName,
        ...(company.companyAddress.addressDetail && {
          AddressDetail: company.companyAddress.addressDetail,
        }),
        City: company.companyAddress.city,
        PostalCode: company.companyAddress.postalCode,
        ...(company.companyAddress.region && {
          Region: company.companyAddress.region,
        }),
        Country: company.companyAddress.country,
      },
      TaxRegistrationNumber: company.taxRegistrationNumber,
      ...(company.vatNumber && { VATNumber: company.vatNumber }),
      ...(company.contact && {
        Contact: {
          ...(company.contact.contactPerson && {
            ContactPerson: { FirstName: company.contact.contactPerson },
          }),
          ...(company.contact.telephone && { Telephone: company.contact.telephone }),
          ...(company.contact.fax && { Fax: company.contact.fax }),
          ...(company.contact.email && { Email: company.contact.email }),
          ...(company.contact.website && { Website: company.contact.website }),
        },
      }),
    };
  }

  /**
   * Build Master Files XML
   */
  private buildMasterFilesXml(masterFiles: SaftMasterFiles): any {
    const result: any = {};

    if (masterFiles.generalLedgerAccounts?.length > 0) {
      result.GeneralLedgerAccounts = masterFiles.generalLedgerAccounts.map(
        (account) => ({
          AccountID: account.accountID,
          AccountDescription: account.accountDescription,
          ...(account.standardAccountID && {
            StandardAccountID: account.standardAccountID,
          }),
          ...(account.groupingCategory && {
            GroupingCategory: account.groupingCategory,
          }),
          ...(account.groupingCode && { GroupingCode: account.groupingCode }),
          AccountType: account.accountType,
          ...(account.openingDebitBalance && {
            OpeningDebitBalance: this.formatAmount(account.openingDebitBalance),
          }),
          ...(account.openingCreditBalance && {
            OpeningCreditBalance: this.formatAmount(account.openingCreditBalance),
          }),
          ...(account.closingDebitBalance && {
            ClosingDebitBalance: this.formatAmount(account.closingDebitBalance),
          }),
          ...(account.closingCreditBalance && {
            ClosingCreditBalance: this.formatAmount(account.closingCreditBalance),
          }),
        }),
      );
    }

    if (masterFiles.customers && masterFiles.customers.length > 0) {
      result.Customer = masterFiles.customers.map((customer) =>
        this.buildCustomerXml(customer),
      );
    }

    if (masterFiles.suppliers && masterFiles.suppliers.length > 0) {
      result.Supplier = masterFiles.suppliers.map((supplier) =>
        this.buildSupplierXml(supplier),
      );
    }

    if (masterFiles.taxTable && masterFiles.taxTable.length > 0) {
      result.TaxTable = masterFiles.taxTable.map((taxEntry) => ({
        TaxType: taxEntry.taxType,
        TaxCodeDetails: taxEntry.taxCodeDetails.map((code) => ({
          TaxCode: code.taxCode,
          Description: code.description,
          ...(code.taxPercentage !== undefined && {
            TaxPercentage: code.taxPercentage,
          }),
          ...(code.country && { Country: code.country }),
        })),
      }));
    }

    if (masterFiles.products && masterFiles.products.length > 0) {
      result.Product = masterFiles.products.map((product) => ({
        ProductType: product.productType,
        ProductCode: product.productCode,
        ...(product.productGroup && { ProductGroup: product.productGroup }),
        ProductDescription: product.productDescription,
        ...(product.productNumberCode && {
          ProductNumberCode: product.productNumberCode,
        }),
      }));
    }

    return result;
  }

  /**
   * Build Customer XML
   */
  private buildCustomerXml(customer: any): any {
    return {
      CustomerID: customer.customerID,
      AccountID: customer.accountID,
      ...(customer.customerTaxID && { CustomerTaxID: customer.customerTaxID }),
      CompanyName: customer.companyName,
      ...(customer.billingAddress && {
        BillingAddress: this.buildAddressXml(customer.billingAddress),
      }),
      ...(customer.telephone && { Telephone: customer.telephone }),
      ...(customer.email && { Email: customer.email }),
      ...(customer.openingDebitBalance && {
        OpeningDebitBalance: this.formatAmount(customer.openingDebitBalance),
      }),
      ...(customer.openingCreditBalance && {
        OpeningCreditBalance: this.formatAmount(customer.openingCreditBalance),
      }),
    };
  }

  /**
   * Build Supplier XML
   */
  private buildSupplierXml(supplier: any): any {
    return {
      SupplierID: supplier.supplierID,
      AccountID: supplier.accountID,
      ...(supplier.supplierTaxID && { SupplierTaxID: supplier.supplierTaxID }),
      CompanyName: supplier.companyName,
      ...(supplier.billingAddress && {
        BillingAddress: this.buildAddressXml(supplier.billingAddress),
      }),
      ...(supplier.telephone && { Telephone: supplier.telephone }),
      ...(supplier.email && { Email: supplier.email }),
      ...(supplier.openingDebitBalance && {
        OpeningDebitBalance: this.formatAmount(supplier.openingDebitBalance),
      }),
      ...(supplier.openingCreditBalance && {
        OpeningCreditBalance: this.formatAmount(supplier.openingCreditBalance),
      }),
    };
  }

  /**
   * Build Address XML
   */
  private buildAddressXml(address: any): any {
    return {
      ...(address.buildingNumber && { BuildingNumber: address.buildingNumber }),
      ...(address.streetName && { StreetName: address.streetName }),
      AddressDetail: address.addressDetail,
      City: address.city,
      PostalCode: address.postalCode,
      ...(address.region && { Region: address.region }),
      Country: address.country,
    };
  }

  /**
   * Build General Ledger Entries XML
   */
  private buildGeneralLedgerEntriesXml(entries: SaftGeneralLedgerEntries): any {
    return {
      NumberOfEntries: entries.numberOfEntries,
      TotalDebit: this.formatAmount(entries.totalDebit),
      TotalCredit: this.formatAmount(entries.totalCredit),
      Journal: entries.journal.map((journal) => ({
        JournalID: journal.journalID,
        Description: journal.description,
        ...(journal.type && { Type: journal.type }),
        Transaction: journal.transactions.map((transaction) =>
          this.buildTransactionXml(transaction),
        ),
      })),
    };
  }

  /**
   * Build Transaction XML
   */
  private buildTransactionXml(transaction: any): any {
    return {
      TransactionID: transaction.transactionID,
      Period: transaction.period,
      PeriodYear: transaction.periodYear,
      TransactionDate: transaction.transactionDate,
      ...(transaction.sourceID && { SourceID: transaction.sourceID }),
      Description: transaction.description,
      ...(transaction.transactionType && {
        TransactionType: transaction.transactionType,
      }),
      ...(transaction.glPostingDate && {
        GLPostingDate: transaction.glPostingDate,
      }),
      ...(transaction.customerID && { CustomerID: transaction.customerID }),
      ...(transaction.supplierID && { SupplierID: transaction.supplierID }),
      Lines: {
        Line: transaction.lines.map((line: any) => ({
          RecordID: line.recordID,
          AccountID: line.accountID,
          ...(line.customerID && { CustomerID: line.customerID }),
          ...(line.supplierID && { SupplierID: line.supplierID }),
          ...(line.description && { Description: line.description }),
          ...(line.debitAmount && {
            DebitAmount: this.formatAmount(line.debitAmount),
          }),
          ...(line.creditAmount && {
            CreditAmount: this.formatAmount(line.creditAmount),
          }),
        })),
      },
    };
  }

  /**
   * Build Source Documents XML
   */
  private buildSourceDocumentsXml(sourceDocuments: SaftSourceDocuments): any {
    const result: any = {};

    if (sourceDocuments.salesInvoices) {
      result.SalesInvoices = {
        NumberOfEntries: sourceDocuments.salesInvoices.numberOfEntries,
        TotalDebit: this.formatAmount(sourceDocuments.salesInvoices.totalDebit),
        TotalCredit: this.formatAmount(sourceDocuments.salesInvoices.totalCredit),
        Invoice: sourceDocuments.salesInvoices.invoice.map((invoice) =>
          this.buildInvoiceXml(invoice),
        ),
      };
    }

    if (sourceDocuments.purchaseInvoices) {
      result.PurchaseInvoices = {
        NumberOfEntries: sourceDocuments.purchaseInvoices.numberOfEntries,
        TotalDebit: this.formatAmount(sourceDocuments.purchaseInvoices.totalDebit),
        TotalCredit: this.formatAmount(
          sourceDocuments.purchaseInvoices.totalCredit,
        ),
        Invoice: sourceDocuments.purchaseInvoices.invoice.map((invoice) =>
          this.buildInvoiceXml(invoice),
        ),
      };
    }

    return result;
  }

  /**
   * Build Invoice XML
   */
  private buildInvoiceXml(invoice: any): any {
    return {
      InvoiceNo: invoice.invoiceNo,
      DocumentStatus: {
        InvoiceStatus: invoice.documentStatus.invoiceStatus,
        InvoiceStatusDate: invoice.documentStatus.invoiceStatusDate,
        SourceID: invoice.documentStatus.sourceID,
        SourceBilling: invoice.documentStatus.sourceBilling,
      },
      ...(invoice.hash && { Hash: invoice.hash }),
      InvoiceDate: invoice.invoiceDate,
      InvoiceType: invoice.invoiceType,
      ...(invoice.customerID && { CustomerID: invoice.customerID }),
      ...(invoice.supplierID && { SupplierID: invoice.supplierID }),
      Line: invoice.line.map((line: any, index: number) => ({
        LineNumber: index + 1,
        ...(line.productCode && { ProductCode: line.productCode }),
        ProductDescription: line.productDescription,
        ...(line.quantity && { Quantity: line.quantity }),
        ...(line.unitPrice && { UnitPrice: this.formatAmount(line.unitPrice) }),
        ...(line.debitAmount && {
          DebitAmount: this.formatAmount(line.debitAmount),
        }),
        ...(line.creditAmount && {
          CreditAmount: this.formatAmount(line.creditAmount),
        }),
        Tax: {
          TaxType: line.tax.taxType,
          TaxCountryRegion: line.tax.taxCountryRegion,
          TaxCode: line.tax.taxCode,
          ...(line.tax.taxPercentage !== undefined && {
            TaxPercentage: line.tax.taxPercentage,
          }),
        },
      })),
      DocumentTotals: {
        TaxPayable: this.formatAmount(invoice.documentTotals.taxPayable),
        NetTotal: this.formatAmount(invoice.documentTotals.netTotal),
        GrossTotal: this.formatAmount(invoice.documentTotals.grossTotal),
      },
    };
  }

  /**
   * Format amount to 2 decimal places
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }
}
