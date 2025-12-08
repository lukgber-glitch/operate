# Bulk Operations Module

Provides efficient bulk operation capabilities for managing multiple financial entities simultaneously.

## Overview

The Bulk Operations module enables users to perform actions on multiple items at once, significantly improving operational efficiency for common workflows like approving bills, categorizing transactions, or sending invoices.

## Features

- **Invoice Operations**: Send, approve, and mark multiple invoices as paid
- **Bill Operations**: Approve bills and schedule payments in bulk
- **Transaction Operations**: Categorize and reconcile multiple transactions
- **Expense Operations**: Approve or reject multiple expense claims
- **Safety First**: Maximum 100 items per request with ownership verification
- **Detailed Error Tracking**: Individual error reporting for partial failures
- **Performance Metrics**: Track operation duration and success rates

## API Endpoints

### Invoice Operations

```typescript
POST /bulk/invoices/send
POST /bulk/invoices/approve
POST /bulk/invoices/mark-paid
```

### Bill Operations

```typescript
POST /bulk/bills/approve
POST /bulk/bills/schedule-payment
```

### Transaction Operations

```typescript
POST /bulk/transactions/:accountId/categorize
POST /bulk/transactions/:accountId/reconcile
```

### Expense Operations

```typescript
POST /bulk/expenses/approve
POST /bulk/expenses/reject
```

## Usage Example

```typescript
// Bulk approve bills
const response = await fetch('/api/bulk/bills/approve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ids: ['bill-1', 'bill-2', 'bill-3'],
    userId: 'user-123'
  })
});

const result = await response.json();
// {
//   total: 3,
//   successful: 2,
//   failed: 1,
//   errors: [
//     { id: 'bill-3', error: 'Bill already approved' }
//   ],
//   successfulIds: ['bill-1', 'bill-2'],
//   metadata: { operation: 'approve', duration: 150 }
// }
```

## Request Validation

All bulk operations enforce:
- Minimum 1 item per request
- Maximum 100 items per request
- All items must belong to the same organization
- Proper type validation on all fields

## Response Structure

```typescript
interface BulkOperationResult {
  total: number;              // Total items in request
  successful: number;         // Successfully processed
  failed: number;            // Failed items
  errors: Array<{            // Detailed error list
    id: string;
    error: string;
    details?: any;
  }>;
  successfulIds?: string[];  // IDs that succeeded
  metadata?: {               // Operation metadata
    operation: string;
    duration: number;
    [key: string]: any;
  };
}
```

## Error Handling

The bulk operations system uses graceful degradation:
- Partial success is acceptable
- Failed items don't block successful ones
- Detailed error messages for each failure
- HTTP status codes indicate error types

## Performance

Expected performance for 100 items:
- Invoice operations: 2-5 seconds
- Transaction categorization: 1-3 seconds
- Bill approvals: 3-6 seconds

## Security

- **Organization Isolation**: All items verified to belong to requesting org
- **Audit Logging**: Individual operations logged for compliance
- **Rate Limiting**: Consider per-organization limits (future enhancement)
- **Input Validation**: Class-validator DTOs prevent injection attacks

## Testing

```bash
# Run bulk operation tests
npm test -- bulk

# Integration tests
npm run test:e2e -- bulk
```

## Implementation Details

### Architecture

```
BulkController
    ↓
BulkService (orchestration)
    ↓
InvoicesService / BillsService / etc. (business logic)
    ↓
Repositories / Prisma (data access)
```

### Key Design Decisions

1. **No Database Transactions**: Operations are independent, partial success is acceptable
2. **Service Reuse**: Leverages existing service logic for consistency
3. **Error Aggregation**: Collects errors without stopping on first failure
4. **Metadata Tracking**: Records operation duration and context

## Future Enhancements

- [ ] Async processing for very large batches (>100 items)
- [ ] WebSocket progress updates for long-running operations
- [ ] Bulk undo/rollback capabilities
- [ ] CSV import/export integration
- [ ] Configurable batch size limits
- [ ] Webhook notifications on completion

## Dependencies

- NestJS framework
- Prisma ORM
- class-validator
- Finance module services (InvoicesService, BillsService, etc.)

## Module Structure

```
bulk/
├── bulk.module.ts          # Module definition
├── bulk.controller.ts      # REST API endpoints
├── bulk.service.ts         # Business logic
├── dto/
│   ├── bulk-operation.dto.ts   # Request DTOs
│   └── bulk-result.dto.ts      # Response DTOs
├── index.ts                # Module exports
└── README.md               # This file
```

## Contributing

When adding new bulk operations:

1. Create DTO in `dto/bulk-operation.dto.ts`
2. Add service method in `bulk.service.ts`
3. Add controller endpoint in `bulk.controller.ts`
4. Update this README with endpoint documentation
5. Add tests for the new operation

## Support

For issues or questions:
- Check existing documentation in `audits/fixes/p1-h004-api003-bulk-operations.md`
- Review Swagger API docs at `/api/docs`
- Contact backend team (FORGE agent)
