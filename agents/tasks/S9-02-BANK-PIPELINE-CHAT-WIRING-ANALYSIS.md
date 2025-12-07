# S9-02: Bank Pipeline → Chat Actions Wiring Analysis

**Agent**: BRIDGE (Integrations)
**Date**: 2025-12-07
**Status**: Analysis Complete - Ready for Implementation

---

## Executive Summary

The bank intelligence services are implemented but NOT connected to the Chat Action system. This analysis identifies:
- Current event-driven architecture (EventEmitter2)
- Existing transaction pipeline that classifies transactions
- Suggestion system for proactive chat recommendations
- Missing event handlers to wire bank intelligence to chat

**Key Finding**: The architecture is 90% ready. We just need to create event listeners that convert bank intelligence results into chat suggestions.

---

## Current Architecture Analysis

### 1. Bank Sync Flow (✅ COMPLETE)

```
BankImportProcessor (Bull Queue)
  ├─> BankSyncService.syncConnection()
  │   ├─> Fetch accounts from Tink/Plaid
  │   ├─> Fetch transactions
  │   └─> Store in BankTransactionNew table
  │
  └─> EMITS: 'bank.sync.completed' event
      └─> {connectionId, accountsSynced, transactionsSynced}
```

**Location**: `apps/api/src/modules/finance/bank-sync/jobs/bank-import.processor.ts`

**Events Emitted**:
- `bank.sync.completed` (line 144) - After successful sync
- `bank.sync.failed` (line 92) - On sync failure
- `bank.batch.completed` (line 192) - After batch sync
- `bank.consents.expiring` (line 236) - Consent renewal needed

---

### 2. Transaction Classification Pipeline (✅ COMPLETE)

```
TransactionPipelineService
  ├─> Listens: 'bank.sync.completed' (@OnEvent decorator)
  │
  ├─> processConnectionTransactions()
  │   ├─> Fetch unclassified transactions
  │   ├─> TransactionCategorizationService.batchCategorize()
  │   ├─> TaxDeductionClassifierService.classifyDeduction()
  │   └─> Store categorization in metadata
  │
  └─> EMITS: 'transaction.classified' event
      └─> {transactionId, orgId, category, confidence, taxDeduction}
```

**Location**: `apps/api/src/modules/finance/banking/transaction-pipeline.service.ts`

**What it does**:
- Listens to `bank.sync.completed` (line 77)
- Auto-categorizes transactions with >80% confidence
- Processes tax deductions for expenses
- Emits `transaction.classified` event (line 245)

**Current Gap**: Does NOT call InvoiceMatcher or BillMatcher services

---

### 3. Bank Intelligence Services (✅ IMPLEMENTED, ❌ NOT WIRED)

#### InvoiceMatcherService
**Location**: `apps/api/src/modules/ai/bank-intelligence/invoice-matcher.service.ts`

**Methods**:
- `matchPaymentToInvoice()` - Match incoming payment to invoice(s)
- `autoReconcile()` - Auto-reconcile high-confidence matches
- `recordPartialPayment()` - Handle partial payments

**Returns**: `MatchResult`
```typescript
{
  matched: boolean,
  matchType: 'EXACT' | 'PROBABLE' | 'PARTIAL' | 'NONE',
  invoice?: Invoice,
  invoices?: Invoice[], // Multi-invoice match
  confidence: number, // 0-100
  suggestedAction: 'AUTO_RECONCILE' | 'REVIEW' | 'PARTIAL_PAYMENT' | 'MULTI_INVOICE',
  matchReasons: string[],
  amountRemaining?: number
}
```

#### BillMatcherService
**Location**: `apps/api/src/modules/ai/bank-intelligence/bill-matcher.service.ts`

**Methods**:
- `matchPaymentToBill()` - Match outgoing payment to bill(s)
- `autoReconcileBill()` - Auto-reconcile high-confidence matches
- `recordPartialBillPayment()` - Handle partial payments
- `detectRecurringPayment()` - Detect subscription patterns

**Returns**: `BillMatchResult` (similar structure to invoice match)

#### RecurringDetectorService
**Location**: `apps/api/src/modules/ai/bank-intelligence/recurring-detector.service.ts`

**Methods**:
- `detectRecurringTransactions()` - Find all recurring patterns
- `predictNextPayments()` - Predict upcoming payments
- `getRecurringSummary()` - Full subscription analysis

**Returns**: `RecurringPattern[]`
```typescript
{
  vendorName: string,
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly',
  averageAmount: number,
  confidence: number,
  category?: string,
  taxCategory?: string,
  nextExpected?: Date,
  isActive: boolean
}
```

---

### 4. Chat Suggestion System (✅ READY FOR INTEGRATION)

**Location**: `apps/api/src/modules/chatbot/suggestions/`

**Database Model**: `Suggestion` (Prisma)
```typescript
{
  id: string,
  orgId: string,
  userId?: string,
  type: SuggestionType, // QUICK_ACTION, INSIGHT, WARNING, etc.
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  title: string,
  description: string,
  actionLabel?: string,
  actionType?: string, // navigate, api_call, open_chat
  actionParams?: Json,
  entityType?: string, // 'transaction', 'invoice', 'bill'
  entityId?: string,
  status: 'PENDING' | 'VIEWED' | 'ACTED' | 'DISMISSED',
  showAfter: DateTime,
  expiresAt?: DateTime
}
```

**Service**: `ProactiveSuggestionsService`
- Manages suggestion generation
- Caches suggestions (5 min TTL)
- Supports multiple generators (Invoice, Expense, Tax, HR)

---

## Missing Wiring - What Needs to Be Built

### Event Handler Service: BankIntelligenceSuggestionService

**Purpose**: Listen to bank/transaction events and create chat suggestions

**Location**: Create new file
```
apps/api/src/modules/ai/bank-intelligence/bank-intelligence-suggestion.service.ts
```

**Event Listeners Needed**:

#### 1. Listen: `transaction.classified` (CREDIT transactions)
```typescript
@OnEvent('transaction.classified')
async handleTransactionClassified(event: TransactionClassifiedEvent) {
  // Only process credit (incoming) transactions
  const transaction = await fetchTransaction(event.transactionId);

  if (transaction.transactionType === 'CREDIT') {
    // Try to match to invoice
    const matchResult = await invoiceMatcherService.matchPaymentToInvoice({
      amount: transaction.amount,
      description: transaction.description,
      counterparty: transaction.merchantName,
      date: transaction.bookingDate
    }, event.orgId);

    if (matchResult.matched) {
      await createInvoiceSuggestion(matchResult, transaction);
    }
  }

  if (transaction.transactionType === 'DEBIT') {
    // Try to match to bill
    const billMatch = await billMatcherService.matchPaymentToBill({...}, orgId);

    if (billMatch.matched) {
      await createBillSuggestion(billMatch, transaction);
    }
  }
}
```

#### 2. Listen: `bank.sync.completed`
```typescript
@OnEvent('bank.sync.completed')
async handleBankSyncCompleted(event: BankSyncCompletedEvent) {
  // Run recurring pattern detection
  const patterns = await recurringDetectorService.detectRecurringTransactions(
    event.orgId,
    { minConfidence: 70, activeOnly: true }
  );

  // Create suggestions for high-value recurring expenses
  for (const pattern of patterns) {
    if (shouldNotifyUser(pattern)) {
      await createRecurringSuggestion(pattern);
    }
  }

  // Predict upcoming payments
  const upcoming = await recurringDetectorService.predictNextPayments(
    event.orgId,
    30 // next 30 days
  );

  for (const payment of upcoming) {
    await createUpcomingPaymentSuggestion(payment);
  }
}
```

---

## Suggestion Creation Functions

### Invoice Match Suggestion
```typescript
async createInvoiceSuggestion(match: MatchResult, transaction: BankTransaction) {
  const suggestionType = match.suggestedAction === 'AUTO_RECONCILE'
    ? SuggestionType.QUICK_ACTION
    : SuggestionType.WARNING;

  const priority = match.confidence >= 95
    ? SuggestionPriority.HIGH
    : SuggestionPriority.MEDIUM;

  await prisma.suggestion.create({
    data: {
      orgId: transaction.orgId,
      type: suggestionType,
      priority,
      title: `Payment received for Invoice ${match.invoice.number}`,
      description: `€${transaction.amount} from ${transaction.merchantName} matches ${match.invoice.number} (${match.confidence}% confidence)`,
      actionLabel: match.suggestedAction === 'AUTO_RECONCILE'
        ? 'Reconcile Now'
        : 'Review Match',
      actionType: 'api_call',
      actionParams: {
        endpoint: match.suggestedAction === 'AUTO_RECONCILE'
          ? '/api/bank-intelligence/invoice/auto-reconcile'
          : '/api/invoices/${match.invoice.id}',
        method: 'POST',
        body: {
          transactionId: transaction.id,
          invoiceId: match.invoice.id
        }
      },
      entityType: 'transaction',
      entityId: transaction.id,
      data: {
        transactionId: transaction.id,
        invoiceId: match.invoice.id,
        matchType: match.matchType,
        confidence: match.confidence,
        matchReasons: match.matchReasons
      },
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
}
```

### Recurring Payment Suggestion
```typescript
async createRecurringSuggestion(pattern: RecurringPattern) {
  await prisma.suggestion.create({
    data: {
      orgId: pattern.orgId,
      type: SuggestionType.INSIGHT,
      priority: SuggestionPriority.LOW,
      title: `Recurring expense detected: ${pattern.vendorName}`,
      description: `${pattern.frequency} expense of €${pattern.averageAmount} - Next payment expected ${formatDate(pattern.nextExpected)}`,
      actionLabel: 'View Details',
      actionType: 'navigate',
      actionParams: {
        route: '/subscriptions',
        query: { vendor: pattern.vendorName }
      },
      entityType: 'vendor',
      entityId: pattern.vendorId,
      data: {
        pattern,
        annualCost: calculateAnnualCost(pattern),
        taxDeductible: pattern.taxCategory !== 'PRIVATE_ENTNAHME'
      },
      status: 'PENDING'
    }
  });
}
```

### Upcoming Payment Alert
```typescript
async createUpcomingPaymentSuggestion(payment: UpcomingPayment) {
  if (payment.daysTillDue <= 7) {
    await prisma.suggestion.create({
      data: {
        orgId: payment.orgId,
        type: SuggestionType.DEADLINE,
        priority: payment.daysTillDue <= 3
          ? SuggestionPriority.HIGH
          : SuggestionPriority.MEDIUM,
        title: `Upcoming payment: ${payment.vendorName}`,
        description: `Expected payment of €${payment.expectedAmount} in ${payment.daysTillDue} days`,
        actionLabel: 'Prepare Payment',
        actionType: 'api_call',
        actionParams: {
          endpoint: '/api/bills/create-from-prediction',
          method: 'POST',
          body: {
            vendorName: payment.vendorName,
            amount: payment.expectedAmount,
            dueDate: payment.expectedDate
          }
        },
        entityType: 'vendor',
        data: {
          prediction: payment,
          confidence: payment.confidence
        },
        status: 'PENDING',
        expiresAt: payment.expectedDate
      }
    });
  }
}
```

---

## Files to Modify/Create

### New Files to Create

1. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence-suggestion.service.ts`**
   - Event listeners for bank/transaction events
   - Suggestion creation logic
   - Integration with InvoiceMatcher, BillMatcher, RecurringDetector

2. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence-suggestion.module.ts`**
   - Module definition
   - Provider exports

### Files to Modify

1. **`apps/api/src/modules/finance/banking/transaction-pipeline.service.ts`**
   - Add transaction type (CREDIT/DEBIT) to emitted event
   - Emit additional metadata needed for matching

2. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence.module.ts`**
   - Import new BankIntelligenceSuggestionService
   - Export for use in other modules

3. **`apps/api/src/app.module.ts`**
   - Ensure BankIntelligenceModule is imported

---

## Database Changes Required

**None** - Existing `Suggestion` table supports all needed fields.

Optional enhancement (for Sprint 3):
```prisma
model BankReconciliation {
  id              String   @id @default(uuid())
  orgId           String
  transactionId   String   @unique
  invoiceId       String?
  billId          String?
  matchType       String   // EXACT, PROBABLE, PARTIAL
  confidence      Int      // 0-100
  autoReconciled  Boolean  @default(false)
  reconciledBy    String?  // userId if manual
  reconciledAt    DateTime @default(now())

  transaction BankTransactionNew @relation(fields: [transactionId], references: [id])
  invoice     Invoice?            @relation(fields: [invoiceId], references: [id])
  bill        Bill?               @relation(fields: [billId], references: [id])
}
```

---

## Implementation Steps

### Phase 1: Core Wiring (Sprint 9 - This Task)

1. Create `BankIntelligenceSuggestionService`
   - Event listener for `transaction.classified`
   - Call InvoiceMatcher for CREDIT transactions
   - Call BillMatcher for DEBIT transactions
   - Create suggestions based on match results

2. Add recurring payment detection
   - Listen to `bank.sync.completed`
   - Run RecurringDetectorService
   - Create suggestions for active recurring expenses

3. Add upcoming payment alerts
   - Predict next 30 days of payments
   - Create deadline suggestions for high-confidence predictions

### Phase 2: Auto-Reconciliation (Sprint 3)

1. Create reconciliation API endpoints
2. Implement auto-reconcile for >95% confidence matches
3. Add manual review UI for 70-94% confidence
4. Store reconciliation records

### Phase 3: Advanced Features (Future)

1. Learn from user behavior (approve/reject patterns)
2. Vendor extraction from unmatched payments
3. ML-based confidence adjustment
4. Batch reconciliation UI

---

## Expected Behavior After Wiring

### Scenario 1: Invoice Payment Received
```
1. Bank sync completes
2. TransactionPipelineService classifies transaction
3. Emits 'transaction.classified' (CREDIT, €1,234.56)
4. BankIntelligenceSuggestionService receives event
5. Calls InvoiceMatcherService.matchPaymentToInvoice()
6. Match found: Invoice #INV-001 (96% confidence)
7. Creates Suggestion:
   - Type: QUICK_ACTION
   - Priority: HIGH
   - Title: "Payment received for Invoice INV-001"
   - Action: "Reconcile Now" → API call to auto-reconcile
8. User sees suggestion in chat
9. User clicks → Invoice marked PAID
```

### Scenario 2: Recurring Expense Detected
```
1. Bank sync completes (monthly AWS bill paid)
2. BankIntelligenceSuggestionService receives 'bank.sync.completed'
3. Runs RecurringDetectorService.detectRecurringTransactions()
4. Finds: AWS, monthly, €89.99, 95% confidence
5. Creates Suggestion:
   - Type: INSIGHT
   - Priority: LOW
   - Title: "Recurring expense: AWS"
   - Description: "Monthly €89.99 - Next payment expected Jan 7"
   - Action: "View Subscriptions"
6. User sees insight in dashboard
```

### Scenario 3: Upcoming Payment Alert
```
1. Bank sync completes
2. RecurringDetectorService.predictNextPayments(30 days)
3. Finds: Office rent due in 5 days (€2,500)
4. Creates Suggestion:
   - Type: DEADLINE
   - Priority: HIGH
   - Title: "Upcoming payment: Office Rent"
   - Description: "Expected €2,500 in 5 days"
   - Action: "Prepare Payment" → Create bill
5. User proactively reminded
```

---

## Testing Plan

### Unit Tests
- [ ] InvoiceMatcherService.matchPaymentToInvoice()
- [ ] BillMatcherService.matchPaymentToBill()
- [ ] RecurringDetectorService.detectRecurringTransactions()
- [ ] BankIntelligenceSuggestionService event handlers

### Integration Tests
- [ ] Bank sync → Classification → Matching → Suggestion
- [ ] Auto-reconciliation flow (high confidence)
- [ ] Manual review flow (medium confidence)
- [ ] Recurring pattern detection across multiple syncs

### E2E Tests
- [ ] Complete flow: Connect bank → Sync → See suggestion → Reconcile
- [ ] User dismisses suggestion
- [ ] User acts on suggestion

---

## Performance Considerations

1. **Event Processing**: Async/non-blocking
   - Don't block transaction classification pipeline
   - Use Bull queue for heavy processing

2. **Batch Processing**:
   - Process recurring detection once per sync (not per transaction)
   - Cache match results (5 min TTL)

3. **Database Queries**:
   - Index on `BankTransactionNew.reconciliationStatus`
   - Index on `Invoice.status` and `Bill.status`
   - Limit lookback period (180 days default)

4. **Suggestion Volume**:
   - Limit to 10 active suggestions per user
   - Auto-dismiss expired suggestions
   - Deduplicate (don't create duplicate suggestions)

---

## Success Metrics

- [ ] 90%+ of invoice payments automatically matched
- [ ] 80%+ of bill payments automatically matched
- [ ] 95%+ accuracy on recurring expense detection
- [ ] User acts on 30%+ of high-priority suggestions
- [ ] Average reconciliation time reduced by 70%

---

## Next Steps

1. **BRIDGE**: Implement `BankIntelligenceSuggestionService`
2. **PRISM**: Add suggestion UI to chat interface
3. **FORGE**: Create reconciliation API endpoints
4. **VERIFY**: Write integration tests
5. **ATLAS**: Review and approve before Sprint 3

---

## Dependencies

- ✅ BankSyncService (implemented)
- ✅ TransactionPipelineService (implemented)
- ✅ InvoiceMatcherService (implemented)
- ✅ BillMatcherService (implemented)
- ✅ RecurringDetectorService (implemented)
- ✅ ProactiveSuggestionsService (implemented)
- ✅ Suggestion database model (implemented)
- ❌ BankIntelligenceSuggestionService (NEEDS IMPLEMENTATION)
- ❌ Reconciliation API endpoints (Sprint 3)

---

## Conclusion

The bank intelligence services are fully implemented and waiting to be wired to the chat system. The architecture is event-driven and ready for integration. The primary work is creating the `BankIntelligenceSuggestionService` that listens to transaction events and creates proactive suggestions.

**Estimated Effort**: 4-6 hours
- 2 hours: BankIntelligenceSuggestionService implementation
- 1 hour: Integration testing
- 1 hour: API endpoint creation (reconciliation)
- 1-2 hours: Bug fixes and refinement

**Risk**: Low - Architecture supports this pattern, just needs glue code.
