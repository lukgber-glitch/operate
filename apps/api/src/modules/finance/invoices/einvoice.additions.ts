// E-INVOICE ADDITIONS FOR INVOICES.SERVICE.TS
// These methods should be added to the InvoicesService class

/**
 * Generate invoice with E-Invoice format support
 *
 * @param id - Invoice ID
 * @param format - E-Invoice format (standard, zugferd, facturx, xrechnung)
 * @param zugferdProfile - ZUGFeRD profile level (for zugferd/facturx)
 * @param xrechnungSyntax - XRechnung syntax (UBL or CII)
 * @returns Buffer and metadata for the generated invoice
 */
async generateInvoiceWithFormat(
  id: string,
  format: EInvoiceFormat = EInvoiceFormat.STANDARD,
  zugferdProfile?: ZugferdProfile,
  xrechnungSyntax?: XRechnungSyntax,
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const invoice = await this.repository.findById(id, {
    items: {
      orderBy: { sortOrder: 'asc' },
    },
  });

  if (!invoice) {
    throw new NotFoundException(`Invoice with ID ${id} not found`);
  }

  this.logger.log(
    `Generating invoice ${invoice.number} with format: ${format}`,
  );

  switch (format) {
    case EInvoiceFormat.ZUGFERD:
    case EInvoiceFormat.FACTURX:
      return this.generateZugferdInvoice(invoice, zugferdProfile);

    case EInvoiceFormat.XRECHNUNG:
      return this.generateXRechnungInvoice(invoice, xrechnungSyntax);

    case EInvoiceFormat.STANDARD:
    default:
      return this.generateStandardPdf(invoice);
  }
}

/**
 * Generate ZUGFeRD/Factur-X invoice (PDF with embedded XML)
 *
 * @private
 */
private async generateZugferdInvoice(
  invoice: any,
  profile: ZugferdProfile = ZugferdProfile.EN16931,
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  try {
    // Map invoice to InvoiceData format expected by ZugferdService
    const invoiceData: InvoiceData = this.mapToInvoiceData(invoice);

    // Generate standard PDF first
    const pdfBuffer = await this.createPdfBuffer(invoice);

    // Embed ZUGFeRD XML into PDF
    const zugferdPdf = await this.zugferdService.generateZugferdInvoice(
      invoiceData,
      profile as any,
      pdfBuffer,
    );

    this.logger.log(
      `Successfully generated ZUGFeRD invoice ${invoice.number} with profile ${profile}`,
    );

    return {
      buffer: zugferdPdf,
      contentType: 'application/pdf',
      filename: `invoice-${invoice.number}-zugferd.pdf`,
    };
  } catch (error) {
    this.logger.error(
      `Failed to generate ZUGFeRD invoice: ${error.message}`,
      error.stack,
    );
    throw new BadRequestException(
      `ZUGFeRD generation failed: ${error.message}`,
    );
  }
}

/**
 * Generate XRechnung invoice (XML only)
 *
 * @private
 */
private async generateXRechnungInvoice(
  invoice: any,
  syntax: XRechnungSyntax = XRechnungSyntax.UBL,
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  try {
    // Map invoice to InvoiceData format
    const invoiceData: InvoiceData = this.mapToInvoiceData(invoice);

    // Generate XRechnung XML
    const xml = await this.xrechnungService.generateXRechnung(
      invoiceData,
      syntax as any as XRechnungSyntaxType,
    );

    this.logger.log(
      `Successfully generated XRechnung invoice ${invoice.number} with syntax ${syntax}`,
    );

    return {
      buffer: Buffer.from(xml, 'utf-8'),
      contentType: 'application/xml',
      filename: `invoice-${invoice.number}-xrechnung.xml`,
    };
  } catch (error) {
    this.logger.error(
      `Failed to generate XRechnung invoice: ${error.message}`,
      error.stack,
    );
    throw new BadRequestException(
      `XRechnung generation failed: ${error.message}`,
    );
  }
}

/**
 * Generate standard PDF (wrapped for consistency)
 *
 * @private
 */
private async generateStandardPdf(
  invoice: any,
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const buffer = await this.createPdfBuffer(invoice);

  return {
    buffer,
    contentType: 'application/pdf',
    filename: `invoice-${invoice.number}.pdf`,
  };
}

/**
 * Map Prisma invoice to InvoiceData format for E-Invoice services
 *
 * @private
 */
private mapToInvoiceData(invoice: any): InvoiceData {
  return {
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    type: invoice.type,
    currency: invoice.currency || 'EUR',

    seller: {
      name: 'Your Company Name', // TODO: Get from organization settings
      address: {
        line1: 'Your Street Address', // TODO: Get from organization settings
        city: 'Your City',
        postalCode: 'Your Postal Code',
        country: 'DE',
      },
      vatId: 'DE123456789', // TODO: Get from organization settings
      email: 'billing@yourcompany.com', // TODO: Get from organization settings
    },

    buyer: {
      name: invoice.customerName,
      address: invoice.customerAddress
        ? {
            line1: invoice.customerAddress,
            city: '', // TODO: Parse address if needed
            postalCode: '',
            country: 'DE',
          }
        : undefined,
      vatId: invoice.customerVatId,
      email: invoice.customerEmail,
    },

    items: invoice.items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
      taxRate: item.taxRate ? Number(item.taxRate) : undefined,
      taxAmount: item.taxAmount ? Number(item.taxAmount) : undefined,
      unit: item.unit || 'C62', // Default to "unit/piece"
      productCode: item.productCode,
    })),

    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    vatRate: invoice.vatRate ? Number(invoice.vatRate) : undefined,
    reverseCharge: invoice.reverseCharge || false,

    paymentTerms: invoice.paymentTerms,
    paymentMethod: invoice.paymentMethod,
    bankReference: invoice.bankReference,

    notes: invoice.notes,
    metadata: invoice.metadata,
  };
}

// IMPORT ADDITIONS FOR TOP OF FILE:
// import {
//   EInvoiceFormat,
//   ZugferdProfile,
//   XRechnungSyntax,
// } from './dto/generate-einvoice.dto';
// import { ZugferdService } from '../../e-invoice/services/zugferd.service';
// import { XRechnungService } from '../../e-invoice/services/xrechnung.service';
// import { InvoiceData } from '../../e-invoice/types/zugferd.types';
// import { XRechnungSyntax as XRechnungSyntaxType } from '../../e-invoice/types/xrechnung.types';

// CONSTRUCTOR UPDATE:
// constructor(
//   private repository: InvoicesRepository,
//   private zugferdService: ZugferdService,
//   private xrechnungService: XRechnungService,
// ) {}
