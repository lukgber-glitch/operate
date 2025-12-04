# Automation Audit Log System

## Overview

The Automation Audit Log system provides comprehensive tracking, querying, and reporting of all automated actions within Operate/CoachOS. This system ensures compliance, transparency, and accountability for automation decisions.

**Task:** W8-T7 - Create automation audit log
**Agent:** SENTINEL (Security Agent)

## Architecture

### Components

1. **AutomationAuditLogService** - Core business logic for audit logging
2. **AutomationAuditLogController** - REST API endpoints for querying logs
3. **Prisma Schema** - `AutomationAuditLog` model with proper indexes
4. **DTOs** - Type-safe request/response definitions

## Features

### 1. Audit Log Creation (Immutable)

Audit logs are created automatically by automation services (e.g., `AutoApproveService`) and are **immutable** after creation.

```typescript
await auditLogService.createAuditLog({
  organisationId: 'org_123',
  action: 'invoice_auto_created',
  feature: 'invoices',
  mode: AutomationMode.FULL_AUTO,
  entityType: 'Invoice',
  entityId: 'inv_456',
  confidenceScore: 0.95,
  wasAutoApproved: true,
  inputData: { amount: 1500, category: 'Office Supplies' },
  outputData: { invoiceId: 'inv_456', status: 'approved' },
  userId: null, // null for fully automated
});
```

### 2. Querying Audit Logs

**Endpoint:** `GET /api/v1/organisations/:orgId/automation/audit-logs`

**Query Parameters:**
- `feature` - Filter by automation feature (invoices, expenses, etc.)
- `action` - Filter by specific action
- `entityType` - Filter by entity type (Invoice, Expense, etc.)
- `entityId` - Filter by specific entity ID
- `startDate` - Filter by date range start (ISO 8601)
- `endDate` - Filter by date range end (ISO 8601)
- `wasAutoApproved` - Filter by auto-approval status (boolean)
- `userId` - Filter by user who triggered action
- `page` - Page number (default: 1)
- `limit` - Items per page (1-100, default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "log_clxyz123456",
      "organisationId": "org_123",
      "action": "invoice_auto_created",
      "feature": "invoices",
      "mode": "FULL_AUTO",
      "entityType": "Invoice",
      "entityId": "inv_456",
      "confidenceScore": 0.95,
      "wasAutoApproved": true,
      "inputData": { "amount": 1500 },
      "outputData": { "invoiceId": "inv_456" },
      "user": null,
      "createdAt": "2025-12-01T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 3. Entity Audit Trail

Get complete audit history for a specific entity.

**Endpoint:** `GET /api/v1/organisations/:orgId/automation/audit-logs/entity/:entityType/:entityId`

**Example:**
```
GET /api/v1/organisations/org_123/automation/audit-logs/entity/Invoice/inv_456
```

**Response:**
```json
{
  "entityType": "Invoice",
  "entityId": "inv_456",
  "auditTrail": [
    {
      "id": "log_1",
      "action": "invoice_created",
      "createdAt": "2025-12-01T10:00:00Z"
    },
    {
      "id": "log_2",
      "action": "invoice_approved",
      "createdAt": "2025-12-01T10:05:00Z"
    }
  ],
  "totalEntries": 2
}
```

### 4. Automation Statistics

Get analytics on automation effectiveness.

**Endpoint:** `GET /api/v1/organisations/:orgId/automation/audit-logs/stats?period=week`

**Response:**
```json
{
  "totalAutomatedActions": 1234,
  "autoApprovedCount": 987,
  "manualOverrideCount": 247,
  "averageConfidenceScore": 0.89,
  "byFeature": {
    "invoices": 500,
    "expenses": 400,
    "classification": 334
  },
  "byMode": {
    "FULL_AUTO": 987,
    "SEMI_AUTO": 200,
    "MANUAL": 47
  },
  "period": "week",
  "startDate": "2025-11-24T00:00:00Z",
  "endDate": "2025-12-01T23:59:59Z"
}
```

### 5. Export for Compliance

Export audit logs in JSON or CSV format.

**Endpoint:** `GET /api/v1/organisations/:orgId/automation/audit-logs/export`

**Query Parameters:**
- `startDate` (required) - Export start date (ISO 8601)
- `endDate` (required) - Export end date (ISO 8601)
- `format` (required) - Export format: `json` or `csv`
- `feature` (optional) - Filter by feature
- `action` (optional) - Filter by action

**Rate Limit:** 5 requests per minute
**Max Date Range:** 1 year
**Max Records:** 10,000 per export

**Example:**
```
GET /api/v1/organisations/org_123/automation/audit-logs/export?startDate=2025-01-01&endDate=2025-12-31&format=csv
```

**CSV Output:**
```csv
ID,Created At,Feature,Action,Mode,Entity Type,Entity ID,Was Auto-Approved,Confidence Score,User Email,User Name
log_1,2025-12-01T10:30:00Z,invoices,invoice_auto_created,FULL_AUTO,Invoice,inv_456,Yes,0.95,System,System
```

### 6. User-Specific Actions

Users can view their own automation actions.

**Endpoint:** `GET /api/v1/organisations/:orgId/automation/audit-logs/my-actions`

Returns only audit logs where `userId` matches the authenticated user.

## Security & Access Control

### Permission Requirements

| Endpoint | Permission | Description |
|----------|-----------|-------------|
| `GET /audit-logs` | `AUDIT_READ` | Admins: all logs, Users: own actions |
| `GET /audit-logs/stats` | `AUDIT_READ` | Admin-only |
| `GET /audit-logs/export` | `AUDIT_EXPORT` | Admin-only, rate-limited |
| `GET /audit-logs/entity/:type/:id` | `AUDIT_READ` | Org members |
| `GET /audit-logs/my-actions` | None (authenticated) | Current user's actions |

### Access Patterns

1. **Admin Users:**
   - Can view all audit logs for their organisation
   - Can export audit logs
   - Can view statistics

2. **Regular Users:**
   - Can only view audit logs for actions they triggered
   - Cannot export or view statistics
   - Can view audit trail for entities they have access to

3. **System Actions:**
   - Fully automated actions have `userId: null`
   - Visible to admins only

### Security Features

- **Immutability:** Audit logs cannot be updated or deleted
- **Rate Limiting:** Export endpoint limited to 5 req/min
- **RBAC Guards:** Permission-based access control on all endpoints
- **Organisation Isolation:** Users can only access logs from their org
- **IP Tracking:** (Future) IP address and user agent logging

## Database Schema

```prisma
model AutomationAuditLog {
  id             String   @id @default(cuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id], onDelete: Cascade)

  action String // e.g., "invoice_auto_created", "expense_auto_approved"
  feature String // e.g., "invoices", "expenses", "tax"
  mode   AutomationMode

  entityType String // e.g., "Invoice", "Expense"
  entityId   String

  confidenceScore Float?  // AI confidence if applicable
  wasAutoApproved Boolean @default(false)

  inputData  Json? // What triggered the automation
  outputData Json? // What was created/modified

  userId String? // null if fully automated
  user   User?   @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@index([organisationId, createdAt])
  @@index([entityType, entityId])
  @@index([feature, action])
}
```

### Indexes

- `[organisationId, createdAt]` - Fast queries by org and time range
- `[entityType, entityId]` - Fast entity audit trail lookups
- `[feature, action]` - Fast filtering by automation type

## Integration with Other Services

### 1. AutoApproveService

The auto-approval service automatically creates audit logs:

```typescript
// In AutoApproveService
async autoApproveExpense(expense: Expense) {
  const decision = await this.makeApprovalDecision(expense);

  if (decision.approved) {
    await this.expenseService.approve(expense.id);

    // Create audit log
    await this.auditLogService.createAuditLog({
      organisationId: expense.organisationId,
      action: 'expense_auto_approved',
      feature: 'expenses',
      mode: AutomationMode.FULL_AUTO,
      entityType: 'Expense',
      entityId: expense.id,
      confidenceScore: decision.confidence,
      wasAutoApproved: true,
      inputData: { amount: expense.amount, category: expense.category },
      outputData: { status: 'approved' },
      userId: null,
    });
  }
}
```

### 2. Invoice Service

```typescript
// When invoice is auto-created
await this.auditLogService.createAuditLog({
  organisationId,
  action: 'invoice_auto_created',
  feature: 'invoices',
  mode: settings.invoiceAutomationMode,
  entityType: 'Invoice',
  entityId: invoice.id,
  wasAutoApproved: true,
  inputData: { transactionId, amount },
  outputData: { invoiceId: invoice.id },
  userId: null,
});
```

### 3. Tax Classification

```typescript
// When transaction is auto-classified
await this.auditLogService.createAuditLog({
  organisationId,
  action: 'transaction_auto_classified',
  feature: 'tax',
  mode: AutomationMode.FULL_AUTO,
  entityType: 'Transaction',
  entityId: transaction.id,
  confidenceScore: 0.92,
  wasAutoApproved: true,
  inputData: { description, amount },
  outputData: { category: 'Office Supplies', taxCode: '7%' },
  userId: null,
});
```

## Testing

Run tests:
```bash
pnpm test audit-log.service.spec.ts
```

### Test Coverage

- ✓ Query with pagination
- ✓ Apply filters correctly
- ✓ Validate pagination parameters
- ✓ Get entity audit trail
- ✓ Calculate statistics
- ✓ Create audit log entries
- ✓ Export validation (date range)
- ✓ Export as JSON
- ✓ Export as CSV

## Compliance & Reporting

### GoBD Compliance

The audit log system supports GoBD (German tax compliance) requirements:

- **Immutability:** Logs cannot be changed after creation
- **Completeness:** All automated actions are logged
- **Traceability:** Full audit trail for each entity
- **Export:** CSV/JSON export for auditor access
- **Retention:** Logs retained per legal requirements

### SOC 2 Compliance

- **Access Control:** RBAC-based access to audit logs
- **Activity Monitoring:** All automation actions tracked
- **Change Management:** Audit trail for all automated changes
- **Data Protection:** Organisation isolation enforced

## Performance Considerations

### Optimizations

1. **Indexes:** Strategically placed for common queries
2. **Pagination:** Enforced limit of 100 items per page
3. **Export Limits:** Max 10k records per export
4. **Rate Limiting:** Export endpoint throttled
5. **Selective Loading:** Only load necessary fields with `include`

### Scaling

For high-volume environments:
- Consider archiving old logs to separate table
- Use read replicas for audit log queries
- Implement caching for statistics endpoints
- Add CDC (Change Data Capture) for real-time analytics

## Future Enhancements

- [ ] IP address and user agent tracking
- [ ] Real-time audit log streaming (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Anomaly detection on audit patterns
- [ ] Integration with SIEM systems
- [ ] Automated compliance reporting
- [ ] Audit log archival system

## Files Created (W8-T7)

1. `audit-log.service.ts` - Core audit logging service
2. `audit-log.controller.ts` - REST API endpoints
3. `dto/audit-log.dto.ts` - Request/response DTOs
4. `dto/index.ts` - DTO exports
5. `audit-log.service.spec.ts` - Unit tests
6. `AUDIT_LOG_README.md` - This documentation

## Related Tasks

- **W8-T3:** AutomationSettings schema (VAULT)
- **W8-T4:** AutoApproveService (FORGE)
- **W8-T5:** AutomationIntegrationService (BRIDGE)
- **W8-T6:** Automation V2 controller (FORGE)

---

**Implemented by:** SENTINEL
**Date:** 2025-12-01
**Status:** ✓ Complete
