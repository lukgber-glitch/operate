# Bank Intelligence → Chat Actions Architecture

## Current State (Before Wiring)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BANK SYNC LAYER                             │
└─────────────────────────────────────────────────────────────────┘

    Tink/Plaid API
         │
         ▼
    BankSyncService
         │
         ├─> Store: BankAccountNew
         ├─> Store: BankTransactionNew
         │
         ▼
    EMIT: bank.sync.completed
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CLASSIFICATION LAYER                            │
└─────────────────────────────────────────────────────────────────┘

    TransactionPipelineService
    @OnEvent('bank.sync.completed')
         │
         ├─> TransactionCategorizationService
         │   └─> AI Category: "Office Supplies", "Software", etc.
         │
         ├─> TaxDeductionClassifierService
         │   └─> Tax %: 0%, 50%, 100%
         │
         ▼
    EMIT: transaction.classified
         │
         │
         X  [NO FURTHER PROCESSING]
         X  [INTELLIGENCE SERVICES UNUSED]


┌─────────────────────────────────────────────────────────────────┐
│              BANK INTELLIGENCE LAYER (ISOLATED)                 │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │ InvoiceMatcherService   │  ← IMPLEMENTED
    │ - matchPaymentToInvoice │     NOT CALLED
    │ - autoReconcile         │
    └─────────────────────────┘

    ┌─────────────────────────┐
    │ BillMatcherService      │  ← IMPLEMENTED
    │ - matchPaymentToBill    │     NOT CALLED
    │ - detectRecurring       │
    └─────────────────────────┘

    ┌─────────────────────────┐
    │ RecurringDetectorService│  ← IMPLEMENTED
    │ - detectRecurring       │     NOT CALLED
    │ - predictNextPayments   │
    └─────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                   CHAT LAYER (WAITING)                          │
└─────────────────────────────────────────────────────────────────┘

    ProactiveSuggestionsService
         │
         └─> Generators (Invoice, Tax, HR)
              │
              └─> Suggestion Table
                   │
                   └─> Frontend Chat UI

    [No bank intelligence suggestions created]
```

---

## Target State (After Wiring)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BANK SYNC LAYER                             │
└─────────────────────────────────────────────────────────────────┘

    Tink/Plaid API
         │
         ▼
    BankSyncService
         │
         ├─> Store: BankAccountNew
         ├─> Store: BankTransactionNew
         │
         ▼
    EMIT: bank.sync.completed ─────────────────────┐
         │                                          │
         │                                          │
         ▼                                          │
┌─────────────────────────────────────────────────────────────────┐
│                 CLASSIFICATION LAYER                            │
└─────────────────────────────────────────────────────────────────┘

    TransactionPipelineService                      │
    @OnEvent('bank.sync.completed')                 │
         │                                          │
         ├─> TransactionCategorizationService      │
         │   └─> AI Category                        │
         │                                          │
         ├─> TaxDeductionClassifierService         │
         │   └─> Tax %                              │
         │                                          │
         ▼                                          │
    EMIT: transaction.classified                   │
         │                                          │
         │                                          │
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│          BANK INTELLIGENCE SUGGESTION SERVICE (NEW!)            │
│                  [WIRING LAYER]                                 │
└─────────────────────────────────────────────────────────────────┘

    BankIntelligenceSuggestionService
         │
         ├─> @OnEvent('transaction.classified')
         │   │
         │   ├─> IF CREDIT (payment received):
         │   │   │
         │   │   ├─> InvoiceMatcherService.matchPaymentToInvoice()
         │   │   │        │
         │   │   │        ├─> MatchResult (EXACT, 96% confidence)
         │   │   │        └─> CREATE SUGGESTION:
         │   │   │             "Payment for INV-001 received"
         │   │   │             Action: "Reconcile Now"
         │   │   │
         │   │   └─> Store: Suggestion table
         │   │
         │   └─> IF DEBIT (payment sent):
         │       │
         │       ├─> BillMatcherService.matchPaymentToBill()
         │       │        │
         │       │        ├─> BillMatchResult (PROBABLE, 82%)
         │       │        └─> CREATE SUGGESTION:
         │       │             "Payment for AWS bill detected"
         │       │             Action: "Review Match"
         │       │
         │       └─> Store: Suggestion table
         │
         └─> @OnEvent('bank.sync.completed')
             │
             ├─> RecurringDetectorService.detectRecurringTransactions()
             │        │
             │        ├─> RecurringPattern[] (monthly, €89)
             │        └─> CREATE SUGGESTION:
             │             "Recurring: AWS - €89/month"
             │             Action: "View Subscriptions"
             │
             ├─> RecurringDetectorService.predictNextPayments(30)
             │        │
             │        ├─> UpcomingPayment[] (rent in 5 days)
             │        └─> CREATE SUGGESTION:
             │             "Upcoming: Rent - €2,500"
             │             Action: "Prepare Payment"
             │
             └─> Store: Suggestion table


┌─────────────────────────────────────────────────────────────────┐
│                   CHAT LAYER (ACTIVE)                           │
└─────────────────────────────────────────────────────────────────┘

    ProactiveSuggestionsService
         │
         ├─> Invoice Generator
         ├─> Tax Generator
         ├─> HR Generator
         └─> Bank Intelligence Suggestions ← NEW!
              │
              └─> Suggestion Table
                   │
                   ├─> HIGH PRIORITY: "Reconcile Invoice INV-001"
                   ├─> MEDIUM: "Review AWS bill match"
                   ├─> LOW: "Recurring: Netflix €15/month"
                   └─> DEADLINE: "Rent due in 5 days"
                        │
                        ▼
                   Frontend Chat UI
                        │
                        ├─> Button: "Reconcile Now"
                        │   └─> API: /api/bank-intelligence/auto-reconcile
                        │        └─> Invoice.status = PAID
                        │
                        ├─> Button: "Review Match"
                        │   └─> Navigate: /invoices/123
                        │
                        └─> Button: "View Subscriptions"
                            └─> Navigate: /subscriptions
```

---

## Event Flow Diagram

```
TIME →

T0: Bank Sync Starts
│
├─> BankSyncService.syncConnection()
│   └─> Fetch 50 new transactions from Tink
│
│
T1: Bank Sync Complete
│
├─> EMIT: bank.sync.completed
│   │
│   ├─────────────────────────────────────────────┐
│   │                                             │
│   ▼                                             ▼
│   TransactionPipelineService                BankIntelligenceSuggestionService
│   @OnEvent('bank.sync.completed')          @OnEvent('bank.sync.completed')
│   │                                             │
│   │                                             ├─> detectRecurring()
│   │                                             │   └─> Found: AWS monthly
│   │                                             │       CREATE SUGGESTION
│   │                                             │
│   │                                             └─> predictNext30Days()
│   │                                                 └─> Found: Rent in 5 days
│   │                                                     CREATE SUGGESTION
│   │
│   ├─> Fetch unclassified transactions (50)
│   │
│   ├─> batchCategorize() via AI
│   │   └─> Transaction #1: "Office Supplies"
│   │   └─> Transaction #2: "Software"
│   │   └─> Transaction #3: "Payment - Acme Corp"
│   │
│   └─> FOR EACH classified transaction:
│       │
│       └─> EMIT: transaction.classified
│           │
│           ▼
│
│
T2: Transaction Classified (Transaction #3)
│
├─> EMIT: transaction.classified
│   {
│     transactionId: 'tx-003',
│     category: 'Revenue',
│     confidence: 0.92,
│     transactionType: 'CREDIT',  ← NEW
│     amount: 1234.56,            ← NEW
│     merchantName: 'Acme Corp'   ← NEW
│   }
│   │
│   ▼
│   BankIntelligenceSuggestionService
│   @OnEvent('transaction.classified')
│   │
│   ├─> Check: transactionType === 'CREDIT'
│   │   │
│   │   └─> InvoiceMatcherService.matchPaymentToInvoice()
│   │       │
│   │       ├─> Search open invoices for "Acme Corp"
│   │       ├─> Found: INV-001 (€1,234.56)
│   │       ├─> Match: EXACT, 96% confidence
│   │       │
│   │       └─> CREATE SUGGESTION:
│   │           {
│   │             type: 'QUICK_ACTION',
│   │             priority: 'HIGH',
│   │             title: 'Payment received for INV-001',
│   │             actionLabel: 'Reconcile Now',
│   │             actionType: 'api_call',
│   │             actionParams: {
│   │               endpoint: '/api/bank-intelligence/invoice/auto-reconcile',
│   │               body: { transactionId: 'tx-003', invoiceId: 'inv-001' }
│   │             }
│   │           }
│   │
│   └─> Store: Suggestion table
│
│
T3: User Opens Chat
│
├─> ProactiveSuggestionsService.getSuggestions()
│   │
│   ├─> Fetch from Suggestion table
│   │   WHERE status = 'PENDING'
│   │   AND showAfter <= NOW()
│   │   AND expiresAt > NOW()
│   │
│   └─> Return top 10 suggestions:
│       │
│       ├─> [1] HIGH: "Payment received for INV-001" ← FROM BANK INTELLIGENCE
│       ├─> [2] HIGH: "Rent due in 5 days"            ← FROM BANK INTELLIGENCE
│       ├─> [3] MEDIUM: "Review AWS bill match"       ← FROM BANK INTELLIGENCE
│       ├─> [4] LOW: "Recurring: AWS €89/month"       ← FROM BANK INTELLIGENCE
│       └─> [5] LOW: "VAT return due next month"      ← FROM TAX GENERATOR
│
│
T4: User Clicks "Reconcile Now"
│
├─> POST /api/bank-intelligence/invoice/auto-reconcile
│   {
│     transactionId: 'tx-003',
│     invoiceId: 'inv-001'
│   }
│   │
│   ├─> InvoiceMatcherService.autoReconcile()
│   │   │
│   │   ├─> UPDATE Invoice SET status = 'PAID'
│   │   ├─> UPDATE Invoice SET paidDate = NOW()
│   │   └─> CREATE Reconciliation record
│   │
│   └─> UPDATE Suggestion SET status = 'ACTED', actedAt = NOW()
│
│
T5: Success!
│
└─> User sees: "Invoice INV-001 marked as paid"
    └─> Suggestion dismissed from chat
```

---

## Data Model Relationships

```
┌─────────────────────┐
│ BankConnection      │
│ - orgId             │
│ - provider          │
│ - accessToken       │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│ BankAccountNew      │
│ - connectionId      │
│ - accountId         │
│ - balance           │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│ BankTransactionNew  │         │ Invoice             │
│ - accountId         │         │ - number            │
│ - amount           │         │ - status            │
│ - description      │◄─┐      │ - totalAmount       │
│ - merchantName     │  │      │ - customerName      │
│ - category         │  │      └──────────┬──────────┘
│ - reconciliation   │  │                 │
└─────────┬───────────┘  │                 │
          │              │   MATCHED BY    │
          │              │   INTELLIGENCE  │
          │              │                 │
          ▼              │                 ▼
┌─────────────────────┐  │      ┌─────────────────────┐
│ Suggestion          │  │      │ Bill                │
│ - orgId             │  │      │ - vendorName        │
│ - type              │  │      │ - status            │
│ - priority          │  │      │ - totalAmount       │
│ - title             │  │      └─────────────────────┘
│ - actionType        │  │                 ▲
│ - actionParams      │  │                 │
│ - entityType        │◄─┘                 │
│ - entityId          │────────────────────┘
│ - status            │  SUGGESTS RECONCILIATION
└─────────────────────┘
```

---

## Confidence-Based Suggestion Flow

```
Match Confidence:

┌─────────────────────────────────────────────────────────────┐
│                     95-100%                                 │
│                  EXACT MATCH                                │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Suggestion Type: QUICK_ACTION
         ├─> Priority: HIGH
         ├─> Action: "Reconcile Now" (auto-approve enabled)
         └─> AUTO-RECONCILE (if user settings allow)


┌─────────────────────────────────────────────────────────────┐
│                     80-94%                                  │
│                  PROBABLE MATCH                             │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Suggestion Type: QUICK_ACTION
         ├─> Priority: MEDIUM
         ├─> Action: "Review Match" (opens detail view)
         └─> USER CONFIRMS → then reconcile


┌─────────────────────────────────────────────────────────────┐
│                     60-79%                                  │
│                  POSSIBLE MATCH                             │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Suggestion Type: WARNING
         ├─> Priority: LOW
         ├─> Action: "View Options"
         └─> SHOW ALTERNATIVES (multiple possible matches)


┌─────────────────────────────────────────────────────────────┐
│                     0-59%                                   │
│                   NO MATCH                                  │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Suggestion Type: WARNING (if important)
         ├─> Priority: LOW
         ├─> Action: "Create Invoice" or "Create Bill"
         └─> HELP USER CREATE MISSING ENTITY
```

---

## Summary

**Current Issue**: Bank intelligence services exist but operate in isolation.

**Solution**: Create `BankIntelligenceSuggestionService` as a "wiring layer" that:
1. Listens to transaction/sync events
2. Calls bank intelligence services
3. Converts results into chat suggestions
4. Stores suggestions in database
5. Users see proactive recommendations in chat

**Impact**: Transforms passive intelligence into actionable chat suggestions.
