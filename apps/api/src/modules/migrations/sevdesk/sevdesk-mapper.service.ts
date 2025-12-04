import { Injectable, Logger } from '@nestjs/common';
import {
  SevDeskContact,
  SevDeskInvoice,
  SevDeskExpense,
  SevDeskProduct,
  SevDeskEntityType,
  SevDeskValidationError,
  SevDeskValidationReport,
  SevDeskDuplicateCheck,
} from './sevdesk.types';
import {
  SEVDESK_FIELD_MAPPINGS,
  SEVDESK_VALIDATION_RULES,
  SEVDESK_DUPLICATE_KEYS,
} from './sevdesk.constants';

/**
 * sevDesk Mapper Service
 * Maps sevDesk data structures to Operate schema and validates data
 */
@Injectable()
export class SevDeskMapperService {
  private readonly logger = new Logger(SevDeskMapperService.name);

  /**
   * Map sevDesk contact to Operate contact
   */
  mapContact(sevDeskContact: SevDeskContact, organizationId: string): any {
    return {
      organizationId,
      name: sevDeskContact.name,
      type: 'customer',
      customerNumber: sevDeskContact.customerNumber,
      email: sevDeskContact.email,
      phone: sevDeskContact.phone,
      website: sevDeskContact.website,
      address: {
        street: sevDeskContact.street,
        zipCode: sevDeskContact.zip,
        city: sevDeskContact.city,
        country: sevDeskContact.country?.toUpperCase(),
      },
      taxNumber: sevDeskContact.taxNumber,
      vatNumber: sevDeskContact.vatNumber,
      category: sevDeskContact.category,
      notes: sevDeskContact.description,
      source: 'sevdesk_migration',
      metadata: {
        sevDeskId: sevDeskContact.id,
        importedAt: new Date(),
      },
    };
  }

  /**
   * Map sevDesk invoice to Operate invoice
   */
  mapInvoice(sevDeskInvoice: SevDeskInvoice, organizationId: string, contactId?: string): any {
    return {
      organizationId,
      contactId,
      invoiceNumber: sevDeskInvoice.invoiceNumber,
      invoiceDate: new Date(sevDeskInvoice.invoiceDate),
      deliveryDate: sevDeskInvoice.deliveryDate ? new Date(sevDeskInvoice.deliveryDate) : undefined,
      dueDate: this.calculateDueDate(new Date(sevDeskInvoice.invoiceDate)),
      status: this.mapInvoiceStatus(sevDeskInvoice.status),
      currency: sevDeskInvoice.currency || 'EUR',
      amountNet: sevDeskInvoice.sumNet || 0,
      amountTax: sevDeskInvoice.sumTax || 0,
      amountGross: sevDeskInvoice.sumGross || 0,
      discount: sevDeskInvoice.sumDiscount || 0,
      header: sevDeskInvoice.header,
      introText: sevDeskInvoice.headText,
      footerText: sevDeskInvoice.footText,
      internalNotes: sevDeskInvoice.customerInternalNote,
      billingAddress: {
        name: sevDeskInvoice.addressName || sevDeskInvoice.contactName,
        street: sevDeskInvoice.addressStreet,
        zipCode: sevDeskInvoice.addressZip,
        city: sevDeskInvoice.addressCity,
        country: sevDeskInvoice.addressCountry?.toUpperCase(),
      },
      lineItems: sevDeskInvoice.lineItems?.map(item => ({
        name: item.name,
        description: item.text,
        quantity: item.quantity,
        unit: item.unity || 'Stk',
        unitPrice: item.price,
        taxRate: item.taxRate || 19,
        discount: item.discount || 0,
        total: item.total || item.quantity * item.price,
      })) || [],
      source: 'sevdesk_migration',
      metadata: {
        sevDeskId: sevDeskInvoice.id,
        importedAt: new Date(),
      },
    };
  }

  /**
   * Map sevDesk expense to Operate expense
   */
  mapExpense(sevDeskExpense: SevDeskExpense, organizationId: string): any {
    return {
      organizationId,
      date: new Date(sevDeskExpense.date),
      vendor: sevDeskExpense.supplier,
      description: sevDeskExpense.description,
      category: sevDeskExpense.category || 'Other',
      amount: sevDeskExpense.amount,
      taxRate: sevDeskExpense.taxRate || 0,
      taxAmount: sevDeskExpense.taxAmount || 0,
      currency: sevDeskExpense.currency || 'EUR',
      paymentMethod: this.mapPaymentMethod(sevDeskExpense.paymentMethod),
      receiptNumber: sevDeskExpense.receiptNumber,
      notes: sevDeskExpense.notes,
      status: 'pending',
      source: 'sevdesk_migration',
      metadata: {
        sevDeskId: sevDeskExpense.id,
        importedAt: new Date(),
      },
    };
  }

  /**
   * Map sevDesk product to Operate product
   */
  mapProduct(sevDeskProduct: SevDeskProduct, organizationId: string): any {
    return {
      organizationId,
      name: sevDeskProduct.name,
      sku: sevDeskProduct.productNumber,
      description: sevDeskProduct.description,
      price: sevDeskProduct.price || sevDeskProduct.priceGross || 0,
      costPrice: sevDeskProduct.pricePurchase,
      taxRate: sevDeskProduct.taxRate || 19,
      unit: sevDeskProduct.unity || 'Stk',
      category: sevDeskProduct.category,
      stockQuantity: sevDeskProduct.stock || 0,
      trackInventory: sevDeskProduct.stockEnabled ?? false,
      isActive: sevDeskProduct.active ?? true,
      source: 'sevdesk_migration',
      metadata: {
        sevDeskId: sevDeskProduct.id,
        importedAt: new Date(),
      },
    };
  }

  /**
   * Validate sevDesk data
   */
  validate(data: any[], entityType: SevDeskEntityType): SevDeskValidationReport {
    const errors: SevDeskValidationError[] = [];
    const warnings: string[] = [];
    let validRecords = 0;

    data.forEach((item, index) => {
      const itemErrors = this.validateItem(item, entityType, index + 2); // +2 for row number (1-based + header)
      errors.push(...itemErrors);

      if (itemErrors.length === 0) {
        validRecords++;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRecords: data.length,
      validRecords,
    };
  }

  /**
   * Validate individual item
   */
  private validateItem(
    item: any,
    entityType: SevDeskEntityType,
    row: number,
  ): SevDeskValidationError[] {
    const errors: SevDeskValidationError[] = [];
    const rules = SEVDESK_VALIDATION_RULES[entityType];

    if (!rules) return errors;

    Object.entries(rules).forEach(([field, rule]: [string, any]) => {
      const value = item[field];

      // Check required
      if (rule.required && (!value || value === '')) {
        errors.push({
          row,
          field,
          value,
          error: `Required field is missing`,
          entityType,
        });
      }

      // Check pattern
      if (value && rule.pattern && !rule.pattern.test(String(value))) {
        errors.push({
          row,
          field,
          value,
          error: `Invalid format for ${field}`,
          entityType,
        });
      }

      // Check max length
      if (value && rule.maxLength && String(value).length > rule.maxLength) {
        errors.push({
          row,
          field,
          value,
          error: `Value exceeds maximum length of ${rule.maxLength}`,
          entityType,
        });
      }

      // Check min value
      if (value !== undefined && rule.min !== undefined && Number(value) < rule.min) {
        errors.push({
          row,
          field,
          value,
          error: `Value must be at least ${rule.min}`,
          entityType,
        });
      }
    });

    return errors;
  }

  /**
   * Check for duplicates
   */
  async checkDuplicate(
    item: any,
    entityType: SevDeskEntityType,
    existingRecords: any[],
  ): Promise<SevDeskDuplicateCheck> {
    const duplicateKeys = SEVDESK_DUPLICATE_KEYS[entityType];
    const matchedOn: string[] = [];
    let matchCount = 0;

    for (const record of existingRecords) {
      for (const key of duplicateKeys) {
        const itemValue = this.getNestedValue(item, key);
        const recordValue = this.getNestedValue(record, key);

        if (itemValue && recordValue && this.compareValues(itemValue, recordValue)) {
          matchedOn.push(key);
          matchCount++;
          break; // Found a match for this record
        }
      }
    }

    const isDuplicate = matchCount > 0;
    const confidence = matchCount / duplicateKeys.length;

    return {
      isDuplicate,
      existingId: isDuplicate ? existingRecords[0]?.id : undefined,
      matchedOn,
      confidence,
    };
  }

  /**
   * Map invoice status
   */
  private mapInvoiceStatus(sevDeskStatus?: string): string {
    if (!sevDeskStatus) return 'draft';

    const statusMap: Record<string, string> = {
      'Entwurf': 'draft',
      'Draft': 'draft',
      'Offen': 'open',
      'Open': 'open',
      'Bezahlt': 'paid',
      'Paid': 'paid',
      'Überfällig': 'overdue',
      'Overdue': 'overdue',
      'Storniert': 'cancelled',
      'Cancelled': 'cancelled',
      'Canceled': 'cancelled',
    };

    return statusMap[sevDeskStatus] || 'draft';
  }

  /**
   * Map payment method
   */
  private mapPaymentMethod(sevDeskMethod?: string): string {
    if (!sevDeskMethod) return 'other';

    const methodMap: Record<string, string> = {
      'Überweisung': 'bank_transfer',
      'Bank Transfer': 'bank_transfer',
      'Banküberweisung': 'bank_transfer',
      'Kreditkarte': 'credit_card',
      'Credit Card': 'credit_card',
      'PayPal': 'paypal',
      'Bar': 'cash',
      'Cash': 'cash',
      'Lastschrift': 'direct_debit',
      'Direct Debit': 'direct_debit',
    };

    return methodMap[sevDeskMethod] || 'other';
  }

  /**
   * Calculate due date (default: 30 days from invoice date)
   */
  private calculateDueDate(invoiceDate: Date): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Compare values for duplicate detection
   */
  private compareValues(value1: any, value2: any): boolean {
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }

    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }

    return value1 === value2;
  }
}
