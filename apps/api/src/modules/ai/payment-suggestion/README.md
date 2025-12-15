# Payment Suggestion Module

## Overview

The Payment Suggestion Module provides intelligent payment recommendations based on bills extracted from emails by the Email Intelligence system. It helps users prioritize which bills to pay and when, reducing the risk of late payments and improving cash flow management.

## Features

### 1. Upcoming Payments
- Get bills due within the next N days (default: 30 days)
- Sorted by due date
- Includes priority ranking

### 2. Overdue Payments
- Identify bills past their due date
- Ranked by urgency based on how long they've been overdue

### 3. AI-Powered Priority Ranking
The system intelligently prioritizes payments based on:
- **Due Date**: Overdue > Urgent (≤3 days) > High (≤7 days) > Medium (≤14 days) > Low (>14 days)
- **Amount**: Higher amounts flagged for cash flow awareness
- **Vendor Relationships**: Frequent vendors get higher priority
- **Payment Terms**: Considers vendor payment terms

Priority levels:
- **URGENT**: Overdue bills or bills due in ≤3 days
- **HIGH**: Bills due in 4-7 days
- **MEDIUM**: Bills due in 8-14 days
- **LOW**: Bills due in >14 days

### 4. Payment Tracking
- Mark bills as paid (full or partial)
- Link payments to bank transactions
- Track payment dates and amounts

### 5. Payment Statistics
- Count of upcoming bills
- Count of overdue bills
- Recently paid bills
- Total pending amount

## API Endpoints

### GET /payment-suggestions/upcoming
Get bills due in the next N days

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30)

**Response:**
```json
{
  "suggestions": [
    {
      "bill": { ... },
      "priority": "URGENT",
      "reasoning": "Due in 2 days. Payment should be initiated immediately...",
      "daysUntilDue": 2,
      "isOverdue": false,
      "suggestedPaymentDate": "2024-01-20T00:00:00Z"
    }
  ],
  "totalAmount": 1250.50,
  "currency": "EUR",
  "urgentCount": 3,
  "overdueCount": 0
}
```

### GET /payment-suggestions/overdue
Get all overdue bills

**Response:** Same format as `/upcoming`

### GET /payment-suggestions/priority
Get AI-ranked payment suggestions

**Query Parameters:**
- `days` (optional): Time window for suggestions (default: 30)

**Response:** Same format as `/upcoming`, but sorted by priority

### GET /payment-suggestions/stats
Get payment statistics

**Query Parameters:**
- `days` (optional): Statistics period (default: 30)

**Response:**
```json
{
  "period": "30 days",
  "upcoming": 15,
  "overdue": 2,
  "recentlyPaid": 8,
  "totalPendingAmount": 5420.75,
  "totalPendingBills": 17
}
```

### POST /payment-suggestions/:billId/mark-paid
Mark a bill as paid

**Body:**
```json
{
  "paidDate": "2024-01-20",
  "paidAmount": 150.50,
  "transactionId": "txn_abc123",
  "notes": "Paid via bank transfer"
}
```

All fields are optional:
- `paidDate`: Defaults to today
- `paidAmount`: Defaults to full bill amount
- `transactionId`: Optional link to bank transaction
- `notes`: Optional payment notes

### GET /payment-suggestions/vendor/:vendorId
Get unpaid bills for a specific vendor

Useful for batch processing vendor payments.

## Integration with Email Intelligence

The Payment Suggestion module works seamlessly with the Email Intelligence system:

1. **Bill Creation**: Email Intelligence extracts invoice data from emails and creates Bill records via `BillCreatorService`
2. **Payment Detection**: Payment Suggestion module identifies bills that need payment
3. **Smart Suggestions**: AI prioritizes which bills to pay based on multiple factors
4. **Payment Tracking**: Users can mark bills as paid, completing the cycle

## Database Model

Uses the existing `Bill` model with these key fields:
- `dueDate`: When the bill is due
- `paymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED
- `paidDate`: When the bill was paid
- `paidAmount`: Amount paid
- `totalAmount`: Total bill amount
- `vendorId`: Link to vendor

## Usage Examples

### Get Bills Due This Week
```typescript
GET /payment-suggestions/upcoming?days=7
```

### Get Priority Payment List
```typescript
GET /payment-suggestions/priority?days=30
```

### Mark Bill as Fully Paid
```typescript
POST /payment-suggestions/bill-123/mark-paid
{
  "paidDate": "2024-01-20",
  "notes": "Paid via wire transfer"
}
```

### Mark Bill as Partially Paid
```typescript
POST /payment-suggestions/bill-123/mark-paid
{
  "paidAmount": 50.00,
  "notes": "Partial payment - balance to follow"
}
```

## Future Enhancements

1. **Payment Initiation Integration**: Direct integration with bank APIs to initiate payments
2. **Recurring Bill Detection**: Identify and suggest recurring payment schedules
3. **Cash Flow Forecasting**: Predict future payment obligations
4. **Vendor Payment Terms Analysis**: Learn optimal payment timing per vendor
5. **Late Fee Calculation**: Estimate late fees for overdue bills
6. **Payment Approval Workflow**: Multi-level approval for high-value payments
7. **Automated Payment Scheduling**: Auto-schedule payments based on cash flow

## Security

- All endpoints protected by JWT authentication
- Tenant isolation enforced via TenantGuard
- Users can only access their organization's bills
- Payment tracking includes audit trail via notes field

## Performance

- Efficient database queries with proper indexing
- Bills filtered by organization ID
- Results paginated where applicable
- Caching can be added for frequently accessed data

## Testing

Test the endpoints using the following scenarios:
1. Bills with various due dates (past, present, future)
2. Different bill amounts
3. Multiple vendors
4. Partial vs. full payments
5. Edge cases (same-day due, far-future due)
