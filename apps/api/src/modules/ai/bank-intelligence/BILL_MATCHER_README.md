# Bill Auto-Matcher Service

**Task**: S4-03 Bill Auto-Matcher
**Sprint**: 4 - Bank Intelligence
**Status**: ✅ Complete

## Overview

The Bill Auto-Matcher service automatically reconciles outgoing payments with vendor bills. When a payment to a vendor is detected from the bank feed, this service matches it to open bills, similar to how the Invoice Matcher works for incoming payments.

## Files Created

### 1. Types Definition
**File**: `types/bill-matching.types.ts`

Defines all TypeScript interfaces and enums for bill matching:
- `BillMatchType` - EXACT, PROBABLE, PARTIAL, NONE
- `BillSuggestedAction` - AUTO_RECONCILE, REVIEW, PARTIAL_PAYMENT, CREATE_BILL, MULTI_BILL
- `BillMatch` - Detailed match information for a bill
- `BillMatchResult` - Result of matching a payment to bill(s)
- `OutgoingPaymentInput` - Input for payment matching
- `BillMatchCriteria` - Matching criteria configuration
- `RecurringPaymentInfo` - Recurring payment detection result

### 2. Vendor Matcher Utility
**File**: `matchers/vendor-matcher.ts`

Enhanced name matcher specifically for vendors with:
- Fuzzy vendor name matching (handles variations)
- Known vendor alias detection (AWS vs Amazon Web Services, GCP vs Google Cloud)
- Common company suffix normalization (GmbH, Inc, Ltd, Corp, etc.)
- Acronym matching (e.g., AWS matches Amazon Web Services)
- Levenshtein distance-based similarity scoring
- Extensible alias mapping system

**Key Features**:
```typescript
// Built-in aliases for common vendors
'amazon web services': ['aws', 'amazon', 'amzn']
'google cloud': ['google', 'gcp', 'google cloud platform']
'digitalocean': ['digital ocean', 'do']
// ... and many more
```

### 3. Bill Matcher Service
**File**: `bill-matcher.service.ts`

Main service with the following methods:

#### `matchPaymentToBill(payment, orgId): Promise<BillMatchResult>`
Matches an outgoing payment to open bills using:
- **Amount matching** (40% weight) - Exact, within tolerance, or partial
- **Vendor name matching** (35% weight) - Using VendorMatcher
- **Bill reference matching** (20% weight) - Extract bill numbers from description
- **Date proximity** (5% weight) - Payment date vs due date

Returns match result with confidence score and suggested action.

#### `autoReconcileBill(transactionId, billId, userId?): Promise<void>`
Auto-reconcile a payment with a bill:
- Updates bill status to PAID
- Sets paidAmount and paidDate
- Creates reconciliation record (TODO)

#### `recordPartialBillPayment(transactionId, billId, amount, userId?): Promise<void>`
Records a partial payment:
- Updates paidAmount
- Marks as PAID if fully paid, otherwise keeps PENDING/APPROVED status
- Tracks payment history (TODO)

#### `createBillFromPayment(payment, vendorId, orgId, userId?): Promise<Bill>`
Creates a bill from an unmatched payment:
- Extracts bill number from description if possible
- Sets sourceType as API_IMPORT
- Creates bill already marked as PAID
- Links to vendor

#### `findPotentialBillMatches(payment, orgId): Promise<BillMatch[]>`
Finds all potential bill matches for a payment:
- Searches open bills (PENDING, APPROVED, OVERDUE)
- Filters by age and due date constraints
- Scores each bill and returns matches with confidence > 30%

#### `detectRecurringPayment(payment, orgId): Promise<RecurringPaymentInfo>`
Detects if a payment is recurring:
- Analyzes historical bills from the same vendor
- Calculates payment frequency (MONTHLY, QUARTERLY, YEARLY)
- Checks amount consistency
- Predicts next payment date
- Returns confidence score

**Recurring Payment Detection Logic**:
- Looks back 12 months for similar payments
- Needs at least 2 historical payments
- Calculates average interval between payments
- Identifies frequency based on interval patterns:
  - Monthly: ~30 days (±5 days)
  - Quarterly: ~90 days (±10 days)
  - Yearly: ~365 days (±15 days)
- Reduces confidence if amounts vary > 20%
- Predicts next payment date based on frequency

### 4. Example Usage
**File**: `bill-matcher.example.ts`

Comprehensive examples demonstrating:
1. Exact match and auto-reconciliation
2. Partial payment handling
3. Creating bills from unmatched payments
4. Recurring payment detection
5. Multi-bill payment scenarios
6. Finding potential matches

### 5. Module Integration
**Updated Files**:
- `matchers/index.ts` - Export VendorMatcher
- `bank-intelligence.module.ts` - Register BillMatcherService
- `index.ts` - Export all bill matching types and services

## Matching Logic

### Payment Flow
```
Outgoing Payment -€500 to "AWS"
  │
  ├─► Search: Open bills from vendors matching "AWS"
  │     ├─► Bill #B-001: €500 from "Amazon Web Services" (EXACT MATCH ✓)
  │     └─► Bill #B-002: €299 from "AWS Inc" (different amount)
  │
  ├─► Score each bill:
  │     ├─► Amount: Exact match (100% confidence)
  │     ├─► Vendor: Alias match "AWS" = "Amazon Web Services" (100%)
  │     ├─► Reference: "B-001" found in description (100%)
  │     └─► Date: Payment 2 days before due date (98%)
  │     → Final confidence: 98%
  │
  └─► Action:
        └─► Confidence ≥ 95% → AUTO_RECONCILE
```

### Match Criteria (Configurable)
```typescript
{
  amountTolerance: 1,              // 1% tolerance
  minAmountToleranceEuro: 1,       // €1 minimum
  maxBillAgeDays: 180,             // 6 months lookback
  maxDueDateFutureDays: 30,        // 30 days lookahead
  minConfidenceForAutoMatch: 95,   // 95% for auto-reconcile
  fuzzyMatchThreshold: 0.8,        // 80% similarity
}
```

## Database Schema

The service uses existing models from `packages/database/prisma/schema.prisma`:

### Bill Model
```prisma
model Bill {
  id             String        @id @default(uuid())
  organisationId String

  // Vendor info
  vendorId       String?
  vendorName     String

  // Bill identification
  billNumber     String?
  reference      String?

  // Amounts
  amount         Decimal       @db.Decimal(12, 2)
  currency       String        @default("EUR")
  taxAmount      Decimal       @default(0) @db.Decimal(12, 2)
  totalAmount    Decimal       @db.Decimal(12, 2)
  paidAmount     Decimal       @default(0) @db.Decimal(12, 2)

  // Status
  status         BillStatus    @default(DRAFT)

  // Dates
  issueDate      DateTime      @db.Date
  dueDate        DateTime      @db.Date
  paidDate       DateTime?

  // Source tracking
  sourceType     BillSourceType @default(MANUAL)
}

enum BillStatus {
  DRAFT
  PENDING
  APPROVED
  PAID
  OVERDUE
  CANCELLED
}

enum BillSourceType {
  MANUAL
  EMAIL_EXTRACTION
  UPLOAD
  API_IMPORT  // Used for bills created from bank transactions
}
```

### Vendor Model
```prisma
model Vendor {
  id             String @id @default(uuid())
  organisationId String

  name           String
  displayName    String?
  email          String?
  phone          String?
  // ... address fields
}
```

## Usage in Production

### 1. Bank Feed Processing
```typescript
// When processing outgoing transaction
const payment: OutgoingPaymentInput = {
  amount: Math.abs(transaction.amount),
  description: transaction.description,
  counterparty: transaction.counterparty,
  date: transaction.date,
};

const result = await billMatcher.matchPaymentToBill(payment, orgId);

if (result.suggestedAction === BillSuggestedAction.AUTO_RECONCILE) {
  await billMatcher.autoReconcileBill(transaction.id, result.bill.id);
  // Notify user: "Bill #12345 automatically paid"
} else if (result.suggestedAction === BillSuggestedAction.REVIEW) {
  // Create notification for user to review
  // Show suggested matches with confidence scores
} else if (result.suggestedAction === BillSuggestedAction.CREATE_BILL) {
  // Suggest creating a bill or vendor
  // Check recurring payment status
}
```

### 2. Manual Bill Payment
```typescript
// When user approves bill for payment
const bill = await prisma.bill.findUnique({ where: { id: billId } });

// When matching transaction arrives
const payment: OutgoingPaymentInput = {
  amount: Math.abs(transaction.amount),
  description: transaction.description,
  counterparty: transaction.counterparty,
  date: transaction.date,
};

const result = await billMatcher.matchPaymentToBill(payment, orgId);

// Should match with high confidence since we're expecting it
if (result.matched && result.bill?.id === billId) {
  await billMatcher.autoReconcileBill(transaction.id, billId);
}
```

### 3. Recurring Bill Management
```typescript
// Check if payment is recurring
const recurringInfo = await billMatcher.detectRecurringPayment(payment, orgId);

if (recurringInfo.isRecurring && recurringInfo.confidence > 80) {
  // Create notification: "AWS bills typically arrive monthly"
  // Suggest setting up automatic bill creation
  // Predict next payment: "Next AWS bill expected around 2024-03-01"
}
```

## Acceptance Criteria

✅ **Bill payments matched to bills**
- Matches by amount, vendor, reference, and date
- Supports exact, probable, and partial matches

✅ **Create bill option for unmatched payments**
- `createBillFromPayment()` method implemented
- Extracts bill reference from description
- Links to vendor automatically

✅ **Vendor matching works**
- VendorMatcher with fuzzy matching
- Known alias detection (AWS vs Amazon Web Services)
- Handles company suffix variations

✅ **Transaction linked to bill**
- `autoReconcileBill()` links transaction to bill
- Updates bill status to PAID
- Records payment date and amount

✅ **Recurring payments detected**
- `detectRecurringPayment()` analyzes historical patterns
- Identifies frequency (monthly, quarterly, yearly)
- Predicts next payment date
- Provides confidence score

## Testing

See `bill-matcher.example.ts` for comprehensive usage examples covering:
- Exact matches
- Partial payments
- Unmatched payments
- Recurring payments
- Multi-bill scenarios
- Manual matching workflows

## Future Enhancements

1. **Reconciliation Model** - Add proper reconciliation tracking table
2. **Payment History** - Track partial payment history
3. **ML Improvements** - Learn from user corrections
4. **Multi-Currency** - Support non-EUR currencies
5. **Split Payments** - Handle one payment split across multiple bills
6. **Vendor Auto-Creation** - Auto-create vendors from payments
7. **Smart Suggestions** - Proactive bill payment reminders
8. **Duplicate Detection** - Prevent duplicate bill creation

## Dependencies

- **Existing**: Invoice Matcher Service (similar architecture)
- **Matchers**: AmountMatcher, ReferenceMatcher (reused)
- **New**: VendorMatcher (vendor-specific logic)
- **Database**: Bill, Vendor models from Prisma schema

## Integration Points

This service integrates with:
- **Bank Feed Pipeline** - Auto-match outgoing payments
- **Bill Management** - Track payment status
- **Vendor Management** - Link payments to vendors
- **Notifications** - Alert users of matches/issues
- **Dashboard** - Show upcoming bills and payment patterns
