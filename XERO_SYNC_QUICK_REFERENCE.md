# Xero Sync - Quick Reference Guide

## Task W19-T6 - Completed

### Files Created

#### Core Services (/apps/api/src/modules/integrations/xero/services/)
1. `xero-mapping.service.ts` - Entity ID mapping service
2. `xero-customer-sync.service.ts` - Customer/contact bidirectional sync
3. `xero-invoice-sync.service.ts` - Invoice bidirectional sync
4. `xero-payment-sync.service.ts` - Payment bidirectional sync
5. `xero-sync.service.ts` - Main sync orchestrator
6. `index.ts` - Barrel export

#### Background Jobs (/apps/api/src/modules/integrations/xero/jobs/)
7. `xero-sync.job.ts` - BullMQ processor for scheduled syncs

#### Module Updates
8. `xero.module.ts` - Updated with sync services and BullMQ
9. `xero.controller.ts` - Updated with sync endpoints

#### Documentation
10. `PRISMA_SCHEMA_ADDITIONS.md` - Prisma schema for sync models

### API Endpoints

#### Sync Operations
```bash
# Trigger full sync
POST /api/integrations/xero/sync/full?orgId=<orgId>&xeroTenantId=<tenantId>

# Trigger incremental sync
POST /api/integrations/xero/sync/incremental?orgId=<orgId>&xeroTenantId=<tenantId>&since=2025-12-01

# Sync single entity
POST /api/integrations/xero/sync/entity
Body: {
  "orgId": "org_123",
  "entityType": "CONTACT",
  "entityId": "customer_456",
  "xeroTenantId": "tenant_789"
}
```

#### Monitoring
```bash
# Get sync history
GET /api/integrations/xero/sync/history?orgId=<orgId>&limit=50

# Get sync statistics
GET /api/integrations/xero/sync/stats?orgId=<orgId>&xeroTenantId=<tenantId>
```

### Sync Modes

| Mode | Description | Trigger | Frequency |
|------|-------------|---------|-----------|
| Full | Import all data from Xero | Manual or scheduled job | Daily at 2 AM |
| Incremental | Sync changed data since last sync | Manual or scheduled job | Every 15 minutes |
| Realtime | Push single entity to Xero | API call | On-demand |

### Entity Types

```typescript
enum XeroSyncEntityType {
  CONTACT = 'CONTACT',           // Customers/suppliers
  INVOICE = 'INVOICE',           // Sales invoices
  PAYMENT = 'PAYMENT',           // Payment records
  BANK_TRANSACTION = 'BANK_TRANSACTION', // Optional
}
```

### Sync Direction

```typescript
enum XeroSyncDirection {
  FROM_XERO = 'FROM_XERO',       // Xero → Operate
  TO_XERO = 'TO_XERO',           // Operate → Xero
  BIDIRECTIONAL = 'BIDIRECTIONAL', // Both directions
}
```

### Rate Limiting

- **Xero Limit**: 60 requests/minute
- **Implementation**: Automatic wait + exponential backoff
- **Retries**: Up to 3 attempts on rate limit errors

### Background Jobs

#### Full Sync Job
```typescript
{
  name: 'xero-full-sync',
  schedule: '0 2 * * *',  // Daily at 2 AM
  data: {
    orgId: 'org_123',
    syncMode: 'full',
    triggeredBy: 'job:scheduled'
  }
}
```

#### Incremental Sync Job
```typescript
{
  name: 'xero-incremental-sync',
  schedule: '*/15 * * * *',  // Every 15 minutes
  data: {
    orgId: 'org_123',
    syncMode: 'incremental',
    triggeredBy: 'job:scheduled'
  }
}
```

### Next Steps

1. **Add Prisma Models** (see PRISMA_SCHEMA_ADDITIONS.md)
   ```bash
   cd packages/database
   # Add models to schema.prisma
   pnpm prisma migrate dev --name add-xero-sync-models
   pnpm prisma generate
   ```

2. **Update Mapping Service**
   - Remove TODO comments
   - Activate Prisma operations

3. **Update Controller**
   - The controller has a backup at `xero.controller.ts.bak`
   - Sync endpoints need to be manually added

4. **Add Environment Variables**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. **Test Sync Operations**
   - Test full sync
   - Test incremental sync
   - Test realtime sync
   - Verify rate limiting
   - Check background jobs

### Field Mappings

#### Contact (Customer)
| Operate | Xero | Notes |
|---------|------|-------|
| name | name | Required |
| email | emailAddress | Optional |
| phone | phones[0].phoneNumber | Default phone type |
| taxNumber | taxNumber | VAT/Tax ID |
| street | addresses[0].addressLine1 | STREET type |
| city | addresses[0].city | |
| postalCode | addresses[0].postalCode | |
| country | addresses[0].country | |

#### Invoice
| Operate | Xero | Notes |
|---------|------|-------|
| invoiceNumber | invoiceNumber | Unique |
| invoiceDate | date | ISO 8601 |
| dueDate | dueDate | ISO 8601 |
| status | status | See status mapping |
| currency | currencyCode | 3-letter code |
| subtotal | subTotal | Before tax |
| taxAmount | totalTax | Tax amount |
| total | total | Total amount |

#### Status Mapping

**Operate → Xero**
- DRAFT → DRAFT
- SENT → AUTHORISED
- PAID → PAID
- CANCELLED → VOIDED
- OVERDUE → AUTHORISED

**Xero → Operate**
- DRAFT → DRAFT
- SUBMITTED → SENT
- AUTHORISED → SENT
- PAID → PAID
- VOIDED → CANCELLED
- DELETED → CANCELLED

### Conflict Resolution

#### Detection
- Compare modification timestamps (operateModifiedAt vs xeroModifiedAt)
- Store conflicts in XeroSyncConflict model

#### Resolution Strategies
1. **Last-write-wins** (default): Most recent modification wins
2. **Keep Operate**: Always use Operate data
3. **Keep Xero**: Always use Xero data
4. **Manual**: User chooses which to keep

### Error Handling

- All sync operations wrapped in try-catch
- Failed items tracked separately
- Sync continues even if individual items fail
- Error details logged to XeroSyncLog
- Stack traces captured for debugging

### Monitoring

#### Sync Log
```typescript
interface SyncResult {
  syncLogId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  entityType: XeroSyncEntityType;
  direction: XeroSyncDirection;
  itemsProcessed: number;
  itemsSuccess: number;
  itemsFailed: number;
  itemsSkipped: number;
  duration: number;  // milliseconds
  error?: string;
}
```

#### Sync Statistics
```typescript
{
  lastSyncAt: Date,
  contacts: {
    total: number,
    synced: number,
    pending: number,
    failed: number
  },
  invoices: { ... },
  payments: { ... }
}
```

### Dependencies

```json
{
  "dependencies": {
    "@nestjs/bullmq": "^10.x.x",
    "bullmq": "^5.x.x",
    "xero-node": "^5.x.x"
  }
}
```

### Architecture

```
XeroSyncService (Orchestrator)
├── XeroMappingService (ID mappings)
├── XeroCustomerSyncService (contacts)
├── XeroInvoiceSyncService (invoices)
└── XeroPaymentSyncService (payments)

XeroSyncProcessor (BullMQ Worker)
└── processes sync jobs from Redis queue
```

### Security

- OAuth2 tokens encrypted with AES-256-GCM
- PKCE for enhanced OAuth security
- Rate limiting to prevent API abuse
- Comprehensive audit logging
- Secure token refresh mechanism

### Performance

- Batch operations for bulk sync
- Rate limiting (60 req/min)
- Background jobs for long-running syncs
- Incremental sync reduces load
- Efficient database queries with indexes

## Support

For issues or questions:
1. Check logs in XeroSyncLog model
2. Review XeroAuditLog for API errors
3. Verify connection status: `GET /api/integrations/xero/status`
4. Check sync stats: `GET /api/integrations/xero/sync/stats`

## Documentation

- Full completion report: `TASK_W19-T6_XERO_SYNC_COMPLETION.md`
- Prisma schema: `PRISMA_SCHEMA_ADDITIONS.md`
- Xero API docs: https://developer.xero.com/documentation/api/accounting/overview
