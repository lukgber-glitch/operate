# QuickBooks Migration Wizard

Full-featured data migration system for importing QuickBooks Online data into Operate.

## Overview

The QuickBooks Migration Wizard provides a comprehensive solution for migrating data from QuickBooks Online to Operate. It handles:

- **8 Entity Types**: Customers, Vendors, Items, Invoices, Bills, Payments, Accounts, Tax Rates
- **Conflict Resolution**: Skip, Overwrite, Merge, or Create New
- **Progress Tracking**: Real-time WebSocket updates
- **Pausable/Resumable**: Stop and continue migrations
- **Rollback**: Undo migrations completely
- **Rate Limiting**: Respects QuickBooks API limits
- **Error Handling**: Detailed error logging and recovery

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          QuickBooksMigrationController              │
│  (REST API Endpoints)                               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│        QuickBooksMigrationService                   │
│  (Orchestration & State Management)                 │
└──┬──────────────┬──────────────────┬────────────────┘
   │              │                  │
   ▼              ▼                  ▼
┌─────────┐  ┌──────────┐  ┌────────────────┐
│ Fetcher │  │  Mapper  │  │  EventEmitter  │
│ Service │  │ Service  │  │  (WebSocket)   │
└─────────┘  └──────────┘  └────────────────┘
```

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `quickbooks-migration.service.ts` | 869 | Main orchestrator |
| `quickbooks-data-fetcher.service.ts` | 400+ | API data fetching |
| `quickbooks-mapper.service.ts` | 550+ | Entity mapping |
| `quickbooks-migration.controller.ts` | 330+ | REST endpoints |
| `quickbooks-migration.types.ts` | 365+ | TypeScript types |
| `quickbooks-migration.dto.ts` | 450+ | Request/response DTOs |

## API Endpoints

### Start Migration
```http
POST /migrations/quickbooks/start
```

**Request Body:**
```json
{
  "entities": ["CUSTOMERS", "INVOICES", "PAYMENTS"],
  "conflictResolution": "SKIP",
  "batchSize": 50,
  "rateLimitDelay": 500,
  "includeInactive": false,
  "dateRangeStart": "2023-01-01T00:00:00Z",
  "dateRangeEnd": "2024-12-31T23:59:59Z",
  "fieldMappings": {
    "customField1": "operate_field_1"
  }
}
```

**Response:**
```json
{
  "migrationId": "cm123456789",
  "status": "IN_PROGRESS",
  "config": { ... },
  "startedAt": "2024-12-04T10:00:00Z",
  "message": "Migration started successfully"
}
```

### Get Status
```http
GET /migrations/quickbooks/status/:migrationId
```

**Response:**
```json
{
  "id": "cm123456789",
  "status": "IN_PROGRESS",
  "progress": [
    {
      "entityType": "CUSTOMERS",
      "status": "COMPLETED",
      "totalItems": 150,
      "processedItems": 150,
      "successfulItems": 148,
      "failedItems": 2,
      "skippedItems": 0,
      "percentComplete": 100
    }
  ],
  "totalItems": 500,
  "processedItems": 250,
  "percentComplete": 50,
  "estimatedTimeRemaining": 180000
}
```

### Pause Migration
```http
POST /migrations/quickbooks/pause/:migrationId
```

### Resume Migration
```http
POST /migrations/quickbooks/resume/:migrationId
```

### Rollback Migration
```http
POST /migrations/quickbooks/rollback/:migrationId
```

**Response:**
```json
{
  "migrationId": "cm123456789",
  "status": "ROLLED_BACK",
  "entitiesRolledBack": 250,
  "message": "Migration rolled back successfully"
}
```

### List Migrations
```http
GET /migrations/quickbooks/list?status=COMPLETED&limit=20&offset=0
```

### Get Errors
```http
GET /migrations/quickbooks/errors/:migrationId
```

## Entity Processing Order

Entities are processed in dependency order:

1. **Accounts** - Chart of accounts (dependencies for others)
2. **Tax Rates** - Tax codes and rates
3. **Customers** - Required for invoices/payments
4. **Vendors** - Required for bills
5. **Items** - Products/services (for line items)
6. **Invoices** - Customer invoices with line items
7. **Bills** - Vendor bills/expenses
8. **Payments** - Payment applications

## Conflict Resolution Strategies

### SKIP (Default)
- If entity exists, skip it
- No changes to existing data
- Fastest option

### OVERWRITE
- Replace existing entity completely
- Updates all fields
- Use with caution

### MERGE
- Combine new data with existing
- Currently same as OVERWRITE
- Future: Smart field-level merging

### CREATE_NEW
- Create duplicate with suffix
- Example: "Customer ABC (QB Import)"
- Preserves both versions

## Features

### 1. Rate Limiting
- Configurable delay between API calls
- Handles 429 (rate limit) responses
- Auto-retry with backoff

### 2. Batch Processing
- Processes entities in configurable batch sizes
- Default: 50 items per batch
- Range: 10-500

### 3. Progress Tracking
- Real-time WebSocket updates
- Per-entity progress
- Overall completion percentage
- Estimated time remaining

### 4. Error Handling
- Continues on individual entity failures
- Logs detailed error information
- Stores failed entity data for retry
- Error endpoint for debugging

### 5. Resumable Migrations
- Pause at any time
- State persisted to database
- Resume from last processed entity
- Maintains position in batch

### 6. Rollback Capability
- Tracks all created entities
- Deletes in reverse dependency order
- Removes entity mappings
- Atomic operation per entity type

### 7. Entity Mapping
- Creates QuickBooksEntityMapping records
- Links QB ID to Operate ID
- Enables future bi-directional sync
- Stores sync tokens for updates

## WebSocket Events

### migration.progress
Emitted during migration with progress updates.

```typescript
{
  migrationId: string;
  status: MigrationStatus;
  currentEntity?: MigrationEntityType;
  progress: EntityMigrationProgress[];
  percentComplete: number;
  estimatedTimeRemaining?: number;
}
```

### migration.complete
Emitted when migration completes.

```typescript
{
  migrationId: string;
  result: MigrationResult;
}
```

## Database Schema

### QuickBooksMigration
- Stores migration metadata
- Tracks overall progress
- Contains configuration
- Rollback points

### QuickBooksMigrationError
- Individual entity errors
- Includes failed entity data
- Timestamp and error codes
- Links to migration

### QuickBooksEntityMapping
- Maps QB ID to Operate ID
- Stores sync tokens
- Entity metadata
- Last sync timestamp

## Usage Example

```typescript
// Start migration
const migration = await migrationService.startMigration(
  orgId,
  userId,
  {
    entities: [
      MigrationEntityType.CUSTOMERS,
      MigrationEntityType.INVOICES,
    ],
    conflictResolution: ConflictResolutionStrategy.SKIP,
    batchSize: 100,
    rateLimitDelay: 500,
    includeInactive: false,
  }
);

// Monitor progress
const status = await migrationService.getMigrationStatus(
  migration.migrationId
);

console.log(`Progress: ${status.percentComplete}%`);
console.log(`ETA: ${status.estimatedTimeRemaining}ms`);

// Pause if needed
await migrationService.pauseMigration(migration.migrationId);

// Resume later
await migrationService.resumeMigration(migration.migrationId);

// Rollback if needed
await migrationService.rollbackMigration(migration.migrationId);
```

## Error Recovery

Failed entities are logged but don't stop migration:

```typescript
// Get errors
const errors = await migrationService.getMigrationErrors(
  migrationId
);

// Retry failed entities
for (const error of errors) {
  console.log(`Failed ${error.entityType}: ${error.entityId}`);
  console.log(`Reason: ${error.error}`);
  // Stored entity data available for manual review/retry
}
```

## Performance

- **Batch Size**: Tune based on entity complexity
  - Simple entities (Customers): 200-500
  - Complex entities (Invoices): 50-100

- **Rate Limiting**: QuickBooks limits
  - Sandbox: ~100 requests/minute
  - Production: ~500 requests/minute

- **Typical Times** (500 entities each):
  - Customers: 2-3 minutes
  - Invoices: 5-7 minutes
  - Total migration: 15-20 minutes

## Future Enhancements

- [ ] Incremental sync (delta updates)
- [ ] Bi-directional sync (Operate → QuickBooks)
- [ ] Field-level conflict resolution
- [ ] Custom entity transformations
- [ ] Migration templates/presets
- [ ] Automatic retry of failed entities
- [ ] Migration scheduling
- [ ] Data validation rules
- [ ] Custom webhooks for events

## Testing

```bash
# Unit tests
npm test quickbooks-migration

# Integration tests
npm test:e2e quickbooks-migration

# Load tests
npm run test:load quickbooks-migration
```

## Monitoring

Use Prisma Studio or database queries to monitor:

```sql
-- Active migrations
SELECT * FROM "QuickBooksMigration"
WHERE status IN ('PENDING', 'IN_PROGRESS', 'PAUSED')
ORDER BY "startedAt" DESC;

-- Recent errors
SELECT * FROM "QuickBooksMigrationError"
WHERE "migrationId" = 'cm123456789'
ORDER BY timestamp DESC
LIMIT 100;

-- Success rate
SELECT
  status,
  COUNT(*) as count,
  AVG("successfulItems"::float / NULLIF("totalItems", 0)) as success_rate
FROM "QuickBooksMigration"
GROUP BY status;
```

## Support

For issues or questions:
1. Check migration errors endpoint
2. Review migration status
3. Check QuickBooks connection status
4. Verify API rate limits
5. Contact support with migration ID
