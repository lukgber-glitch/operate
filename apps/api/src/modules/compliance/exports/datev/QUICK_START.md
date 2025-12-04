# DATEV Export - Quick Start Guide

## 5-Minute Setup

### 1. Import the Service

```typescript
import { DatevExportService } from '@/modules/compliance/exports/datev';
```

### 2. Create an Export

```typescript
const exportDto = {
  orgId: 'your-org-id',
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  companyConfig: {
    consultantNumber: 1234567,  // Your DATEV consultant number
    clientNumber: 12345,         // Your DATEV client number
    fiscalYearStart: 20240101,   // YYYYMMDD format
    skrType: 'SKR03',            // or 'SKR04'
  },
};

const result = await datevExportService.createExport(exportDto);
// Returns: { id, orgId, status: 'PENDING', filename, ... }
```

### 3. Check Status

```typescript
const status = await datevExportService.getExportStatus(result.id);
// Returns: { status: 'READY', downloadUrl, ... }
```

### 4. Download Export

```typescript
const file = await datevExportService.downloadExport(result.id);
// Returns: StreamableFile (ZIP archive)
```

## What You Get

The export creates a ZIP file containing:

1. **EXTF_Buchungsstapel.csv** - Your transaction bookings
2. **EXTF_Kontenbeschriftungen.csv** - Account labels
3. **EXTF_Stammdaten.csv** - Customer/supplier data

## Import into DATEV

1. Open DATEV software
2. Go to **Import** → **ASCII Format**
3. Select the CSV files
4. Follow the import wizard
5. Verify the imported data

## Common Issues

### "Invalid consultant number"
- Must be 1-7 digits
- Get from your tax consultant

### "Invalid client number"
- Must be 1-5 digits
- Get from your tax consultant

### "Wrong SKR type"
- SKR03: Industrial companies
- SKR04: Service providers
- Check with your tax consultant

### "Import fails in DATEV"
- Verify date range is within fiscal year
- Check account numbers match your SKR
- Ensure transaction data is complete

## Configuration Options

```typescript
// Full options
const exportDto = {
  orgId: 'your-org-id',
  dateRange: { startDate, endDate },
  companyConfig: {
    consultantNumber: 1234567,
    clientNumber: 12345,
    fiscalYearStart: 20240101,
    skrType: 'SKR03',
    accountLength: 4,              // Optional: 4-8 digits
    companyName: 'My Company',     // Optional
  },
  options: {
    includeAccountLabels: true,    // Include account descriptions
    includeCustomers: true,        // Include customer master data
    includeSuppliers: true,        // Include supplier master data
    includeTransactions: true,     // Include transactions
    formatVersion: '7.0',          // DATEV format version
    origin: 'CoachOS',             // Software name
    label: 'Q4 2024 Export',       // Export label
  },
};
```

## API Endpoints (When Controller is Added)

```bash
# Create export
POST /api/compliance/exports/datev
{
  "orgId": "...",
  "dateRange": { ... },
  "companyConfig": { ... }
}

# Get status
GET /api/compliance/exports/datev/:id

# Download
GET /api/compliance/exports/datev/:id/download
```

## Environment Setup

Add to your `.env`:

```env
STORAGE_DATEV_EXPORT_DIR=/var/app/datev-exports
STORAGE_TEMP_DIR=/tmp/datev-temp
```

## Testing

```typescript
// Test export
const testExport = await datevExportService.createExport({
  orgId: 'test-org',
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  companyConfig: {
    consultantNumber: 9999999,
    clientNumber: 99999,
    fiscalYearStart: 20240101,
    skrType: 'SKR03',
  },
});

// Wait a few seconds for processing
await new Promise(resolve => setTimeout(resolve, 5000));

// Check result
const status = await datevExportService.getExportStatus(testExport.id);
console.log(status); // Should be 'READY'
```

## Need Help?

1. Check the [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
3. Contact your tax consultant for DATEV-specific questions

## Next Steps

- [ ] Configure your environment variables
- [ ] Get consultant and client numbers from your tax consultant
- [ ] Test with a small date range first
- [ ] Import test export into DATEV
- [ ] Verify all data is correct
- [ ] Set up regular exports

## Quick Reference

| SKR Type | Description | Common Accounts |
|----------|-------------|-----------------|
| SKR03 | Industrial | 1000 (Cash), 1200 (Bank), 8400 (Revenue) |
| SKR04 | Service | 1600 (Cash), 1800 (Bank), 5000 (Revenue) |

| Tax Key | VAT Rate | Usage |
|---------|----------|-------|
| 3 | 19% | Standard rate revenue |
| 2 | 7% | Reduced rate revenue |
| 8 | 0% | Tax-free |
| 9 | 19% | Input tax |
| 7 | 7% | Input tax |

---

**Ready to export?** Follow the 4 steps above to create your first DATEV export!
