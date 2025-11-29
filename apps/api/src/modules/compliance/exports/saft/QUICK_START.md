# SAF-T Export - Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
npm install xml2js
npm install -D @types/xml2js
```

### 2. Add Database Model
Add the SaftExport model from `prisma-schema.prisma` to your `packages/database/prisma/schema.prisma`

### 3. Run Migration
```bash
cd packages/database
npx prisma migrate dev --name add_saft_export
npx prisma generate
```

### 4. Set Environment Variable
```bash
# .env
SAFT_EXPORT_DIR=./exports/saft
```

## API Usage

### Create Export
```bash
POST /api/compliance/exports/saft
Authorization: Bearer <token>
Content-Type: application/json

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
  "validation": true
}
```

### Get Export Status
```bash
GET /api/compliance/exports/saft/:exportId
Authorization: Bearer <token>
```

### Download Export
```bash
GET /api/compliance/exports/saft/:exportId/download
Authorization: Bearer <token>
```

### Validate Export
```bash
POST /api/compliance/exports/saft/:exportId/validate
Authorization: Bearer <token>
```

### List Exports
```bash
GET /api/compliance/exports/saft?page=1&pageSize=10
Authorization: Bearer <token>
```

### Delete Export
```bash
DELETE /api/compliance/exports/saft/:exportId
Authorization: Bearer <token>
```

## Code Examples

### TypeScript/JavaScript
```typescript
import { SaftService } from './modules/compliance/exports/saft/saft.service';
import { CreateSaftExportDto } from './modules/compliance/exports/saft/dto';
import { SaftVariant, ExportScope } from './modules/compliance/exports/saft/interfaces';

// Create export
const exportDto: CreateSaftExportDto = {
  variant: SaftVariant.INTERNATIONAL,
  scope: ExportScope.FULL,
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  validation: true,
};

const result = await saftService.createExport(
  organizationId,
  userId,
  exportDto,
);

console.log(`Export created: ${result.exportId}`);
console.log(`Status: ${result.status}`);
```

### cURL Examples

#### Create International Export
```bash
curl -X POST http://localhost:3000/api/compliance/exports/saft \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant": "INTERNATIONAL",
    "scope": "FULL",
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }'
```

#### Create Portugal Export
```bash
curl -X POST http://localhost:3000/api/compliance/exports/saft \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant": "PT",
    "scope": "FULL",
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "countrySpecificExtensions": {
      "softwareValidationNumber": "PT123456789"
    }
  }'
```

#### Check Status
```bash
curl http://localhost:3000/api/compliance/exports/saft/SAFT-123 \
  -H "Authorization: Bearer $TOKEN"
```

#### Download Export
```bash
curl http://localhost:3000/api/compliance/exports/saft/SAFT-123/download \
  -H "Authorization: Bearer $TOKEN" \
  -o export.xml
```

## Export Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `INTERNATIONAL` | OECD 2.0 standard | General compliance |
| `PT` | Portugal SAF-T | Portuguese tax authorities |
| `NO` | Norway SAF-T | Norwegian tax authorities |
| `AT` | Austria SAF-T | Austrian tax authorities |
| `PL` | Poland JPK | Polish tax authorities |
| `LU` | Luxembourg SAF-T | Luxembourg tax authorities |

## Export Scopes

| Scope | Description | Includes |
|-------|-------------|----------|
| `FULL` | Complete export | All sections |
| `MASTER_FILES` | Master data only | Accounts, customers, suppliers |
| `TRANSACTIONS` | Transactions only | General ledger entries |
| `SOURCE_DOCUMENTS` | Documents only | Invoices, payments |

## Export Status Flow

```
PENDING → PROCESSING → VALIDATING → COMPLETED
                            ↓
                         FAILED
```

## Common Errors

### Export Not Ready
```json
{
  "statusCode": 400,
  "message": "Export is not ready for download"
}
```
**Solution**: Wait for export status to be `COMPLETED`

### Invalid Date Range
```json
{
  "statusCode": 400,
  "message": "End date must be after start date"
}
```
**Solution**: Ensure `endDate` > `startDate`

### Export Not Found
```json
{
  "statusCode": 404,
  "message": "Export SAFT-123 not found"
}
```
**Solution**: Verify export ID and organization access

## File Locations

- **Exports**: `./exports/saft/` (configurable via `SAFT_EXPORT_DIR`)
- **Format**: `SAFT-{timestamp}-{random}.xml`
- **Checksum**: SHA-256

## Permissions Required

- **Create/Delete**: `ADMIN`, `ACCOUNTANT`
- **View/Download**: `ADMIN`, `ACCOUNTANT`, `VIEWER`

## Testing

### Run Tests
```bash
npm test -- saft.service.spec.ts
```

### Test Coverage
```bash
npm run test:cov -- saft
```

## Troubleshooting

### Export Stuck in PROCESSING
- Check application logs for errors
- Verify database connectivity
- Check organization data completeness

### Validation Errors
- Review `validationErrors` in response
- Check XML structure
- Verify account balances

### File Not Found
- Check `SAFT_EXPORT_DIR` permissions
- Verify export status is `COMPLETED`
- Check disk space

## Support Files

- `README.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `schemas/saft-schema.xsd` - XML schema reference

## Next Steps

1. Integrate with real accounting data
2. Add background job processing
3. Implement file storage (S3/MinIO)
4. Add scheduled exports
5. Enhance country-specific implementations

---

For detailed information, see `README.md`
