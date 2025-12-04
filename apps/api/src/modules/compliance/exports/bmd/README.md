# BMD Export Module

Austrian BMD accounting software export functionality for Operate/CoachOS.

## Overview

This module provides export capabilities for **BMD** (Buchführungs-, Bilanzierungs- und Datenverwaltungs-Software), a popular Austrian accounting software package. The exports are formatted specifically for BMD import requirements.

## Supported Export Types

### 1. Buchungsjournal (Booking Journal)
- Transaction listings with debit/credit entries
- Date format: DD.MM.YYYY
- Number format: Austrian locale (1.234,56)
- Tax information included
- VAT ID (UID-Nummer) support

### 2. Kontenstamm (Chart of Accounts)
- Account master data
- 4-digit Austrian account numbers (Einheits-Kontenrahmen)
- Account types (Asset, Liability, Equity, Income, Expense)
- Opening balances and carry-forwards

### 3. Kundenstamm (Customer Master Data)
- Customer information
- Billing addresses
- VAT IDs (Austrian UID format: ATU12345678)
- Payment terms
- Tax zones

### 4. Lieferantenstamm (Supplier Master Data)
- Supplier information
- Addresses
- VAT IDs
- Payment terms
- Banking information (IBAN/BIC)

### 5. Steuerkonto-Zuordnung (Tax Account Mapping)
- Tax codes and rates
- Input VAT accounts (Vorsteuer)
- Output VAT accounts (Umsatzsteuer)
- Austrian standard tax rates (20%, 13%, 10%, 0%)

## Austrian-Specific Features

### Date Format
- Format: `DD.MM.YYYY`
- Example: `31.12.2024`

### Number Format
- Decimal separator: Comma (,)
- Thousands separator: Dot (.)
- Example: `1.234,56` for 1234.56

### VAT ID (UID-Nummer)
- Format: `ATU12345678`
- Automatically validates and formats Austrian VAT IDs
- Prefix "AT" with "U" and 8 digits

### Account Numbers
- 4-digit format with leading zeros
- Based on Austrian Einheits-Kontenrahmen (EKR)
- Example: `1400` (Accounts Receivable)

### Currency
- Default: EUR (Euro)
- Austrian standard

### Country Codes
- ISO 3166-1 alpha-2 format
- Example: `AT` (Austria), `DE` (Germany)

## CSV Format

### Delimiter
- Semicolon (`;`) - BMD standard
- Configurable via `options.useSemicolon`

### Encoding
- Default: UTF-8
- Optional: ISO-8859-1 (latin1)
- Configurable via `options.useIsoEncoding`

### Header Row
- Included by default
- Configurable via `options.includeHeader`

### Example CSV Line (Booking Journal)
```csv
Buchungsnummer;Belegdatum;Buchungsdatum;Sollkonto;Habenkonto;Betrag;Währung;Steuercode;Steuersatz;Steuerbetrag;Kostenstellennummer;Belegnummer;Belegtext;UID-Nummer;Gegenkontotyp;Gegenkontonummer
2024-001;31.12.2024;31.12.2024;1400;4000;1.200,00;EUR;V20;20,00;200,00;;RE-2024-001;Rechnung Dezember;ATU12345678;K;K-001
```

## API Endpoints

### Create BMD Export
```http
POST /api/compliance/exports/bmd
```

**Request Body:**
```json
{
  "orgId": "123e4567-e89b-12d3-a456-426614174000",
  "exportTypes": [
    "BOOKING_JOURNAL",
    "CHART_OF_ACCOUNTS",
    "CUSTOMERS",
    "SUPPLIERS",
    "TAX_ACCOUNTS"
  ],
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  },
  "format": "CSV",
  "options": {
    "useSemicolon": true,
    "includeHeader": true,
    "useIsoEncoding": false,
    "postedOnly": true,
    "accountingFramework": "EKR"
  },
  "includeArchived": false
}
```

**Response:**
```json
{
  "id": "bmd_1701234567890_abc123",
  "orgId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "PENDING",
  "filename": "bmd_export_2024_2024-12-02_12345678.zip",
  "createdAt": "2024-12-02T10:00:00.000Z",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z"
}
```

### Get Export Status
```http
GET /api/compliance/exports/bmd/:exportId
```

**Response:**
```json
{
  "id": "bmd_1701234567890_abc123",
  "orgId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "READY",
  "filename": "bmd_export_2024_2024-12-02_12345678.zip",
  "createdAt": "2024-12-02T10:00:00.000Z",
  "completedAt": "2024-12-02T10:05:00.000Z",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "downloadUrl": "/api/compliance/exports/bmd/bmd_1701234567890_abc123/download",
  "fileSize": 1024000
}
```

### Download Export
```http
GET /api/compliance/exports/bmd/:exportId/download
```

Returns a ZIP file containing CSV files organized by export type.

### List Exports
```http
GET /api/compliance/exports/bmd/organization/:orgId?limit=50
```

### Delete Export
```http
DELETE /api/compliance/exports/bmd/:exportId
```

## Export Structure

When downloaded, the ZIP archive contains:

```
bmd_export_2024.zip
├── README.txt                           # Export information
├── buchungsjournal/
│   └── buchungsjournal.csv              # Booking journal
├── stammdaten/
│   ├── konten.csv                       # Chart of accounts
│   ├── kunden.csv                       # Customers
│   ├── lieferanten.csv                  # Suppliers
│   └── steuerkonten.csv                 # Tax accounts
└── metadata/
    └── export_info.json                 # Export metadata
```

## Configuration

### Environment Variables

```env
# BMD export directory
STORAGE_BMD_EXPORT_DIR=/var/exports/bmd

# Temporary directory for export generation
STORAGE_TEMP_DIR=/tmp

# Export retention period (days)
COMPLIANCE_BMD_RETENTION_DAYS=30
```

### Default Values
- Export directory: `/tmp/bmd-exports`
- Temp directory: `/tmp`
- Retention days: `30`

## BMD Import Instructions

To import the exported files into BMD:

1. **Extract the ZIP archive**
   - Extract to a temporary directory

2. **Import Stammdaten (Master Data) first**
   - Import in this order:
     1. `konten.csv` (Chart of accounts)
     2. `kunden.csv` (Customers)
     3. `lieferanten.csv` (Suppliers)
     4. `steuerkonten.csv` (Tax accounts)

3. **Import Buchungsjournal (Transactions)**
   - Import `buchungsjournal.csv`
   - Ensure master data is imported first

4. **BMD Import Settings**
   - Field separator: Semicolon (`;`)
   - Decimal separator: Comma (`,`)
   - Date format: DD.MM.YYYY
   - Encoding: UTF-8 or ISO-8859-1

## Tax Codes (Steuercodes)

Common Austrian VAT codes supported:

| Code | Rate | Description |
|------|------|-------------|
| V20  | 20%  | Standard rate (Normalsteuersatz) |
| V13  | 13%  | Reduced rate (ermäßigter Steuersatz) |
| V10  | 10%  | Old reduced rate (historic) |
| V0   | 0%   | Zero-rated |
| VF   | -    | Tax-free (steuerbefreit) |

## Account Number Mapping

Standard Austrian account numbers (Einheits-Kontenrahmen):

| Account | Description |
|---------|-------------|
| 1400    | Forderungen aus Lieferungen und Leistungen (AR) |
| 2500    | Vorsteuer (Input VAT) |
| 3300    | Verbindlichkeiten aus Lieferungen und Leistungen (AP) |
| 3500    | Umsatzsteuer (Output VAT) |
| 4000-4999 | Erträge (Revenue) |
| 5000-7999 | Aufwendungen (Expenses) |

## Validation Rules

### Organization Requirements
- Must be Austrian organization (`countryCode: 'AT'`)
- Organization must exist in database

### Date Range
- Start date must be before end date
- Both dates required

### Export Types
- At least one export type must be selected
- Valid types: `BOOKING_JOURNAL`, `CHART_OF_ACCOUNTS`, `CUSTOMERS`, `SUPPLIERS`, `TAX_ACCOUNTS`

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "BMD export is only available for Austrian organizations" | Ensure organization has `countryCode: 'AT'` |
| "Start date must be before end date" | Check date range in request |
| "Export not found" | Verify export ID or check if export was deleted |
| "Export is not ready for download" | Wait for export to complete (status: READY) |

## Development

### Running Tests

```bash
npm test -- bmd-export.service.spec.ts
```

### Adding New Export Types

1. Add enum value to `BmdExportType` in `interfaces/bmd-config.interface.ts`
2. Implement export method in `bmd-export.service.ts`
3. Add to `generateExportByType()` switch statement
4. Update CSV format in formatter utilities if needed

## References

- [BMD Software](https://www.bmd.com/)
- [Austrian VAT Regulations](https://www.bmf.gv.at/)
- [Einheits-Kontenrahmen (EKR)](https://www.wko.at/)

## Support

For issues or questions:
- Check logs in `/var/log/operate/compliance.log`
- Review export validation errors
- Contact support with export ID

---

Generated by Operate/CoachOS - Enterprise SaaS for SMEs
