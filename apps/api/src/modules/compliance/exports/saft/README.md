# SAF-T Export Module

OECD Standard Audit File for Tax (SAF-T) export implementation for Operate/CoachOS.

## Overview

This module implements the OECD SAF-T 2.0 standard for exporting accounting data in a standardized XML format required by tax authorities in various countries.

## Features

- **Complete SAF-T 2.0 Compliance**: Implements OECD Standard Audit File for Tax version 2.0
- **Multi-Country Support**: Supports country-specific variants (Portugal, Norway, Austria, Poland, Luxembourg)
- **Full Data Export**: Exports header, master files, general ledger entries, and source documents
- **XML Validation**: Validates against SAF-T XSD schema
- **Async Processing**: Background export generation with status tracking
- **Secure Storage**: Encrypted file storage with checksums
- **Audit Logging**: Complete audit trail for compliance

## Supported SAF-T Variants

| Variant | Country | Status | Notes |
|---------|---------|--------|-------|
| INTERNATIONAL | OECD | ✅ Full | Standard OECD 2.0 format |
| PT | Portugal | ✅ Full | Includes hash and certification |
| NO | Norway | ✅ Full | Includes organization number |
| AT | Austria | ⚠️ Partial | Austrian extensions |
| PL | Poland | ⚠️ Partial | JPK format |
| LU | Luxembourg | ⚠️ Partial | Luxembourg variant |

## SAF-T Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:2.00">
  <Header>
    <!-- Company info, fiscal period, software details -->
  </Header>
  <MasterFiles>
    <!-- Chart of accounts, customers, suppliers, products, tax codes -->
  </MasterFiles>
  <GeneralLedgerEntries>
    <!-- All journal entries -->
  </GeneralLedgerEntries>
  <SourceDocuments>
    <!-- Sales invoices, purchase invoices, payments -->
  </SourceDocuments>
</AuditFile>
```

## API Endpoints

### Create Export
```
POST /api/compliance/exports/saft
```

**Request Body:**
```json
{
  "variant": "INTERNATIONAL",
  "scope": "FULL",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "includeOpeningBalances": true,
  "includeClosingBalances": true,
  "includeTaxDetails": true,
  "includeCustomerSupplierDetails": true,
  "validation": true
}
```

### Get Export Status
```
GET /api/compliance/exports/saft/:exportId
```

### Download Export
```
GET /api/compliance/exports/saft/:exportId/download
```

### Validate Export
```
POST /api/compliance/exports/saft/:exportId/validate
```

### List Exports
```
GET /api/compliance/exports/saft?page=1&pageSize=10
```

### Delete Export
```
DELETE /api/compliance/exports/saft/:exportId
```

## Module Structure

```
saft/
├── interfaces/              # TypeScript interfaces
│   ├── saft-config.interface.ts
│   ├── saft-header.interface.ts
│   ├── saft-master.interface.ts
│   ├── saft-entries.interface.ts
│   └── index.ts
├── dto/                     # Data Transfer Objects
│   ├── create-saft-export.dto.ts
│   └── saft-export-response.dto.ts
├── utils/                   # Utilities
│   ├── saft-xml-builder.util.ts
│   └── saft-validator.util.ts
├── schemas/                 # XSD schemas
│   └── saft-schema.xsd
├── __tests__/              # Unit tests
│   └── saft.service.spec.ts
├── saft.service.ts         # Main service
├── saft-builder.service.ts # XML builder service
├── saft.controller.ts      # HTTP controller
├── saft.module.ts          # NestJS module
└── README.md               # Documentation
```

## Usage Examples

### Create a Standard Export

```typescript
const exportDto: CreateSaftExportDto = {
  variant: SaftVariant.INTERNATIONAL,
  scope: ExportScope.FULL,
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  includeOpeningBalances: true,
  includeClosingBalances: true,
  validation: true,
};

const result = await saftService.createExport(
  organizationId,
  userId,
  exportDto,
);
```

### Create Portugal-Specific Export

```typescript
const exportDto: CreateSaftExportDto = {
  variant: SaftVariant.PORTUGAL,
  scope: ExportScope.FULL,
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  countrySpecificExtensions: {
    softwareValidationNumber: 'PT123456789',
    includeHash: true,
  },
};
```

### Export Only Master Files

```typescript
const exportDto: CreateSaftExportDto = {
  variant: SaftVariant.INTERNATIONAL,
  scope: ExportScope.MASTER_FILES,
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
};
```

## Database Schema

Add to `schema.prisma`:

```prisma
model SaftExport {
  id             String   @id @default(uuid())
  organizationId String
  createdBy      String
  variant        String
  scope          String
  startDate      DateTime
  endDate        DateTime
  status         String   @default("PENDING")
  filePath       String?
  fileSize       Int?
  checksum       String?
  numberOfEntries Int?
  totalDebit      Float?
  totalCredit     Float?
  validationErrors String[]
  createdAt      DateTime  @default(now())
  completedAt    DateTime?
  description    String?

  organization   Organization @relation(fields: [organizationId], references: [id])
  creator        User         @relation(fields: [createdBy], references: [id])

  @@index([organizationId])
  @@map("saft_exports")
}
```

## Environment Variables

```env
SAFT_EXPORT_DIR=./exports/saft
```

## Dependencies

```json
{
  "xml2js": "^0.6.2"
}
```

Install with:
```bash
npm install xml2js
npm install -D @types/xml2js
```

## Validation

The module validates SAF-T exports against:

1. **XML Structure**: Well-formed XML
2. **Schema Compliance**: XSD validation
3. **Business Rules**:
   - Debit/Credit balance
   - Required fields
   - Data type constraints
   - Date range validity
4. **Country-Specific Rules**: Per-country validation

## Country-Specific Requirements

### Portugal (SAF-T PT)
- Invoice hash required
- Software validation number
- Certification requirements

### Norway (SAF-T NO)
- Organization number required
- Norwegian tax format

### Austria (SAF-T AT)
- Austrian-specific account types
- UID number format

### Poland (JPK)
- Polish Standard Audit File
- VAT registration number

## Testing

Run tests:
```bash
npm test -- saft.service.spec.ts
```

## Security Considerations

- ✅ Role-based access control (ADMIN, ACCOUNTANT)
- ✅ Organization-scoped data access
- ✅ File checksum verification
- ✅ Audit logging
- ✅ Secure file storage
- ✅ Export retention policies

## Performance

- Async export generation
- Progress tracking
- Background processing
- Efficient XML streaming for large datasets

## Troubleshooting

### Export Fails to Generate
- Check organization data completeness
- Verify date range validity
- Review validation errors

### Validation Errors
- Check XML structure
- Verify account balances
- Ensure all required fields present

### Download Issues
- Check file existence
- Verify export status is COMPLETED
- Check file permissions

## References

- [OECD SAF-T Documentation](https://www.oecd.org/tax/forum-on-tax-administration/)
- [SAF-T PT Specification](https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Manuais/)
- [SAF-T NO Documentation](https://www.skatteetaten.no/en/business-and-organisation/)
- [Austrian SAF-T Guide](https://www.bmf.gv.at/)

## License

Proprietary - Operate/CoachOS

## Support

For issues or questions, contact the development team.
