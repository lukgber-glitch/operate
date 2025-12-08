# Migration Guide: DB-003 + DB-007 Cascade Rules Fix

## Quick Reference

```bash
# 1. Review changes
git diff packages/database/prisma/schema.prisma

# 2. Generate migration
cd packages/database
npx prisma migrate dev --name fix-cascade-rules-db003 --create-only

# 3. Review migration SQL
cat prisma/migrations/*/migration.sql

# 4. Apply migration
npx prisma migrate dev

# 5. Verify
npx prisma generate
npm run test:db
```

## Changes Summary

### 26 Relations Fixed

#### Cascade (8 relations)
Deleting parent deletes children:

- Membership.user → User
- Membership.organisation → Organisation
- Session.user → User
- AuditLog.organisation → Organisation
- Bill.organisation → Organisation
- ScheduledPayment.bill → Bill
- AmlScreening.organisation → Organisation
- All org-scoped data cascades with org deletion

#### SetNull (13 relations)
Deleting parent sets foreign key to null:

- Employee.user
- LeaveRequest.reviewer
- TimeEntry.approver
- PayrollPeriod.processor
- TransactionClassificationReview.reviewer
- DeductionSuggestion (confirmer, rejecter, modifier)
- FraudAlert.resolver
- FraudAuditLog.performer
- AutomationAuditLog.user
- UsageEvent.user
- AmlScreening.user
- Document.folder
- DocumentFolder.parent
- Invoice.recurringInvoice
- ReceiptScan.expense

#### Restrict (5 relations)
Prevents deletion if children exist:

- Invoice.client → Client
- Bill.vendor → Vendor
- RecurringInvoice.customer → Customer
- RecurringInvoice.createdBy → User
- CorrectionRecord.user → User
- ScheduledPayment.bankAccount → BankAccount

## Expected Migration SQL

```sql
-- SetNull foreign keys
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_userId_fkey";
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest" DROP CONSTRAINT IF EXISTS "LeaveRequest_reviewedBy_fkey";
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Cascade foreign keys
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_userId_fkey";
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Restrict foreign keys
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_clientId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Bill" DROP CONSTRAINT IF EXISTS "Bill_vendorId_fkey";
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ... (21 more similar alterations)
```

## Pre-Migration Checks

### 1. Check for Orphaned Records

Run these queries to find potential migration failures:

```sql
-- Orphaned employees (userId doesn't exist)
SELECT e.id, e.userId, e.email
FROM "Employee" e
LEFT JOIN "User" u ON e."userId" = u.id
WHERE e."userId" IS NOT NULL AND u.id IS NULL;

-- Orphaned invoices (clientId doesn't exist)
SELECT i.id, i."clientId", i.number
FROM "Invoice" i
LEFT JOIN "Client" c ON i."clientId" = c.id
WHERE i."clientId" IS NOT NULL AND c.id IS NULL;

-- Orphaned bills (vendorId doesn't exist)
SELECT b.id, b."vendorId", b."billNumber"
FROM "Bill" b
LEFT JOIN "Vendor" v ON b."vendorId" = v.id
WHERE b."vendorId" IS NOT NULL AND v.id IS NULL;

-- Orphaned sessions (userId doesn't exist)
SELECT s.id, s."userId"
FROM "Session" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL;
```

### 2. Clean Orphaned Records

If orphans found, clean them:

```sql
-- Clean orphaned sessions (safe - sessions expire)
DELETE FROM "Session" s
WHERE NOT EXISTS (
  SELECT 1 FROM "User" u WHERE u.id = s."userId"
);

-- Clean orphaned invoices - BE CAREFUL
-- Better to fix the clientId reference than delete
UPDATE "Invoice" SET "clientId" = NULL
WHERE "clientId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Client" c WHERE c.id = "Invoice"."clientId"
  );
```

## Migration Steps

### Development Environment

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_before_cascade_fix.sql

# 2. Review schema changes
git diff packages/database/prisma/schema.prisma

# 3. Generate migration (creates SQL, doesn't apply)
cd packages/database
npx prisma migrate dev --name fix-cascade-rules-db003 --create-only

# 4. Review generated SQL
cat prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql

# 5. Apply migration
npx prisma migrate dev

# 6. Generate Prisma Client
npx prisma generate

# 7. Test cascade behavior
npm run test:db:cascade
```

### Production Environment

```bash
# 1. Backup database
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on staging database first
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 3. Verify staging works
# Run application tests

# 4. Apply to production during maintenance window
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy

# 5. Verify production
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate status
```

## Post-Migration Verification

### 1. Test Cascade Deletion

```typescript
// Test 1: User deletion cascades sessions
const user = await prisma.user.create({
  data: { email: 'test@example.com', firstName: 'Test', lastName: 'User' }
});

const session = await prisma.session.create({
  data: { userId: user.id, token: 'test-token', expiresAt: new Date() }
});

await prisma.user.delete({ where: { id: user.id } });

// Session should be auto-deleted
const deletedSession = await prisma.session.findUnique({
  where: { id: session.id }
});
expect(deletedSession).toBeNull();

// Test 2: Org deletion cascades all org data
const org = await prisma.organisation.create({
  data: { name: 'Test Org', slug: 'test-org' }
});

await prisma.invoice.create({
  data: {
    orgId: org.id,
    number: 'INV-001',
    issueDate: new Date(),
    amount: 100
  }
});

await prisma.organisation.delete({ where: { id: org.id } });

// All org data should be deleted
const invoices = await prisma.invoice.findMany({
  where: { orgId: org.id }
});
expect(invoices).toHaveLength(0);
```

### 2. Test SetNull Behavior

```typescript
// Test: User deletion nullifies reviewer
const reviewer = await prisma.user.create({
  data: { email: 'reviewer@example.com', firstName: 'Reviewer', lastName: 'User' }
});

const employee = await prisma.employee.create({
  data: {
    orgId: org.id,
    email: 'emp@example.com',
    firstName: 'Employee',
    lastName: 'Name',
    hireDate: new Date()
  }
});

const leave = await prisma.leaveRequest.create({
  data: {
    employeeId: employee.id,
    type: 'ANNUAL',
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 5,
    reviewedBy: reviewer.id
  }
});

await prisma.user.delete({ where: { id: reviewer.id } });

// Leave request should exist with null reviewer
const updatedLeave = await prisma.leaveRequest.findUnique({
  where: { id: leave.id }
});
expect(updatedLeave?.reviewedBy).toBeNull();
```

### 3. Test Restrict Protection

```typescript
// Test: Cannot delete customer with invoices
const customer = await prisma.customer.create({
  data: { orgId: org.id, name: 'Test Customer' }
});

await prisma.invoice.create({
  data: {
    orgId: org.id,
    customerId: customer.id,
    number: 'INV-002',
    issueDate: new Date(),
    amount: 200
  }
});

// Should fail
await expect(
  prisma.customer.delete({ where: { id: customer.id } })
).rejects.toThrow(/foreign key constraint/);

// Delete invoice first, then customer works
await prisma.invoice.deleteMany({ where: { customerId: customer.id } });
await prisma.customer.delete({ where: { id: customer.id } }); // Now succeeds
```

## Rollback Plan

If migration fails or causes issues:

```bash
# Option 1: Rollback last migration
cd packages/database
npx prisma migrate resolve --rolled-back <migration-name>

# Option 2: Restore from backup
psql $DATABASE_URL < backup_before_cascade_fix.sql

# Option 3: Revert schema changes
git revert <commit-hash>
npx prisma migrate dev
```

## Monitoring

After deployment, monitor for:

1. **Foreign key constraint violations**
   - Check application logs for deletion errors
   - Look for `foreign key constraint` errors

2. **Orphaned record detection**
   - Run orphan detection queries weekly
   - Alert if orphans found

3. **Performance impact**
   - Cascade deletions may be slower (batch deletes)
   - Monitor deletion operation duration

## Known Issues & Workarounds

### Issue 1: Large Cascade Deletions

**Problem**: Deleting an org with millions of records times out

**Solution**: Soft delete pattern or batch deletion
```typescript
// Instead of:
await prisma.organisation.delete({ where: { id: orgId } });

// Use soft delete:
await prisma.organisation.update({
  where: { id: orgId },
  data: { deletedAt: new Date() }
});

// Then cleanup in background job
```

### Issue 2: DocumentFolder Self-Reference

**Problem**: DocumentFolder.parent has `onUpdate: NoAction` to prevent circular issues

**Workaround**: When updating folder hierarchy, update in correct order
```typescript
// Update children first, then parent
await prisma.documentFolder.updateMany({
  where: { parentId: oldParentId },
  data: { parentId: newParentId }
});
```

## Support

If you encounter issues:

1. Check migration logs: `packages/database/prisma/migrations/*/migration.sql`
2. Review Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-actions
3. Contact VAULT (Database Specialist) for assistance

---

**Status**: ✅ Ready for migration
**Estimated Duration**: 5-30 minutes (depends on data size)
**Downtime Required**: Recommended (database schema changes)

*Last Updated: 2025-12-08*
