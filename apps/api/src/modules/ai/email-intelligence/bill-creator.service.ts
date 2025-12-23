/**
 * Bill Creator Service
 * Automatically creates Bill records from ExtractedInvoice data captured by email intelligence
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExtractedInvoiceDataDto } from '../extractors/dto/invoice-extraction.dto';
import { Bill, BillStatus, PaymentStatus, BillSourceType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface BillCreationResult {
  bill?: Bill;
  action: 'CREATED' | 'DUPLICATE_FOUND' | 'SKIPPED';
  reasoning: string;
  duplicateBillId?: string;
}

export interface BillCreationOptions {
  sourceEmailId?: string;
  sourceAttachmentId?: string;
  extractedDataId?: string;
  categoryId?: string;
  autoApprove?: boolean;
  notes?: string;
}

/**
 * Service that automatically creates Bill records from extracted invoice data
 */
@Injectable()
export class BillCreatorService {
  private readonly logger = new Logger(BillCreatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a Bill from ExtractedInvoice data
   * Checks for duplicates and handles vendor linking
   */
  async createBillFromExtractedInvoice(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
    options: BillCreationOptions = {},
  ): Promise<BillCreationResult> {
    this.logger.log(
      `Creating bill from extracted invoice: ${extractedInvoice.invoiceNumber || 'NO_NUMBER'} for vendor ${extractedInvoice.vendorName}`,
    );

    // Validate required fields
    if (!extractedInvoice.vendorName) {
      return {
        action: 'SKIPPED',
        reasoning: 'Missing vendor name - cannot create bill without vendor information',
      };
    }

    if (!extractedInvoice.total || extractedInvoice.total <= 0) {
      return {
        action: 'SKIPPED',
        reasoning: 'Invalid total amount - cannot create bill without valid amount',
      };
    }

    // Try to find existing vendor by name or email
    const vendor = await this.findVendor(orgId, extractedInvoice);

    if (!vendor) {
      this.logger.warn(
        `No vendor found for ${extractedInvoice.vendorName}. Bill creation requires vendor to exist first.`,
      );
      return {
        action: 'SKIPPED',
        reasoning: `Vendor "${extractedInvoice.vendorName}" not found. Please create vendor first or use VendorAutoCreatorService.`,
      };
    }

    // Check for duplicate bills
    if (extractedInvoice.invoiceNumber) {
      const duplicate = await this.findDuplicateBill(
        orgId,
        vendor.id,
        extractedInvoice.invoiceNumber,
      );

      if (duplicate) {
        this.logger.warn(
          `Duplicate bill found: ${duplicate.id} for invoice ${extractedInvoice.invoiceNumber}`,
        );
        return {
          action: 'DUPLICATE_FOUND',
          reasoning: `Bill already exists for invoice number ${extractedInvoice.invoiceNumber}`,
          duplicateBillId: duplicate.id,
          bill: duplicate,
        };
      }
    }

    // Create the bill
    const bill = await this.createBill(
      orgId,
      vendor.id,
      extractedInvoice,
      options,
    );

    this.logger.log(
      `Successfully created bill ${bill.id} from extracted invoice`,
    );

    return {
      action: 'CREATED',
      reasoning: 'Bill created successfully from extracted invoice data',
      bill,
    };
  }

  /**
   * Find vendor by name or email
   */
  private async findVendor(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    // First try exact name match
    let vendor = await this.prisma.vendor.findFirst({
      where: {
        organisationId: orgId,
        name: {
          equals: extractedInvoice.vendorName,
          mode: 'insensitive',
        },
      },
    });

    // If not found and we have an email, try email match
    if (!vendor && extractedInvoice.vendorEmail) {
      vendor = await this.prisma.vendor.findFirst({
        where: {
          organisationId: orgId,
          email: {
            equals: extractedInvoice.vendorEmail,
            mode: 'insensitive',
          },
        },
      });
    }

    // If still not found, try partial name match (for variations)
    if (!vendor) {
      vendor = await this.prisma.vendor.findFirst({
        where: {
          organisationId: orgId,
          name: {
            contains: extractedInvoice.vendorName,
            mode: 'insensitive',
          },
        },
      });
    }

    return vendor;
  }

  /**
   * Check for duplicate bills
   */
  private async findDuplicateBill(
    orgId: string,
    vendorId: string,
    invoiceNumber: string,
  ): Promise<Bill | null> {
    return this.prisma.bill.findFirst({
      where: {
        organisationId: orgId,
        vendorId,
        billNumber: invoiceNumber,
      },
      include: {
        vendor: true,
        lineItems: true,
      },
    });
  }

  /**
   * Create the bill record
   */
  private async createBill(
    orgId: string,
    vendorId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
    options: BillCreationOptions,
  ): Promise<Bill> {
    const issueDate = extractedInvoice.invoiceDate
      ? new Date(extractedInvoice.invoiceDate)
      : new Date();

    const dueDate = extractedInvoice.dueDate
      ? new Date(extractedInvoice.dueDate)
      : this.calculateDueDate(issueDate, 30); // Default 30 days

    const status = options.autoApprove ? BillStatus.PENDING : BillStatus.DRAFT;

    const billData = {
      organisation: { connect: { id: orgId } },
      vendor: { connect: { id: vendorId } },
      vendorName: extractedInvoice.vendorName!,
      billNumber: extractedInvoice.invoiceNumber,
      description: this.generateDescription(extractedInvoice),
      amount: new Decimal(extractedInvoice.subtotal),
      currency: extractedInvoice.currency || 'EUR',
      taxAmount: new Decimal(extractedInvoice.taxAmount || 0),
      totalAmount: new Decimal(extractedInvoice.total),
      total: new Decimal(extractedInvoice.total),
      paidAmount: new Decimal(0),
      status,
      paymentStatus: PaymentStatus.PENDING,
      issueDate,
      dueDate,
      sourceType: BillSourceType.EMAIL_EXTRACTION,
      sourceEmailId: options.sourceEmailId,
      sourceAttachmentId: options.sourceAttachmentId,
      extractedDataId: options.extractedDataId,
      categoryId: options.categoryId,
      vatRate: extractedInvoice.taxRate
        ? new Decimal(extractedInvoice.taxRate)
        : undefined,
      taxDeductible: true,
      notes: this.generateNotes(extractedInvoice, options),
      internalNotes: options.autoApprove
        ? 'Auto-approved from email extraction'
        : 'Created from email extraction - requires review',
      lineItems: {
        create: extractedInvoice.lineItems.map((item, index) => ({
          description: item.description,
          quantity: new Decimal(item.quantity || 1),
          unitPrice: new Decimal(item.unitPrice || item.totalAmount),
          amount: new Decimal(item.totalAmount),
          taxRate: item.taxRate ? new Decimal(item.taxRate) : undefined,
          taxAmount: item.taxAmount ? new Decimal(item.taxAmount) : undefined,
          sortOrder: index + 1,
        })),
      },
    };

    return this.prisma.bill.create({
      data: billData,
      include: {
        vendor: true,
        lineItems: true,
      },
    });
  }

  /**
   * Generate bill description from extracted data
   */
  private generateDescription(extractedInvoice: ExtractedInvoiceDataDto): string {
    const parts: string[] = [];

    if (extractedInvoice.invoiceNumber) {
      parts.push(`Invoice ${extractedInvoice.invoiceNumber}`);
    } else {
      parts.push('Invoice');
    }

    parts.push(`from ${extractedInvoice.vendorName}`);

    if (extractedInvoice.invoiceDate) {
      const date = new Date(extractedInvoice.invoiceDate);
      parts.push(`dated ${date.toLocaleDateString()}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate bill notes from extracted data
   */
  private generateNotes(
    extractedInvoice: ExtractedInvoiceDataDto,
    options: BillCreationOptions,
  ): string {
    const notes: string[] = [];

    notes.push('Auto-created from email invoice extraction');

    if (options.notes) {
      notes.push(options.notes);
    }

    if (extractedInvoice.purchaseOrderNumber) {
      notes.push(`PO: ${extractedInvoice.purchaseOrderNumber}`);
    }

    if (extractedInvoice.paymentTerms) {
      notes.push(`Payment Terms: ${extractedInvoice.paymentTerms}`);
    }

    if (extractedInvoice.paymentMethod) {
      notes.push(`Payment Method: ${extractedInvoice.paymentMethod}`);
    }

    if (extractedInvoice.iban) {
      notes.push(`IBAN: ${extractedInvoice.iban}`);
    }

    return notes.join('\n');
  }

  /**
   * Calculate due date from issue date and payment terms (in days)
   */
  private calculateDueDate(issueDate: Date, paymentTermsDays: number): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
  }

  /**
   * Batch create bills from multiple extracted invoices
   */
  async createBillsFromExtractedInvoices(
    orgId: string,
    extractedInvoices: Array<{
      data: ExtractedInvoiceDataDto;
      options?: BillCreationOptions;
    }>,
  ): Promise<BillCreationResult[]> {
    this.logger.log(
      `Batch creating ${extractedInvoices.length} bills for org ${orgId}`,
    );

    const results: BillCreationResult[] = [];

    for (const { data, options } of extractedInvoices) {
      try {
        const result = await this.createBillFromExtractedInvoice(
          orgId,
          data,
          options || {},
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to create bill from extracted invoice: ${error.message}`,
          error.stack,
        );
        results.push({
          action: 'SKIPPED',
          reasoning: `Error creating bill: ${error.message}`,
        });
      }
    }

    const created = results.filter((r) => r.action === 'CREATED').length;
    const duplicates = results.filter((r) => r.action === 'DUPLICATE_FOUND')
      .length;
    const skipped = results.filter((r) => r.action === 'SKIPPED').length;

    this.logger.log(
      `Batch bill creation complete: ${created} created, ${duplicates} duplicates, ${skipped} skipped`,
    );

    return results;
  }

  /**
   * Get bill creation statistics for an organization
   */
  async getBillCreationStats(orgId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await this.prisma.bill.groupBy({
      by: ['sourceType', 'status'],
      where: {
        organisationId: orgId,
        sourceType: BillSourceType.EMAIL_EXTRACTION,
        createdAt: {
          gte: since,
        },
      },
      _count: true,
    });

    return {
      period: `Last ${days} days`,
      stats,
      total: stats.reduce((sum, s) => sum + s._count, 0),
    };
  }
}
