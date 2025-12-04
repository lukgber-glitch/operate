# QuickBooks Migration Wizard - Quick Start Guide

## Prerequisites

1. **Active QuickBooks Connection**
   - User must have connected QuickBooks OAuth
   - Connection status must be `CONNECTED`
   - Access tokens must be valid

2. **Database Models**
   - Ensure Prisma schema includes:
     - `QuickBooksMigration`
     - `QuickBooksMigrationError`
     - `QuickBooksEntityMapping`
     - Customer, Vendor, Product, Invoice, Payment models

3. **Module Registration**
   ```typescript
   // In app.module.ts
   import { QuickBooksMigrationModule } from './modules/migrations/quickbooks';

   @Module({
     imports: [
       // ... other modules
       QuickBooksMigrationModule,
     ],
   })
   export class AppModule {}
   ```

## Basic Usage

### Step 1: Start a Migration

```bash
curl -X POST http://localhost:3000/api/migrations/quickbooks/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entities": [
      "CUSTOMERS",
      "ITEMS",
      "INVOICES",
      "PAYMENTS"
    ],
    "conflictResolution": "SKIP",
    "batchSize": 100,
    "rateLimitDelay": 500,
    "includeInactive": false
  }'
```

**Response:**
```json
{
  "migrationId": "cm3x5y7z9abc123",
  "status": "IN_PROGRESS",
  "message": "Migration started successfully",
  "startedAt": "2024-12-04T10:00:00Z"
}
```

### Step 2: Monitor Progress

```bash
curl http://localhost:3000/api/migrations/quickbooks/status/cm3x5y7z9abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "cm3x5y7z9abc123",
  "status": "IN_PROGRESS",
  "percentComplete": 45.5,
  "totalItems": 1000,
  "processedItems": 455,
  "successfulItems": 450,
  "failedItems": 5,
  "progress": [
    {
      "entityType": "CUSTOMERS",
      "status": "COMPLETED",
      "totalItems": 250,
      "successfulItems": 248,
      "percentComplete": 100
    },
    {
      "entityType": "INVOICES",
      "status": "IN_PROGRESS",
      "totalItems": 500,
      "processedItems": 205,
      "percentComplete": 41
    }
  ],
  "estimatedTimeRemaining": 300000
}
```

### Step 3: Handle Completion

Migration completes automatically. Check final status:

```bash
curl http://localhost:3000/api/migrations/quickbooks/status/cm3x5y7z9abc123
```

**Completed Response:**
```json
{
  "id": "cm3x5y7z9abc123",
  "status": "COMPLETED",
  "percentComplete": 100,
  "totalItems": 1000,
  "successfulItems": 995,
  "failedItems": 5,
  "completedAt": "2024-12-04T10:15:32Z"
}
```

## Advanced Usage

### Pause and Resume

**Pause Migration:**
```bash
curl -X POST http://localhost:3000/api/migrations/quickbooks/pause/cm3x5y7z9abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resume Later:**
```bash
curl -X POST http://localhost:3000/api/migrations/quickbooks/resume/cm3x5y7z9abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Rollback Migration

```bash
curl -X POST http://localhost:3000/api/migrations/quickbooks/rollback/cm3x5y7z9abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "migrationId": "cm3x5y7z9abc123",
  "status": "ROLLED_BACK",
  "entitiesRolledBack": 995,
  "message": "Migration rolled back successfully"
}
```

### View Errors

```bash
curl http://localhost:3000/api/migrations/quickbooks/errors/cm3x5y7z9abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "entityType": "INVOICES",
    "entityId": "123",
    "error": "Customer not found for QB ID 456",
    "timestamp": "2024-12-04T10:12:45Z"
  }
]
```

## Configuration Options

### Entity Types

Choose which entities to migrate:

```typescript
enum MigrationEntityType {
  CUSTOMERS = 'CUSTOMERS',
  VENDORS = 'VENDORS',
  ITEMS = 'ITEMS',          // Products/Services
  INVOICES = 'INVOICES',
  BILLS = 'BILLS',          // Expenses
  PAYMENTS = 'PAYMENTS',
  ACCOUNTS = 'ACCOUNTS',    // Chart of Accounts
  TAX_RATES = 'TAX_RATES',
}
```

### Conflict Resolution

Handle existing entities:

```typescript
enum ConflictResolutionStrategy {
  SKIP = 'SKIP',              // Skip if exists (default)
  OVERWRITE = 'OVERWRITE',    // Replace existing
  MERGE = 'MERGE',            // Merge data (future)
  CREATE_NEW = 'CREATE_NEW',  // Create with suffix
}
```

### Date Range Filter

Only migrate specific date range (for transactional entities):

```json
{
  "dateRangeStart": "2024-01-01T00:00:00Z",
  "dateRangeEnd": "2024-12-31T23:59:59Z"
}
```

### Batch Size & Rate Limiting

```json
{
  "batchSize": 100,        // Items per batch (10-500)
  "rateLimitDelay": 500    // Milliseconds between API calls
}
```

## Frontend Integration

### React/Next.js Example

```typescript
import { useState, useEffect } from 'react';

function MigrationWizard() {
  const [migrationId, setMigrationId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  // Start migration
  const startMigration = async () => {
    const response = await fetch('/api/migrations/quickbooks/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        entities: ['CUSTOMERS', 'INVOICES'],
        conflictResolution: 'SKIP',
        batchSize: 100,
      }),
    });

    const data = await response.json();
    setMigrationId(data.migrationId);
  };

  // Poll for status
  useEffect(() => {
    if (!migrationId) return;

    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/migrations/quickbooks/status/${migrationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setStatus(data);

      // Stop polling if completed/failed
      if (['COMPLETED', 'FAILED', 'ROLLED_BACK'].includes(data.status)) {
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [migrationId]);

  return (
    <div>
      <button onClick={startMigration}>Start Migration</button>

      {status && (
        <div>
          <h3>Status: {status.status}</h3>
          <progress value={status.percentComplete} max={100} />
          <p>{status.percentComplete.toFixed(1)}% Complete</p>
          <p>
            {status.successfulItems} / {status.totalItems} items migrated
          </p>

          {status.progress.map((entityProgress) => (
            <div key={entityProgress.entityType}>
              <h4>{entityProgress.entityType}</h4>
              <progress
                value={entityProgress.percentComplete}
                max={100}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### WebSocket Integration (Real-time)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Listen for migration progress
socket.on('migration.progress', (event) => {
  console.log('Progress:', event.percentComplete);
  updateUI(event);
});

// Listen for completion
socket.on('migration.complete', (event) => {
  console.log('Migration completed!', event.result);
  showSuccessMessage(event.result);
});

// Start migration
startMigration().then(({ migrationId }) => {
  socket.emit('subscribe', `migration.${migrationId}`);
});
```

## Error Handling

### Common Errors

**1. No Active QuickBooks Connection**
```json
{
  "statusCode": 404,
  "message": "No active QuickBooks connection found"
}
```
**Solution:** User must connect QuickBooks first via OAuth.

**2. Another Migration In Progress**
```json
{
  "statusCode": 409,
  "message": "Another migration is already in progress"
}
```
**Solution:** Wait for current migration to complete, or pause it.

**3. QuickBooks Access Token Expired**
```json
{
  "statusCode": 400,
  "message": "QuickBooks access token expired. Please reconnect."
}
```
**Solution:** Refresh tokens or reconnect QuickBooks.

**4. Rate Limited**
- Migration automatically handles rate limits
- Retries after delay specified in response
- No action needed

### Retry Failed Entities

Failed entities don't stop migration. After completion:

1. Check errors endpoint
2. Review failed entities
3. Fix issues (e.g., missing dependencies)
4. Re-run migration with `OVERWRITE` strategy

## Performance Tips

### 1. Entity Order
Process entities in dependency order:
- Customers/Vendors first (required for invoices/bills)
- Items next (required for line items)
- Invoices/Bills/Payments last

### 2. Batch Sizing
- **Small entities** (Customers, Vendors): 200-500
- **Medium entities** (Items): 100-200
- **Large entities** (Invoices with line items): 50-100

### 3. Rate Limiting
- **Sandbox**: 500ms delay (120/min)
- **Production**: 200ms delay (300/min)

### 4. Date Range
- For large datasets, migrate in yearly chunks
- Reduces memory usage and improves reliability

### 5. Incremental Approach
1. First migration: Last 2 years
2. Second migration: Historical data
3. Ongoing: Use sync instead of migration

## Best Practices

### Pre-Migration Checklist
- [ ] Verify QuickBooks connection is active
- [ ] Backup Operate database
- [ ] Test migration with small date range
- [ ] Review conflict resolution strategy
- [ ] Inform users of maintenance window

### During Migration
- [ ] Monitor progress regularly
- [ ] Watch for errors in real-time
- [ ] Keep QuickBooks connection active
- [ ] Don't disconnect QuickBooks

### Post-Migration
- [ ] Review migration errors
- [ ] Verify critical entities migrated
- [ ] Test application functionality
- [ ] Update users on completion
- [ ] Archive migration logs

## Troubleshooting

### Migration Stuck?

**Check status:**
```bash
GET /migrations/quickbooks/status/:migrationId
```

**If truly stuck (rare):**
1. Note the `currentEntity` and `lastProcessedId`
2. Pause the migration
3. Check QuickBooks connection
4. Resume or start fresh with date range filter

### Too Many Errors?

**Review errors:**
```bash
GET /migrations/quickbooks/errors/:migrationId
```

**Common causes:**
- Missing dependencies (migrate in correct order)
- Invalid data in QuickBooks
- API timeouts (reduce batch size)

**Solution:**
1. Pause migration
2. Fix underlying issues
3. Rollback if needed
4. Restart with corrected configuration

### Performance Issues?

**Slow migration:**
- Reduce batch size
- Increase rate limit delay
- Check network latency
- Review database performance

**Memory issues:**
- Reduce batch size
- Use date range filters
- Process entities separately

## Security Considerations

1. **Access Tokens**
   - Never expose in client-side code
   - Always use server-side authentication
   - Tokens are encrypted at rest

2. **Authorization**
   - Verify user has permission for org
   - Check QuickBooks connection ownership
   - Audit log all migration actions

3. **Data Validation**
   - Validate all QuickBooks data
   - Sanitize inputs before database insert
   - Handle malformed data gracefully

## Support & Resources

- **API Documentation**: `/api/docs` (Swagger)
- **WebSocket Events**: See README.md
- **Database Schema**: See Prisma schema
- **Error Codes**: See types file

For issues, provide:
- Migration ID
- Organization ID
- Error messages
- Timeline of actions
