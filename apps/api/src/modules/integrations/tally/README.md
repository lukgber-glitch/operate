# Tally ERP Integration

Integration module for Tally ERP accounting software, enabling bidirectional data synchronization between Tally and Operate platform.

## Overview

Tally is one of the most popular accounting software solutions in India and other markets. This integration allows Operate to:

- Import data from Tally (companies, ledgers, vouchers, stock items)
- Export data to Tally (invoices, bills, payments)
- Maintain mappings between Tally entities and Operate entities
- Support for both Tally Prime and Tally ERP 9

## Architecture

### Components

1. **TallyClient** (`tally.client.ts`) - HTTP/XML client for Tally Gateway Server
2. **TallyService** (`tally.service.ts`) - Business logic and sync orchestration
3. **TallyModule** (`tally.module.ts`) - NestJS module configuration
4. **TallyTypes** (`tally.types.ts`) - TypeScript type definitions

### Communication Protocol

Tally uses XML-based communication via HTTP POST to the Tally Gateway Server:

- **Default Port**: 9000
- **Protocol**: HTTP
- **Format**: XML (TDL - Tally Definition Language)
- **Method**: POST

## Setup

### Prerequisites

1. **Tally ERP/Prime Installation**
   - Tally must be installed and running on a machine
   - Gateway Server must be enabled (Settings > Gateway > Enable)

2. **Network Access**
   - Tally Gateway Server must be accessible from Operate API
   - Default: `http://localhost:9000`
   - Can be configured for remote access

### Configuration

Configure Tally connection in your environment:

```env
TALLY_HOST=localhost
TALLY_PORT=9000
TALLY_TIMEOUT=30000
```

### Module Import

Import the Tally module in your NestJS application:

```typescript
import { TallyModule } from '@modules/integrations/tally';

@Module({
  imports: [
    TallyModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### Test Connection

```typescript
const connectionTest = await tallyService.testConnection(orgId, {
  host: 'localhost',
  port: 9000,
  companyName: 'My Company Ltd',
});

if (connectionTest.success) {
  console.log('Available companies:', connectionTest.availableCompanies);
}
```

### Configure Sync

```typescript
const syncConfig: TallySyncConfig = {
  orgId: 'org_123',
  tallyCompanyName: 'My Company Ltd',
  tallyHost: 'localhost',
  tallyPort: 9000,
  syncDirection: 'import',
  syncEntities: [
    TallySyncEntity.COMPANIES,
    TallySyncEntity.LEDGERS,
    TallySyncEntity.VOUCHERS,
    TallySyncEntity.STOCK_ITEMS,
  ],
  autoSync: true,
  syncInterval: 60, // minutes
};

await tallyService.configureTallySync(orgId, syncConfig);
```

### Import Data from Tally

```typescript
// Start sync
const syncStatus = await tallyService.syncFromTally(orgId, syncConfig);

// Check progress
const status = tallyService.getSyncStatus(orgId);
console.log(`Progress: ${status.progress}%`);
console.log(`Current entity: ${status.currentEntity}`);

// Results
syncStatus.results.forEach(result => {
  console.log(`${result.entity}: ${result.recordsSynced} synced, ${result.recordsFailed} failed`);
});
```

### Export Data to Tally

```typescript
// Export invoices to Tally
const exportResult = await tallyService.exportToTally(
  orgId,
  TallySyncEntity.VOUCHERS,
  ['invoice_1', 'invoice_2', 'invoice_3']
);

console.log(`Exported: ${exportResult.exportedCount}`);
console.log(`Failed: ${exportResult.failedCount}`);
```

### Get Available Companies

```typescript
const companies = await tallyService.getAvailableCompanies();

companies.forEach(company => {
  console.log(`${company.name} (GSTIN: ${company.gstin})`);
});
```

### Manual Sync Trigger

```typescript
try {
  const syncStatus = await tallyService.triggerSync(orgId, syncConfig);
  console.log('Sync completed successfully');
} catch (error) {
  if (error.message.includes('already running')) {
    console.log('Sync is already in progress');
  }
}
```

## Supported Entities

### Companies
- Company information
- Financial year settings
- GST registration details
- Address and contact information

### Ledgers (Accounts)
- Customers (Sundry Debtors)
- Vendors (Sundry Creditors)
- Bank accounts
- Tax accounts (GST, CGST, SGST, IGST)
- Expense and income accounts

### Vouchers (Transactions)
- Sales vouchers → Invoices
- Purchase vouchers → Bills
- Payment vouchers → Payments
- Receipt vouchers → Receipts
- Journal entries
- Debit/Credit notes

### Stock Items (Products)
- Product information
- HSN/SAC codes
- Opening stock and valuation
- GST rates
- Batch tracking configuration

## Mapping System

The integration maintains mappings between Tally entities and Operate entities:

```typescript
interface TallyMapping {
  id: string;
  orgId: string;
  tallyEntity: TallySyncEntity;
  tallyEntityId: string;      // Tally GUID
  tallyEntityName: string;     // Tally entity name
  operateEntity: string;       // Operate entity type
  operateEntityId: string;     // Operate entity ID
  mappedAt: Date;
  metadata?: Record<string, any>;
}
```

### Example Mappings

- Tally Ledger (Sundry Debtors) → Operate Customer
- Tally Ledger (Sundry Creditors) → Operate Vendor
- Tally Sales Voucher → Operate Invoice
- Tally Purchase Voucher → Operate Bill
- Tally Stock Item → Operate Product

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  await tallyService.syncFromTally(orgId, config);
} catch (error) {
  if (error.code === 'TALLY_REQUEST_FAILED') {
    // Handle Tally Gateway connection error
  } else if (error.message.includes('Company not found')) {
    // Handle invalid company name
  }
}
```

## Limitations

### Current Implementation (P2 - Basic)

This is a P2 (optional) implementation focusing on basic sync functionality:

1. **One-way sync priority**: Import from Tally is fully implemented; export to Tally is partially implemented
2. **Manual sync**: Auto-sync interval is configured but not yet automated
3. **Simplified mapping**: Basic entity mapping without complex field transformations
4. **No conflict resolution**: Last-write-wins strategy (can be enhanced later)
5. **Limited error recovery**: Basic retry logic with exponential backoff

### Future Enhancements (P1 - Production)

For production deployment, consider implementing:

1. **Real-time sync**: Webhook support or polling mechanism
2. **Bidirectional sync**: Full export capabilities with conflict resolution
3. **Advanced mapping**: Custom field mapping configuration UI
4. **Audit logging**: Complete audit trail of sync operations
5. **Selective sync**: Filter by date range, entity type, or specific records
6. **Delta sync**: Only sync changed records since last sync
7. **Background jobs**: Queue-based sync with Bull/BullMQ
8. **Multi-company**: Support for multiple Tally companies per organization

## Technical Details

### XML Request Format

Tally uses TDL (Tally Definition Language) for XML requests:

```xml
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Ledger</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCOMPANYNAME>My Company Ltd</SVCOMPANYNAME>
      </STATICVARIABLES>
    </DESC>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>
```

### XML Response Format

```xml
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <STATUS>1</STATUS>
  </HEADER>
  <BODY>
    <DATA>
      <COLLECTION NAME="Ledger">
        <LEDGER NAME="Customer A" GUID="{GUID-001}">
          <PARENT>Sundry Debtors</PARENT>
          <OPENINGBALANCE>5000</OPENINGBALANCE>
          ...
        </LEDGER>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>
```

## Testing

Run the test suite:

```bash
npm test tally.service.spec.ts
```

The tests include:
- Connection testing with mocked responses
- Sync configuration validation
- Entity synchronization (companies, ledgers, vouchers, stock items)
- Error handling and retry logic
- Concurrent sync prevention

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Tally Gateway Server

**Solutions**:
1. Verify Tally is running
2. Check Gateway Server is enabled: Settings → Gateway → Enable
3. Verify port 9000 is not blocked by firewall
4. Try accessing `http://localhost:9000` in browser

### Company Not Found

**Problem**: Company name not found in available companies

**Solutions**:
1. Verify exact company name (case-sensitive)
2. Check if company is loaded in Tally
3. Use `getAvailableCompanies()` to list all companies

### Slow Sync Performance

**Problem**: Sync takes too long for large datasets

**Solutions**:
1. Use date range filters to limit vouchers
2. Implement pagination for large collections
3. Enable delta sync (track last sync timestamp)
4. Consider background job processing

### XML Parsing Errors

**Problem**: Error parsing Tally XML response

**Solutions**:
1. Check Tally version compatibility (Prime vs ERP 9)
2. Verify TDL request format
3. Enable debug logging to inspect raw XML
4. Update xml2js parser configuration

## Support

For Tally-specific issues:
- Tally Developer Documentation: https://developer.tallysolutions.com/
- Tally Support: https://tallysolutions.com/support/

For integration issues:
- Check application logs for detailed error messages
- Enable debug logging: `LOG_LEVEL=debug`
- Review test cases for expected behavior

## License

Part of Operate/CoachOS platform. Proprietary.

## Related Integrations

- **Xero**: Cloud accounting (Australia, UK, US)
- **freee**: Cloud accounting (Japan)
- **Zoho Books**: Cloud accounting (India, Global)
- **ELSTER**: Tax filing (Germany)
- **GST IRP**: GST e-invoicing (India)
