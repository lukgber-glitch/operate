# sevDesk Migration Tool

A comprehensive migration tool for importing data from sevDesk exports (CSV/Excel) into Operate/CoachOS.

## Features

- **Multi-format Support**: CSV and Excel (.xlsx) file parsing
- **Entity Types**: Contacts, Invoices, Expenses, Products
- **Field Mapping**: Automatic mapping from sevDesk schema to Operate schema
- **Validation**: Comprehensive data validation with detailed error reports
- **Dry-run Mode**: Preview migrations without making database changes
- **Batch Processing**: Efficient batch processing with progress tracking
- **Duplicate Detection**: Automatic detection and handling of duplicate records
- **Rollback**: Complete rollback capability for failed migrations
- **Progress Tracking**: Real-time job status and progress monitoring

## API Endpoints

### 1. Upload File
```
POST /organisations/:orgId/migrations/sevdesk/upload
Content-Type: multipart/form-data

Body:
- file: CSV or Excel file
- entityType: contact | invoice | expense | product
- dryRun: true (optional, default: true)
```

### 2. Preview Migration
```
POST /organisations/:orgId/migrations/sevdesk/preview

Body:
{
  "jobId": "uuid"
}
```

### 3. Execute Migration
```
POST /organisations/:orgId/migrations/sevdesk/execute

Body:
{
  "jobId": "uuid"
}
```

### 4. Get Job Status
```
GET /organisations/:orgId/migrations/sevdesk/status/:jobId
```

### 5. Rollback Migration
```
DELETE /organisations/:orgId/migrations/sevdesk/rollback/:jobId
```

## Usage Flow

### Step 1: Export from sevDesk
1. Log in to your sevDesk account
2. Navigate to the entity you want to export (Contacts, Invoices, etc.)
3. Click "Export" and select CSV or Excel format
4. Download the export file

### Step 2: Upload and Preview
```typescript
// Upload file for preview
const formData = new FormData();
formData.append('file', file);
formData.append('entityType', 'contact');
formData.append('dryRun', 'true');

const uploadResponse = await fetch(
  '/organisations/:orgId/migrations/sevdesk/upload',
  {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);

const { id: jobId } = await uploadResponse.json();

// Run preview
const previewResponse = await fetch(
  '/organisations/:orgId/migrations/sevdesk/preview',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jobId })
  }
);

const previewResult = await previewResponse.json();
console.log('Validation:', previewResult.validationReport);
```

### Step 3: Review and Execute
```typescript
// If preview looks good, create new job for execution
const executionFormData = new FormData();
executionFormData.append('file', file);
executionFormData.append('entityType', 'contact');
executionFormData.append('dryRun', 'false'); // Execute for real

const execUploadResponse = await fetch(
  '/organisations/:orgId/migrations/sevdesk/upload',
  {
    method: 'POST',
    body: executionFormData,
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);

const { id: execJobId } = await execUploadResponse.json();

// Execute migration
const execResponse = await fetch(
  '/organisations/:orgId/migrations/sevdesk/execute',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jobId: execJobId })
  }
);

const result = await execResponse.json();
console.log('Migration result:', result.migrationSummary);
```

### Step 4: Monitor Progress
```typescript
// Poll for status updates
const checkStatus = async (jobId) => {
  const response = await fetch(
    `/organisations/:orgId/migrations/sevdesk/status/${jobId}`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    }
  );
  return response.json();
};

// Check every 2 seconds
const interval = setInterval(async () => {
  const status = await checkStatus(execJobId);
  console.log(`Progress: ${status.progress}%`);

  if (status.status === 'completed' || status.status === 'failed') {
    clearInterval(interval);
    console.log('Final status:', status);
  }
}, 2000);
```

### Step 5: Rollback (if needed)
```typescript
// Rollback migration
const rollbackResponse = await fetch(
  `/organisations/:orgId/migrations/sevdesk/rollback/${jobId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);

const rollbackResult = await rollbackResponse.json();
console.log(rollbackResult.message);
```

## Field Mappings

### Contacts
| sevDesk Field | Operate Field |
|--------------|---------------|
| Name | name |
| Kundennummer | customerNumber |
| E-Mail | email |
| Telefon | phone |
| Webseite | website |
| Straße | address.street |
| PLZ | address.zipCode |
| Stadt | address.city |
| Land | address.country |
| Steuernummer | taxNumber |
| USt-IdNr. | vatNumber |

### Invoices
| sevDesk Field | Operate Field |
|--------------|---------------|
| Rechnungsnummer | invoiceNumber |
| Kunde | contact.name |
| Rechnungsdatum | invoiceDate |
| Lieferdatum | deliveryDate |
| Status | status |
| Währung | currency |
| Nettosumme | amountNet |
| MwSt. | amountTax |
| Bruttosumme | amountGross |

### Expenses
| sevDesk Field | Operate Field |
|--------------|---------------|
| Datum | date |
| Lieferant | vendor |
| Beschreibung | description |
| Kategorie | category |
| Betrag | amount |
| Steuersatz | taxRate |
| Währung | currency |

### Products
| sevDesk Field | Operate Field |
|--------------|---------------|
| Artikelname | name |
| Artikelnummer | sku |
| Beschreibung | description |
| Preis | price |
| Einkaufspreis | costPrice |
| Steuersatz | taxRate |
| Einheit | unit |
| Bestand | stockQuantity |

## Validation Rules

### Contacts
- **name**: Required, max 255 characters
- **email**: Must be valid email format
- **vatNumber**: Must match format: 2 letters + alphanumeric

### Invoices
- **invoiceNumber**: Required, max 100 characters
- **invoiceDate**: Required, must be valid date
- **sumGross**: Required, must be >= 0

### Expenses
- **date**: Required, must be valid date
- **description**: Required, max 500 characters
- **amount**: Required, must be >= 0

### Products
- **name**: Required, max 255 characters
- **price**: Must be >= 0
- **stock**: Must be >= 0

## Duplicate Detection

The tool automatically detects duplicates based on:

- **Contacts**: Email, Customer Number, or Name
- **Invoices**: Invoice Number + Invoice Date
- **Expenses**: Receipt Number + Date + Amount
- **Products**: Product Number or Name

When duplicates are detected:
- In preview mode: Warnings are shown
- In execution mode: Existing records are returned instead of creating duplicates

## Error Handling

### Common Errors

**Invalid File Format**
```json
{
  "statusCode": 400,
  "message": "Unsupported file format. Allowed: .csv, .xlsx, .xls"
}
```

**File Too Large**
```json
{
  "statusCode": 413,
  "message": "File size exceeds maximum allowed (50MB)"
}
```

**Validation Errors**
```json
{
  "validationReport": {
    "valid": false,
    "errors": [
      {
        "row": 2,
        "field": "email",
        "value": "invalid-email",
        "error": "Invalid format for email"
      }
    ]
  }
}
```

## Best Practices

1. **Always Preview First**: Use dry-run mode to validate data before execution
2. **Check Validation Report**: Review all errors and warnings before proceeding
3. **Small Test Batch**: Start with a small export to test the process
4. **Backup Data**: Ensure you have backups before large migrations
5. **Monitor Progress**: Use status endpoint to track long-running migrations
6. **Handle Duplicates**: Review duplicate detection results
7. **Keep Source Files**: Retain original sevDesk exports for reference

## Troubleshooting

### Problem: German characters not displayed correctly
**Solution**: Ensure CSV is UTF-8 encoded when exporting from sevDesk

### Problem: Date parsing errors
**Solution**: Use format DD.MM.YYYY or YYYY-MM-DD in CSV

### Problem: Decimal numbers not recognized
**Solution**: Use comma (,) as decimal separator for German format

### Problem: Migration is slow
**Solution**: Split large files into smaller batches of ~1000 records

## Technical Details

### Architecture
```
SevDeskMigrationController
  ├── SevDeskMigrationService (Orchestrator)
  ├── SevDeskParserService (File parsing)
  └── SevDeskMapperService (Data mapping & validation)
```

### Batch Processing
- Default batch size: 100 records
- Progress updates after each batch
- Continues processing even if individual records fail

### File Storage
- Uploaded files stored in: `./uploads/migrations/sevdesk/`
- Files automatically cleaned up after processing
- Retention: Deleted immediately after migration completes

### Performance
- Average speed: ~100-200 records/second
- Memory usage: ~50MB per 1000 records
- Suitable for files up to 50,000 records

## Configuration

Default settings in `sevdesk.constants.ts`:

```typescript
export const SEVDESK_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SEVDESK_BATCH_SIZE = 100;
export const SEVDESK_DEFAULTS = {
  CURRENCY: 'EUR',
  COUNTRY: 'DE',
  TAX_RATE: 19,
  UNITY: 'Stk',
};
```

## Support

For issues or questions:
- Check validation report for specific error details
- Review sevDesk export format documentation
- Contact support with job ID for investigation
