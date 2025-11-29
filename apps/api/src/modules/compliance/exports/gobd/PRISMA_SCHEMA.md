# Prisma Schema for GoBD Export Module

Add this model to your `packages/database/prisma/schema.prisma` file:

```prisma
/// GoBD Export records
/// Tracks GoBD-compliant exports for German tax audits
model GobdExport {
  /// Unique export identifier
  id          String    @id

  /// Organization ID
  orgId       String

  /// Export filename (ZIP archive)
  filename    String

  /// Export status: pending, processing, completed, ready, failed, downloaded, deleted
  status      String

  /// Start date of the exported data range
  startDate   DateTime

  /// End date of the exported data range
  endDate     DateTime

  /// Export creation timestamp
  createdAt   DateTime  @default(now())

  /// Export completion timestamp (when generation finished)
  completedAt DateTime?

  /// Expiration date (for automatic cleanup)
  expiresAt   DateTime

  /// File size in bytes
  fileSize    BigInt?

  /// Export metadata (JSON)
  /// Contains: totalFiles, totalSize, transactionCount, documentCount, archiveHash
  metadata    Json?

  /// Error message (if status is failed)
  error       String?

  /// Soft delete timestamp
  deletedAt   DateTime?

  /// Relation to organization
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  /// Indexes for query performance
  @@index([orgId])
  @@index([status])
  @@index([expiresAt])
  @@index([createdAt])

  @@map("gobd_exports")
}
```

## Add to Organization Model

Update your `Organization` model to include the relation:

```prisma
model Organization {
  // ... existing fields ...

  /// GoBD exports
  gobdExports GobdExport[]

  // ... rest of model ...
}
```

## Migration

After adding the model, create and run a migration:

```bash
cd packages/database
npx prisma migrate dev --name add_gobd_exports
```

## Example Queries

### Find exports for an organization
```typescript
const exports = await prisma.gobdExport.findMany({
  where: {
    orgId: 'org-123',
    deletedAt: null,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### Find expired exports
```typescript
const expired = await prisma.gobdExport.findMany({
  where: {
    expiresAt: {
      lt: new Date(),
    },
    deletedAt: null,
  },
});
```

### Update export status
```typescript
await prisma.gobdExport.update({
  where: { id: 'export-123' },
  data: {
    status: 'completed',
    completedAt: new Date(),
    fileSize: 1024000,
    metadata: {
      totalFiles: 100,
      totalSize: 1024000,
      transactionCount: 500,
      documentCount: 50,
      archiveHash: 'abc123...',
    },
  },
});
```

### Soft delete export
```typescript
await prisma.gobdExport.update({
  where: { id: 'export-123' },
  data: {
    status: 'deleted',
    deletedAt: new Date(),
  },
});
```

## Metadata Schema

The `metadata` JSON field contains:

```typescript
interface ExportMetadata {
  totalFiles: number;       // Total number of files in export
  totalSize: number;        // Total size in bytes
  transactionCount: number; // Number of transactions exported
  documentCount: number;    // Number of documents included
  archiveHash: string;      // SHA-256 hash of the ZIP archive
}
```

## Status Values

Valid status values:
- `pending` - Export queued for generation
- `processing` - Export is being generated
- `completed` - Export generation completed
- `ready` - Export is ready for download
- `failed` - Export generation failed
- `downloaded` - Export has been downloaded
- `deleted` - Export has been deleted (soft delete)
