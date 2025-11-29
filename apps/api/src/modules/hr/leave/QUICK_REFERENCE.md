# Leave Management API - Quick Reference

## Common Operations

### Submit Leave Request
```typescript
POST /api/v1/employees/{employeeId}/leave-requests
{
  "leaveType": "ANNUAL",
  "startDate": "2024-07-15T00:00:00Z",
  "endDate": "2024-07-19T00:00:00Z",
  "reason": "Summer vacation"
}
```

### Check Leave Balance
```typescript
GET /api/v1/employees/{employeeId}/leave-balance
Response:
{
  "data": {
    "employeeId": "emp-123",
    "year": 2024,
    "balances": [
      {
        "leaveType": "ANNUAL",
        "totalDays": 20,
        "usedDays": 5,
        "pendingDays": 2,
        "availableDays": 13,
        "carriedOver": 0
      }
    ]
  }
}
```

### Approve Request (Manager)
```typescript
POST /api/v1/leave-requests/{requestId}/approve
{
  "note": "Approved"
}
```

### View Team Calendar
```typescript
GET /api/v1/organisations/{orgId}/leave-calendar?startDate=2024-07-01&endDate=2024-07-31
```

## Service Methods

### LeaveService
```typescript
// Submit request
await leaveService.submitRequest(employeeId, dto);

// Approve/Reject
await leaveService.approveRequest(requestId, managerId, note);
await leaveService.rejectRequest(requestId, managerId, reason);

// Cancel
await leaveService.cancelRequest(requestId, employeeId);

// Query
await leaveService.getBalance(employeeId, year);
await leaveService.getEmployeeRequests(employeeId, query);
await leaveService.getPendingForOrganisation(orgId);
await leaveService.getTeamCalendar(orgId, startDate, endDate);
```

### EntitlementsService
```typescript
// Calculate entitlements for year
await entitlementsService.calculateForYear(employeeId, 2024);

// Get balance
await entitlementsService.getBalance(employeeId, 2024);

// Update used days
await entitlementsService.updateUsedDays(
  employeeId,
  year,
  leaveType,
  days,
  'add' | 'subtract'
);

// Year-end processing
await entitlementsService.processYearEndCarryover(orgId, 2024);
```

### EntitlementsCalculator
```typescript
// Calculate annual entitlement
const days = calculator.calculateAnnualEntitlement(employee, 2024);

// Calculate working days
const workingDays = calculator.calculateWorkingDays(startDate, endDate);

// Carryover
const maxCarryover = calculator.calculateMaxCarryover(employee, 2024);
const expiryDate = calculator.calculateCarryoverExpiry(employee, 2024);
```

## Country Rules Quick Reference

| Country | Min Days | Carryover Max | Expires | Special Rules |
|---------|----------|---------------|---------|---------------|
| DE (Germany) | 20 | 5 | March 31 | - |
| AT (Austria) | 25 | 10 | Dec 31 | +5 days @ 25 years |
| CH (Switzerland) | 20 | 5 | March 31 | +5 days @ age 50 |

## Validation Rules

1. **Start date** must be before **end date**
2. **Cannot request past dates** (except sick leave)
3. **No overlapping requests** allowed
4. **Sufficient balance** required (for annual leave)
5. **Employee must have active contract**

## Status Workflow

```
PENDING ──approve──> APPROVED ──cancel──> CANCELLED
   │
   └──────reject──> REJECTED
   │
   └──────cancel──> CANCELLED
```

## Testing

### Run Tests
```bash
npm test leave.service.spec.ts
npm test entitlements.calculator.spec.ts
```

### Test Coverage
```bash
npm run test:cov -- leave
```

## Common Errors

### Insufficient Balance
```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Insufficient leave balance. Available: 5 days, Requested: 10 days"
  }
}
```

### Overlapping Request
```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Leave request overlaps with existing request"
  }
}
```

### Invalid Status
```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Cannot approve request with status APPROVED"
  }
}
```

## Performance Tips

1. **Cache entitlements** - They rarely change within a year
2. **Batch calendar queries** - Use date ranges efficiently
3. **Index queries** - Ensure indexes on employeeId, status, dates
4. **Pagination** - Always use pagination for list endpoints

## Integration Checklist

- [ ] Add authentication guards to controller
- [ ] Implement RBAC authorization
- [ ] Add notification service integration
- [ ] Set up public holiday calendar
- [ ] Configure block-out periods
- [ ] Enable audit logging
- [ ] Run database migration
- [ ] Add to main app module
- [ ] Configure caching strategy
- [ ] Set up monitoring/alerts
