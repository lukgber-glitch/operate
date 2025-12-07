# Bank to Chat Bridge - Implementation Test Guide

## Overview
This document provides test instructions for the Bank to Chat Bridge feature (S9-06).

## Architecture Implemented

```
TransactionPipelineService (existing)
  ↓
EMITS: 'transaction.classified' event
  ↓
BankIntelligenceSuggestionService [NEW - IMPLEMENTED]
  ↓ (listens to event)
For CREDIT: InvoiceMatcherService.matchPaymentToInvoice()
For DEBIT: BillMatcherService.matchPaymentToBill()
  ↓
Create Suggestion records for matches
  ↓
Chat UI displays suggestions (via existing SuggestionsService)
```

## Files Created/Modified

### Created:
1. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence-suggestion.service.ts`**
   - Event listener for `transaction.classified` events
   - Processes CREDIT transactions → matches to invoices
   - Processes DEBIT transactions → matches to bills
   - Creates Suggestion records for matches

2. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence.controller.ts`**
   - POST `/bank-intelligence/auto-reconcile/invoice` - Auto-reconcile invoice
   - POST `/bank-intelligence/auto-reconcile/bill` - Auto-reconcile bill
   - POST `/bank-intelligence/partial-payment/invoice` - Record partial payment for invoice
   - POST `/bank-intelligence/partial-payment/bill` - Record partial payment for bill

### Modified:
3. **`apps/api/src/modules/ai/bank-intelligence/bank-intelligence.module.ts`**
   - Added BankIntelligenceSuggestionService to providers
   - Added BankIntelligenceController
   - Exported the new service

## How It Works

### 1. Transaction Classification Flow
When a bank transaction is synced:
1. `TransactionPipelineService` classifies the transaction
2. Emits `transaction.classified` event
3. `BankIntelligenceSuggestionService` listens to the event
4. For CREDIT (incoming): Calls `InvoiceMatcherService.matchPaymentToInvoice()`
5. For DEBIT (outgoing): Calls `BillMatcherService.matchPaymentToBill()`
6. If match found with >50% confidence, creates a `Suggestion` record

### 2. Suggestion Types Created

#### Invoice Match Suggestions:
- **AUTO_RECONCILE**: High confidence (>95%), automatic reconciliation suggested
- **PARTIAL_PAYMENT**: Payment is less than invoice total
- **MULTI_INVOICE**: Payment matches multiple invoices
- **REVIEW**: Medium confidence, manual review needed

#### Bill Match Suggestions:
- **AUTO_RECONCILE**: High confidence (>95%), automatic reconciliation suggested
- **PARTIAL_PAYMENT**: Payment is less than bill total
- **MULTI_BILL**: Payment matches multiple bills
- **REVIEW**: Medium confidence, manual review needed

### 3. Chat Integration
Suggestions are automatically displayed in the chat UI via the existing:
- `SuggestionsService.getSuggestions()` - Fetches active suggestions
- Chat UI polls or subscribes to suggestions endpoint
- User can click action buttons to trigger reconciliation

## Testing Instructions

### Test 1: Invoice Match (CREDIT transaction)

1. **Create an Invoice**:
   ```bash
   POST /finance/invoices
   {
     "customerName": "Test Customer GmbH",
     "totalAmount": 1000.00,
     "status": "SENT"
   }
   ```

2. **Simulate Bank Transaction (CREDIT)**:
   ```bash
   # This would normally come from bank sync
   # Create a bank transaction manually via database or API
   INSERT INTO BankTransactionNew (
     amount: 1000.00,  # Positive = CREDIT
     merchantName: "Test Customer GmbH",
     description: "Payment for invoice INV-001",
     bookingDate: NOW()
   )
   ```

3. **Trigger Classification**:
   ```bash
   # The TransactionPipelineService will:
   # - Classify the transaction
   # - Emit 'transaction.classified' event
   # - BankIntelligenceSuggestionService picks it up
   ```

4. **Check Suggestions**:
   ```bash
   GET /chatbot/suggestions?orgId={orgId}&userId={userId}

   # Expected response:
   {
     "id": "...",
     "type": "INVOICE_REMINDER",
     "priority": "HIGH",
     "title": "Auto-reconcile payment to Invoice INV-001",
     "description": "Incoming payment of €1000.00 matches Invoice INV-001...",
     "actionLabel": "Auto-Reconcile",
     "actionType": "auto_reconcile_invoice",
     "actionParams": {
       "transactionId": "...",
       "invoiceId": "..."
     }
   }
   ```

5. **Execute Auto-Reconciliation**:
   ```bash
   POST /bank-intelligence/auto-reconcile/invoice
   {
     "transactionId": "...",
     "invoiceId": "..."
   }

   # This will:
   # - Mark invoice as PAID
   # - Set paidDate
   # - Transaction marked as reconciled
   ```

### Test 2: Bill Match (DEBIT transaction)

1. **Create a Bill**:
   ```bash
   POST /finance/bills
   {
     "vendorName": "AWS Europe",
     "totalAmount": 500.00,
     "status": "PENDING"
   }
   ```

2. **Simulate Bank Transaction (DEBIT)**:
   ```bash
   INSERT INTO BankTransactionNew (
     amount: -500.00,  # Negative = DEBIT
     merchantName: "AWS Europe",
     description: "Monthly AWS bill",
     bookingDate: NOW()
   )
   ```

3. **Check Suggestions**:
   ```bash
   GET /chatbot/suggestions

   # Expected response:
   {
     "type": "EXPENSE_ANOMALY",
     "priority": "HIGH",
     "title": "Auto-reconcile payment to Bill BILL-001",
     "actionType": "auto_reconcile_bill"
   }
   ```

4. **Execute Auto-Reconciliation**:
   ```bash
   POST /bank-intelligence/auto-reconcile/bill
   {
     "transactionId": "...",
     "billId": "..."
   }
   ```

### Test 3: Partial Payment

1. **Create Invoice for €1000**
2. **Simulate transaction for €500**
3. **Check suggestion type is PARTIAL_PAYMENT**
4. **Execute partial payment**:
   ```bash
   POST /bank-intelligence/partial-payment/invoice
   {
     "transactionId": "...",
     "invoiceId": "...",
     "amount": 500.00
   }
   ```

## Event Listener Verification

To confirm the event listener is working:

1. **Check service is instantiated**:
   ```bash
   # Look for log entry on app startup:
   [BankIntelligenceSuggestionService] Service initialized
   ```

2. **Check event emission**:
   ```bash
   # After bank sync, look for:
   [TransactionPipelineService] Emitting transaction.classified event
   [BankIntelligenceSuggestionService] Transaction XXX classified as YYY
   ```

3. **Check suggestion creation**:
   ```bash
   # Look for:
   [BankIntelligenceSuggestionService] Created invoice match suggestion for transaction XXX
   ```

## Database Verification

Check the `Suggestion` table:

```sql
SELECT
  id,
  type,
  priority,
  title,
  status,
  "actionType",
  "actionParams",
  confidence,
  "createdAt"
FROM "Suggestion"
WHERE
  "entityType" = 'transaction'
  AND status IN ('PENDING', 'VIEWED')
ORDER BY "createdAt" DESC;
```

## API Endpoints

### Get Suggestions
```bash
GET /chatbot/suggestions
Authorization: Bearer {token}
```

### Auto-Reconcile Invoice
```bash
POST /bank-intelligence/auto-reconcile/invoice
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "uuid",
  "invoiceId": "uuid"
}
```

### Auto-Reconcile Bill
```bash
POST /bank-intelligence/auto-reconcile/bill
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "uuid",
  "billId": "uuid"
}
```

### Partial Payment - Invoice
```bash
POST /bank-intelligence/partial-payment/invoice
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "uuid",
  "invoiceId": "uuid",
  "amount": 500.00
}
```

### Partial Payment - Bill
```bash
POST /bank-intelligence/partial-payment/bill
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "uuid",
  "billId": "uuid",
  "amount": 500.00
}
```

## Success Criteria

✅ BankIntelligenceSuggestionService is registered and listens to events
✅ CREDIT transactions trigger invoice matching
✅ DEBIT transactions trigger bill matching
✅ Suggestions are created in database with correct data
✅ Suggestions appear in chat UI via /chatbot/suggestions endpoint
✅ Auto-reconcile endpoints work correctly
✅ Partial payment endpoints work correctly
✅ Event flow: bank sync → classification → matching → suggestion → chat UI

## Next Steps

1. **Frontend Integration**: Update chat UI to display bank intelligence suggestions with action buttons
2. **User Feedback**: Add user confirmation dialogs before auto-reconciliation
3. **Webhooks**: Add webhook support for real-time suggestion updates
4. **Analytics**: Track suggestion acceptance/dismissal rates for ML improvement
5. **Testing**: Add unit tests for BankIntelligenceSuggestionService
6. **Documentation**: Update API documentation with new endpoints

## Notes

- The service uses `@OnEvent('transaction.classified')` decorator to listen for events
- Events are emitted by `TransactionPipelineService.applyCategorizationResult()`
- Suggestions are org-wide (userId = null) but can be filtered per user
- Confidence threshold for creating suggestions is 50%
- Auto-reconcile threshold is 95% (defined in matcher services)
- Partial payments are detected based on amount differences
- Multi-invoice/bill matches are supported for overpayments
