/**
 * Invoice Context Provider
 * Provides context about invoices
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseContextProvider } from './base-context.provider';

@Injectable()
export class InvoiceContextProvider extends BaseContextProvider {
  entityType = 'invoice';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected async fetchEntity(entityId: string, orgId: string): Promise<any> {
    return this.prisma.invoice.findFirst({
      where: { id: entityId, orgId },
      include: {
        items: true,
        paymentReminders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  getSummary(invoice: any): string {
    const status = invoice.status.toLowerCase();
    const amount = this.formatCurrency(invoice.totalAmount, invoice.currency);
    const customer = invoice.customerName;
    const number = invoice.number;
    const dueDate = this.formatDate(invoice.dueDate);

    let statusDescription = '';
    if (status === 'paid') {
      const paidDate = this.formatDate(invoice.paidDate);
      statusDescription = `paid on ${paidDate}`;
    } else if (status === 'overdue') {
      const daysOverdue = Math.abs(this.daysDifference(invoice.dueDate));
      statusDescription = `overdue by ${daysOverdue} days`;
    } else if (status === 'pending') {
      const daysToDue = this.daysDifference(invoice.dueDate);
      statusDescription = daysToDue > 0 ? `due in ${daysToDue} days` : `due today`;
    } else {
      statusDescription = status;
    }

    return `Invoice ${number} to ${customer} for ${amount} (${statusDescription}, due ${dueDate})`;
  }

  getRelevantFields(invoice: any): Record<string, any> {
    const fields: Record<string, any> = {
      number: invoice.number,
      status: invoice.status,
      customerName: invoice.customerName,
      totalAmount: parseFloat(invoice.totalAmount),
      currency: invoice.currency,
      issueDate: this.formatDate(invoice.issueDate),
      dueDate: this.formatDate(invoice.dueDate),
      itemCount: invoice.items?.length || 0,
    };

    // Add payment info if paid
    if (invoice.status === 'PAID' && invoice.paidDate) {
      fields.paidDate = this.formatDate(invoice.paidDate);
      fields.paymentMethod = invoice.paymentMethod;
    }

    // Add overdue info
    if (invoice.status === 'OVERDUE') {
      const daysOverdue = Math.abs(this.daysDifference(invoice.dueDate));
      fields.daysOverdue = daysOverdue;
      fields.remindersSent = invoice.paymentReminders?.length || 0;
    }

    // Add VAT info if present
    if (invoice.vatRate) {
      fields.vatRate = parseFloat(invoice.vatRate);
      fields.vatAmount = parseFloat(invoice.taxAmount);
      fields.subtotal = parseFloat(invoice.subtotal);
    }

    // Add customer details
    if (invoice.customerEmail) {
      fields.customerEmail = invoice.customerEmail;
    }

    if (invoice.customerVatId) {
      fields.customerVatId = invoice.customerVatId;
    }

    return fields;
  }

  getSuggestedActions(invoice: any): string[] {
    const suggestions: string[] = [];

    switch (invoice.status) {
      case 'DRAFT':
        suggestions.push('Finalize and send this invoice to the customer');
        suggestions.push('Add or modify line items');
        suggestions.push('Preview invoice PDF');
        break;

      case 'PENDING':
        const daysToDue = this.daysDifference(invoice.dueDate);
        if (daysToDue <= 3) {
          suggestions.push('Send payment reminder to customer');
        }
        suggestions.push('Mark invoice as paid');
        suggestions.push('Download invoice PDF');
        suggestions.push('Send invoice via email');
        break;

      case 'OVERDUE':
        suggestions.push('Send overdue payment reminder');
        suggestions.push('Contact customer about payment');
        suggestions.push('Create payment plan for this invoice');
        suggestions.push('Write off as bad debt');
        break;

      case 'PAID':
        suggestions.push('Download receipt');
        suggestions.push('View payment details');
        if (invoice.type !== 'CREDIT_NOTE') {
          suggestions.push('Create credit note for this invoice');
        }
        break;

      case 'CANCELLED':
        suggestions.push('View cancellation reason');
        suggestions.push('Recreate this invoice');
        break;
    }

    // Common suggestions
    suggestions.push('View customer details');
    suggestions.push('Create similar invoice');

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  protected async getRelatedEntities(
    invoice: any,
    orgId: string,
  ): Promise<Array<{ type: string; id: string; relation: string }>> {
    const related: Array<{ type: string; id: string; relation: string }> = [];

    // Add customer if exists
    if (invoice.customerId) {
      related.push({
        type: 'contact',
        id: invoice.customerId,
        relation: 'customer',
      });
    }

    // Add recurring invoice if exists
    if (invoice.recurringInvoiceId) {
      related.push({
        type: 'recurring-invoice',
        id: invoice.recurringInvoiceId,
        relation: 'generated-from',
      });
    }

    return related;
  }

  protected getMetadata(invoice: any): Record<string, any> {
    return {
      hasReminders: (invoice.paymentReminders?.length || 0) > 0,
      isRecurring: !!invoice.recurringInvoiceId,
      reverseCharge: invoice.reverseCharge,
      paymentTerms: invoice.paymentTerms,
    };
  }
}
