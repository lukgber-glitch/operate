# Prisma Schema Additions for freee Integration

Add the following models to your Prisma schema file:

```prisma
// ==================== freee Integration ====================

/// freee connection configuration and token storage
/// Stores OAuth2 tokens and connection metadata for freee API
model FreeeConnection {
  id                     String   @id @default(cuid())

  // Organization reference
  orgId                  String

  // freee company information
  freeeCompanyId         Int
  freeeCompanyName       String?

  // Encrypted access token (AES-256-GCM)
  accessToken            String   @db.Text
  accessTokenIv          Bytes    // Initialization vector
  accessTokenTag         Bytes    // Authentication tag

  // Encrypted refresh token (AES-256-GCM)
  refreshToken           String   @db.Text
  refreshTokenIv         Bytes    // Initialization vector
  refreshTokenTag        Bytes    // Authentication tag

  // Token expiry times
  tokenExpiresAt         DateTime
  refreshTokenExpiresAt  DateTime

  // Connection status
  status                 String   @default("CONNECTED") // CONNECTED, DISCONNECTED, EXPIRED, ERROR
  lastSyncAt             DateTime?
  lastError              String?  @db.Text

  // Timestamps
  connectedAt            DateTime @default(now())
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([orgId, freeeCompanyId])
  @@index([orgId])
  @@index([status])
  @@index([freeeCompanyId])
  @@map("freee_connections")
}

/// freee API audit log
/// Comprehensive logging of all freee API interactions
model FreeeAuditLog {
  id           String   @id @default(cuid())

  // Organization reference
  orgId        String

  // Action details
  action       String   // e.g., 'oauth_connected', 'partner_created', 'invoice_synced'
  endpoint     String?  // API endpoint called
  statusCode   Int?     // HTTP status code
  success      Boolean  // Whether the operation succeeded
  errorMessage String?  @db.Text

  // Request tracking
  requestId    String?  // freee API request ID (if available)
  ipAddress    String?
  userAgent    String?

  // Additional metadata
  metadata     Json?    // Flexible JSON field for extra context

  // Timestamp
  createdAt    DateTime @default(now())

  @@index([orgId])
  @@index([createdAt])
  @@index([action])
  @@index([success])
  @@map("freee_audit_logs")
}

/// freee sync jobs tracking
/// Track background synchronization jobs
model FreeeSyncJob {
  id                String   @id @default(cuid())

  // Organization and company
  orgId             String
  freeeCompanyId    Int

  // Job configuration
  direction         String   // IMPORT, EXPORT, BIDIRECTIONAL
  entityTypes       String[] // ['partners', 'invoices', 'deals']
  fullSync          Boolean  @default(false)
  sinceDate         DateTime?

  // Job status
  status            String   @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, FAILED
  progress          Int      @default(0) // 0-100

  // Results
  entitiesSynced    Json?    // { partners: 10, invoices: 5, deals: 3 }
  errors            Json?    // Array of error messages

  // Timestamps
  startedAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([orgId])
  @@index([freeeCompanyId])
  @@index([status])
  @@index([createdAt])
  @@map("freee_sync_jobs")
}
```

## Migration Commands

After adding the models to your schema:

```bash
# Create migration
npx prisma migrate dev --name add_freee_integration

# Generate Prisma client
npx prisma generate

# Apply migration to production
npx prisma migrate deploy
```

## Database Indexes

The following indexes are created to optimize query performance:

### FreeeConnection
- `orgId` - Fast lookup by organization
- `status` - Filter by connection status
- `freeeCompanyId` - Lookup by freee company
- Unique constraint on `[orgId, freeeCompanyId]` - One connection per org-company pair

### FreeeAuditLog
- `orgId` - Filter logs by organization
- `createdAt` - Time-based queries
- `action` - Filter by action type
- `success` - Filter successful/failed operations

### FreeeSyncJob
- `orgId` - Filter jobs by organization
- `freeeCompanyId` - Filter jobs by company
- `status` - Filter by job status
- `createdAt` - Time-based queries

## Storage Estimates

Based on typical usage:

### FreeeConnection
- ~500 bytes per connection
- 1,000 connections = ~500 KB
- 10,000 connections = ~5 MB

### FreeeAuditLog
- ~1 KB per log entry
- 100,000 logs = ~100 MB
- Consider implementing log rotation/archival after 90 days

### FreeeSyncJob
- ~2 KB per job (including results)
- 10,000 jobs = ~20 MB

## Security Notes

1. **Encrypted Tokens**: Access and refresh tokens are encrypted using AES-256-GCM
2. **IV and Tag Storage**: Each encrypted token has its own IV and authentication tag
3. **Master Key**: Store `FREEE_ENCRYPTION_KEY` securely (min 32 characters)
4. **Token Rotation**: Tokens are automatically refreshed before expiry
5. **Audit Trail**: All operations are logged for compliance and troubleshooting

## Maintenance

### Cleanup Old Audit Logs

```sql
-- Delete audit logs older than 90 days
DELETE FROM freee_audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Cleanup Expired Connections

```sql
-- Mark connections as expired if refresh token expired
UPDATE freee_connections
SET status = 'EXPIRED'
WHERE refresh_token_expires_at < NOW()
AND status = 'CONNECTED';
```

### Archive Old Sync Jobs

```sql
-- Delete completed sync jobs older than 30 days
DELETE FROM freee_sync_jobs
WHERE status = 'COMPLETED'
AND completed_at < NOW() - INTERVAL '30 days';
```
