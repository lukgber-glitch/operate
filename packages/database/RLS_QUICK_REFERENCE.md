# RLS Quick Reference Card

## 🚀 Quick Start

```typescript
import { prisma, setTenantContext } from '@operate/database';

// Set organization context
await setTenantContext(prisma, orgId);

// All queries now automatically filtered to this org
const memberships = await prisma.membership.findMany();
```

## 📦 Core Functions

| Function | Use Case | Example |
|----------|----------|---------|
| `setTenantContext(prisma, orgId)` | Set current org | `await setTenantContext(prisma, 'org-123')` |
| `clearTenantContext(prisma)` | Clear org context | `await clearTenantContext(prisma)` |
| `getTenantContext(prisma)` | Get current org | `const orgId = await getTenantContext(prisma)` |
| `withTenantContext(prisma, orgId, fn)` | Scoped operation | `await withTenantContext(prisma, 'org-123', async () => {...})` |
| `withRlsBypass(prisma, fn)` | Admin operation | `await withRlsBypass(prisma, async () => {...})` |

## 🛡️ Protected Tables

| Table | RLS Enabled | Filtered By |
|-------|-------------|-------------|
| Membership | ✅ | orgId |
| AuditLog | ✅ | orgId |
| User | ❌ | N/A (not org-scoped) |
| Organisation | ❌ | N/A (tenant entity) |
| Session | ❌ | N/A (user-scoped) |

## 🔧 Middleware Setup

```typescript
import { AsyncLocalStorage } from 'async_hooks';
import { prisma, tenantContextMiddleware } from '@operate/database';

// Create storage
const tenantStorage = new AsyncLocalStorage<{ orgId: string }>();

// Register middleware (once at app startup)
prisma.$use(
  tenantContextMiddleware(() => tenantStorage.getStore()?.orgId || null)
);

// Use in request handler
app.use((req, res, next) => {
  const orgId = req.user.currentOrgId;
  tenantStorage.run({ orgId }, () => next());
});
```

## 🎯 Common Patterns

### Pattern 1: Basic Usage
```typescript
await setTenantContext(prisma, orgId);
const data = await prisma.membership.findMany();
```

### Pattern 2: Scoped Operation
```typescript
const count = await withTenantContext(prisma, orgId, async () => {
  return await prisma.membership.count();
});
```

### Pattern 3: Admin Dashboard
```typescript
const stats = await withRlsBypass(prisma, async () => {
  return {
    orgs: await prisma.organisation.count(),
    members: await prisma.membership.count(),
  };
});
```

### Pattern 4: Transaction
```typescript
await setTenantContext(prisma, orgId);
await prisma.$transaction(async (tx) => {
  const member = await tx.membership.create({...});
  await tx.auditLog.create({...});
});
```

## ⚠️ Important Notes

### DO ✅
- Always set tenant context before queries
- Use middleware for automatic context management
- Test RLS isolation in your app
- Log bypass operations for audit

### DON'T ❌
- Don't trust client-provided org IDs without validation
- Don't use bypass for regular operations
- Don't forget to clear context in tests
- Don't add manual WHERE orgId clauses (RLS handles it)

## 🧪 Testing

```bash
# Run RLS tests
npm test

# Run with coverage
npm test -- --coverage

# Verify RLS in database
psql $DATABASE_URL -f scripts/verify-rls.sql
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Queries return empty | Set tenant context: `setTenantContext(prisma, orgId)` |
| Context not working | Check RLS enabled: `SELECT * FROM pg_tables WHERE rowsecurity = true` |
| Need cross-org access | Use bypass: `withRlsBypass(prisma, async () => {...})` |
| Tests failing | Clear context in `beforeEach`: `clearTenantContext(prisma)` |

## 📚 Full Documentation

- **Implementation**: `RLS_IMPLEMENTATION.md`
- **Testing**: `RLS_TESTING.md`
- **Examples**: `examples/rls-usage.example.ts`
- **Report**: `OP-005_IMPLEMENTATION_REPORT.md`

## 🔍 Verification

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('Membership', 'AuditLog');

-- Check policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('Membership', 'AuditLog');
```

## 🚨 Security Checklist

- [ ] Tenant context set in auth middleware
- [ ] User has access to org before setting context
- [ ] Bypass only used for admin operations
- [ ] Bypass operations are logged
- [ ] RLS tests passing in CI/CD
- [ ] No manual WHERE orgId clauses in code

---

**Version**: 1.0 | **Last Updated**: 2025-11-28
