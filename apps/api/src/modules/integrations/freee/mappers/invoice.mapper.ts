import { Injectable, Logger } from '@nestjs/common';
import { FreeeInvoice, FreeeInvoiceContent } from '../freee.types';

/**
 * freee Invoice Mapper
 * Maps between Operate invoices and freee invoices (請求書)
 */
@Injectable()
export class FreeeInvoiceMapper {
  private readonly logger = new Logger(FreeeInvoiceMapper.name);

  /**
   * Map freee invoice to Operate invoice
   */
  mapToOperateInvoice(invoice: FreeeInvoice): any {
    try {
      return {
        externalId: `freee_${invoice.id}`,
        externalSystem: 'freee',
        invoiceNumber: invoice.invoice_number,
        issueDate: new Date(invoice.issue_date),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
        bookingDate: invoice.booking_date ? new Date(invoice.booking_date) : null,

        // Customer/Partner
        customerId: invoice.partner_id,
        customerName: invoice.partner_name,
        customerDisplayName: invoice.partner_display_name,

        // Amounts
        subtotal: invoice.sub_total,
        taxAmount: invoice.total_vat,
        totalAmount: invoice.total_amount,

        // Status
        status: this.mapFreeeStatusToOperate(invoice.invoice_status),
        paymentStatus: invoice.payment_status === 'settled' ? 'paid' : 'unpaid',

        // Details
        title: invoice.title,
        description: invoice.description,
        message: invoice.message,
        notes: invoice.notes,

        // Line items
        lineItems: invoice.invoice_contents.map((item) => this.mapInvoiceLineItem(item)),

        // Tax breakdown
        taxBreakdown: {
          reducedVat: invoice.total_amount_per_vat_rate.reduced_vat,
          eightPercentVat: invoice.total_amount_per_vat_rate.eight_percent_vat,
          fivePercentVat: invoice.total_amount_per_vat_rate.five_percent_vat,
          standardVat: invoice.total_amount_per_vat_rate.standard_vat,
        },

        // Payment details
        paymentType: invoice.payment_type,
        paymentBankInfo: invoice.payment_bank_info,

        // Address information
        customerAddress: {
          zipcode: invoice.partner_zipcode,
          prefectureCode: invoice.partner_prefecture_code,
          prefectureName: invoice.partner_prefecture_name,
          address1: invoice.partner_address1,
          address2: invoice.partner_address2,
          contactInfo: invoice.partner_contact_info,
        },

        companyAddress: {
          name: invoice.company_name,
          zipcode: invoice.company_zipcode,
          prefectureCode: invoice.company_prefecture_code,
          prefectureName: invoice.company_prefecture_name,
          address1: invoice.company_address1,
          address2: invoice.company_address2,
          contactInfo: invoice.company_contact_info,
        },

        // Settings
        invoiceLayout: invoice.invoice_layout,
        taxEntryMethod: invoice.tax_entry_method,

        // Linked deal
        dealId: invoice.deal_id,

        // Metadata
        metadata: {
          freeeCompanyId: invoice.company_id,
          partnerTitle: invoice.partner_title,
        },

        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to map freee invoice ${invoice.id}`, error);
      throw error;
    }
  }

  /**
   * Map freee invoice line item to Operate line item
   */
  private mapInvoiceLineItem(item: FreeeInvoiceContent): any {
    return {
      id: item.id,
      order: item.order,
      type: item.type,
      description: item.description,
      quantity: item.qty,
      unit: item.unit,
      unitPrice: item.unit_price,
      amount: item.amount,
      taxAmount: item.vat,
      isReducedVat: item.reduced_vat,
      taxCode: item.tax_code,

      // Item reference
      itemId: item.item_id,
      itemName: item.item_name,

      // Section (department)
      sectionId: item.section_id,
      sectionName: item.section_name,

      // Tags
      tags: item.tag_ids.map((id, index) => ({
        id,
        name: item.tag_names[index],
      })),

      // Segment tags
      segment1: item.segment_1_tag_id ? {
        id: item.segment_1_tag_id,
        name: item.segment_1_tag_name,
      } : null,
      segment2: item.segment_2_tag_id ? {
        id: item.segment_2_tag_id,
        name: item.segment_2_tag_name,
      } : null,
      segment3: item.segment_3_tag_id ? {
        id: item.segment_3_tag_id,
        name: item.segment_3_tag_name,
      } : null,
    };
  }

  /**
   * Map Operate invoice to freee invoice
   */
  mapToFreeeInvoice(
    invoice: any,
    freeeCompanyId: number,
    partnerId: number,
  ): Partial<FreeeInvoice> {
    try {
      const freeeInvoice: any = {
        company_id: freeeCompanyId,
        partner_id: partnerId,
        issue_date: this.formatDate(invoice.issueDate),
        due_date: invoice.dueDate ? this.formatDate(invoice.dueDate) : undefined,
        title: invoice.title,
        description: invoice.description,
        message: invoice.message,
        notes: invoice.notes,
        payment_type: invoice.paymentType || 'transfer',
        invoice_status: this.mapOperateStatusToFreee(invoice.status),
        tax_entry_method: invoice.taxEntryMethod || 'exclusive',

        // Map line items
        invoice_contents: invoice.lineItems?.map((item: any, index: number) => ({
          order: index,
          type: item.type || 'normal',
          qty: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          description: item.description,
          item_id: item.itemId,
          section_id: item.sectionId,
          tag_ids: item.tags?.map((t: any) => t.id) || [],
          segment_1_tag_id: item.segment1?.id,
          segment_2_tag_id: item.segment2?.id,
          segment_3_tag_id: item.segment3?.id,
        })),
      };

      // Add invoice number if updating
      if (invoice.invoiceNumber) {
        freeeInvoice.invoice_number = invoice.invoiceNumber;
      }

      return freeeInvoice;
    } catch (error) {
      this.logger.error(`Failed to map Operate invoice ${invoice.id}`, error);
      throw error;
    }
  }

  /**
   * Map array of freee invoices to Operate invoices
   */
  mapToOperateInvoices(invoices: FreeeInvoice[]): any[] {
    return invoices.map((invoice) => this.mapToOperateInvoice(invoice));
  }

  /**
   * Map freee invoice status to Operate status
   */
  private mapFreeeStatusToOperate(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'draft',
      applying: 'pending_approval',
      remanded: 'rejected',
      rejected: 'rejected',
      approved: 'approved',
      submitted: 'sent',
    };

    return statusMap[status] || 'draft';
  }

  /**
   * Map Operate status to freee invoice status
   */
  private mapOperateStatusToFreee(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'draft',
      pending_approval: 'applying',
      approved: 'approved',
      sent: 'submitted',
      rejected: 'rejected',
    };

    return statusMap[status] || 'draft';
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * Detect changes between Operate invoice and freee invoice
   */
  detectChanges(operateInvoice: any, freeeInvoice: FreeeInvoice): string[] {
    const changes: string[] = [];

    if (operateInvoice.totalAmount !== freeeInvoice.total_amount) {
      changes.push('totalAmount');
    }
    if (operateInvoice.status !== this.mapFreeeStatusToOperate(freeeInvoice.invoice_status)) {
      changes.push('status');
    }
    if (operateInvoice.lineItems?.length !== freeeInvoice.invoice_contents?.length) {
      changes.push('lineItems');
    }

    return changes;
  }

  /**
   * Calculate totals from line items
   */
  calculateTotals(lineItems: any[]): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  }
}
