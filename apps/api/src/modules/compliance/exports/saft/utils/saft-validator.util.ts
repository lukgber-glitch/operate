/**
 * SAF-T Validator Utility
 * Validates SAF-T XML against schema and business rules
 */

import { parseStringPromise } from 'xml2js';
import { ValidationResult, ValidationError, ValidationWarning } from '../interfaces/saft-config.interface';

/**
 * SAF-T Validator Utility
 */
export class SaftValidator {
  /**
   * Validate SAF-T XML structure
   */
  async validateXml(xmlContent: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Parse XML to validate structure
      const parsed = await parseStringPromise(xmlContent);

      // Validate root element
      if (!parsed.AuditFile) {
        errors.push({
          code: 'MISSING_ROOT',
          message: 'Missing AuditFile root element',
          path: '/',
        });
      } else {
        // Validate required sections
        this.validateHeader(parsed.AuditFile, errors, warnings);
        this.validateMasterFiles(parsed.AuditFile, errors, warnings);
        this.validateBalances(parsed.AuditFile, errors, warnings);
      }
    } catch (error) {
      errors.push({
        code: 'INVALID_XML',
        message: `XML parsing error: ${error.message}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schemaVersion: '2.00',
    };
  }

  /**
   * Validate Header section
   */
  private validateHeader(
    auditFile: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const header = auditFile.Header?.[0];

    if (!header) {
      errors.push({
        code: 'MISSING_HEADER',
        message: 'Header section is required',
        path: '/AuditFile/Header',
      });
      return;
    }

    // Required fields
    const requiredFields = [
      'AuditFileVersion',
      'AuditFileCountry',
      'AuditFileDateCreated',
      'DefaultCurrencyCode',
    ];

    requiredFields.forEach((field) => {
      if (!header[field] || !header[field][0]) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field ${field} is missing`,
          path: `/AuditFile/Header/${field}`,
        });
      }
    });

    // Validate version
    if (header.AuditFileVersion?.[0] && header.AuditFileVersion[0] !== '2.00') {
      warnings.push({
        code: 'UNSUPPORTED_VERSION',
        message: `SAF-T version ${header.AuditFileVersion[0]} may not be fully supported`,
        path: '/AuditFile/Header/AuditFileVersion',
      });
    }

    // Validate currency code (ISO 4217)
    if (header.DefaultCurrencyCode?.[0]) {
      const currencyCode = header.DefaultCurrencyCode[0];
      if (currencyCode.length !== 3) {
        errors.push({
          code: 'INVALID_CURRENCY',
          message: `Currency code must be 3 characters (ISO 4217)`,
          path: '/AuditFile/Header/DefaultCurrencyCode',
        });
      }
    }

    // Validate company information
    this.validateCompany(header.Company?.[0], errors, warnings);

    // Validate selection criteria
    this.validateSelectionCriteria(
      header.SelectionCriteria?.[0],
      errors,
      warnings,
    );
  }

  /**
   * Validate Company information
   */
  private validateCompany(
    company: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!company) {
      errors.push({
        code: 'MISSING_COMPANY',
        message: 'Company information is required',
        path: '/AuditFile/Header/Company',
      });
      return;
    }

    const requiredFields = ['RegistrationNumber', 'Name', 'Address'];

    requiredFields.forEach((field) => {
      if (!company[field] || !company[field][0]) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required company field ${field} is missing`,
          path: `/AuditFile/Header/Company/${field}`,
        });
      }
    });

    // Validate address
    if (company.Address?.[0]) {
      const address = company.Address[0];
      const requiredAddressFields = ['City', 'PostalCode', 'Country'];

      requiredAddressFields.forEach((field) => {
        if (!address[field] || !address[field][0]) {
          errors.push({
            code: 'MISSING_REQUIRED_FIELD',
            message: `Required address field ${field} is missing`,
            path: `/AuditFile/Header/Company/Address/${field}`,
          });
        }
      });

      // Validate country code (ISO 3166-1 alpha-2)
      if (address.Country?.[0] && address.Country[0].length !== 2) {
        errors.push({
          code: 'INVALID_COUNTRY_CODE',
          message: 'Country code must be 2 characters (ISO 3166-1 alpha-2)',
          path: '/AuditFile/Header/Company/Address/Country',
        });
      }
    }
  }

  /**
   * Validate Selection Criteria
   */
  private validateSelectionCriteria(
    criteria: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!criteria) {
      errors.push({
        code: 'MISSING_SELECTION_CRITERIA',
        message: 'Selection criteria is required',
        path: '/AuditFile/Header/SelectionCriteria',
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (criteria.PeriodStart?.[0]) {
      if (!dateRegex.test(criteria.PeriodStart[0])) {
        errors.push({
          code: 'INVALID_DATE_FORMAT',
          message: 'PeriodStart must be in YYYY-MM-DD format',
          path: '/AuditFile/Header/SelectionCriteria/PeriodStart',
        });
      }
    } else {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: 'PeriodStart is required',
        path: '/AuditFile/Header/SelectionCriteria/PeriodStart',
      });
    }

    if (criteria.PeriodEnd?.[0]) {
      if (!dateRegex.test(criteria.PeriodEnd[0])) {
        errors.push({
          code: 'INVALID_DATE_FORMAT',
          message: 'PeriodEnd must be in YYYY-MM-DD format',
          path: '/AuditFile/Header/SelectionCriteria/PeriodEnd',
        });
      }

      // Validate period range
      if (criteria.PeriodStart?.[0]) {
        const startDate = new Date(criteria.PeriodStart[0]);
        const endDate = new Date(criteria.PeriodEnd[0]);

        if (endDate < startDate) {
          errors.push({
            code: 'INVALID_DATE_RANGE',
            message: 'PeriodEnd must be after PeriodStart',
            path: '/AuditFile/Header/SelectionCriteria',
          });
        }
      }
    } else {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: 'PeriodEnd is required',
        path: '/AuditFile/Header/SelectionCriteria/PeriodEnd',
      });
    }
  }

  /**
   * Validate Master Files
   */
  private validateMasterFiles(
    auditFile: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const masterFiles = auditFile.MasterFiles?.[0];

    if (!masterFiles) {
      errors.push({
        code: 'MISSING_MASTER_FILES',
        message: 'MasterFiles section is required',
        path: '/AuditFile/MasterFiles',
      });
      return;
    }

    // At least GeneralLedgerAccounts should be present
    if (!masterFiles.GeneralLedgerAccounts) {
      errors.push({
        code: 'MISSING_CHART_OF_ACCOUNTS',
        message: 'GeneralLedgerAccounts are required in MasterFiles',
        path: '/AuditFile/MasterFiles/GeneralLedgerAccounts',
      });
    } else {
      this.validateGeneralLedgerAccounts(
        masterFiles.GeneralLedgerAccounts,
        errors,
        warnings,
      );
    }

    // Validate customers if present
    if (masterFiles.Customer) {
      this.validateCustomers(masterFiles.Customer, errors, warnings);
    }

    // Validate suppliers if present
    if (masterFiles.Supplier) {
      this.validateSuppliers(masterFiles.Supplier, errors, warnings);
    }
  }

  /**
   * Validate General Ledger Accounts
   */
  private validateGeneralLedgerAccounts(
    accounts: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const accountIDs = new Set<string>();

    accounts.forEach((account, index) => {
      const accountID = account.AccountID?.[0];
      const accountType = account.AccountType?.[0];

      if (!accountID) {
        errors.push({
          code: 'MISSING_ACCOUNT_ID',
          message: `Account at index ${index} is missing AccountID`,
          path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
        });
      } else if (accountIDs.has(accountID)) {
        errors.push({
          code: 'DUPLICATE_ACCOUNT_ID',
          message: `Duplicate AccountID: ${accountID}`,
          path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
        });
      } else {
        accountIDs.add(accountID);
      }

      if (!accountType) {
        errors.push({
          code: 'MISSING_ACCOUNT_TYPE',
          message: `Account ${accountID} is missing AccountType`,
          path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
        });
      } else {
        const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
        if (!validTypes.includes(accountType)) {
          errors.push({
            code: 'INVALID_ACCOUNT_TYPE',
            message: `Invalid AccountType: ${accountType}`,
            path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
          });
        }
      }

      // Validate balances
      const openingDebit = parseFloat(account.OpeningDebitBalance?.[0] || '0');
      const openingCredit = parseFloat(account.OpeningCreditBalance?.[0] || '0');

      if (openingDebit < 0 || openingCredit < 0) {
        errors.push({
          code: 'NEGATIVE_BALANCE',
          message: `Account ${accountID} has negative balance`,
          path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
        });
      }

      if (openingDebit > 0 && openingCredit > 0) {
        warnings.push({
          code: 'BOTH_BALANCES',
          message: `Account ${accountID} has both debit and credit opening balances`,
          path: `/AuditFile/MasterFiles/GeneralLedgerAccounts[${index}]`,
        });
      }
    });
  }

  /**
   * Validate Customers
   */
  private validateCustomers(
    customers: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const customerIDs = new Set<string>();

    customers.forEach((customer, index) => {
      const customerID = customer.CustomerID?.[0];

      if (!customerID) {
        errors.push({
          code: 'MISSING_CUSTOMER_ID',
          message: `Customer at index ${index} is missing CustomerID`,
          path: `/AuditFile/MasterFiles/Customer[${index}]`,
        });
      } else if (customerIDs.has(customerID)) {
        errors.push({
          code: 'DUPLICATE_CUSTOMER_ID',
          message: `Duplicate CustomerID: ${customerID}`,
          path: `/AuditFile/MasterFiles/Customer[${index}]`,
        });
      } else {
        customerIDs.add(customerID);
      }

      if (!customer.AccountID?.[0]) {
        errors.push({
          code: 'MISSING_ACCOUNT_REFERENCE',
          message: `Customer ${customerID} is missing AccountID reference`,
          path: `/AuditFile/MasterFiles/Customer[${index}]`,
        });
      }
    });
  }

  /**
   * Validate Suppliers
   */
  private validateSuppliers(
    suppliers: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const supplierIDs = new Set<string>();

    suppliers.forEach((supplier, index) => {
      const supplierID = supplier.SupplierID?.[0];

      if (!supplierID) {
        errors.push({
          code: 'MISSING_SUPPLIER_ID',
          message: `Supplier at index ${index} is missing SupplierID`,
          path: `/AuditFile/MasterFiles/Supplier[${index}]`,
        });
      } else if (supplierIDs.has(supplierID)) {
        errors.push({
          code: 'DUPLICATE_SUPPLIER_ID',
          message: `Duplicate SupplierID: ${supplierID}`,
          path: `/AuditFile/MasterFiles/Supplier[${index}]`,
        });
      } else {
        supplierIDs.add(supplierID);
      }

      if (!supplier.AccountID?.[0]) {
        errors.push({
          code: 'MISSING_ACCOUNT_REFERENCE',
          message: `Supplier ${supplierID} is missing AccountID reference`,
          path: `/AuditFile/MasterFiles/Supplier[${index}]`,
        });
      }
    });
  }

  /**
   * Validate balances (debits must equal credits)
   */
  private validateBalances(
    auditFile: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Validate General Ledger Entries balance
    const glEntries = auditFile.GeneralLedgerEntries?.[0];
    if (glEntries) {
      const totalDebit = parseFloat(glEntries.TotalDebit?.[0] || '0');
      const totalCredit = parseFloat(glEntries.TotalCredit?.[0] || '0');

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push({
          code: 'UNBALANCED_ENTRIES',
          message: `General Ledger total debit (${totalDebit}) does not equal total credit (${totalCredit})`,
          path: '/AuditFile/GeneralLedgerEntries',
        });
      }
    }

    // Validate Source Documents balances
    const sourceDocuments = auditFile.SourceDocuments?.[0];
    if (sourceDocuments?.SalesInvoices?.[0]) {
      const salesInvoices = sourceDocuments.SalesInvoices[0];
      const totalDebit = parseFloat(salesInvoices.TotalDebit?.[0] || '0');
      const totalCredit = parseFloat(salesInvoices.TotalCredit?.[0] || '0');

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        warnings.push({
          code: 'UNBALANCED_INVOICES',
          message: `Sales Invoices total debit (${totalDebit}) does not equal total credit (${totalCredit})`,
          path: '/AuditFile/SourceDocuments/SalesInvoices',
        });
      }
    }
  }

  /**
   * Validate against country-specific rules
   */
  validateCountrySpecific(
    xmlContent: string,
    country: string,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Country-specific validation logic
    switch (country) {
      case 'PT': // Portugal
        this.validatePortugal(xmlContent, errors, warnings);
        break;
      case 'NO': // Norway
        this.validateNorway(xmlContent, errors, warnings);
        break;
      case 'AT': // Austria
        this.validateAustria(xmlContent, errors, warnings);
        break;
      // Add more countries as needed
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schemaVersion: '2.00',
    };
  }

  /**
   * Portugal-specific validation
   */
  private validatePortugal(
    xmlContent: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Portugal requires hash and certification
    if (!xmlContent.includes('<Hash>')) {
      errors.push({
        code: 'PT_MISSING_HASH',
        message: 'Portugal SAF-T requires invoice hash',
      });
    }

    if (!xmlContent.includes('<SoftwareValidationNumber>')) {
      warnings.push({
        code: 'PT_MISSING_VALIDATION',
        message: 'Software validation number recommended for Portugal',
      });
    }
  }

  /**
   * Norway-specific validation
   */
  private validateNorway(
    xmlContent: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Norway-specific rules
    if (!xmlContent.includes('<OrganisationNumber>')) {
      warnings.push({
        code: 'NO_MISSING_ORG_NUMBER',
        message: 'Organisation number recommended for Norway',
      });
    }
  }

  /**
   * Austria-specific validation
   */
  private validateAustria(
    xmlContent: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Austria-specific rules
    // Add specific validation for Austrian requirements
  }
}
