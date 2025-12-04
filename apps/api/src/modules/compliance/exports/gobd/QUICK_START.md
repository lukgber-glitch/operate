# GoBD Export - Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
npm install archiver
npm install @types/archiver --save-dev
```

### 2. Add Prisma Schema
Add to `packages/database/prisma/schema.prisma`:

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

Add to `Organization` model:
```prisma
model Organization {
  // ... existing fields
  gobdExports GobdExport[]
}
```

### 3. Run Migration
```bash
cd packages/database
npx prisma migrate dev --name add_gobd_exports
```

### 4. Configure Environment
Add to `.env`:
```env
STORAGE_GOBD_EXPORT_DIR=/var/exports/gobd
STORAGE_TEMP_DIR=/tmp
COMPLIANCE_GOBD_RETENTION_DAYS=30
```

### 5. Import Module
In `app.module.ts` or `compliance.module.ts`:
```typescript
import { GobdModule } from './compliance/exports/gobd';

@Module({
  imports: [
    // ... other imports
    GobdModule,
  ],
})
export class AppModule {}
```

## Usage

### Create Export
```typescript
POST /api/compliance/exports/gobd
Authorization: Bearer <token>

{
  "orgId": "org-123",
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  },
  "documentTypes": ["invoices", "receipts"],
  "includeDocuments": true
}
```

### Check Status
```typescript
GET /api/compliance/exports/gobd/:exportId
Authorization: Bearer <token>
```

### Download Export
```typescript
GET /api/compliance/exports/gobd/:exportId/download
Authorization: Bearer <token>
```

### List Exports
```typescript
GET /api/compliance/exports/gobd?orgId=org-123&limit=50
Authorization: Bearer <token>
```

### Delete Export
```typescript
DELETE /api/compliance/exports/gobd/:exportId
Authorization: Bearer <token>
```

## Implementation Checklist

- [x] Install dependencies
- [x] Add Prisma schema
- [x] Run migration
- [x] Configure environment
- [x] Import module
- [ ] Implement data extraction methods (see below)
- [ ] Set up cron job for cleanup
- [ ] Test exports

## Data Extraction TODO

Complete these methods in `gobd-builder.service.ts`:

```typescript
// 1. Export chart of accounts
private async exportAccounts(orgId: string): Promise<AccountData[]> {
  // TODO: Query your accounts table
  // Return array of AccountData
}

// 2. Export journal entries
private async exportTransactions(
  orgId: string,
  dateRange: DateRange,
): Promise<TransactionData[]> {
  // TODO: Query your transactions table
  // Filter by dateRange
  // Return array of TransactionData
}

// 3. Export invoices
private async exportInvoices(
  orgId: string,
  dateRange: DateRange,
): Promise<InvoiceData[]> {
  // TODO: Query your invoices table
  // Filter by dateRange
  // Return array of InvoiceData
}

// 4. Export customers
private async exportCustomers(orgId: string): Promise<CustomerData[]> {
  // TODO: Query your customers table
  // Return array of CustomerData
}

// 5. Export suppliers
private async exportSuppliers(orgId: string): Promise<SupplierData[]> {
  // TODO: Query your suppliers table
  // Return array of SupplierData
}

// 6. Package documents
async packageDocuments(
  orgId: string,
  dateRange: DateRange,
  baseDir: string,
): Promise<DocumentPackage> {
  // TODO: Retrieve documents from storage
  // Copy to baseDir/documents/{category}/
  // Return DocumentPackage metadata
}
```

## Cron Job Setup

Add to a service with `@nestjs/schedule`:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GobdService } from './compliance/exports/gobd';

@Injectable()
export class TasksService {
  constructor(private gobdService: GobdService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredGobdExports() {
    await this.gobdService.cleanupExpiredExports();
  }
}
```

## Testing

```bash
# Run unit tests
npm test gobd.service.spec.ts

# Test export creation
curl -X POST http://localhost:3000/api/compliance/exports/gobd \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-123",
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "documentTypes": ["invoices"]
  }'
```

## File Structure

```
gobd/
├── __tests__/
│   └── gobd.service.spec.ts
├── dto/
│   ├── create-gobd-export.dto.ts
│   └── gobd-export-response.dto.ts
├── interfaces/
│   ├── gobd-config.interface.ts
│   ├── gobd-document.interface.ts
│   └── gobd-index.interface.ts
├── utils/
│   ├── gobd-hash.util.ts
│   ├── gobd-packager.util.ts
│   └── gobd-xml-builder.util.ts
├── gobd.controller.ts
├── gobd.module.ts
├── gobd.service.ts
├── gobd-builder.service.ts
└── index.ts
```

## Export Structure

Generated exports follow this structure:

```
gobd_export_20241129_120000.zip
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
└── checksums.sha256       # Hash verification
```

## Security

- Requires ADMIN or ACCOUNTANT role
- JWT authentication required
- Files encrypted at rest
- Auto-cleanup after retention period
- Audit logging enabled

## Support

For detailed documentation, see:
- `README.md` - Complete documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `PRISMA_SCHEMA.md` - Database schema reference

## Common Issues

### Issue: Export fails with "Organization not found"
**Solution**: Ensure the orgId exists and user has access

### Issue: Download returns 404
**Solution**: Wait for export status to be "ready" or "completed"

### Issue: Data exports are empty
**Solution**: Implement the placeholder methods in `gobd-builder.service.ts`

### Issue: Checksums don't match
**Solution**: Ensure file system is not modifying files during export

---

**Status**: ✅ Ready for integration
**Next**: Implement data extraction methods and test with real data
