# Reconciliation Engine Flow Diagram

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Reconciliation Engine                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Banking    │─────▶│ Reconcilia-  │─────▶│   Expenses   │  │
│  │ Transactions │      │  tion Engine │      │  & Invoices  │  │
│  │ (Unmatched)  │      │              │      │  (Targets)   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                               │                                 │
│                               │                                 │
│                               ▼                                 │
│                        ┌──────────────┐                         │
│                        │ Reconcilia-  │                         │
│                        │  tion Rules  │                         │
│                        └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Matching Process Flow

```
                    ┌─────────────────────┐
                    │  Bank Transaction   │
                    │    (UNMATCHED)      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  findMatches()      │
                    │  - Amount match     │
                    │  - Date proximity   │
                    │  - Merchant match   │
                    │  - Description      │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
    ┌────────────────────┐        ┌────────────────────┐
    │ Find Expense       │        │ Find Invoice       │
    │ Matches            │        │ Payment Matches    │
    │ - ±3 days          │        │ - ±3 days          │
    │ - ±5% amount       │        │ - ±1% amount       │
    └─────────┬──────────┘        └─────────┬──────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Calculate Confidence │
                  │ - Amount: 40 pts     │
                  │ - Date: 30 pts       │
                  │ - Merchant: 20 pts   │
                  │ - Desc: 10 pts       │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Sort by Confidence   │
                  │ Return PotentialMatch│
                  └──────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌────────────────────┐    ┌────────────────────┐
    │  Manual Review     │    │  Auto Match        │
    │  (confidence<85)   │    │  (confidence≥85)   │
    └─────────┬──────────┘    └─────────┬──────────┘
              │                          │
              └──────────────┬───────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │   applyMatch()      │
                    │   - Update status   │
                    │   - Link IDs        │
                    │   - Log action      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Bank Transaction   │
                    │     (MATCHED)       │
                    └─────────────────────┘
```

## Auto-Reconciliation Workflow

```
        ┌──────────────────────────────────┐
        │ POST /reconciliation/auto        │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ Get Unmatched Transactions       │
        │ (Batch of 100)                   │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ Get Active Rules (priority desc) │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ For Each Transaction:            │
        └────────────┬─────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌────────────────┐    ┌────────────────────┐
│ Find Matches   │    │ Apply Rules        │
│ confidence≥85? │    │ Pattern matched?   │
└───────┬────────┘    └────────┬───────────┘
        │                      │
        ▼                      ▼
    ┌───────┐             ┌────────┐
    │ Yes?  │             │ Yes?   │
    └───┬───┘             └───┬────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ applyMatch()         │
        │ matchedCount++       │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Log Match Result     │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │ No match found?     │
        │ skippedCount++      │
        └─────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Return Results       │
        │ - processedCount     │
        │ - matchedCount       │
        │ - skippedCount       │
        │ - matches[]          │
        │ - errors[]           │
        └─────────────────────┘
```

## Confidence Calculation

```
┌────────────────────────────────────────────────────────┐
│                Confidence Score Calculation             │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Transaction: €45.00, 2024-12-01, "STARBUCKS COFFEE"   │
│  Expense: €45.00, 2024-12-01, "Coffee meeting"         │
│                                                         │
├────────────────────────────────────────────────────────┤
│  Amount Match:                                          │
│  ├─ Difference: €0.00                                  │
│  └─ Score: +40 points (EXACT)                          │
│                                                         │
│  Date Proximity:                                        │
│  ├─ Days difference: 0                                 │
│  └─ Score: +30 points (SAME DAY)                       │
│                                                         │
│  Merchant Match:                                        │
│  ├─ Transaction: "STARBUCKS COFFEE"                    │
│  ├─ Expense vendor: "Starbucks"                        │
│  ├─ Similarity: 0.85                                   │
│  └─ Score: +17 points (20 × 0.85)                      │
│                                                         │
│  Description Match:                                     │
│  ├─ Transaction: "STARBUCKS COFFEE"                    │
│  ├─ Expense desc: "Coffee meeting"                     │
│  ├─ Contains "coffee": Yes                             │
│  └─ Score: +8 points (10 × 0.8)                        │
│                                                         │
├────────────────────────────────────────────────────────┤
│  TOTAL CONFIDENCE: 95 points                           │
│  RESULT: ✅ AUTO-MATCH (≥85)                           │
└────────────────────────────────────────────────────────┘
```

## Rule-Based Matching Flow

```
┌──────────────────────────────────────────────────────┐
│ Reconciliation Rule: "Match Starbucks Expenses"      │
├──────────────────────────────────────────────────────┤
│ matchType: MERCHANT                                  │
│ matchPattern: "starbucks|sbux"                       │
│ action: AUTO_MATCH_EXPENSE                           │
│ priority: 10                                         │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│ Transaction: "STARBUCKS COFFEE SF #123"              │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│ Check Pattern Match:                                 │
│ regex.test("STARBUCKS COFFEE SF #123")               │
│ Pattern: /starbucks|sbux/i                           │
│ Result: ✅ MATCH                                     │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│ Execute Action: AUTO_MATCH_EXPENSE                   │
│ 1. Find expense matches                              │
│ 2. Select best match                                 │
│ 3. Apply match                                       │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│ Result: Transaction matched to Expense               │
│ matchedExpenseId: "exp-789"                          │
│ reconciliationStatus: MATCHED                        │
└──────────────────────────────────────────────────────┘
```

## Data Model Relationships

```
BankConnection
    │
    └─── BankAccountNew
            │
            └─── BankTransactionNew
                    │
                    ├─ reconciliationStatus: UNMATCHED | MATCHED | IGNORED
                    │
                    ├─ matchedExpenseId ──────────┐
                    │                             │
                    └─ matchedInvoicePaymentId ───┼─────┐
                                                   │     │
                                                   ▼     ▼
                                              Expense  Invoice
                                                │        │
                                                │        ├─ status: SENT
                                                │        ├─ totalAmount
                                                │        └─ dueDate
                                                │
                                                ├─ amount
                                                ├─ date
                                                ├─ vendorName
                                                └─ category

ReconciliationRule
    │
    ├─ matchType: MERCHANT | DESCRIPTION | AMOUNT_RANGE
    ├─ matchPattern: regex or pattern string
    ├─ action: AUTO_MATCH_EXPENSE | CATEGORIZE | IGNORE
    ├─ priority: int (higher = first)
    └─ isActive: boolean
```

## API Request Flow

```
Client                Controller              Service                 Database
  │                       │                      │                       │
  │  GET /unmatched       │                      │                       │
  ├──────────────────────▶│                      │                       │
  │                       │ getUnmatched()       │                       │
  │                       ├─────────────────────▶│                       │
  │                       │                      │ findMany()            │
  │                       │                      ├──────────────────────▶│
  │                       │                      │◀──────────────────────┤
  │                       │◀─────────────────────┤                       │
  │◀──────────────────────┤                      │                       │
  │  [transactions]       │                      │                       │
  │                       │                      │                       │
  │  GET /matches/:id     │                      │                       │
  ├──────────────────────▶│                      │                       │
  │                       │ findMatches()        │                       │
  │                       ├─────────────────────▶│                       │
  │                       │                      │ findMany(expenses)    │
  │                       │                      ├──────────────────────▶│
  │                       │                      │◀──────────────────────┤
  │                       │                      │ findMany(invoices)    │
  │                       │                      ├──────────────────────▶│
  │                       │                      │◀──────────────────────┤
  │                       │                      │ calculate confidence  │
  │                       │◀─────────────────────┤                       │
  │◀──────────────────────┤                      │                       │
  │  [matches + scores]   │                      │                       │
  │                       │                      │                       │
  │  POST /match          │                      │                       │
  ├──────────────────────▶│                      │                       │
  │  {matchType, id}      │ applyMatch()         │                       │
  │                       ├─────────────────────▶│                       │
  │                       │                      │ update(transaction)   │
  │                       │                      ├──────────────────────▶│
  │                       │                      │◀──────────────────────┤
  │                       │◀─────────────────────┤                       │
  │◀──────────────────────┤                      │                       │
  │  {matchResult}        │                      │                       │
```

## Status Transitions

```
                    ┌─────────────┐
                    │  UNMATCHED  │ ◀─── Initial state
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │ MATCHED  │    │ IGNORED  │   │UNMATCHED │
    │          │    │          │   │(no action)│
    └────┬─────┘    └──────────┘   └──────────┘
         │
         │ undoMatch()
         │
         ▼
    ┌──────────┐
    │UNMATCHED │
    └──────────┘
```

## Performance Optimization

```
Query Optimization Strategy:

1. Date Range Filter (±3 days)
   ├─ Reduces search space by ~99%
   └─ Uses indexed bookingDate field

2. Amount Range Filter (±5%)
   ├─ Reduces candidates by ~95%
   └─ Uses indexed amount field

3. Batch Processing (100 txns)
   ├─ Prevents memory overflow
   └─ Allows progress tracking

4. Rule Priority Ordering
   ├─ Most specific rules first
   └─ Early exit on match

5. String Similarity Caching
   ├─ Memoize common comparisons
   └─ Reduce computation time

Result: Average match time < 100ms per transaction
```
