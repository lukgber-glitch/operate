# Row-Level Security (RLS) Implementation

## Overview

This package implements PostgreSQL Row-Level Security (RLS) for tenant isolation in the Operate/CoachOS platform. RLS ensures that database queries are automatically filtered to only access data belonging to the current organization, providing a robust security layer at the database level.

## Architecture

### Components

1. **Migration SQL** (`prisma/migrations/20251128233757_rls_policies/migration.sql`)
   - Enables RLS on tenant-scoped tables
   - Creates policies for automatic data filtering
   - Uses PostgreSQL session variables for context

2. **RLS Helper Functions** (`src/rls.ts`)
   - Utilities for managing tenant context
   - Functions for bypass mode (system operations)
   - Context management helpers

3. **Prisma Middleware** (`src/middleware/tenant-context.ts`)
   - Automatically sets tenant context before queries
   - Integrates with AsyncLocalStorage or request context
   - Configurable skip logic for non-tenant tables

## Tenant-Scoped Tables

The following tables have RLS enabled:

- **Membership** - User memberships in organizations
- **AuditLog** - Audit trail entries for organizations

### Non-Tenant Tables

These tables are NOT protected by RLS (accessed at application layer):

- **Organisation** - The tenant entities themselves
- **User** - Users can belong to multiple organizations
- **Session** - User sessions (not org-specific)

## Usage

### 1. Basic Setup with AsyncLocalStorage (Recommended)

```typescript
import { AsyncLocalStorage } from 'async_hooks';
import { prisma, tenantContextMiddleware } from '@operate/database';

// Create AsyncLocalStorage for tenant context
const tenantStorage = new AsyncLocalStorage<{ orgId: string }>();

// Register middleware
prisma.$use(
  tenantContextMiddleware(() => tenantStorage.getStore()?.orgId || null)
);

// In your route handler (Express/Fastify)
app.get('/api/memberships', async (req, res) => {
  const orgId = req.user.currentOrgId;

  await tenantStorage.run({ orgId }, async () => {
    // All queries here are automatically scoped to orgId
    const memberships = await prisma.membership.findMany();
    res.json(memberships);
  });
});
```

### 2. Manual Tenant Context Management

```typescript
import { prisma, setTenantContext, clearTenantContext } from '@operate/database';

// Set tenant context
await setTenantContext(prisma, 'org-uuid-123');

// All queries now scoped to org-uuid-123
const memberships = await prisma.membership.findMany();
const auditLogs = await prisma.auditLog.findMany();

// Clear context
await clearTenantContext(prisma);
```

### 3. Temporary Context (Scoped Operations)

```typescript
import { prisma, withTenantContext } from '@operate/database';

// Execute queries with temporary tenant context
const memberCount = await withTenantContext(prisma, 'org-uuid-123', async () => {
  return await prisma.membership.count();
});

// Context is automatically restored after callback
```

### 4. System Operations (RLS Bypass)

```typescript
import { prisma, withRlsBypass } from '@operate/database';

// Bypass RLS for system/admin operations
const allMemberships = await withRlsBypass(prisma, async () => {
  // Can access data across ALL organizations
  return await prisma.membership.findMany({
    include: { organisation: true },
  });
});

// RLS is automatically re-enabled after callback
```

### 5. Advanced Middleware Configuration

```typescript
import { createTenantContextMiddleware } from '@operate/database';

const middleware = createTenantContextMiddleware({
  getTenantId: () => tenantStorage.getStore()?.orgId || null,

  // Custom skip logic
  shouldSkip: (params) => {
    // Skip for specific operations
    if (params.action === 'findFirst' && params.model === 'User') {
      return true;
    }
    return false;
  },

  // Enable debug logging
  debug: process.env.NODE_ENV === 'development',
});

prisma.$use(middleware);
```

## Security Considerations

### Best Practices

1. **Always Set Tenant Context**
   - Set tenant context at the request boundary (middleware/handler)
   - Never trust client-provided tenant IDs without authentication
   - Validate user has access to the organization

2. **Limit Bypass Usage**
   - Only use RLS bypass for legitimate system operations
   - Always disable bypass immediately after use
   - Log all bypass operations for audit trail
   - Consider implementing additional authorization checks

3. **Validate Organization Access**
   ```typescript
   // Before setting tenant context, verify user access
   async function setUserTenantContext(userId: string, orgId: string) {
     const membership = await prisma.membership.findUnique({
       where: { userId_orgId: { userId, orgId } },
     });

     if (!membership) {
       throw new Error('User does not have access to organization');
     }

     await setTenantContext(prisma, orgId);
   }
   ```

4. **Handle Edge Cases**
   - Handle queries that span multiple organizations (use bypass carefully)
   - Consider read-only vs read-write operations
   - Test migration rollback scenarios

### Common Pitfalls

1. **Forgetting to Set Context**
   ```typescript
   // BAD - No tenant context set
   const memberships = await prisma.membership.findMany();
   // Returns empty array (RLS blocks access)

   // GOOD - Context set via middleware or manually
   await setTenantContext(prisma, orgId);
   const memberships = await prisma.membership.findMany();
   ```

2. **Context in Background Jobs**
   ```typescript
   // Background jobs need explicit context
   async function processOrgData(orgId: string) {
     await withTenantContext(prisma, orgId, async () => {
       // Process org-specific data
       const logs = await prisma.auditLog.findMany();
       // ...
     });
   }
   ```

3. **Transaction Boundaries**
   ```typescript
   // Context must be set before transaction
   await setTenantContext(prisma, orgId);

   await prisma.$transaction(async (tx) => {
     // Context is preserved within transaction
     await tx.membership.create({ ... });
     await tx.auditLog.create({ ... });
   });
   ```

## Testing

### Unit Tests

```typescript
import { prisma, setTenantContext, clearTenantContext } from '@operate/database';

describe('RLS Tenant Isolation', () => {
  beforeEach(async () => {
    await clearTenantContext(prisma);
  });

  it('should only return memberships for current org', async () => {
    await setTenantContext(prisma, 'org-1');
    const memberships = await prisma.membership.findMany();

    expect(memberships.every(m => m.orgId === 'org-1')).toBe(true);
  });

  it('should block access without tenant context', async () => {
    const memberships = await prisma.membership.findMany();
    expect(memberships).toHaveLength(0);
  });
});
```

### Integration Tests

```typescript
describe('RLS Middleware Integration', () => {
  it('should automatically set context from AsyncLocalStorage', async () => {
    await tenantStorage.run({ orgId: 'org-1' }, async () => {
      const memberships = await prisma.membership.findMany();
      expect(memberships.every(m => m.orgId === 'org-1')).toBe(true);
    });
  });
});
```

## Migration

### Applying the Migration

```bash
# Using Prisma Migrate
cd packages/database
npx prisma migrate deploy

# Or apply manually
psql -d your_database -f prisma/migrations/20251128233757_rls_policies/migration.sql
```

### Rollback (if needed)

```sql
-- Disable RLS on tables
ALTER TABLE "Membership" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS membership_tenant_isolation ON "Membership";
DROP POLICY IF EXISTS auditlog_tenant_isolation ON "AuditLog";
```

### Verifying RLS is Active

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Membership', 'AuditLog');

-- View active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('Membership', 'AuditLog');
```

## Performance Considerations

### Indexing

The migration ensures that `orgId` columns are indexed for efficient filtering:

```sql
CREATE INDEX IF NOT EXISTS "Membership_orgId_idx" ON "Membership"("orgId");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");
```

### Query Planning

RLS policies are evaluated during query planning. PostgreSQL's query optimizer will use the `orgId` indexes when possible.

### Monitoring

Monitor query performance with RLS enabled:

```sql
-- Check query execution plan
EXPLAIN ANALYZE
SELECT * FROM "Membership"
WHERE "orgId" = current_setting('app.current_org_id', true)::uuid;
```

## API Reference

### RLS Helper Functions

- `setTenantContext(prisma, orgId)` - Set current organization context
- `clearTenantContext(prisma)` - Clear organization context
- `getTenantContext(prisma)` - Get current organization context
- `enableRlsBypass(prisma)` - Enable RLS bypass mode
- `disableRlsBypass(prisma)` - Disable RLS bypass mode
- `isRlsBypassed(prisma)` - Check if bypass is enabled
- `withTenantContext(prisma, orgId, callback)` - Execute with temporary context
- `withRlsBypass(prisma, callback)` - Execute with bypass enabled

### Middleware Functions

- `tenantContextMiddleware(getTenantId)` - Default middleware with sensible defaults
- `createTenantContextMiddleware(options)` - Custom middleware configuration
- `isTenantScopedModel(modelName)` - Check if model requires tenant context

## Troubleshooting

### Issue: Queries return empty results

**Cause:** No tenant context set

**Solution:**
```typescript
// Check current context
const context = await getTenantContext(prisma);
console.log('Current tenant:', context); // Should not be null

// Set context if missing
await setTenantContext(prisma, orgId);
```

### Issue: RLS policies not being applied

**Cause:** RLS may not be enabled or policies not created

**Solution:**
```bash
# Re-apply migration
npx prisma migrate deploy
```

### Issue: Permission denied errors

**Cause:** Database user lacks necessary permissions

**Solution:**
```sql
-- Grant permissions to app user
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
```

## Future Enhancements

- Add RLS policies for additional tenant-scoped tables as schema grows
- Implement fine-grained policies (e.g., role-based access within organization)
- Add audit logging for RLS bypass operations
- Create performance monitoring dashboard for RLS query impact
- Implement automatic tenant context detection from JWT tokens

## References

- [PostgreSQL Row-Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma Middleware Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [Node.js AsyncLocalStorage Documentation](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
