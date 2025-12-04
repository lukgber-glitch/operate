# XRechnung Service Documentation

## Overview

The XRechnung service provides generation, validation, and parsing of XRechnung invoices - the mandatory e-invoice format for German Business-to-Government (B2G) contracts.

## What is XRechnung?

XRechnung is a pure XML invoice format (unlike ZUGFeRD which combines PDF and XML). It is:
- **Mandatory** for B2G invoices in Germany (since November 2020)
- Based on the European standard EN 16931
- Compliant with PEPPOL specifications
- Available in two XML syntaxes: UBL and CII

## Key Features

- Generate XRechnung XML in UBL or CII syntax
- Validate XRechnung XML against schema requirements
- Parse incoming XRechnung XML to internal format
- Compliance checking for B2G requirements
- Support for Leitweg-ID routing

## Usage

### Basic Generation

```typescript
import { XRechnungService, XRechnungSyntax, InvoiceData } from '@modules/e-invoice';

// Inject the service
constructor(private readonly xrechnungService: XRechnungService) {}

// Prepare invoice data
const invoiceData: InvoiceData = {
  number: 'INV-2024-001',
  issueDate: new Date('2024-12-01'),
  dueDate: new Date('2024-12-31'),
  currency: 'EUR',
  subtotal: 1000,
  taxAmount: 190,
  totalAmount: 1190,
  vatRate: 19,

  // Seller information (mandatory)
  seller: {
    name: 'My Company GmbH',
    vatId: 'DE123456789',
    address: {
      street: 'Hauptstraße 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
    },
    email: 'info@mycompany.de',
  },

  // Buyer information (mandatory)
  buyer: {
    name: 'Bundesamt für XYZ',
    address: {
      street: 'Behördenstraße 10',
      city: 'Berlin',
      postalCode: '10117',
      country: 'DE',
    },
    buyerReference: 'REF-2024-12345', // Mandatory for B2G
  },

  // Line items (at least one required)
  items: [{
    description: 'Consulting Services',
    quantity: 10,
    unitPrice: 100,
    amount: 1000,
    taxRate: 19,
    unit: 'HUR', // Hour
  }],

  // B2G specific fields
  leitwegId: '99-12345-123456', // Mandatory routing ID for German B2G

  // Payment information (optional but recommended)
  bankDetails: {
    accountHolder: 'My Company GmbH',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
  },
};

// Generate UBL format (more common)
const ublXml = await xrechnungService.generateXRechnung(
  invoiceData,
  XRechnungSyntax.UBL
);

// Or generate CII format
const ciiXml = await xrechnungService.generateXRechnung(
  invoiceData,
  XRechnungSyntax.CII
);
```

### Validation

```typescript
// Validate XRechnung XML
const result = await xrechnungService.validateXRechnung(xmlString);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
}
```

### Compliance Check

```typescript
// Check if invoice meets XRechnung requirements before generation
const compliance = xrechnungService.checkCompliance(invoiceData);

if (!compliance.compliant) {
  console.error('Missing fields:', compliance.missingFields);
  console.error('Issues:', compliance.issues);
}
```

### Parsing

```typescript
// Parse incoming XRechnung XML
const invoiceData = await xrechnungService.parseXRechnung(xmlString);
```

## XRechnung Requirements

### Mandatory Fields

- Invoice number
- Issue date and due date
- Currency (EUR recommended)
- Seller name, VAT ID, and address
- Buyer name and address
- **Buyer reference** (contract/PO reference) - mandatory for B2G
- **Leitweg-ID** - mandatory routing identifier for German B2G
- At least one line item
- Total amounts (subtotal, tax, total)

### Leitweg-ID Format

The Leitweg-ID is a routing identifier that ensures the invoice reaches the correct government department. Valid formats:

- `XX-XXXXX-XXXXXX` (e.g., `99-12345-123456`)
- `XXXXXXXXXXXX` (12-13 alphanumeric characters)

### Buyer Reference

The buyer reference (Buyer Reference / Leitweg-ID) is mandatory and should contain:
- Purchase order number, or
- Contract reference, or
- Leitweg-ID itself

## XML Syntax Comparison

### UBL (Universal Business Language)
- More widely used internationally
- OASIS standard
- Namespace: `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2`
- Root element: `<Invoice>`

### CII (Cross Industry Invoice)
- UN/CEFACT standard
- Common in European B2B
- Namespace: `urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100`
- Root element: `<rsm:CrossIndustryInvoice>`

**Recommendation:** Use UBL for German B2G unless specifically requested otherwise.

## Error Handling

### Common Errors

```typescript
try {
  const xml = await xrechnungService.generateXRechnung(invoiceData);
} catch (error) {
  if (error.message.includes('does not meet XRechnung requirements')) {
    // Handle compliance errors
    const compliance = xrechnungService.checkCompliance(invoiceData);
    console.log('Missing:', compliance.missingFields);
  }
}
```

### Validation Errors

```typescript
const result = await xrechnungService.validateXRechnung(xml);

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`[${error.code}] ${error.message}`);
    if (error.field) {
      console.error(`  Field: ${error.field}`);
    }
  });
}
```

## Integration Example

```typescript
import { Injectable } from '@nestjs/common';
import { XRechnungService, XRechnungSyntax } from '@modules/e-invoice';
import { PrismaService } from '@modules/database';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly xrechnungService: XRechnungService,
    private readonly prisma: PrismaService,
  ) {}

  async generateXRechnungForInvoice(invoiceId: string): Promise<string> {
    // Fetch invoice from database
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        organization: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Map to XRechnung format
    const invoiceData = this.mapToXRechnungFormat(invoice);

    // Check compliance
    const compliance = this.xrechnungService.checkCompliance(invoiceData);
    if (!compliance.compliant) {
      throw new Error(
        `Invoice not compliant: ${compliance.missingFields.join(', ')}`
      );
    }

    // Generate XML
    const xml = await this.xrechnungService.generateXRechnung(
      invoiceData,
      XRechnungSyntax.UBL,
    );

    // Validate
    const validation = await this.xrechnungService.validateXRechnung(xml);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors[0].message}`);
    }

    return xml;
  }

  private mapToXRechnungFormat(invoice: any): InvoiceData {
    // Transform Prisma model to XRechnung format
    return {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: parseFloat(invoice.subtotal),
      taxAmount: parseFloat(invoice.taxAmount),
      totalAmount: parseFloat(invoice.totalAmount),
      vatRate: parseFloat(invoice.vatRate || '19'),
      seller: {
        name: invoice.organization.name,
        vatId: invoice.organization.vatId,
        address: {
          street: invoice.organization.address,
          city: invoice.organization.city,
          postalCode: invoice.organization.postalCode,
          country: invoice.organization.country,
        },
      },
      buyer: {
        name: invoice.customerName,
        vatId: invoice.customerVatId,
        address: {
          street: invoice.customerAddress || '',
          city: '', // Parse from customerAddress
          postalCode: '',
          country: 'DE',
        },
        buyerReference: invoice.buyerReference || invoice.leitwegId,
      },
      items: invoice.items.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(item.amount),
        taxRate: parseFloat(item.taxRate || '19'),
      })),
      leitwegId: invoice.leitwegId,
    };
  }
}
```

## Testing

Run the test suite:

```bash
# Unit tests
pnpm test e-invoice/xrechnung

# Test coverage
pnpm test:cov e-invoice/xrechnung
```

## References

- [XRechnung Official Documentation](https://xeinkauf.de/xrechnung/)
- [XRechnung Standard](https://xeinkauf.de/xrechnung/versionen-und-bundles/)
- [PEPPOL BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [EN 16931 Standard](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Standard+on+eInvoicing)

## Support

For issues or questions:
- Check compliance with `checkCompliance()` first
- Review validation errors for specific issues
- Ensure Leitweg-ID format is correct
- Verify all mandatory fields are present
