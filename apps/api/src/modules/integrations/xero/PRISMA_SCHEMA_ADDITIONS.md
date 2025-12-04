# Xero Sync Prisma Schema Additions

Add these models to `packages/database/prisma/schema.prisma` to support Xero bidirectional sync.

## Enums

```prisma
// Xero Sync Entity Types
enum XeroSyncEntityType {
  CONTACT
  INVOICE
  PAYMENT
  BANK_TRANSACTION
}

// Xero Sync Direction
enum XeroSyncDirection {
  FROM_XERO
  TO_XERO
  BIDIRECTIONAL
}

// Xero Sync Status
enum XeroSyncStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  PARTIAL
}
```

## Models

```prisma
// Xero Sync Mapping
// Tracks ID mappings between Xero and Operate entities
model XeroSyncMapping {
  id           String              @id @default(uuid())
  connectionId String
  orgId        String

  // Entity information
  entityType XeroSyncEntityType
  operateId  String // Operate entity ID
  xeroId     String // Xero entity ID

  // Sync metadata
  lastSyncAt     DateTime
  lastModifiedAt DateTime
  syncVersion    Int      @default(1) // Incremented on each sync
  metadata       Json     @default("{}") // Store additional mapping data

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  connection XeroConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  // Indexes
  @@unique([connectionId, entityType, operateId])
  @@unique([connectionId, entityType, xeroId])
  @@index([orgId])
  @@index([entityType])
  @@index([lastSyncAt])
  @@map("xero_sync_mappings")
}

// Xero Sync Log
// Tracks all sync operations with detailed results
model XeroSyncLog {
  id           String           @id @default(uuid())
  connectionId String
  orgId        String

  // Sync operation details
  syncType   XeroSyncEntityType
  direction  XeroSyncDirection
  status     XeroSyncStatus     @default(IN_PROGRESS)
  syncMode   String // 'full', 'incremental', 'realtime'
  triggeredBy String? // user ID or 'job:id'

  // Sync progress
  itemsProcessed Int @default(0)
  itemsSuccess   Int @default(0)
  itemsFailed    Int @default(0)
  itemsSkipped   Int @default(0)

  // Timing
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  duration    Int? // milliseconds

  // Results
  changesSummary Json? // { created: X, updated: Y, failed: Z, errors: [...] }
  error          String?
  errorDetails   Json?

  // Relations
  connection XeroConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([connectionId])
  @@index([orgId])
  @@index([syncType])
  @@index([status])
  @@index([startedAt])
  @@map("xero_sync_logs")
}

// Xero Sync Conflict
// Tracks conflicts when both sides have been modified
model XeroSyncConflict {
  id           String              @id @default(uuid())
  connectionId String
  orgId        String

  // Entity information
  entityType       XeroSyncEntityType
  operateId        String
  xeroId           String

  // Conflict details
  operateData      Json // Current Operate data
  xeroData         Json // Current Xero data
  operateModifiedAt DateTime
  xeroModifiedAt    DateTime

  // Resolution
  status       String @default("PENDING") // PENDING, RESOLVED, IGNORED
  resolvedBy   String? // user ID
  resolvedAt   DateTime?
  resolution   String? // KEEP_OPERATE, KEEP_XERO, MANUAL_MERGE
  resolvedData Json?

  // Timestamps
  detectedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  connection XeroConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([connectionId])
  @@index([orgId])
  @@index([status])
  @@index([detectedAt])
  @@map("xero_sync_conflicts")
}
```

## Update XeroConnection Model

Add these relations to the existing `XeroConnection` model:

```prisma
model XeroConnection {
  // ... existing fields ...

  // Relations
  auditLogs    XeroAuditLog[]
  syncMappings XeroSyncMapping[]
  syncLogs     XeroSyncLog[]
  syncConflicts XeroSyncConflict[]

  // ... rest of model ...
}
```

## Migration Command

After adding these models to the schema, run:

```bash
pnpm prisma migrate dev --name add-xero-sync-models
pnpm prisma generate
```

## Notes

1. **XeroSyncMapping**: Maintains the bidirectional mapping between Operate and Xero entity IDs
2. **XeroSyncLog**: Comprehensive logging of all sync operations for auditing and debugging
3. **XeroSyncConflict**: Conflict detection and resolution when both systems have modified the same entity
4. **Indexes**: Optimized for common query patterns (filtering by connection, entity type, status, date)
5. **Cascade Delete**: All sync-related data is deleted when connection is removed

## Implementation Status

The following services have been created and are ready to use once the Prisma models are added:

- `XeroMappingService`: Entity mapping service (uses XeroSyncMapping)
- `XeroCustomerSyncService`: Customer/Contact sync
- `XeroInvoiceSyncService`: Invoice sync
- `XeroPaymentSyncService`: Payment sync
- `XeroSyncService`: Main sync orchestrator (uses XeroSyncLog)
- `XeroSyncProcessor`: BullMQ job processor for scheduled syncs

The services currently have placeholder implementations for Prisma operations that will be activated once the schema is migrated.
