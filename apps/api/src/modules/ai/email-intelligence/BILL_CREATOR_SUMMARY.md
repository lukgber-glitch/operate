# BillCreatorService - Quick Reference

## Purpose
Automatically creates Bill records from ExtractedInvoice data captured by email intelligence system.

## Location
`apps/api/src/modules/ai/email-intelligence/bill-creator.service.ts`

## Quick Start

```typescript
import { BillCreatorService } from '@/modules/ai/email-intelligence';

// Inject in constructor
constructor(private billCreator: BillCreatorService) {}

// Create a bill from extracted invoice
const result = await this.billCreator.createBillFromExtractedInvoice(
  orgId,
  extractedInvoiceData,
  {
    sourceEmailId: email.id,
    autoApprove: false, // DRAFT status
  }
);

// Check result
if (result.action === 'CREATED') {
  console.log('✅ Bill created:', result.bill.id);
} else if (result.action === 'DUPLICATE_FOUND') {
  console.log('⚠️ Duplicate found:', result.duplicateBillId);
} else {
  console.log('❌ Skipped:', result.reasoning);
}
```

## Main Method Signature

```typescript
async createBillFromExtractedInvoice(
  orgId: string,
  extractedInvoice: ExtractedInvoiceDataDto,
  options?: BillCreationOptions
): Promise<BillCreationResult>
```

## Options

```typescript
interface BillCreationOptions {
  sourceEmailId?: string;         // Link to email
  sourceAttachmentId?: string;    // Link to attachment
  extractedDataId?: string;       // Link to ExtractedInvoice record
  categoryId?: string;            // Expense category
  autoApprove?: boolean;          // PENDING vs DRAFT status
  notes?: string;                 // Additional notes
}
```

## Return Value

```typescript
interface BillCreationResult {
  bill?: Bill;
  action: 'CREATED' | 'DUPLICATE_FOUND' | 'SKIPPED';
  reasoning: string;
  duplicateBillId?: string;
}
```

## Key Features

✅ **Duplicate Detection**: Checks vendor + invoice number
✅ **Vendor Linking**: Finds vendor by name/email/partial match
✅ **Line Items**: Auto-creates from invoice data
✅ **Source Tracking**: Links to email/attachment
✅ **Batch Processing**: Handle multiple invoices
✅ **Statistics**: Track creation metrics

## Workflow

1. Validates required fields (vendor name, amount)
2. Finds vendor (exact → email → partial match)
3. Checks for duplicate bills
4. Creates bill with line items
5. Returns result with action and reasoning

## Status Logic

- **DRAFT** (default): Requires manual review
- **PENDING** (autoApprove: true): Auto-approved
- Payment status always starts as PENDING

## Integration Example

```typescript
// Complete email-to-bill pipeline
async processInvoiceEmail(email: EmailMessage, orgId: string) {
  // Step 1: Extract invoice data (assume done)
  const extractedInvoice = await extractInvoiceFromEmail(email);

  // Step 2: Create/match vendor (assume done)
  const vendor = await createOrMatchVendor(extractedInvoice, orgId);

  // Step 3: Create bill
  const billResult = await this.billCreator.createBillFromExtractedInvoice(
    orgId,
    extractedInvoice,
    {
      sourceEmailId: email.id,
      extractedDataId: extractedInvoice.id,
      autoApprove: false, // Requires review
    }
  );

  return billResult;
}
```

## Common Use Cases

### 1. Basic Creation
```typescript
const result = await billCreator.createBillFromExtractedInvoice(
  orgId,
  extractedInvoice
);
```

### 2. With Email Link
```typescript
const result = await billCreator.createBillFromExtractedInvoice(
  orgId,
  extractedInvoice,
  { sourceEmailId: email.id }
);
```

### 3. Auto-Approved
```typescript
const result = await billCreator.createBillFromExtractedInvoice(
  orgId,
  extractedInvoice,
  { autoApprove: true }
);
```

### 4. Batch Processing
```typescript
const results = await billCreator.createBillsFromExtractedInvoices(
  orgId,
  invoices.map(inv => ({ data: inv, options: { sourceEmailId: inv.emailId } }))
);
```

### 5. Get Statistics
```typescript
const stats = await billCreator.getBillCreationStats(orgId, 30);
```

## Validation Rules

✅ **Required**: vendorName, total > 0
✅ **Vendor**: Must exist in database
✅ **Duplicates**: Checks orgId + vendorId + billNumber

## Error Scenarios

| Scenario | Action | Reasoning |
|----------|--------|-----------|
| No vendor name | SKIPPED | "Missing vendor name..." |
| Invalid amount | SKIPPED | "Invalid total amount..." |
| Vendor not found | SKIPPED | "Vendor not found. Please create..." |
| Duplicate invoice | DUPLICATE_FOUND | "Bill already exists for invoice..." |
| Success | CREATED | "Bill created successfully..." |

## Bill Fields Auto-Generated

- `description`: "Invoice [number] from [vendor] dated [date]"
- `notes`: Includes PO, payment terms, IBAN, etc.
- `internalNotes`: Review status message
- `dueDate`: Calculated from issueDate + payment terms
- `sourceType`: Always EMAIL_EXTRACTION

## Dependencies

- `PrismaService`: Database access
- `ExtractedInvoiceDataDto`: Input data type
- `@prisma/client`: Bill, BillStatus, PaymentStatus types

## Module Integration

Service is:
- ✅ Registered in `email-intelligence.module.ts` providers
- ✅ Exported from `email-intelligence.module.ts`
- ✅ Exported from `index.ts` barrel export
- ✅ Injectable throughout application

## Next Steps

1. Integrate with email processing pipeline
2. Add notification system for auto-created bills
3. Build UI for reviewing/approving bills
4. Add automation rules (auto-approve trusted vendors)
5. Implement ML-based duplicate detection

## Related Services

- **VendorAutoCreatorService**: Creates vendors from emails
- **EmailClassifierService**: Classifies email types
- **EntityExtractorService**: Extracts entities from emails
- **InvoiceExtractorService**: Extracts invoice data from PDFs

## Support

For issues or questions:
- See full documentation: `TASK_S3-01_BILL_CREATOR_COMPLETE.md`
- Review vendor-auto-creator.service.ts for similar patterns
- Check bills.service.ts for bill management operations
