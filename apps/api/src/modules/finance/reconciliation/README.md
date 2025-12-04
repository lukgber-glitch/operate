# Transaction Reconciliation Engine

## Overview

The Transaction Reconciliation Engine automatically matches bank transactions to expenses and invoice payments, providing intelligent suggestions based on multiple matching criteria.

## Features

- **Intelligent Matching**: Multi-factor matching algorithm with confidence scoring
- **Auto-Reconciliation**: Automated matching using configurable rules
- **Manual Matching**: Review and apply suggested matches manually
- **Rule-Based Automation**: Create custom rules for automatic categorization
- **Comprehensive Statistics**: Track reconciliation progress and metrics

## Matching Logic

### Match Types

1. **EXPENSE** - Match to expense records
2. **INVOICE_PAYMENT** - Match to invoice payments

### Matching Criteria

The engine evaluates potential matches using:

#### Amount Matching
- **AMOUNT_EXACT**: Exact match (±€0.01) → +40 points
- **AMOUNT_APPROXIMATE**: Within 5% → +25 points

#### Date Proximity
- Same day → +30 points
- 1 day difference → +25 points
- 2 days difference → +15 points
- 3 days difference → +10 points

#### Merchant/Vendor Matching
- Merchant name similarity → up to +20 points

#### Description Matching
- Description keyword match → up to +10 points

### Confidence Scoring

Confidence scores range from 0-100:
- **85-100**: High confidence (auto-match eligible)
- **70-84**: Medium confidence (manual review recommended)
- **50-69**: Low confidence (additional verification needed)
- **<50**: Very low confidence (likely not a match)

## API Endpoints

### Get Unmatched Transactions

```
GET /organisations/:orgId/reconciliation/unmatched
```

Query parameters:
- `status`: Filter by reconciliation status
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `minAmount`: Minimum transaction amount
- `maxAmount`: Maximum transaction amount
- `merchantName`: Filter by merchant name
- `accountId`: Filter by bank account

### Get Suggested Matches

```
GET /organisations/:orgId/reconciliation/transactions/:id/matches
```

Returns array of potential matches with confidence scores.

### Apply Match

```
POST /organisations/:orgId/reconciliation/transactions/:id/match
```

Body:
```json
{
  "matchType": "EXPENSE",
  "matchId": "expense-uuid",
  "confidence": 92
}
```

### Undo Match

```
POST /organisations/:orgId/reconciliation/transactions/:id/undo
```

Reverts a transaction back to UNMATCHED status.

### Ignore Transaction

```
POST /organisations/:orgId/reconciliation/transactions/:id/ignore
```

Body:
```json
{
  "reason": "Transfer between own accounts"
}
```

### Auto-Reconcile

```
POST /organisations/:orgId/reconciliation/auto
```

Runs automatic reconciliation for all unmatched transactions.

Response:
```json
{
  "processedCount": 150,
  "matchedCount": 89,
  "skippedCount": 61,
  "matches": [...],
  "errors": []
}
```

### Get Statistics

```
GET /organisations/:orgId/reconciliation/stats
```

Response:
```json
{
  "total": 500,
  "unmatched": 120,
  "matched": 350,
  "ignored": 30,
  "percentageReconciled": 76,
  "unmatchedValue": 15420.50,
  "matchedValue": 89634.25,
  "averageConfidence": 0,
  "matchesByType": {
    "expense": 280,
    "invoicePayment": 70
  },
  "matchesByReason": {
    "AMOUNT_EXACT": 200,
    "DATE_PROXIMITY": 350,
    "MERCHANT_MATCH": 180
  }
}
```

### Create Reconciliation Rule

```
POST /organisations/:orgId/reconciliation/rules
```

Body:
```json
{
  "name": "Auto-match Starbucks purchases",
  "description": "Automatically match Starbucks transactions to Meals category",
  "matchType": "MERCHANT",
  "matchPattern": "starbucks|sbux",
  "action": "AUTO_MATCH_EXPENSE",
  "priority": 10
}
```

## Reconciliation Rules

Rules allow for automatic categorization and matching based on patterns.

### Rule Types

1. **MERCHANT**: Match by merchant name pattern
2. **DESCRIPTION**: Match by transaction description
3. **AMOUNT_RANGE**: Match by amount range

### Rule Actions

1. **AUTO_MATCH_EXPENSE**: Automatically match to expenses
2. **CATEGORIZE**: Auto-categorize transaction
3. **IGNORE**: Automatically ignore matching transactions

### Example Rules

#### Auto-match recurring subscriptions
```json
{
  "name": "Microsoft 365 Subscription",
  "matchType": "MERCHANT",
  "matchPattern": "microsoft.*office",
  "action": "AUTO_MATCH_EXPENSE",
  "categoryId": "software-subscriptions",
  "priority": 20
}
```

#### Ignore internal transfers
```json
{
  "name": "Internal Transfers",
  "matchType": "DESCRIPTION",
  "matchPattern": "transfer|überweisung",
  "action": "IGNORE",
  "priority": 100
}
```

#### Auto-categorize by amount range
```json
{
  "name": "Small Purchases",
  "matchType": "AMOUNT_RANGE",
  "matchPattern": "0-50",
  "action": "CATEGORIZE",
  "categoryId": "misc-expenses",
  "priority": 5
}
```

## Workflow

### Manual Reconciliation

1. Fetch unmatched transactions
2. For each transaction, get suggested matches
3. Review matches and confidence scores
4. Apply match or ignore transaction

### Automatic Reconciliation

1. Run auto-reconcile endpoint
2. System processes all unmatched transactions
3. High-confidence matches (≥85%) are auto-applied
4. Lower confidence matches are skipped for manual review
5. Review auto-reconciliation results

### Rule-Based Reconciliation

1. Create reconciliation rules for common patterns
2. Run auto-reconcile
3. System applies rules in priority order
4. Matching transactions are automatically processed

## Best Practices

### Creating Effective Rules

1. **Specific Patterns**: Use precise patterns to avoid false matches
2. **Test Patterns**: Start with lower priority, test, then increase
3. **Priority Management**: Higher priority = executed first
4. **Regular Reviews**: Periodically review and update rules

### Handling Edge Cases

1. **Split Transactions**: Handle manually
2. **Partial Payments**: May require custom matching logic
3. **Foreign Currency**: Consider exchange rate variations
4. **Duplicate Transactions**: Review carefully before matching

### Performance Tips

1. **Batch Processing**: Auto-reconcile processes in batches of 100
2. **Date Filtering**: Use date filters for large datasets
3. **Regular Reconciliation**: Run daily or weekly for best results
4. **Rule Optimization**: Keep active rules under 50 for performance

## Database Schema

### BankTransactionNew

```prisma
model BankTransactionNew {
  id                       String                @id @default(uuid())
  reconciliationStatus     ReconciliationStatus  @default(UNMATCHED)
  matchedExpenseId         String?
  matchedInvoicePaymentId  String?
  // ... other fields
}
```

### ReconciliationRule

```prisma
model ReconciliationRule {
  id           String                  @id @default(uuid())
  orgId        String
  name         String
  matchType    ReconciliationMatchType
  matchPattern String
  action       ReconciliationAction
  priority     Int                     @default(0)
  isActive     Boolean                 @default(true)
  // ... other fields
}
```

## Error Handling

The service handles various error scenarios:

- **Transaction Not Found**: Returns 404
- **Already Reconciled**: Returns 400
- **Invalid Match**: Returns 404
- **Rule Pattern Error**: Gracefully falls back to string matching

## Logging

The service logs:
- Match operations
- Ignore operations
- Undo operations
- Auto-reconciliation results
- Errors and exceptions

## Future Enhancements

1. **ML-Based Matching**: Train model on user corrections
2. **Bulk Operations**: Match/ignore multiple transactions at once
3. **Custom Confidence Thresholds**: Per-organization settings
4. **Advanced Rule Conditions**: Multiple criteria per rule
5. **Reconciliation Snapshots**: Historical reconciliation states
6. **Integration Events**: Webhooks for reconciliation events

## Related Modules

- **Banking Module**: Provides bank transaction data
- **Expenses Module**: Target for expense matches
- **Invoices Module**: Target for invoice payment matches
- **AI Module**: Can provide ML-based suggestions (future)

## Testing

Key test scenarios:
1. Exact amount and date match
2. Approximate amount match
3. Merchant name variations
4. Multi-day date range
5. Rule pattern matching
6. Auto-reconciliation workflow
7. Undo operations
8. Statistics calculation

## Security

- **Role-Based Access**: OWNER, ADMIN, MANAGER can reconcile
- **Audit Trail**: All operations are logged
- **Data Validation**: Input validation on all endpoints
- **Organization Isolation**: Transactions only accessible within org
