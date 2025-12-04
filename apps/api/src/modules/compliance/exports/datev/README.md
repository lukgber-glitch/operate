# DATEV Export Service

## Overview

The DATEV Export Service provides DATEV-compliant ASCII CSV export functionality for accounting data. DATEV is the standard accounting software format used in Germany, and this service ensures that exported data can be directly imported into DATEV systems.

## Features

- **DATEV ASCII CSV Format**: Exports data in DATEV-compliant ASCII format version 7.0
- **CP1252 Encoding**: Proper Windows-1252 encoding for German special characters
- **Multiple Export Types**:
  - Buchungsstapel (booking stack) - transaction data
  - Kontenbeschriftung (account labels)
  - Debitoren/Kreditoren (customers/suppliers)
- **SKR Support**: Support for both SKR03 and SKR04 chart of accounts
- **Configurable**: Flexible configuration for consultant/client numbers, fiscal year, etc.

## Usage

### Basic Export

```typescript
import { DatevExportService } from './exports/datev/datev-export.service';

// Create export
const exportDto: CreateDatevExportDto = {
  orgId: 'org-123',
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  companyConfig: {
    consultantNumber: 1234567,
    clientNumber: 12345,
    fiscalYearStart: 20240101,
    skrType: DatevSKRType.SKR03,
    accountLength: 4,
    companyName: 'Musterfirma GmbH',
  },
  options: {
    includeAccountLabels: true,
    includeCustomers: true,
    includeSuppliers: true,
    includeTransactions: true,
    formatVersion: DatevFormatVersion.V7_0,
    origin: 'CoachOS',
    label: 'Q4 2024 Export',
  },
};

const result = await datevExportService.createExport(exportDto);
```

## DATEV Format Specification

### File Structure

Each DATEV CSV file consists of:

1. **Header Line 1**: Metadata (format version, consultant/client numbers, date range, etc.)
2. **Header Line 2**: Column names
3. **Data Lines**: Actual data records

### Encoding

- **Character Encoding**: CP1252 (Windows-1252)
- **Field Delimiter**: Semicolon (;)
- **Text Qualifier**: Double quotes (")
- **Decimal Separator**: Comma (,)
- **Date Format**: DDMM (booking date) or TTMMJJ (document date)

### Header Format

```
"DATEV";7.0;21;"Buchungsstapel";7.0;;"CoachOS";"CoachOS";1234567;12345;20240101;4;20240101;20241231;"Export";;;;"03";;;"CoachOS";;
```

Header fields:
- Format name: "DATEV"
- Format version: "7.0"
- Data category: 21 (Buchungsstapel)
- Format type: "Buchungsstapel"
- Consultant number (Berater-Nr)
- Client number (Mandanten-Nr)
- Fiscal year start (YYYYMMDD)
- Account length (4-8 digits)
- Date range (from/to in YYYYMMDD)
- SKR type (03 or 04)

### Buchungsstapel (Booking Stack)

Required fields for each booking entry:
- **Umsatz**: Amount (without debit/credit indicator)
- **Soll/Haben-Kz**: Debit/Credit indicator (S=Debit, H=Credit)
- **WKZ Umsatz**: Currency code (EUR, USD, etc.)
- **Konto**: Account number
- **Gegenkonto**: Offset account
- **Belegdatum**: Booking date (DDMM)
- **Belegfeld 1**: Document number
- **Buchungstext**: Posting text

Optional fields:
- **BU-Schlüssel**: Tax key
- **Kurs**: Exchange rate
- **Kostenstelle**: Cost center
- **EU-Land u. UStID**: EU country and VAT ID

## Tax Keys (BU-Schlüssel)

Common tax keys for SKR03/SKR04:

| Key | Description | VAT Rate |
|-----|-------------|----------|
| 3 | Standard rate revenue | 19% |
| 2 | Reduced rate revenue | 7% |
| 8 | Tax-free revenue | 0% |
| 9 | Input tax 19% | 19% |
| 7 | Input tax 7% | 7% |

## Account Mapping

### SKR03 (Industrial Chart of Accounts)

Common accounts:
- **1000**: Cash account (Kasse)
- **1200**: Bank account (Bank)
- **1400**: Accounts receivable (Forderungen)
- **1600**: Accounts payable (Verbindlichkeiten)
- **8400**: Revenue account (Erlöse)
- **4400**: Cost of goods (Waren)

### SKR04 (Service Provider Chart of Accounts)

Common accounts:
- **1600**: Cash account (Kasse)
- **1800**: Bank account (Bank)
- **1200**: Accounts receivable (Forderungen)
- **3300**: Accounts payable (Verbindlichkeiten)
- **5000**: Revenue account (Erlöse)
- **6000**: Cost of goods (Waren)

## Export Files

The service generates the following CSV files:

1. **EXTF_Buchungsstapel.csv**: Transaction bookings
2. **EXTF_Kontenbeschriftungen.csv**: Account labels and descriptions
3. **EXTF_Stammdaten.csv**: Customer and supplier master data

All files are packaged into a single ZIP archive for easy download.

## Configuration

Required environment variables:

```env
# Storage directories
STORAGE_DATEV_EXPORT_DIR=/path/to/datev-exports
STORAGE_TEMP_DIR=/tmp

# Optional: Default DATEV settings
DATEV_DEFAULT_CONSULTANT_NUMBER=1234567
DATEV_DEFAULT_CLIENT_NUMBER=12345
DATEV_DEFAULT_SKR=03
```

## API Response

```typescript
{
  "id": "datev_1234567890_abc123",
  "orgId": "org-123",
  "status": "READY",
  "filename": "DATEV_Export_20240101_20241231.zip",
  "createdAt": "2024-12-02T10:00:00Z",
  "completedAt": "2024-12-02T10:01:30Z",
  "downloadUrl": "/api/compliance/exports/datev/datev_1234567890_abc123/download",
  "fileSize": 524288
}
```

## Error Handling

The service handles common errors:

- Invalid date ranges
- Missing organization
- Invalid consultant/client numbers
- Encoding errors
- File system errors

All errors are logged and returned with appropriate HTTP status codes.

## Best Practices

1. **Date Ranges**: Use fiscal year boundaries (e.g., 2024-01-01 to 2024-12-31)
2. **Account Numbers**: Ensure account numbers match your SKR type
3. **Tax Keys**: Use correct tax keys for your jurisdiction
4. **Testing**: Always test exports with DATEV software before production use
5. **Backup**: Keep copies of exported files for audit purposes

## Limitations

- Currently supports SKR03 and SKR04 only
- Transaction categorization requires proper account mapping
- Complex booking scenarios (e.g., split bookings) may need manual review
- Exchange rate handling is simplified

## Future Enhancements

- [ ] Support for additional SKR types (SKR01, SKR02, etc.)
- [ ] Advanced tax key mapping
- [ ] Cost center and cost unit support
- [ ] Digital signature support
- [ ] Validation against DATEV import rules
- [ ] Batch export scheduling
- [ ] Export templates for common scenarios

## References

- [DATEV Format Description](https://www.datev.de)
- [GoBD Compliance Guidelines](https://www.bundesfinanzministerium.de)
- German Tax Code (Abgabenordnung - AO)

## Support

For issues or questions:
1. Check the error logs
2. Verify your DATEV configuration
3. Contact the compliance team
