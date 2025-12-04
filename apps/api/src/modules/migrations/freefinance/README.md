# FreeFinance Migration Tool

Migration tool for importing data from FreeFinance CSV/Excel exports into Operate/CoachOS.

## Overview

FreeFinance is a popular Austrian accounting software. This module provides a comprehensive migration path for Austrian businesses switching from FreeFinance to Operate.

## Supported Data Types

1. **Kunden (Customers)** - Customer master data with Austrian tax IDs
2. **Lieferanten (Vendors)** - Vendor/supplier master data
3. **Ausgangsrechnungen (Outgoing Invoices)** - Sales invoices
4. **Eingangsrechnungen (Incoming Invoices)** - Purchase invoices/expenses
5. **Artikel (Products/Services)** - Product catalog

## Austrian-Specific Features

### Tax Identifiers
- **UID-Nummer**: Austrian VAT ID (ATU12345678)
- **Steuernummer**: Austrian tax number
- **Finanzamt**: Tax office

### VAT Rates
- 20% - Standard rate (Normalsteuersatz)
- 13% - Reduced rate 1 (Food, agriculture)
- 10% - Reduced rate 2 (Books, culture)
- 0% - Zero rate (Exports, intra-EU)

### Special Tax Scenarios
- **Reverse Charge** (Reverse-Charge Verfahren)
- **Intra-Community Supply** (Innergemeinschaftliche Lieferung)
- **Export Delivery** (Ausfuhrlieferung)

### Number Format
- German number format: 1.234,56
- Automatically converted to: 1234.56

### Date Format
- Austrian format: DD.MM.YYYY
- Multiple formats supported

## API Endpoints

### 1. Upload File
```http
POST /api/migrations/freefinance/upload
Content-Type: multipart/form-data

Parameters:
- file: CSV/Excel file
- type: Migration type (customers, vendors, etc.)

Response:
{
  "fileId": "ff_1234567890_abc123",
  "originalName": "kunden.csv",
  "size": 102400,
  "detectedType": "customers",
  "rowCount": 150,
  "columnCount": 25
}
```

### 2. Preview Migration
```http
POST /api/migrations/freefinance/preview/:fileId
Content-Type: application/json

Body:
{
  "type": "customers",
  "customFieldMapping": {
    "Kundennummer": "customerNumber",
    "Firma": "companyName"
  }
}

Response:
{
  "type": "customers",
  "totalRecords": 150,
  "validRecords": 145,
  "invalidRecords": 5,
  "errors": [...],
  "warnings": [...],
  "sampleData": [...],
  "detectedColumns": [...],
  "fieldMapping": {...},
  "stats": {...}
}
```

### 3. Validate Data
```http
POST /api/migrations/freefinance/validate/:fileId
Content-Type: application/json

Body:
{
  "type": "customers",
  "strictMode": false
}

Response:
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "stats": {
    "totalRows": 150,
    "validRows": 145,
    "invalidRows": 5,
    "duplicates": 2,
    "emptyRows": 0
  },
  "dataQuality": {
    "completeness": 95,
    "accuracy": 98,
    "consistency": 99
  }
}
```

### 4. Execute Migration
```http
POST /api/migrations/freefinance/execute/:fileId
Content-Type: application/json

Body:
{
  "type": "customers",
  "dryRun": false,
  "batchSize": 100,
  "skipDuplicates": true,
  "updateExisting": false,
  "validateOnly": false,
  "strictMode": false,
  "createMissingReferences": false,
  "defaultCountry": "AT",
  "defaultCurrency": "EUR"
}

Response:
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Migration job started..."
}
```

### 5. Check Status
```http
GET /api/migrations/freefinance/status/:jobId

Response:
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 65,
  "currentPhase": "Importing data",
  "totalRecords": 150,
  "processedRecords": 98,
  "successCount": 95,
  "failureCount": 3,
  "warningCount": 12,
  "errors": [...],
  "warnings": [...],
  "startedAt": "2024-12-04T10:30:00Z",
  "estimatedCompletion": "2024-12-04T10:32:00Z",
  "processingRate": 25.5
}
```

### 6. Cancel Migration
```http
POST /api/migrations/freefinance/cancel/:jobId

Response:
{
  "message": "Migration job cancelled successfully"
}
```

## Usage Example

```typescript
// 1. Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'customers');

const upload = await fetch('/api/migrations/freefinance/upload', {
  method: 'POST',
  body: formData,
  headers: { Authorization: `Bearer ${token}` }
});
const { fileId } = await upload.json();

// 2. Preview data
const preview = await fetch(`/api/migrations/freefinance/preview/${fileId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ type: 'customers' })
});
const previewData = await preview.json();

// 3. Validate (optional)
const validation = await fetch(`/api/migrations/freefinance/validate/${fileId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ type: 'customers' })
});
const validationResult = await validation.json();

// 4. Execute migration
const execute = await fetch(`/api/migrations/freefinance/execute/${fileId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'customers',
    dryRun: false,
    skipDuplicates: true
  })
});
const { jobId } = await execute.json();

// 5. Poll for status
const pollStatus = async () => {
  const status = await fetch(`/api/migrations/freefinance/status/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statusData = await status.json();

  if (statusData.status === 'completed') {
    console.log('Migration completed!', statusData);
  } else if (statusData.status === 'failed') {
    console.error('Migration failed:', statusData.errors);
  } else {
    setTimeout(pollStatus, 2000); // Poll every 2 seconds
  }
};
pollStatus();
```

## Field Mappings

### Customer Fields
| FreeFinance Field | Operate Field | Required |
|-------------------|---------------|----------|
| Kundennummer | customerNumber | Yes |
| Firma | companyName | * |
| Vorname | firstName | * |
| Nachname | lastName | * |
| UID-Nummer | uidNummer | No |
| Steuernummer | steuernummer | No |
| IBAN | iban | No |
| PLZ | zip | No |
| Ort | city | No |
| Land | country | Yes |

*Either company name OR first/last name required

### Vendor Fields
Similar to customer fields with vendor-specific identifiers.

### Invoice Fields
| FreeFinance Field | Operate Field | Required |
|-------------------|---------------|----------|
| Rechnungsnummer | invoiceNumber | Yes |
| Kundennummer | customerNumber | Yes |
| Rechnungsdatum | invoiceDate | Yes |
| Fälligkeitsdatum | dueDate | Yes |
| Nettobetrag | netAmount | Yes |
| MwSt | vatAmount | Yes |
| Bruttobetrag | grossAmount | Yes |

### Product Fields
| FreeFinance Field | Operate Field | Required |
|-------------------|---------------|----------|
| Artikelnummer | productNumber | Yes |
| Artikelname | name | Yes |
| Verkaufspreis | unitPrice | Yes |
| MwSt-Satz | vatRate | Yes |
| Einheit | unit | No |

## Validation Rules

### Austrian UID Number
- Format: ATU12345678
- Pattern: `^ATU\d{8}$`

### Austrian IBAN
- Format: AT + 18 digits
- Pattern: `^AT\d{18}$`

### Tax Number
- Pattern: `^\d{2}[-\s]?\d{3}[-\s\/]?\d{4}$`

### VAT Rates
- Valid: 0, 10, 13, 20
- Invalid rates will default to 20% with warning

## Error Handling

### Error Severity Levels
- **error**: Prevents import of specific record
- **critical**: Stops entire migration

### Common Errors
1. Missing required fields
2. Invalid format (email, IBAN, UID)
3. Invalid VAT rate
4. Duplicate records
5. Invalid amounts (negative or zero)

### Warnings
1. Non-standard formats
2. Missing optional fields
3. Data quality issues
4. Potential duplicates

## Configuration Options

### Migration Config
```typescript
{
  dryRun: boolean;              // Preview without importing
  batchSize: number;            // Records per batch (1-1000)
  skipDuplicates: boolean;      // Skip duplicate records
  updateExisting: boolean;      // Update existing records
  validateOnly: boolean;        // Only validate, don't import
  strictMode: boolean;          // Fail on warnings
  createMissingReferences: boolean; // Auto-create customers/vendors
  defaultCountry: string;       // Default country code (AT)
  defaultCurrency: string;      // Default currency (EUR)
  dateFormat: string;           // Override date format
  encoding: string;             // File encoding (utf8)
  delimiter: string;            // CSV delimiter (;)
  customFieldMapping: object;   // Custom field mappings
}
```

## File Format Requirements

### CSV Files
- Encoding: UTF-8 (with or without BOM)
- Delimiter: ; (semicolon) - German/Austrian standard
- Quote: " (double quote)
- Headers: Required in first row
- German number format: 1.234,56

### Excel Files
- Formats: .xlsx, .xls, .ods
- First sheet will be imported
- Headers in first row

## Performance

- Batch processing for large files
- Progress tracking in real-time
- Async execution for non-blocking operations
- Memory-efficient streaming for large files

### Batch Sizes
- Customers: 100 records/batch
- Vendors: 100 records/batch
- Invoices: 50 records/batch (more complex)
- Products: 200 records/batch

## Testing

### Test with Sample Data
1. Export sample data from FreeFinance
2. Upload to `/upload` endpoint
3. Review preview and validation
4. Run with `dryRun: true`
5. Check results before actual import

### Rollback
If migration fails or needs to be reversed:
1. Rollback available if indicated in results
2. Use created IDs to identify imported records
3. Manual cleanup if necessary

## Support

For issues or questions:
1. Check validation errors and warnings
2. Review field mappings
3. Verify file format
4. Contact support with job ID

## Future Enhancements

- [ ] Automatic field mapping detection
- [ ] AI-powered data cleaning
- [ ] Duplicate detection and merging
- [ ] Incremental imports
- [ ] Webhook notifications
- [ ] Export migration reports
- [ ] Multi-file batch uploads
- [ ] Direct FreeFinance API integration
