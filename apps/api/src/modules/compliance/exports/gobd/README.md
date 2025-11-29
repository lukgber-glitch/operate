# GoBD Export Module

## Overview

This module implements GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form) compliant exports for German tax audits.

## Features

- **GDPdU-Compliant Index XML**: Generates index.xml following GDPdU specification (01-09-2004)
- **Data Export**: Exports accounting data in CSV format
  - Chart of accounts (Kontenplan)
  - Journal entries (Buchungssätze)
  - Invoices (Rechnungen)
  - Customer master data (Kundenstammdaten)
  - Supplier master data (Lieferantenstammdaten)
- **Document Packaging**: Includes source documents (PDFs)
- **Hash Verification**: SHA-256 checksums for all files
- **ZIP Archive**: Complete export packaged in a single file
- **Retention Support**: 30-day retention with auto-cleanup

## Export Structure

```
gobd_export_YYYYMMDD_HHMMSS.zip
├── index.xml              # GDPdU master index
├── gdpdu-01-09-2004.dtd   # Schema definition
├── documents/
│   ├── invoices/          # Invoice PDFs
│   ├── receipts/          # Receipt documents
│   └── contracts/         # Contract documents
├── data/
│   ├── accounts.csv       # Chart of accounts
│   ├── transactions.csv   # Transaction journal
│   ├── invoices.csv       # Invoice data
│   ├── customers.csv      # Customer master data
│   └── suppliers.csv      # Supplier master data
└── checksums.sha256       # Hash verification file
```

## API Endpoints

### Create Export
```http
POST /api/compliance/exports/gobd
Authorization: Bearer <token>

{
  "orgId": "123e4567-e89b-12d3-a456-426614174000",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "documentTypes": ["invoices", "receipts"],
  "includeDocuments": true,
  "includeSignature": false,
  "incremental": false,
  "metadata": {
    "auditor": "Finanzamt München",
    "referenceNumber": "FA-2024-12345",
    "notes": "Betriebsprüfung 2024"
  }
}
```

### Get Export Status
```http
GET /api/compliance/exports/gobd/:exportId
Authorization: Bearer <token>
```

### Download Export
```http
GET /api/compliance/exports/gobd/:exportId/download
Authorization: Bearer <token>
```

### List Exports
```http
GET /api/compliance/exports/gobd?orgId=<orgId>&limit=50
Authorization: Bearer <token>
```

### Delete Export
```http
DELETE /api/compliance/exports/gobd/:exportId
Authorization: Bearer <token>
```

## Database Schema

Add this model to your Prisma schema:

```prisma
model GobdExport {
  id          String    @id
  orgId       String
  filename    String
  status      String
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  expiresAt   DateTime
  fileSize    BigInt?
  metadata    Json?
  error       String?
  deletedAt   DateTime?

  organization Organization @relation(fields: [orgId], references: [id])

  @@index([orgId])
  @@index([status])
  @@index([expiresAt])
  @@map("gobd_exports")
}
```

## Configuration

Add to your `.env` file:

```env
# GoBD Export Configuration
STORAGE_GOBD_EXPORT_DIR=/var/exports/gobd
STORAGE_TEMP_DIR=/tmp
COMPLIANCE_GOBD_RETENTION_DAYS=30
```

## Usage Example

```typescript
import { GobdService } from './modules/compliance/exports/gobd';

// Inject service
constructor(private gobdService: GobdService) {}

// Create export
const exportDto = {
  orgId: 'org-123',
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  documentTypes: [DocumentType.INVOICES],
  includeDocuments: true,
};

const result = await this.gobdService.createExport(exportDto);
console.log(`Export created: ${result.id}`);

// Check status
const status = await this.gobdService.getExportStatus(result.id);
console.log(`Status: ${status.status}`);

// Download when ready
if (status.status === ExportStatus.READY) {
  const file = await this.gobdService.downloadExport(result.id);
}
```

## Implementation Notes

### Data Export Placeholders

The following methods in `GobdBuilderService` contain placeholder implementations that need to be completed based on your actual database schema:

- `exportAccounts()` - Chart of accounts
- `exportTransactions()` - Journal entries
- `exportInvoices()` - Invoice records
- `exportCustomers()` - Customer master data
- `exportSuppliers()` - Supplier master data
- `packageDocuments()` - Document retrieval from storage

### Required Dependencies

Ensure these packages are installed:

```bash
npm install archiver
npm install @types/archiver --save-dev
```

### Cron Job for Cleanup

Set up a cron job to cleanup expired exports:

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleCron() {
  await this.gobdService.cleanupExpiredExports();
}
```

## Compliance Notes

### GoBD Requirements

- **Completeness**: All transactions must be included
- **Accuracy**: Data must match source records
- **Immutability**: Exported data cannot be altered (verified via checksums)
- **Traceability**: Clear audit trail with timestamps
- **Retention**: 10-year retention period (configurable)

### GDPdU Format

The export follows the GDPdU (Grundsätze zum Datenzugriff und zur Prüfbarkeit digitaler Unterlagen) standard:
- Version 1.0 (01-09-2004)
- XML index file with metadata
- CSV data files with proper encoding (UTF-8)
- German decimal format (comma as separator)
- Complete DTD schema included

## Testing

Run the test suite:

```bash
npm test gobd.service.spec.ts
```

## Security Considerations

- Exports contain sensitive financial data
- Access restricted to ADMIN and ACCOUNTANT roles
- Files encrypted at rest
- Automatic cleanup after retention period
- Audit logging of all export operations

## References

- [GoBD Guidelines (German)](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/2019-11-28-GoBD.html)
- [GDPdU Specification](https://www.bzst.de/DE/Unternehmen/Aussenpruefungen/DigitaleSchnittstelleFinV/digitaleschnittstellefinv_node.html)

## Support

For issues or questions, contact the backend team or refer to the main project documentation.
