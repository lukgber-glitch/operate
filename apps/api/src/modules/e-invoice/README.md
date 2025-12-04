# E-Invoice Module - Quick Start

## Overview

This module handles German e-invoicing standards: **ZUGFeRD/Factur-X** and **XRechnung**.

## Installed Packages

```typescript
// Primary e-invoicing library (supports all formats)
import { InvoiceService, FormatFactoryService, Invoice, Mapping } from '@e-invoice-eu/core';

// PDF manipulation (PDF/A-3 compliance)
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// PDF generation
import PDFKit from 'pdfkit';

// XML processing
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { create as createXML } from 'xmlbuilder2';
```

## Supported Formats

### XRechnung (German B2G - Public Sector)
- **XRECHNUNG-UBL**: XRechnung in Universal Business Language format
- **XRECHNUNG-CII**: XRechnung in Cross Industry Invoice format

### Factur-X/ZUGFeRD (B2B/B2C)
- **Factur-X-Minimum**: Minimal required data
- **Factur-X-Basic**: Basic invoice data
- **Factur-X-EN16931**: European standard (most common)
- **Factur-X-Extended**: Full feature set

## Quick Examples

### Generate XRechnung (UBL)
```typescript
import { InvoiceService } from '@e-invoice-eu/core';

const invoiceService = new InvoiceService(console);

const invoice: Invoice = {
  // Your invoice data structure
  invoiceNumber: 'INV-2025-001',
  issueDate: '2025-12-02',
  // ... more fields
};

const xmlInvoice = await invoiceService.generate(invoice, {
  format: 'XRECHNUNG-UBL',
  lang: 'de-DE'
});
```

### Generate Factur-X (PDF with embedded XML)
```typescript
const facturX = await invoiceService.generate(invoice, {
  format: 'Factur-X-EN16931',
  lang: 'de-DE',
  pdf: {
    name: 'invoice.pdf',
    data: pdfBuffer  // Your PDF invoice
  }
});

// Result: PDF/A-3 compliant PDF with embedded factur-x.xml
```

### List Available Formats
```typescript
import { FormatFactoryService } from '@e-invoice-eu/core';

const factory = new FormatFactoryService();
const formats = factory.listFormatServices();

formats.forEach(format => {
  console.log(format.name); // e.g., "XRECHNUNG-UBL"
});
```

## German E-Invoice Standards

### When to use what?

| Use Case | Format | Description |
|----------|--------|-------------|
| **German Public Sector (B2G)** | XRECHNUNG-UBL or XRECHNUNG-CII | Required for invoices to German government entities |
| **German Private Sector (B2B/B2C)** | Factur-X-EN16931 | Recommended for business-to-business |
| **European Standard** | UBL or CII | Generic European e-invoicing |
| **Embedded PDF** | Factur-X-* profiles | PDF with embedded XML (human + machine readable) |

### Key Differences

**XRechnung**:
- ✅ Pure XML (no PDF)
- ✅ Required for German B2G since 2020
- ✅ Based on EN16931
- ✅ Available in UBL and CII syntax

**Factur-X/ZUGFeRD**:
- ✅ PDF/A-3 with embedded XML
- ✅ Human-readable PDF + machine-readable XML
- ✅ Multiple profiles (Minimum to Extended)
- ✅ Popular in German B2B

## Module Structure

```
apps/api/src/modules/e-invoice/
├── services/
│   ├── e-invoice.service.ts       # Main service
│   ├── xrechnung.service.ts       # XRechnung specific
│   ├── facturx.service.ts         # Factur-X specific
│   └── pdf-generator.service.ts   # PDF operations
├── dto/
│   ├── create-invoice.dto.ts      # Invoice creation DTO
│   └── invoice-format.enum.ts     # Supported formats
├── interfaces/
│   └── invoice.interface.ts       # Type definitions
└── README.md                      # This file
```

## Development Notes

- All packages support TypeScript with built-in types
- `@e-invoice-eu/core` is the primary library
- `pdf-lib` handles PDF/A-3 compliance
- Multiple XML libraries for different use cases
- Test formats with small invoices first

## Resources

- [E-Invoice-EU Documentation](https://gflohr.github.io/e-invoice-eu)
- [XRechnung Specification](https://www.xrechnung.de/)
- [Factur-X Standard](https://www.ferd-net.de/)
