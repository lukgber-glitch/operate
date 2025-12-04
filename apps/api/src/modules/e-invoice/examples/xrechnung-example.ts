/**
 * XRechnung Usage Examples
 *
 * This file contains practical examples of how to use the XRechnungService
 * for German B2G (Business-to-Government) electronic invoicing.
 */

import { XRechnungService, XRechnungSyntax, InvoiceData } from '../index';

/**
 * Example 1: Basic B2G Invoice Generation
 */
export async function example1_BasicGeneration(
  xrechnungService: XRechnungService,
): Promise<string> {
  const invoiceData: InvoiceData = {
    // Basic invoice details
    number: 'INV-2024-001',
    issueDate: new Date('2024-12-01'),
    dueDate: new Date('2024-12-31'),
    currency: 'EUR',

    // Financial amounts
    subtotal: 1000.0,
    taxAmount: 190.0,
    totalAmount: 1190.0,
    vatRate: 19,

    // Seller (your company)
    seller: {
      name: 'IT Services GmbH',
      vatId: 'DE123456789',
      address: {
        street: 'Technologiepark 5',
        city: 'München',
        postalCode: '80331',
        country: 'DE',
      },
      email: 'rechnungen@it-services.de',
      phone: '+49 89 12345678',
    },

    // Buyer (government entity)
    buyer: {
      name: 'Bundesministerium für Digitales',
      address: {
        street: 'Wilhelmstraße 97',
        city: 'Berlin',
        postalCode: '10117',
        country: 'DE',
      },
      email: 'eingangsrechnungen@bmi.bund.de',
      buyerReference: 'BMI-2024-IT-001', // Mandatory for B2G
    },

    // Invoice line items
    items: [
      {
        description: 'IT Beratungsleistungen',
        quantity: 8,
        unitPrice: 125.0,
        amount: 1000.0,
        taxRate: 19,
        taxAmount: 190.0,
        unit: 'HUR', // Hours
      },
    ],

    // B2G specific - Leitweg-ID (mandatory!)
    leitwegId: '99-BMI01-2024001',

    // Payment information
    bankDetails: {
      accountHolder: 'IT Services GmbH',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank AG',
    },
  };

  // Generate UBL format (recommended for German B2G)
  const xml = await xrechnungService.generateXRechnung(
    invoiceData,
    XRechnungSyntax.UBL,
  );

  return xml;
}

/**
 * Example 2: Multiple Line Items with Different Tax Rates
 */
export async function example2_MultipleItems(
  xrechnungService: XRechnungService,
): Promise<string> {
  const invoiceData: InvoiceData = {
    number: 'INV-2024-002',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    currency: 'EUR',
    subtotal: 2380.0,
    taxAmount: 452.2,
    totalAmount: 2832.2,

    seller: {
      name: 'Consulting & Training GmbH',
      vatId: 'DE987654321',
      address: {
        street: 'Hauptstraße 100',
        city: 'Frankfurt am Main',
        postalCode: '60311',
        country: 'DE',
      },
    },

    buyer: {
      name: 'Stadt Frankfurt - Amt für Digitalisierung',
      address: {
        street: 'Römerberg 23',
        city: 'Frankfurt am Main',
        postalCode: '60311',
        country: 'DE',
      },
      buyerReference: 'STADT-FFM-2024-456',
    },

    items: [
      {
        description: 'Softwarelizenz (12 Monate)',
        quantity: 50,
        unitPrice: 30.0,
        amount: 1500.0,
        taxRate: 19,
        taxAmount: 285.0,
        unit: 'C62', // Piece/Unit
        productCode: 'SW-LIC-001',
      },
      {
        description: 'Schulung (Präsenz)',
        quantity: 2,
        unitPrice: 350.0,
        amount: 700.0,
        taxRate: 19,
        taxAmount: 133.0,
        unit: 'DAY',
      },
      {
        description: 'Fachbücher',
        quantity: 20,
        unitPrice: 9.0,
        amount: 180.0,
        taxRate: 7, // Reduced VAT rate for books
        taxAmount: 12.6,
        unit: 'C62',
      },
    ],

    leitwegId: '06-412000-DIGIT-2024',
    contractReference: 'VERTRAG-2024-IT-TRAINING',

    bankDetails: {
      accountHolder: 'Consulting & Training GmbH',
      iban: 'DE12500105170648489890',
      bic: 'INGDDEFFXXX',
    },
  };

  return await xrechnungService.generateXRechnung(
    invoiceData,
    XRechnungSyntax.UBL,
  );
}

/**
 * Example 3: Validation and Error Handling
 */
export async function example3_ValidationAndErrors(
  xrechnungService: XRechnungService,
  invoiceData: InvoiceData,
): Promise<void> {
  try {
    // Step 1: Check compliance BEFORE generation
    const compliance = xrechnungService.checkCompliance(invoiceData);

    if (!compliance.compliant) {
      console.error('❌ Invoice is not compliant!');
      console.error('Missing fields:', compliance.missingFields);

      compliance.issues
        .filter((i) => i.severity === 'error')
        .forEach((issue) => {
          console.error(`  - [${issue.code}] ${issue.message}`);
        });

      throw new Error('Invoice does not meet XRechnung requirements');
    }

    console.log('✅ Invoice is compliant');

    // Step 2: Generate XML
    const xml = await xrechnungService.generateXRechnung(
      invoiceData,
      XRechnungSyntax.UBL,
    );

    // Step 3: Validate generated XML
    const validation = await xrechnungService.validateXRechnung(xml);

    if (!validation.valid) {
      console.error('❌ Validation failed!');
      validation.errors.forEach((error) => {
        console.error(`  - [${error.code}] ${error.message}`);
      });
      throw new Error('XRechnung validation failed');
    }

    // Show warnings (non-critical)
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Validation warnings:');
      validation.warnings.forEach((warning) => {
        console.warn(`  - [${warning.code}] ${warning.message}`);
      });
    }

    console.log('✅ XML is valid');
  } catch (error) {
    console.error('Error generating XRechnung:', error.message);
    throw error;
  }
}

/**
 * Example 4: Parsing Incoming XRechnung
 */
export async function example4_ParseIncoming(
  xrechnungService: XRechnungService,
  xmlString: string,
): Promise<InvoiceData> {
  try {
    // Parse XML to internal format
    const invoiceData = await xrechnungService.parseXRechnung(xmlString);

    console.log('Parsed invoice:', {
      number: invoiceData.number,
      total: invoiceData.totalAmount,
      seller: invoiceData.seller.name,
      buyer: invoiceData.buyer.name,
      items: invoiceData.items.length,
    });

    return invoiceData;
  } catch (error) {
    console.error('Failed to parse XRechnung:', error.message);
    throw error;
  }
}

/**
 * Example 5: Integration with Prisma Invoice Model
 */
export async function example5_PrismaIntegration(
  xrechnungService: XRechnungService,
  prismaInvoice: any, // PrismaClient.Invoice with items
): Promise<string> {
  // Map Prisma invoice to XRechnung format
  const invoiceData: InvoiceData = {
    number: prismaInvoice.number,
    issueDate: prismaInvoice.issueDate,
    dueDate: prismaInvoice.dueDate,
    currency: prismaInvoice.currency,
    subtotal: parseFloat(prismaInvoice.subtotal.toString()),
    taxAmount: parseFloat(prismaInvoice.taxAmount.toString()),
    totalAmount: parseFloat(prismaInvoice.totalAmount.toString()),
    vatRate: prismaInvoice.vatRate
      ? parseFloat(prismaInvoice.vatRate.toString())
      : 19,

    seller: {
      name: prismaInvoice.organization?.name || 'Company Name',
      vatId: prismaInvoice.organization?.vatId || '',
      address: {
        street: prismaInvoice.organization?.address || '',
        city: prismaInvoice.organization?.city || '',
        postalCode: prismaInvoice.organization?.postalCode || '',
        country: prismaInvoice.organization?.country || 'DE',
      },
      email: prismaInvoice.organization?.email,
      phone: prismaInvoice.organization?.phone,
    },

    buyer: {
      name: prismaInvoice.customerName,
      vatId: prismaInvoice.customerVatId || undefined,
      address: {
        street: prismaInvoice.customerAddress || '',
        city: '', // Parse from address if needed
        postalCode: '',
        country: 'DE',
      },
      email: prismaInvoice.customerEmail || undefined,
      buyerReference:
        prismaInvoice.buyerReference || prismaInvoice.leitwegId,
    },

    items: prismaInvoice.items.map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity.toString()),
      unitPrice: parseFloat(item.unitPrice.toString()),
      amount: parseFloat(item.amount.toString()),
      taxRate: item.taxRate
        ? parseFloat(item.taxRate.toString())
        : undefined,
      taxAmount: item.taxAmount
        ? parseFloat(item.taxAmount.toString())
        : undefined,
      unit: item.unit,
      productCode: item.productCode,
    })),

    leitwegId: prismaInvoice.leitwegId,
    purchaseOrderReference: prismaInvoice.purchaseOrderReference,
    contractReference: prismaInvoice.contractReference,
    paymentTerms: prismaInvoice.paymentTerms,

    bankDetails: prismaInvoice.bankDetails
      ? {
          accountHolder: prismaInvoice.bankDetails.accountHolder,
          iban: prismaInvoice.bankDetails.iban,
          bic: prismaInvoice.bankDetails.bic,
          bankName: prismaInvoice.bankDetails.bankName,
        }
      : undefined,
  };

  // Generate XRechnung
  return await xrechnungService.generateXRechnung(
    invoiceData,
    XRechnungSyntax.UBL,
  );
}

/**
 * Example 6: Using CII Syntax Instead of UBL
 */
export async function example6_CIISyntax(
  xrechnungService: XRechnungService,
  invoiceData: InvoiceData,
): Promise<string> {
  // Generate using CII (Cross Industry Invoice) syntax
  // Use this if specifically required by the recipient
  const xml = await xrechnungService.generateXRechnung(
    invoiceData,
    XRechnungSyntax.CII,
  );

  return xml;
}

/**
 * Example 7: Get Required Fields List
 */
export function example7_RequiredFields(
  xrechnungService: XRechnungService,
): void {
  const requiredFields = xrechnungService.getRequiredFields();

  console.log('XRechnung required fields:');
  requiredFields.forEach((field) => {
    console.log(`  - ${field}`);
  });

  // Output:
  // - number
  // - issueDate
  // - seller.name
  // - seller.vatId
  // - buyer.buyerReference
  // - leitwegId
  // ... etc
}

/**
 * Example 8: Complete Workflow - From Database to XML File
 */
export async function example8_CompleteWorkflow(
  xrechnungService: XRechnungService,
  invoiceId: string,
  prisma: any,
  fs: any,
): Promise<string> {
  // 1. Fetch from database
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      organization: true,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // 2. Map to XRechnung format
  const invoiceData: InvoiceData = mapPrismaToXRechnung(invoice);

  // 3. Check compliance
  const compliance = xrechnungService.checkCompliance(invoiceData);
  if (!compliance.compliant) {
    throw new Error(
      `Non-compliant: ${compliance.missingFields.join(', ')}`,
    );
  }

  // 4. Generate XML
  const xml = await xrechnungService.generateXRechnung(
    invoiceData,
    XRechnungSyntax.UBL,
  );

  // 5. Validate
  const validation = await xrechnungService.validateXRechnung(xml);
  if (!validation.valid) {
    throw new Error(
      `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
    );
  }

  // 6. Save to file
  const filename = `XRechnung_${invoice.number}.xml`;
  await fs.promises.writeFile(filename, xml, 'utf-8');

  console.log(`✅ XRechnung saved to ${filename}`);

  return filename;
}

// Helper function for example 8
function mapPrismaToXRechnung(prismaInvoice: any): InvoiceData {
  return {
    number: prismaInvoice.number,
    issueDate: prismaInvoice.issueDate,
    dueDate: prismaInvoice.dueDate,
    currency: prismaInvoice.currency,
    subtotal: parseFloat(prismaInvoice.subtotal.toString()),
    taxAmount: parseFloat(prismaInvoice.taxAmount.toString()),
    totalAmount: parseFloat(prismaInvoice.totalAmount.toString()),
    vatRate: prismaInvoice.vatRate
      ? parseFloat(prismaInvoice.vatRate.toString())
      : 19,
    seller: {
      name: prismaInvoice.organization.name,
      vatId: prismaInvoice.organization.vatId,
      address: {
        street: prismaInvoice.organization.address,
        city: prismaInvoice.organization.city,
        postalCode: prismaInvoice.organization.postalCode,
        country: prismaInvoice.organization.country,
      },
    },
    buyer: {
      name: prismaInvoice.customerName,
      address: {
        street: prismaInvoice.customerAddress || '',
        city: '',
        postalCode: '',
        country: 'DE',
      },
      buyerReference: prismaInvoice.buyerReference,
    },
    items: prismaInvoice.items.map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity.toString()),
      unitPrice: parseFloat(item.unitPrice.toString()),
      amount: parseFloat(item.amount.toString()),
    })),
    leitwegId: prismaInvoice.leitwegId,
  };
}
