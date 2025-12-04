import { Injectable, Logger } from '@nestjs/common';
import {
  FreeFinanceCustomer,
  FreeFinanceVendor,
  FreeFinanceOutgoingInvoice,
  FreeFinanceIncomingInvoice,
  FreeFinanceProduct,
  MigrationError,
  MigrationWarning,
} from './freefinance.types';
import {
  STATUS_MAPPINGS,
  CUSTOMER_TYPE_MAPPINGS,
  PAYMENT_METHOD_MAPPINGS,
  INVOICE_TYPE_MAPPINGS,
  VALIDATION_RULES,
  AUSTRIAN_VAT_RATES,
} from './freefinance.constants';

/**
 * Service for mapping FreeFinance data to Operate schema
 * Validates and transforms data structures
 */
@Injectable()
export class FreeFinanceMapperService {
  private readonly logger = new Logger(FreeFinanceMapperService.name);

  /**
   * Map FreeFinance customer to Operate customer schema
   */
  mapCustomer(
    customer: FreeFinanceCustomer,
    errors: MigrationError[],
    warnings: MigrationWarning[],
    rowNumber: number,
  ): any {
    try {
      // Validate required fields
      if (!customer.customerNumber) {
        errors.push({
          row: rowNumber,
          field: 'customerNumber',
          message: 'Customer number is required',
          severity: 'error',
        });
        return null;
      }

      // Check if at least one name field is present
      if (!customer.companyName && !customer.firstName && !customer.lastName) {
        errors.push({
          row: rowNumber,
          field: 'name',
          message: 'Either company name or person name (first/last) is required',
          severity: 'error',
        });
        return null;
      }

      // Validate email format
      if (customer.email && !VALIDATION_RULES.customers.email.test(customer.email)) {
        warnings.push({
          row: rowNumber,
          field: 'email',
          message: `Invalid email format: ${customer.email}`,
          suggestion: 'Email will be skipped if invalid',
        });
        customer.email = undefined;
      }

      // Validate UID number (Austrian VAT ID)
      if (customer.uidNummer) {
        const uidValid = VALIDATION_RULES.customers.uidNummer.test(customer.uidNummer);
        if (!uidValid) {
          warnings.push({
            row: rowNumber,
            field: 'uidNummer',
            message: `Invalid UID number format: ${customer.uidNummer}. Expected: ATU12345678`,
            suggestion: 'UID will be stored but may need manual correction',
          });
        }
      }

      // Validate IBAN
      if (customer.iban) {
        const ibanValid = VALIDATION_RULES.customers.iban.test(customer.iban);
        if (!ibanValid && customer.country === 'AT') {
          warnings.push({
            row: rowNumber,
            field: 'iban',
            message: `Invalid Austrian IBAN format: ${customer.iban}`,
            suggestion: 'IBAN should start with AT followed by 18 digits',
          });
        }
      }

      // Map to Operate schema
      const mapped = {
        // Identification
        externalId: customer.customerNumber,
        customerNumber: customer.customerNumber,

        // Name
        companyName: customer.companyName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        displayName: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),

        // Type
        customerType: this.mapCustomerType(customer.type),
        isCompany: !!customer.companyName,

        // Contact
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        website: customer.website,

        // Address
        address: {
          street: customer.street,
          postalCode: customer.zip,
          city: customer.city,
          country: customer.country || 'AT',
        },

        // Tax information
        taxId: customer.uidNummer,
        taxNumber: customer.steuernummer,
        taxOffice: customer.finanzamt,

        // Banking
        bankAccount: customer.iban ? {
          iban: customer.iban,
          bic: customer.bic,
          bankName: customer.bankName,
        } : undefined,

        // Business registration (Austrian specific)
        registrationNumber: customer.registrationNumber,
        commercialRegisterCourt: customer.commercialRegisterCourt,

        // Payment terms
        paymentTerms: {
          daysUntilDue: customer.paymentTermDays || 14,
          discountPercent: customer.discount,
          discountDays: customer.discountDays,
        },

        // Metadata
        notes: customer.notes,
        isActive: customer.isActive !== false,
        source: 'freefinance_migration',
        importedAt: new Date(),
      };

      return mapped;
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error mapping customer: ${error.message}`,
        severity: 'critical',
      });
      return null;
    }
  }

  /**
   * Map FreeFinance vendor to Operate vendor schema
   */
  mapVendor(
    vendor: FreeFinanceVendor,
    errors: MigrationError[],
    warnings: MigrationWarning[],
    rowNumber: number,
  ): any {
    try {
      if (!vendor.vendorNumber) {
        errors.push({
          row: rowNumber,
          field: 'vendorNumber',
          message: 'Vendor number is required',
          severity: 'error',
        });
        return null;
      }

      if (!vendor.companyName && !vendor.firstName && !vendor.lastName) {
        errors.push({
          row: rowNumber,
          field: 'name',
          message: 'Either company name or person name is required',
          severity: 'error',
        });
        return null;
      }

      // Validate email
      if (vendor.email && !VALIDATION_RULES.vendors.email.test(vendor.email)) {
        warnings.push({
          row: rowNumber,
          field: 'email',
          message: `Invalid email format: ${vendor.email}`,
          suggestion: 'Email will be skipped',
        });
        vendor.email = undefined;
      }

      const mapped = {
        externalId: vendor.vendorNumber,
        vendorNumber: vendor.vendorNumber,

        companyName: vendor.companyName,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        displayName: vendor.companyName || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim(),

        isCompany: !!vendor.companyName,

        email: vendor.email,
        phone: vendor.phone,
        mobile: vendor.mobile,
        website: vendor.website,

        address: {
          street: vendor.street,
          postalCode: vendor.zip,
          city: vendor.city,
          country: vendor.country || 'AT',
        },

        taxId: vendor.uidNummer,
        taxNumber: vendor.steuernummer,

        bankAccount: vendor.iban ? {
          iban: vendor.iban,
          bic: vendor.bic,
          bankName: vendor.bankName,
        } : undefined,

        paymentTerms: {
          daysUntilDue: vendor.paymentTermDays || 30,
        },

        notes: vendor.notes,
        isActive: vendor.isActive !== false,
        source: 'freefinance_migration',
        importedAt: new Date(),
      };

      return mapped;
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error mapping vendor: ${error.message}`,
        severity: 'critical',
      });
      return null;
    }
  }

  /**
   * Map FreeFinance outgoing invoice to Operate invoice schema
   */
  mapOutgoingInvoice(
    invoice: FreeFinanceOutgoingInvoice,
    errors: MigrationError[],
    warnings: MigrationWarning[],
    rowNumber: number,
  ): any {
    try {
      // Validate required fields
      const requiredFields = ['invoiceNumber', 'customerNumber', 'customerName', 'invoiceDate', 'grossAmount'];
      for (const field of requiredFields) {
        if (!invoice[field]) {
          errors.push({
            row: rowNumber,
            field,
            message: `Required field missing: ${field}`,
            severity: 'error',
          });
          return null;
        }
      }

      // Validate invoice number format
      if (!VALIDATION_RULES.outgoingInvoices.invoiceNumber.test(invoice.invoiceNumber)) {
        warnings.push({
          row: rowNumber,
          field: 'invoiceNumber',
          message: `Non-standard invoice number format: ${invoice.invoiceNumber}`,
          suggestion: 'Invoice number should contain only letters, numbers, and -_/',
        });
      }

      // Validate amounts
      if (invoice.netAmount <= 0) {
        errors.push({
          row: rowNumber,
          field: 'netAmount',
          message: 'Net amount must be greater than 0',
          severity: 'error',
        });
        return null;
      }

      // Check VAT calculation
      const calculatedVat = invoice.grossAmount - invoice.netAmount;
      const vatDiff = Math.abs(calculatedVat - invoice.vatAmount);
      if (vatDiff > 0.02) {
        warnings.push({
          row: rowNumber,
          field: 'vatAmount',
          message: `VAT amount mismatch. Expected: ${calculatedVat.toFixed(2)}, Got: ${invoice.vatAmount.toFixed(2)}`,
          suggestion: 'VAT will be recalculated based on gross - net',
        });
      }

      // Map invoice type
      const invoiceType = this.mapInvoiceType(invoice.type);

      // Map status
      const status = this.mapInvoiceStatus(invoice.status);

      const mapped = {
        externalId: invoice.invoiceNumber,
        invoiceNumber: invoice.invoiceNumber,
        type: invoiceType,
        status: status,

        // Customer reference
        customerExternalId: invoice.customerNumber,
        customerName: invoice.customerName,

        // Dates
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        serviceDate: invoice.serviceDate,
        paidDate: invoice.paidDate,

        // Amounts
        currency: invoice.currency || 'EUR',
        netAmount: invoice.netAmount,
        vatAmount: invoice.vatAmount,
        grossAmount: invoice.grossAmount,
        paidAmount: invoice.paidAmount || 0,
        outstandingAmount: invoice.openAmount || (invoice.grossAmount - (invoice.paidAmount || 0)),

        // VAT breakdown
        vatBreakdown: invoice.vatBreakdown || this.calculateDefaultVatBreakdown(
          invoice.netAmount,
          invoice.vatAmount,
        ),

        // Payment
        paymentTerms: {
          daysUntilDue: invoice.paymentTermDays || 14,
          discountPercent: invoice.discount,
          discountDays: invoice.discountDays,
        },
        paymentMethod: this.mapPaymentMethod(invoice.paymentMethod),

        // Line items
        items: invoice.items.map((item, idx) => this.mapInvoiceItem(item, idx)),

        // Austrian tax specifics
        isReverseCharge: invoice.reverseCharge || false,
        isIntraCommunitySupply: invoice.innerCommunitySupply || false,
        isExportDelivery: invoice.exportDelivery || false,

        // Notes
        headerText: invoice.headerText,
        footerText: invoice.footerText,
        notes: invoice.notes,

        // References
        orderNumber: invoice.orderNumber,
        deliveryNoteNumber: invoice.deliveryNoteNumber,

        // Accounting
        bookingDate: invoice.bookingDate,
        bookingPeriod: invoice.bookingPeriod,

        // Metadata
        source: 'freefinance_migration',
        importedAt: new Date(),
      };

      return mapped;
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error mapping outgoing invoice: ${error.message}`,
        severity: 'critical',
      });
      return null;
    }
  }

  /**
   * Map FreeFinance incoming invoice to Operate expense/bill schema
   */
  mapIncomingInvoice(
    invoice: FreeFinanceIncomingInvoice,
    errors: MigrationError[],
    warnings: MigrationWarning[],
    rowNumber: number,
  ): any {
    try {
      // Validate required fields
      if (!invoice.invoiceNumber || !invoice.vendorName || !invoice.invoiceDate || !invoice.grossAmount) {
        errors.push({
          row: rowNumber,
          message: 'Missing required fields for incoming invoice',
          severity: 'error',
        });
        return null;
      }

      const mapped = {
        externalId: invoice.invoiceNumber,
        internalNumber: invoice.invoiceNumber,
        vendorInvoiceNumber: invoice.vendorInvoiceNumber,

        // Vendor reference
        vendorExternalId: invoice.vendorNumber,
        vendorName: invoice.vendorName,
        vendorTaxId: invoice.vendorUidNummer,

        // Dates
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        receiptDate: invoice.receiptDate,
        serviceDate: invoice.serviceDate,
        paidDate: invoice.paidDate,

        // Amounts
        currency: invoice.currency || 'EUR',
        netAmount: invoice.netAmount,
        vatAmount: invoice.vatAmount,
        grossAmount: invoice.grossAmount,
        paidAmount: invoice.paidAmount || 0,
        outstandingAmount: invoice.openAmount || (invoice.grossAmount - (invoice.paidAmount || 0)),

        // VAT breakdown
        vatBreakdown: invoice.vatBreakdown || this.calculateDefaultVatBreakdown(
          invoice.netAmount,
          invoice.vatAmount,
        ),

        // Payment
        paymentMethod: this.mapPaymentMethod(invoice.paymentMethod),
        paymentTerms: invoice.paymentTermDays ? {
          daysUntilDue: invoice.paymentTermDays,
        } : undefined,

        // Classification
        category: invoice.category,
        expenseCategory: invoice.expenseCategory,
        accountingCode: invoice.accountingCode,

        // Line items (if available)
        items: invoice.items?.map((item, idx) => this.mapInvoiceItem(item, idx)) || [],

        // Austrian tax specifics
        isReverseCharge: invoice.reverseCharge || false,
        deductibleVat: invoice.deductibleVat || invoice.vatAmount,

        // Description
        description: invoice.description,
        notes: invoice.notes,

        // Attachment
        hasAttachment: invoice.hasAttachment || false,
        attachmentPath: invoice.attachmentPath,

        // Accounting
        bookingDate: invoice.bookingDate,
        bookingPeriod: invoice.bookingPeriod,

        // Metadata
        source: 'freefinance_migration',
        importedAt: new Date(),
      };

      return mapped;
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error mapping incoming invoice: ${error.message}`,
        severity: 'critical',
      });
      return null;
    }
  }

  /**
   * Map FreeFinance product to Operate product schema
   */
  mapProduct(
    product: FreeFinanceProduct,
    errors: MigrationError[],
    warnings: MigrationWarning[],
    rowNumber: number,
  ): any {
    try {
      // Validate required fields
      if (!product.productNumber || !product.name) {
        errors.push({
          row: rowNumber,
          message: 'Product number and name are required',
          severity: 'error',
        });
        return null;
      }

      // Validate VAT rate
      const validVatRates = VALIDATION_RULES.products.vatRate;
      if (!validVatRates.includes(product.vatRate)) {
        warnings.push({
          row: rowNumber,
          field: 'vatRate',
          message: `Invalid Austrian VAT rate: ${product.vatRate}%. Valid rates: ${validVatRates.join(', ')}%`,
          suggestion: `Will use ${AUSTRIAN_VAT_RATES.STANDARD}% (standard rate)`,
        });
        product.vatRate = AUSTRIAN_VAT_RATES.STANDARD;
      }

      // Validate EAN if provided
      if (product.ean && !VALIDATION_RULES.products.ean.test(product.ean)) {
        warnings.push({
          row: rowNumber,
          field: 'ean',
          message: `Invalid EAN format: ${product.ean}. Should be 8 or 13 digits`,
          suggestion: 'EAN will be stored but may need correction',
        });
      }

      const mapped = {
        externalId: product.productNumber,
        productNumber: product.productNumber,
        sku: product.sku || product.productNumber,

        name: product.name,
        description: product.description,

        // Pricing
        unitPrice: product.unitPrice,
        currency: product.currency || 'EUR',
        vatRate: product.vatRate,

        // Unit
        unit: product.unit || 'Stk',

        // Category
        category: product.category,
        productGroup: product.productGroup,

        // Accounting
        accountingCode: product.accountingCode,
        revenueAccount: product.revenueAccount,

        // Inventory
        trackInventory: product.trackStock || false,
        stockQuantity: product.stockQuantity || 0,
        minStockLevel: product.minStockLevel,

        // Type
        isService: product.isService || false,
        isActive: product.isActive,

        // Codes
        ean: product.ean,

        // Metadata
        source: 'freefinance_migration',
        importedAt: new Date(),
      };

      return mapped;
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error mapping product: ${error.message}`,
        severity: 'critical',
      });
      return null;
    }
  }

  /**
   * Map invoice line item
   */
  private mapInvoiceItem(item: any, index: number): any {
    return {
      position: item.position || index + 1,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'Stk',
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      discountPercent: item.discountPercent || 0,
      vatRate: item.vatRate,
      netAmount: item.netAmount,
      vatAmount: item.vatAmount,
      grossAmount: item.grossAmount,
      productNumber: item.productNumber,
      accountingCode: item.accountingCode,
    };
  }

  /**
   * Map customer type
   */
  private mapCustomerType(type: string): string {
    if (!type) return 'business';
    return CUSTOMER_TYPE_MAPPINGS[type] || type;
  }

  /**
   * Map invoice status
   */
  private mapInvoiceStatus(status: string): string {
    if (!status) return 'draft';
    return STATUS_MAPPINGS.invoices[status] || status;
  }

  /**
   * Map invoice type
   */
  private mapInvoiceType(type: string): string {
    if (!type) return 'invoice';
    return INVOICE_TYPE_MAPPINGS[type] || type;
  }

  /**
   * Map payment method
   */
  private mapPaymentMethod(method: string): string {
    if (!method) return 'bank_transfer';
    return PAYMENT_METHOD_MAPPINGS[method] || method;
  }

  /**
   * Calculate default VAT breakdown when not provided
   */
  private calculateDefaultVatBreakdown(netAmount: number, vatAmount: number): any[] {
    if (!netAmount || !vatAmount) return [];

    const vatRate = (vatAmount / netAmount) * 100;

    return [{
      rate: Math.round(vatRate),
      netAmount,
      vatAmount,
    }];
  }
}
