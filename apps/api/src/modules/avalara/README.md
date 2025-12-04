# Avalara AvaTax Module - US Sales Tax Integration

This module provides comprehensive US sales tax calculation, management, and reporting via Avalara AvaTax API.

## Features

### 1. Sales Tax Calculation
- **Invoice Tax Calculation**: Calculate tax for invoices with automatic exemption handling
- **Cart Tax Calculation**: Real-time tax preview for shopping carts
- **Multi-state Support**: Handle tax calculations across all US states
- **Exemption Management**: Automatic application of valid exemption certificates

### 2. Nexus Management
- **Nexus Tracking**: Track where your organization has tax obligations
- **Economic Nexus Monitoring**: Monitor sales thresholds for economic nexus
- **Multi-state Registration**: Manage tax registrations across states
- **Threshold Alerts**: Automatic warnings when approaching nexus thresholds

### 3. Exemption Certificate Management
- **Certificate Types**:
  - Resale certificates
  - Nonprofit exemptions
  - Government entity exemptions
  - Manufacturing exemptions
  - Agricultural exemptions
  - Direct pay permits
- **Validation**: Verify certificate validity and expiration
- **Document Storage**: Store scanned certificates with integrity checking
- **Auto-expiration**: Automatic expiration of outdated certificates

### 4. Tax Reporting
- **Filing Reports**: Generate reports by jurisdiction for tax filing
- **Period Reports**: Monthly, quarterly, and annual summaries
- **Avalara Export**: Export data for Avalara automated filing
- **Deadline Tracking**: Monitor upcoming filing deadlines
- **Jurisdiction Breakdown**: Detailed tax breakdown by state, county, and city

### 5. Special Scenarios
- **Marketplace Facilitator**: Handle marketplace facilitator laws
- **Drop Shipping**: Support for drop shipping with resale certificates
- **Multi-state Sales**: Properly calculate tax for cross-state transactions
- **Product Taxability**: Map products to appropriate tax codes

## Services

### USSalesTaxService
Main service for tax calculations and nexus management.

```typescript
// Calculate tax for an invoice
await usSalesTaxService.calculateInvoiceTax({
  invoiceId: 'inv-12345',
  orgId: 'org-67890',
  commit: true, // Commit the transaction
});

// Calculate cart tax (real-time preview)
await usSalesTaxService.calculateCartTax({
  orgId: 'org-67890',
  customerCode: 'CUST-001',
  destinationAddress: {
    line1: '123 Main St',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
  },
  items: [
    {
      itemCode: 'ITEM-001',
      description: 'Software Subscription',
      quantity: 1,
      amount: 99.99,
    },
  ],
});

// Manage nexus
await usSalesTaxService.manageNexus('org-id', 'CA', 'create', {
  effectiveDate: new Date(),
  salesThreshold: 500000,
  transactionThreshold: 200,
});
```

### TaxExemptionService
Manages exemption certificates.

```typescript
// Create exemption certificate
await taxExemptionService.createExemptionCertificate({
  orgId: 'org-67890',
  customerId: 'cust-12345',
  certificateNumber: 'CERT-2024-001',
  exemptionType: 'RESALE',
  effectiveDate: new Date(),
  expirationDate: new Date('2025-12-31'),
  states: ['CA', 'NY', 'TX'],
  documentUrl: 'https://example.com/cert.pdf',
});

// Validate certificate
await taxExemptionService.validateExemptionCertificate(
  'cert-id',
  'user-id',
);

// Check expiring certificates
await taxExemptionService.checkExpiringCertificates('org-id', 30);
```

### TaxReportingService
Generates tax reports for filing.

```typescript
// Generate monthly report
const report = await taxReportingService.generateMonthlyReport(
  'org-id',
  2024,
  1,
);

// Get upcoming filing deadlines
const deadlines = await taxReportingService.getUpcomingFilingDeadlines(
  'org-id',
  30,
);

// Export for Avalara filing
const export = await taxReportingService.exportForAvalaraFiling(
  'org-id',
  2024,
  1,
);
```

## Database Models

### TaxNexus
Tracks where your organization has tax obligations.

```prisma
model TaxNexus {
  id                    String
  orgId                 String
  state                 String
  effectiveDate         DateTime
  endDate               DateTime?
  status                NexusStatus
  salesThreshold        Decimal?
  transactionThreshold  Int?
  currentSales          Decimal
  currentTransactions   Int
  taxRegistrationId     String?
  // ...
}
```

### TaxExemptionCertificate
Stores customer exemption certificates.

```prisma
model TaxExemptionCertificate {
  id                String
  orgId             String
  customerId        String?
  certificateNumber String
  exemptionType     ExemptionType
  status            ExemptionStatus
  effectiveDate     DateTime
  expirationDate    DateTime?
  states            String[]
  documentUrl       String?
  // ...
}
```

### TaxTransaction
Records committed tax transactions for filing.

```prisma
model TaxTransaction {
  id                  String
  orgId               String
  transactionCode     String
  status              TransactionStatus
  invoiceId           String?
  customerCode        String
  totalAmount         Decimal
  totalTax            Decimal
  totalTaxable        Decimal
  totalExempt         Decimal
  originAddress       Json
  destinationAddress  Json
  jurisdictionSummary Json
  // ...
}
```

## Configuration

Add to your `.env`:

```env
# Avalara AvaTax Configuration
AVALARA_ACCOUNT_ID=your-account-id
AVALARA_LICENSE_KEY=your-license-key
AVALARA_ENVIRONMENT=sandbox # or production
AVALARA_COMPANY_CODE=DEFAULT
AVALARA_APP_NAME=OperateCoachOS
AVALARA_APP_VERSION=1.0.0
```

## Integration Examples

### Invoice Tax Calculation Flow

```typescript
// 1. Create invoice
const invoice = await createInvoice({
  customerName: 'Acme Corp',
  customerAddress: '123 Main St, Seattle, WA 98101',
  items: [
    { description: 'Software License', quantity: 1, unitPrice: 1000 },
  ],
});

// 2. Calculate tax
const taxResult = await usSalesTaxService.calculateInvoiceTax({
  invoiceId: invoice.id,
  orgId: 'org-id',
  commit: true,
});

// 3. Update invoice with tax
await updateInvoice(invoice.id, {
  taxAmount: taxResult.totalTax,
  totalAmount: taxResult.totalAmount,
});
```

### Exemption Handling

```typescript
// Check if customer has exemption
const exemption = await taxExemptionService.getActiveExemption(
  'org-id',
  'customer-id',
  'CA', // State
);

if (exemption) {
  // Tax calculation will automatically apply exemption
  console.log(`Using exemption: ${exemption.certificateNumber}`);
}
```

### Filing Report Generation

```typescript
// Generate Q1 2024 report
const q1Report = await taxReportingService.generateQuarterlyReport(
  'org-id',
  2024,
  1,
);

console.log(`Total tax collected: $${q1Report.totalTaxCollected}`);
console.log(`Transactions: ${q1Report.transactionCount}`);

// By jurisdiction
q1Report.byJurisdiction.forEach(juris => {
  console.log(
    `${juris.jurisdiction.state} - ${juris.jurisdiction.jurisName}: $${juris.taxCollected}`,
  );
});
```

## Special Scenarios

### Marketplace Facilitator

```typescript
const isMarketplace = await usSalesTaxService.handleMarketplaceFacilitator(
  'org-id',
  'CA',
  true, // isMarketplaceSale
);

if (isMarketplace) {
  // Marketplace is collecting tax, skip our calculation
}
```

### Drop Shipping

```typescript
const { exempt, exemptionNo } = await usSalesTaxService.handleDropShipping(
  'org-id',
  'RESALE-CERT-123',
  'CA',
);

if (exempt) {
  // Transaction is exempt under resale certificate
}
```

## Testing

```bash
# Run tests
npm test avalara

# Integration tests with Avalara sandbox
npm run test:integration:avalara
```

## Migration

Run the migration to create the new tables:

```bash
npx prisma migrate dev --name add-us-sales-tax-models
```

## API Endpoints

The module exposes the following endpoints through the Avalara controller:

- `POST /avalara/calculate` - Calculate tax
- `POST /avalara/commit` - Commit transaction
- `POST /avalara/void` - Void transaction
- `POST /avalara/address/validate` - Validate address
- `GET /avalara/health` - Health check

## Best Practices

1. **Always validate addresses** before calculating tax
2. **Commit transactions** only when invoice is finalized
3. **Track exemption certificates** and verify before expiration
4. **Monitor nexus thresholds** to avoid compliance issues
5. **Generate reports regularly** for filing preparation
6. **Use cart calculations** for customer quotes
7. **Handle errors gracefully** and log for audit

## Support

For Avalara API documentation: https://developer.avalara.com/
For issues or questions: Contact the BRIDGE team

## License

Proprietary - Operate/CoachOS
