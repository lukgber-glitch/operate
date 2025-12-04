# Hash Chain Service

GoBD-compliant hash chain service for immutable audit logging.

## Overview

The `HashChainService` implements a cryptographic hash chain to ensure the integrity and immutability of audit logs, meeting GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form) requirements for German tax compliance.

## Features

- **SHA-256 Hash Generation**: Each audit entry is hashed using SHA-256
- **Chain Integrity**: Each entry links to the previous hash, creating an immutable chain
- **Atomic Operations**: Uses Prisma transactions to ensure data consistency
- **Chain Verification**: Verify the integrity of the entire chain or specific ranges
- **Recovery Support**: Rebuild chain sequences after data corruption or migration

## Usage

### Creating Audit Entries

```typescript
import { HashChainService } from '@/modules/compliance/services';
import { AuditEntityType, AuditAction, AuditActorType } from '@prisma/client';

@Injectable()
export class MyService {
  constructor(private readonly hashChain: HashChainService) {}

  async updateEntity(tenantId: string, entityId: string) {
    // ... perform update ...

    // Create audit entry
    const auditLog = await this.hashChain.createEntry({
      tenantId,
      entityType: AuditEntityType.INVOICE,
      entityId,
      action: AuditAction.UPDATE,
      previousState: oldData,
      newState: newData,
      changes: { field: 'value' },
      actorType: AuditActorType.USER,
      actorId: userId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: { requestId: request.id },
    });
  }
}
```

### Verifying Chain Integrity

```typescript
// Verify entire chain for a tenant
const result = await hashChain.verifyChainIntegrity(tenantId);

if (!result.valid) {
  console.error('Chain integrity compromised:', result.error);
  console.error('First invalid entry:', result.firstInvalidEntryId);
}

// Verify specific range
const rangeResult = await hashChain.verifyChainIntegrity(tenantId, {
  startId: 'entry-123',
  endId: 'entry-456',
  stopOnFirstError: true,
});
```

### Getting Chain Statistics

```typescript
const stats = await hashChain.getChainStats(tenantId);
console.log(`Chain has ${stats.entryCount} entries`);
console.log(`Last hash: ${stats.lastHash}`);
```

### Rebuilding Chain Sequence

```typescript
// WARNING: Heavy operation - use only for recovery
await hashChain.rebuildChainSequence(tenantId);
```

## Hash Generation

The hash is generated from the following fields:

- `tenantId`: Organization identifier
- `entityType`: Type of entity being audited
- `entityId`: Entity identifier
- `action`: Action performed
- `previousState`: State before the action (optional)
- `newState`: State after the action (optional)
- `timestamp`: When the action occurred
- `previousHash`: Hash of the previous entry in the chain
- `actorType`: Type of actor (USER, SYSTEM, etc.)
- `actorId`: Actor identifier (optional)

## Database Schema

The service uses two Prisma models:

1. **AuditLog**: Stores individual audit entries with hash chain
2. **AuditLogSequence**: Tracks the last hash and entry count per tenant

## GoBD Compliance

This implementation meets GoBD requirements by:

1. **Immutability**: Hash chain ensures entries cannot be modified without detection
2. **Completeness**: All changes are logged with full state tracking
3. **Traceability**: Actor and timestamp information for all changes
4. **Verifiability**: Chain integrity can be verified at any time
5. **Security**: SHA-256 cryptographic hashing

## Error Handling

The service includes comprehensive error handling:

- Transaction rollback on failure
- Detailed error messages for chain verification
- Logging of all operations
- Safe handling of empty chains

## Performance Considerations

- Uses database indexes for efficient queries
- Atomic transactions prevent race conditions
- Chain verification can be expensive for large chains - use range verification for better performance
- Sequence tracking enables O(1) access to last hash

## Testing

See `__tests__/hash-chain.service.spec.ts` for unit tests and usage examples.

## Related

- `/modules/compliance/types/hash-chain.types.ts` - Type definitions
- `/packages/database/prisma/schema.prisma` - Database schema
- `/modules/compliance/compliance.module.ts` - Module registration
