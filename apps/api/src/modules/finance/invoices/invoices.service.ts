import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Prisma, InvoiceStatus, AuditEntityType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { MultiCurrencyService } from '../../currency/multi-currency.service';
import { InvoiceCurrencyHelper } from './helpers/invoice-currency.helper';
import { PrismaService } from '../../database/prisma.service';
import { FinancialAuditService } from '../../audit/financial-audit.service';

/**
 * Invoices Service
 * Business logic for invoice management operations with multi-currency support
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  // In-memory cache for company defaults with TTL
  private companyDefaultsCache = new Map<string, {
    data: any;
    expiry: number;
  }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private repository: InvoicesRepository,
    private multiCurrencyService: MultiCurrencyService,
    private currencyHelper: InvoiceCurrencyHelper,
    private prisma: PrismaService,
    private auditService: FinancialAuditService,
  ) {}

  /**
   * Find all invoices with pagination and filters
   */
  async findAll(orgId: string, query: InvoiceQueryDto) {
    const {
      search,
      status,
      type,
      customerId,
      fromDate,
      toDate,
      page = 1,
      pageSize = 20,
      sortBy = 'issueDate',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {
      orgId,
      ...(status && { status }),
      ...(type && { type }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) {
        where.issueDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.issueDate.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.repository.count(where),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get invoice statistics by status
   */
  async getStatistics(orgId: string) {
    return this.repository.getStatisticsByStatus(orgId);
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(orgId: string) {
    return this.repository.getOverdueInvoices(orgId);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string, userId?: string) {
    const invoice = await this.repository.findById(id, {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Audit log: READ access
    await this.auditService.logAccess({
      userId,
      organisationId: invoice.orgId,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
    });

    return invoice;
  }

  /**
   * Create new invoice with multi-currency support
   */
  async create(orgId: string, dto: CreateInvoiceDto, userId?: string) {
    // Validate that items array is not empty
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Validate currency
    const invoiceCurrency = dto.currency || 'EUR';
    this.currencyHelper.validateCurrency(invoiceCurrency);

    // Get organization and company defaults
    const companyDefaults = await this.getCompanyDefaults(orgId);

    if (!companyDefaults) {
      throw new NotFoundException(`Organisation ${orgId} not found`);
    }

    const baseCurrency = companyDefaults.currency || 'EUR';

    // Generate invoice number
    const issueDate = new Date(dto.issueDate);
    const year = issueDate.getFullYear();
    const invoiceNumber = await this.repository.getNextInvoiceNumber(
      orgId,
      year,
    );

    // Calculate totals using currency helper
    const { subtotal, taxAmount, totalAmount } =
      this.currencyHelper.calculateInvoiceTotals(
        dto.items,
        invoiceCurrency,
        dto.vatRate || 0,
        dto.reverseCharge || false,
      );

    // Calculate base currency amount for reporting (if different currency)
    let baseCurrencyAmount: number | undefined;
    let exchangeRate: number | undefined;

    if (invoiceCurrency !== baseCurrency) {
      // Use 1:1 exchange rate for now (will be replaced with actual rates in W20-T4)
      exchangeRate = 1;
      baseCurrencyAmount = this.currencyHelper.calculateBaseCurrencyAmount(
        totalAmount,
        invoiceCurrency,
        baseCurrency,
        exchangeRate,
      );

      this.logger.log(
        `Invoice in ${invoiceCurrency}, base currency ${baseCurrency}, rate: ${exchangeRate}, base amount: ${baseCurrencyAmount}`,
      );
    }

    // Merge company defaults into metadata
    const metadata = {
      ...dto.metadata,
      seller: companyDefaults.seller,
    };

    // Prepare invoice data
    const invoiceData: Prisma.InvoiceCreateInput = {
      orgId,
      number: invoiceNumber,
      type: dto.type,
      status: InvoiceStatus.DRAFT,
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerAddress: dto.customerAddress,
      customerVatId: dto.customerVatId,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      subtotal: new Decimal(subtotal),
      taxAmount: new Decimal(taxAmount),
      totalAmount: new Decimal(totalAmount),
      currency: invoiceCurrency,
      exchangeRate: exchangeRate ? new Decimal(exchangeRate) : undefined,
      baseCurrencyAmount: baseCurrencyAmount
        ? new Decimal(baseCurrencyAmount)
        : undefined,
      vatRate: dto.vatRate,
      reverseCharge: dto.reverseCharge || false,
      paymentTerms: dto.paymentTerms,
      paymentMethod: dto.paymentMethod,
      bankReference: dto.bankReference,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      metadata: metadata ?? undefined,
    };

    // Prepare items data
    const itemsData = dto.items.map((item, index) => {
      const itemTaxRate = item.taxRate ?? dto.vatRate ?? 0;
      const amount = item.quantity * item.unitPrice;
      const itemTaxAmount = dto.reverseCharge ? 0 : (amount * itemTaxRate) / 100;

      return {
        description: item.description,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        amount: new Decimal(amount),
        taxRate: itemTaxRate,
        taxAmount: new Decimal(itemTaxAmount),
        productCode: item.productCode,
        unit: item.unit,
        sortOrder: item.sortOrder ?? index + 1,
      };
    });

    const invoice = await this.repository.create(invoiceData, itemsData);

    this.logger.log(
      `Created invoice ${invoice.number} for organisation ${orgId}`,
    );

    // Audit log: CREATE
    await this.auditService.logCreate({
      userId,
      organisationId: orgId,
      entityType: AuditEntityType.INVOICE,
      entityId: invoice.id,
      newState: invoice,
    });

    return invoice;
  }

  /**
   * Update invoice (only DRAFT invoices)
   */
  async update(id: string, dto: UpdateInvoiceDto, userId?: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update invoice with status ${existing.status}. Only DRAFT invoices can be updated.`,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {};

    // Update basic fields
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.customerEmail !== undefined)
      updateData.customerEmail = dto.customerEmail;
    if (dto.customerAddress !== undefined)
      updateData.customerAddress = dto.customerAddress;
    if (dto.customerVatId !== undefined)
      updateData.customerVatId = dto.customerVatId;
    if (dto.issueDate) updateData.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.paymentTerms !== undefined)
      updateData.paymentTerms = dto.paymentTerms;
    if (dto.paymentMethod !== undefined)
      updateData.paymentMethod = dto.paymentMethod;
    if (dto.bankReference !== undefined)
      updateData.bankReference = dto.bankReference;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.internalNotes !== undefined)
      updateData.internalNotes = dto.internalNotes;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata ?? undefined;

    // If items are being updated, recalculate totals
    let itemsData: any[] | undefined;
    if (dto.items) {
      if (dto.items.length === 0) {
        throw new BadRequestException('Invoice must have at least one item');
      }

      const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
        dto.items,
        Number(existing.vatRate || 0),
      );

      updateData.subtotal = new Decimal(subtotal);
      updateData.taxAmount = new Decimal(taxAmount);
      updateData.totalAmount = new Decimal(totalAmount);

      itemsData = dto.items.map((item, index) => {
        const itemTaxRate = item.taxRate ?? Number(existing.vatRate) ?? 0;
        const amount = item.quantity * item.unitPrice;
        const itemTaxAmount = existing.reverseCharge
          ? 0
          : (amount * Number(itemTaxRate)) / 100;

        return {
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(amount),
          taxRate: itemTaxRate,
          taxAmount: new Decimal(itemTaxAmount),
          productCode: item.productCode,
          unit: item.unit,
          sortOrder: item.sortOrder ?? index + 1,
        };
      });
    }

    const invoice = await this.repository.updateWithItems(
      id,
      updateData,
      itemsData,
    );

    this.logger.log(`Updated invoice ${id}`);

    // Audit log: UPDATE
    await this.auditService.logUpdate({
      userId,
      organisationId: existing.orgId,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
      previousState: existing,
      newState: invoice,
      changes: updateData,
    });

    return invoice;
  }

  /**
   * Mark invoice as sent
   */
  async send(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot send invoice with status ${existing.status}`,
      );
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.SENT,
    });

    this.logger.log(`Marked invoice ${id} as sent`);

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async pay(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (
      existing.status !== InvoiceStatus.SENT &&
      existing.status !== InvoiceStatus.OVERDUE
    ) {
      throw new BadRequestException(
        `Cannot mark invoice with status ${existing.status} as paid`,
      );
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.PAID,
      paidDate: new Date(),
    });

    this.logger.log(`Marked invoice ${id} as paid`);

    return invoice;
  }

  /**
   * Cancel invoice
   */
  async cancel(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    const invoice = await this.repository.update(id, {
      status: InvoiceStatus.CANCELLED,
    });

    this.logger.log(`Cancelled invoice ${id}`);

    return invoice;
  }

  /**
   * Delete invoice (only DRAFT invoices)
   */
  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete invoice with status ${existing.status}. Only DRAFT invoices can be deleted.`,
      );
    }

    await this.repository.delete(id);

    this.logger.log(`Deleted invoice ${id}`);

    // Audit log: DELETE
    await this.auditService.logDelete({
      userId,
      organisationId: existing.orgId,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
      previousState: existing,
    });
  }

  /**
   * Duplicate an existing invoice
   */
  async duplicate(id: string, orgId: string) {
    const existing = await this.repository.findById(id, {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Verify invoice belongs to the organization
    if (existing.orgId !== orgId) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Type-safe access to items with proper typing
    const invoiceWithItems = existing as typeof existing & { items?: Array<{
      description: string;
      quantity: any;
      unitPrice: any;
      amount: any;
      taxRate?: number | null;
      taxAmount?: any;
      productCode?: string | null;
      unit?: string | null;
      sortOrder?: number | null;
    }> };

    // Type guard to ensure items exist
    if (!invoiceWithItems.items || invoiceWithItems.items.length === 0) {
      throw new BadRequestException('Cannot duplicate invoice without items');
    }

    // Generate new invoice number
    const today = new Date();
    const year = today.getFullYear();
    const invoiceNumber = await this.repository.getNextInvoiceNumber(
      orgId,
      year,
    );

    // Prepare new invoice data (reset to DRAFT status)
    const newInvoiceData: Prisma.InvoiceCreateInput = {
      orgId,
      number: invoiceNumber,
      type: invoiceWithItems.type,
      status: InvoiceStatus.DRAFT,
      customerId: invoiceWithItems.customerId ?? undefined,
      customerName: invoiceWithItems.customerName,
      customerEmail: invoiceWithItems.customerEmail ?? undefined,
      customerAddress: invoiceWithItems.customerAddress ?? undefined,
      customerVatId: invoiceWithItems.customerVatId ?? undefined,
      issueDate: today,
      dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotal: invoiceWithItems.subtotal,
      taxAmount: invoiceWithItems.taxAmount,
      totalAmount: invoiceWithItems.totalAmount,
      currency: invoiceWithItems.currency,
      vatRate: invoiceWithItems.vatRate ?? undefined,
      reverseCharge: invoiceWithItems.reverseCharge,
      paymentTerms: invoiceWithItems.paymentTerms ?? undefined,
      paymentMethod: invoiceWithItems.paymentMethod ?? undefined,
      bankReference: invoiceWithItems.bankReference ?? undefined,
      notes: invoiceWithItems.notes ?? undefined,
      internalNotes: invoiceWithItems.internalNotes ?? undefined,
      metadata: invoiceWithItems.metadata ?? undefined,
    };

    // Prepare items data with proper typing
    const itemsData: Prisma.InvoiceItemCreateManyInvoiceInput[] =
      invoiceWithItems.items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        taxRate: item.taxRate ?? undefined,
        taxAmount: item.taxAmount ?? undefined,
        productCode: item.productCode ?? undefined,
        unit: item.unit ?? undefined,
        sortOrder: item.sortOrder ?? index + 1,
      }));

    const invoice = await this.repository.create(newInvoiceData, itemsData);

    this.logger.log(
      `Duplicated invoice ${invoiceWithItems.number} as ${invoice.number} for organisation ${orgId}`,
    );

    return invoice;
  }

  /**
   * Generate PDF for invoice
   */
  async generatePdf(id: string): Promise<Buffer> {
    const invoice = await this.repository.findById(id, {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.createPdfBuffer(invoice);
  }

  /**
   * Generate invoice with format support (PDF, ZUGFeRD, XRechnung)
   */
  async generateInvoiceWithFormat(
    id: string,
    format?: string,
    zugferdProfile?: string,
    xrechnungSyntax?: string,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const invoice = await this.repository.findById(id, {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Default to PDF if no format specified
    const invoiceFormat = format || 'pdf';

    // For now, only generate PDF (E-Invoice formats will be added later)
    if (invoiceFormat === 'pdf') {
      const pdfBuffer = await this.createPdfBuffer(invoice);
      return {
        buffer: pdfBuffer,
        contentType: 'application/pdf',
        filename: `invoice-${invoice.number}.pdf`,
      };
    }

    // Placeholder for ZUGFeRD/XRechnung support
    if (invoiceFormat === 'zugferd' || invoiceFormat === 'facturx') {
      throw new BadRequestException('ZUGFeRD format not yet implemented');
    }

    if (invoiceFormat === 'xrechnung') {
      throw new BadRequestException('XRechnung format not yet implemented');
    }

    throw new BadRequestException(`Unsupported format: ${invoiceFormat}`);
  }

  /**
   * Create PDF buffer from invoice data
   */
  private async createPdfBuffer(invoice: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });

      // Collect PDF chunks
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('INVOICE', { align: 'right' });
      doc.moveDown();

      // Seller information (from metadata)
      const sellerInfo = invoice.metadata?.seller;
      if (sellerInfo) {
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(sellerInfo.name || '', 50, 100);
        doc.fontSize(9).font('Helvetica');
        let yPos = 115;
        if (sellerInfo.address) {
          doc.text(sellerInfo.address, 50, yPos);
          yPos += 12;
        }
        if (sellerInfo.taxId) {
          doc.text(`Tax ID: ${sellerInfo.taxId}`, 50, yPos);
          yPos += 12;
        }
        if (sellerInfo.vatNumber) {
          doc.text(`VAT: ${sellerInfo.vatNumber}`, 50, yPos);
          yPos += 12;
        }
        if (sellerInfo.email) {
          doc.text(sellerInfo.email, 50, yPos);
          yPos += 12;
        }
        if (sellerInfo.phone) {
          doc.text(sellerInfo.phone, 50, yPos);
        }
      }

      // Invoice details (right side)
      doc.fontSize(10);
      doc.text(`Invoice Number: ${invoice.number}`, 350, 100, { align: 'right' });
      doc.text(`Issue Date: ${invoice.issueDate.toISOString().split('T')[0]}`, 350, 115, {
        align: 'right',
      });
      doc.text(`Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`, 350, 130, {
        align: 'right',
      });
      doc.text(`Status: ${invoice.status}`, 350, 145, { align: 'right' });
      doc.moveDown(4);

      // Bill To
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50);
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.customerName);
      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail);
      }
      if (invoice.customerAddress) {
        doc.text(invoice.customerAddress);
      }
      if (invoice.customerVatId) {
        doc.text(`VAT ID: ${invoice.customerVatId}`);
      }
      doc.moveDown(2);

      // Items table
      const tableTop = doc.y;
      const descCol = 50;
      const qtyCol = 300;
      const priceCol = 370;
      const amountCol = 470;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', descCol, tableTop);
      doc.text('Qty', qtyCol, tableTop);
      doc.text('Price', priceCol, tableTop);
      doc.text('Amount', amountCol, tableTop);

      doc
        .moveTo(descCol, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      doc.font('Helvetica');
      let yPosition = tableTop + 25;

      for (const item of invoice.items) {
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const amount = Number(item.amount);

        // Get currency decimals for proper formatting
        const decimals = this.currencyHelper.getCurrencyDecimals(
          invoice.currency,
        );

        doc.text(item.description, descCol, yPosition, { width: 240 });
        doc.text(qty.toFixed(2), qtyCol, yPosition);
        doc.text(
          `${invoice.currency} ${unitPrice.toFixed(decimals)}`,
          priceCol,
          yPosition,
        );
        doc.text(
          `${invoice.currency} ${amount.toFixed(decimals)}`,
          amountCol,
          yPosition,
        );

        yPosition += 30;
      }

      // Totals
      yPosition += 20;
      doc.fontSize(10);

      const totalsX = 400;
      const decimals = this.currencyHelper.getCurrencyDecimals(
        invoice.currency,
      );

      doc.text('Subtotal:', totalsX, yPosition);
      doc.text(
        `${invoice.currency} ${Number(invoice.subtotal).toFixed(decimals)}`,
        470,
        yPosition,
      );

      yPosition += 20;
      if (invoice.reverseCharge) {
        doc.text('Tax (Reverse Charge):', totalsX, yPosition);
        doc.text('0.00', 470, yPosition);
      } else {
        doc.text(`Tax (${invoice.vatRate}%):`, totalsX, yPosition);
        doc.text(
          `${invoice.currency} ${Number(invoice.taxAmount).toFixed(decimals)}`,
          470,
          yPosition,
        );
      }

      yPosition += 20;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', totalsX, yPosition);
      doc.text(
        `${invoice.currency} ${Number(invoice.totalAmount).toFixed(decimals)}`,
        470,
        yPosition,
      );

      // Payment terms
      if (invoice.paymentTerms || invoice.paymentMethod || invoice.bankReference) {
        yPosition += 40;
        doc.fontSize(10).font('Helvetica');
        doc.text('Payment Information:', 50, yPosition);
        yPosition += 20;

        if (invoice.paymentTerms) {
          doc.text(`Terms: ${invoice.paymentTerms}`, 50, yPosition);
          yPosition += 15;
        }
        if (invoice.paymentMethod) {
          doc.text(`Method: ${invoice.paymentMethod}`, 50, yPosition);
          yPosition += 15;
        }
        if (invoice.bankReference) {
          doc.text(`Reference: ${invoice.bankReference}`, 50, yPosition);
        }
      }

      // Notes
      if (invoice.notes) {
        yPosition += 30;
        doc.fontSize(10).font('Helvetica');
        doc.text('Notes:', 50, yPosition);
        yPosition += 15;
        doc.text(invoice.notes, 50, yPosition, { width: 500 });
      }

      // Finalize PDF
      doc.end();
    });
  }

  /**
   * Convert invoice amount to a different currency
   *
   * @param invoiceId - Invoice ID
   * @param targetCurrency - Target currency code
   * @param exchangeRate - Optional exchange rate (uses 1:1 if not provided)
   * @returns Converted amount details
   */
  async convertInvoiceAmount(
    invoiceId: string,
    targetCurrency: string,
    exchangeRate?: number,
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
  }> {
    const invoice = await this.findById(invoiceId);

    // Validate target currency
    this.currencyHelper.validateCurrency(targetCurrency);

    const rate = exchangeRate ?? 1;
    const convertedAmount = this.multiCurrencyService.convert(
      Number(invoice.totalAmount),
      invoice.currency,
      targetCurrency,
      rate,
    );

    this.logger.log(
      `Converting invoice ${invoiceId} from ${invoice.currency} to ${targetCurrency}: ${invoice.totalAmount} -> ${convertedAmount} (rate: ${rate})`,
    );

    return {
      originalAmount: Number(invoice.totalAmount),
      originalCurrency: invoice.currency,
      convertedAmount,
      convertedCurrency: targetCurrency,
      exchangeRate: rate,
    };
  }

  /**
   * Get invoice with amounts in a different currency
   *
   * @param invoiceId - Invoice ID
   * @param displayCurrency - Currency to display amounts in
   * @param exchangeRate - Optional exchange rate
   * @returns Invoice with converted amounts
   */
  async getInvoiceInCurrency(
    invoiceId: string,
    displayCurrency: string,
    exchangeRate?: number,
  ): Promise<any> {
    const invoice = await this.findById(invoiceId);

    // If same currency, return as-is
    if (invoice.currency === displayCurrency) {
      return invoice;
    }

    // Validate display currency
    this.currencyHelper.validateCurrency(displayCurrency);

    const rate = exchangeRate ?? 1;

    // Convert amounts
    const convertedAmounts = this.currencyHelper.convertInvoiceAmounts(
      {
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
      },
      invoice.currency,
      displayCurrency,
      rate,
    );

    return {
      ...invoice,
      displayCurrency,
      displaySubtotal: convertedAmounts.subtotal,
      displayTaxAmount: convertedAmounts.taxAmount,
      displayTotalAmount: convertedAmounts.totalAmount,
      displayExchangeRate: rate,
      originalCurrency: invoice.currency,
      originalSubtotal: Number(invoice.subtotal),
      originalTaxAmount: Number(invoice.taxAmount),
      originalTotalAmount: Number(invoice.totalAmount),
    };
  }

  /**
   * Recalculate base currency amount
   *
   * Useful when exchange rates are updated and base currency amounts need to be recalculated
   *
   * @param invoiceId - Invoice ID
   * @param newExchangeRate - New exchange rate (optional, uses 1:1 if not provided)
   * @returns Updated invoice
   */
  async recalculateBaseCurrency(
    invoiceId: string,
    newExchangeRate?: number,
  ): Promise<any> {
    const invoice = await this.findById(invoiceId);

    // Get organization's base currency
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: invoice.orgId },
      select: { currency: true },
    });

    if (!organisation) {
      throw new NotFoundException(
        `Organisation ${invoice.orgId} not found`,
      );
    }

    const baseCurrency = organisation.currency || 'EUR';

    // If invoice is already in base currency, no conversion needed
    if (invoice.currency === baseCurrency) {
      this.logger.log(
        `Invoice ${invoiceId} is already in base currency ${baseCurrency}, no recalculation needed`,
      );
      return invoice;
    }

    const rate = newExchangeRate ?? 1;

    const newBaseCurrencyAmount =
      this.currencyHelper.calculateBaseCurrencyAmount(
        Number(invoice.totalAmount),
        invoice.currency,
        baseCurrency,
        rate,
      );

    // Update invoice
    const updated = await this.repository.update(invoiceId, {
      exchangeRate: new Decimal(rate),
      baseCurrencyAmount: new Decimal(newBaseCurrencyAmount),
    });

    this.logger.log(
      `Recalculated base currency for invoice ${invoiceId}: ${invoice.currency} ${invoice.totalAmount} -> ${baseCurrency} ${newBaseCurrencyAmount} (rate: ${rate})`,
    );

    return updated;
  }

  /**
   * Get invoice totals in a specific currency
   *
   * Useful for reporting and analytics across multiple currencies
   * Optimized: Uses groupBy aggregation instead of fetching all invoices
   *
   * @param orgId - Organisation ID
   * @param targetCurrency - Target currency code
   * @param query - Optional filters
   * @returns Total amounts in target currency
   */
  async getTotalsInCurrency(
    orgId: string,
    targetCurrency: string,
    query?: InvoiceQueryDto,
  ): Promise<{
    currency: string;
    totalInvoices: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  }> {
    // Validate currency
    this.currencyHelper.validateCurrency(targetCurrency);

    // Build where clause (same as findAll)
    const where: Prisma.InvoiceWhereInput = {
      orgId,
      ...(query?.status && { status: query.status }),
      ...(query?.type && { type: query.type }),
      ...(query?.customerId && { customerId: query.customerId }),
    };

    // Get aggregated totals grouped by currency for efficient processing
    const aggregatedByCurrency = await this.prisma.invoice.groupBy({
      by: ['currency'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
      },
    });

    // Sum up amounts, converting to target currency
    let totalSubtotal = 0;
    let totalTaxAmount = 0;
    let totalTotalAmount = 0;
    let totalInvoices = 0;

    for (const currencyGroup of aggregatedByCurrency) {
      totalInvoices += currencyGroup._count._all;

      // Use 1:1 rate for same currency, otherwise use default rate
      // Note: For accurate multi-currency conversion, exchange rates should be fetched from a rates service
      const rate = currencyGroup.currency === targetCurrency ? 1 : 1;

      // Convert amounts
      totalSubtotal += this.multiCurrencyService.convert(
        Number(currencyGroup._sum.subtotal || 0),
        currencyGroup.currency,
        targetCurrency,
        rate,
      );

      totalTaxAmount += this.multiCurrencyService.convert(
        Number(currencyGroup._sum.taxAmount || 0),
        currencyGroup.currency,
        targetCurrency,
        rate,
      );

      totalTotalAmount += this.multiCurrencyService.convert(
        Number(currencyGroup._sum.totalAmount || 0),
        currencyGroup.currency,
        targetCurrency,
        rate,
      );
    }

    return {
      currency: targetCurrency,
      totalInvoices,
      subtotal: this.multiCurrencyService.roundToDecimals(
        totalSubtotal,
        targetCurrency,
      ),
      taxAmount: this.multiCurrencyService.roundToDecimals(
        totalTaxAmount,
        targetCurrency,
      ),
      totalAmount: this.multiCurrencyService.roundToDecimals(
        totalTotalAmount,
        targetCurrency,
      ),
    };
  }

  /**
   * Get company defaults from organisation and onboarding data
   * Returns seller information to auto-populate invoices
   * Optimized: Uses in-memory cache with TTL to reduce DB lookups
   */
  private async getCompanyDefaults(orgId: string): Promise<{
    currency: string;
    seller: {
      name: string;
      address?: string;
      taxId?: string;
      vatNumber?: string;
      email?: string;
      phone?: string;
      website?: string;
    };
  } | null> {
    // Check cache first
    const cached = this.companyDefaultsCache.get(orgId);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Parallel fetch for organization and onboarding data
    const [org, onboarding] = await Promise.all([
      this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          country: true,
          currency: true,
          vatNumber: true,
          companyRegistrationNumber: true,
          taxRegistrationNumber: true,
        },
      }),
      this.prisma.onboardingProgress.findUnique({
        where: { orgId },
        select: {
          companyInfoData: true,
        },
      }),
    ]);

    if (!org) {
      return null;
    }

    // Extract company info from onboarding data
    const companyInfo = onboarding?.companyInfoData as Record<string, any> | null;

    // Build address from onboarding data if available
    let address: string | undefined;
    if (companyInfo?.address) {
      const addr = companyInfo.address;
      const parts = [
        addr.street,
        addr.streetNumber,
        addr.postalCode,
        addr.city,
        org.country,
      ].filter(Boolean);
      address = parts.join(', ');
    }

    const result = {
      currency: org.currency,
      seller: {
        name: org.name,
        address,
        taxId: companyInfo?.taxId || org.companyRegistrationNumber || undefined,
        vatNumber: org.vatNumber || undefined,
        email: companyInfo?.email || undefined,
        phone: companyInfo?.phone || undefined,
        website: companyInfo?.website || undefined,
      },
    };

    // Cache the result
    this.companyDefaultsCache.set(orgId, {
      data: result,
      expiry: Date.now() + this.CACHE_TTL_MS,
    });

    return result;
  }

  /**
   * Clear the company defaults cache for an organization
   * Call this when organization settings are updated
   */
  clearCompanyDefaultsCache(orgId: string): void {
    this.companyDefaultsCache.delete(orgId);
  }

  /**
   * Calculate invoice totals from items
   * @deprecated Use currencyHelper.calculateInvoiceTotals instead
   */
  private calculateTotals(
    items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
    defaultTaxRate: number,
  ): { subtotal: number; taxAmount: number; totalAmount: number } {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemAmount = item.quantity * item.unitPrice;
      const itemTaxRate = item.taxRate ?? defaultTaxRate;
      const itemTaxAmount = (itemAmount * itemTaxRate) / 100;

      subtotal += itemAmount;
      taxAmount += itemTaxAmount;
    }

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
