# Lexoffice Migration Module

This module provides tools to import data from lexoffice (competitor) into Operate/CoachOS.

## Features

- **CSV and Excel Support**: Parse both CSV (`.csv`) and Excel (`.xlsx`, `.xls`) files
- **German Format Handling**: Properly handles German date formats (DD.MM.YYYY) and number formats (comma decimals)
- **Multiple Data Types**: Support for Contacts, Invoices, Vouchers, and Products
- **Validation**: Comprehensive validation with detailed error reports
- **Dry-Run Mode**: Preview imports without making database changes
- **Progress Tracking**: Real-time progress tracking for long-running imports
- **Duplicate Detection**: Automatically detects and skips duplicate records

## Supported Data Types

### 1. Contacts (Kontakte)
- Customer and vendor information
- Company and personal details
- Contact information (email, phone)
- Address data
- Tax identifiers (VAT ID, tax number)
- Banking information (IBAN, BIC)

### 2. Invoices (Rechnungen)
- Invoice header and line items
- Customer information
- Dates (invoice, due, delivery, paid)
- Amounts and currency
- Payment terms and methods
- Status tracking

### 3. Vouchers (Belege)
- Expenses and receipts
- Vendor information
- Amount and tax details
- Categories
- Payment methods
- Attachment references

### 4. Products (Produkte)
- Product information
- Pricing and tax rates
- Units and categories
- Stock quantities
- Active/inactive status

## API Endpoints

### POST /migrations/lexoffice/upload
Upload and validate a file without importing.

**Request:**
```bash
curl -X POST http://localhost:3000/migrations/lexoffice/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@contacts.csv"
```

**Response:**
```json
{
  "success": true,
  "message": "File validated successfully",
  "filename": "contacts.csv",
  "size": 12345
}
```

### POST /migrations/lexoffice/preview
Preview migration data without importing.

**Request:**
```bash
curl -X POST http://localhost:3000/migrations/lexoffice/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@invoices.xlsx" \
  -F "type=invoices"
```

**Response:**
```json
{
  "type": "invoices",
  "totalRecords": 150,
  "validRecords": 148,
  "errors": [
    {
      "row": 5,
      "field": "invoiceDate",
      "message": "Invalid date format"
    }
  ],
  "warnings": [],
  "sampleData": [...],
  "fieldMapping": {...}
}
```

### POST /migrations/lexoffice/execute
Execute the migration.

**Request:**
```bash
curl -X POST http://localhost:3000/migrations/lexoffice/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@contacts.csv" \
  -F "type=contacts" \
  -F "dryRun=false"
```

**Response:**
```json
{
  "jobId": "lexoffice-1234567890-abc123",
  "type": "contacts",
  "status": "completed",
  "totalRecords": 100,
  "imported": 95,
  "skipped": 3,
  "failed": 2,
  "errors": [...],
  "warnings": [...],
  "duration": 5432,
  "createdIds": ["uuid1", "uuid2", ...]
}
```

### GET /migrations/lexoffice/status/:jobId
Check migration progress.

**Request:**
```bash
curl -X GET http://localhost:3000/migrations/lexoffice/status/lexoffice-1234567890-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "jobId": "lexoffice-1234567890-abc123",
  "status": "processing",
  "progress": 45,
  "totalRecords": 100,
  "processedRecords": 45,
  "successCount": 43,
  "failureCount": 2,
  "errors": [...],
  "startedAt": "2025-12-04T10:00:00Z"
}
```

## CSV Format Examples

### Contacts CSV (German)
```csv
Kontaktnummer;Firma;E-Mail;Telefon;Straße;PLZ;Ort;Land;USt-IdNr
K001;Musterfirma GmbH;info@musterfirma.de;+49 30 12345678;Musterstr. 1;10115;Berlin;DE;DE123456789
```

### Invoices CSV (German)
```csv
Rechnungsnummer;Kunde;Rechnungsdatum;Fälligkeitsdatum;Nettobetrag;MwSt;Bruttobetrag;Status
RE-2024-001;Musterfirma GmbH;01.12.2024;31.12.2024;1000,00;190,00;1190,00;Offen
```

### Vouchers CSV (German)
```csv
Belegnummer;Datum;Lieferant;Beschreibung;Betrag;MwSt;Kategorie
B-2024-001;15.11.2024;Office Supplies Ltd;Büromaterial;150,00;28,50;Büro
```

### Products CSV (German)
```csv
Artikelnummer;Artikelname;Beschreibung;Verkaufspreis;MwSt-Satz;Einheit
A001;Premium Beratung;Stundensatz für Premium Beratung;150,00;19;Stunde
```

## Field Mappings

The module automatically maps German column headers to internal fields. See `lexoffice.constants.ts` for complete field mappings.

### Common German Headers
- **Kontaktnummer** → contactNumber
- **Firma** → companyName
- **E-Mail** → email
- **Rechnungsnummer** → invoiceNumber
- **Datum** → date
- **Betrag** → amount
- **MwSt** → taxAmount
- **USt-IdNr** → vatId

## Date and Number Formats

### Dates
Supported formats:
- DD.MM.YYYY (German standard)
- DD/MM/YYYY
- YYYY-MM-DD (ISO)
- DD.MM.YY
- D.M.YYYY

### Numbers
- Comma as decimal separator: `1.234,56`
- Dot as thousand separator: `1.234.567,89`
- Automatically converts to standard format

## Error Handling

The module provides detailed error reporting:

```json
{
  "row": 15,
  "field": "email",
  "message": "Invalid email format",
  "value": "not-an-email"
}
```

## Validation Rules

### Contacts
- Required: At least one name field (companyName, firstName, or lastName)
- Email: Valid format check
- VAT ID: Format validation (2-letter country code + digits)
- IBAN: Format validation

### Invoices
- Required: invoiceNumber, customerName, invoiceDate, totalAmount
- Invoice number: Alphanumeric with hyphens/underscores
- Amounts: Positive numbers with proper decimal format

### Vouchers
- Required: date, amount, description
- Amount: Positive number

### Products
- Required: name, unitPrice
- Unit price: Non-negative number

## Duplicate Handling

The module automatically detects and skips duplicates based on:
- **Contacts**: Email address
- **Invoices**: Invoice number
- **Vouchers**: Voucher number
- **Products**: Product number

## Usage in Code

```typescript
import { LexofficeMigrationService } from './modules/migrations/lexoffice';

// Preview migration
const preview = await migrationService.previewMigration(
  file,
  LexofficeMigrationType.INVOICES,
);

// Execute migration
const result = await migrationService.executeMigration(
  orgId,
  file,
  LexofficeMigrationType.CONTACTS,
  false, // dryRun
);

// Check status
const status = migrationService.getJobStatus(jobId);
```

## Architecture

```
lexoffice/
├── lexoffice-migration.service.ts    # Main orchestrator
├── lexoffice-parser.service.ts       # File parsing (CSV/Excel)
├── lexoffice-mapper.service.ts       # Data mapping to Prisma
├── lexoffice.types.ts                # TypeScript interfaces
├── lexoffice.constants.ts            # Field mappings & config
├── lexoffice-migration.controller.ts # REST API endpoints
├── lexoffice-migration.module.ts     # NestJS module
└── dto/                              # Data transfer objects
```

## Dependencies

- **xlsx**: Excel file parsing
- **papaparse**: CSV parsing with German format support
- **dayjs**: Date parsing and formatting
- **class-validator**: DTO validation
- **@nestjs/platform-express**: File upload support

## Testing

```bash
# Run tests
npm run test modules/migrations/lexoffice

# Test with sample files
curl -X POST http://localhost:3000/migrations/lexoffice/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-data/sample-contacts.csv" \
  -F "type=contacts"
```

## Future Enhancements

- [ ] Support for recurring invoices
- [ ] Multi-currency conversion rules
- [ ] Custom field mapping configuration
- [ ] Background job processing for large files
- [ ] Export functionality (reverse migration)
- [ ] Data transformation rules engine
- [ ] Webhook notifications on completion

## Support

For issues or questions about lexoffice migration, contact the BRIDGE team or refer to the main project documentation.
