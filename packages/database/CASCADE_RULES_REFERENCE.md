# Cascade Rules Quick Reference

## When to Use Each Rule

### 🔴 Cascade - Delete child with parent

```prisma
organisation Organisation @relation(fields: [orgId], references: [id], onDelete: Cascade)
```

**Use when:**
- Child record is meaningless without parent
- Multi-tenant data (org-owned data)
- Session/auth records
- Dependent data that should be cleaned up

**Examples:**
- Organisation → Invoices, Expenses, Transactions
- User → Sessions
- Bill → BillLineItems
- Conversation → Messages

---

### 🟡 SetNull - Unlink on parent deletion

```prisma
reviewer User? @relation(fields: [reviewedBy], references: [id], onDelete: SetNull)
```

**Use when:**
- Relationship is optional
- Need to preserve history/audit trail
- Assignment can be removed without losing data
- Soft references

**Examples:**
- User → Leave Request Reviewer
- User → Approver fields
- Folder → Documents (document stays if folder deleted)
- Template → Generated records

---

### 🔵 Restrict - Prevent deletion if children exist

```prisma
customer Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
```

**Use when:**
- Financial records (invoices, bills, payments)
- Critical dependencies
- Need referential integrity protection
- Prevent accidental data loss

**Examples:**
- Customer → Invoices (can't delete customer with invoices)
- Vendor → Bills (can't delete vendor with bills)
- User → Created records (preserve creator)
- BankAccount → Scheduled Payments

---

## Common Patterns

### Pattern 1: Organization-Owned Data
```prisma
model Invoice {
  orgId String
  organisation Organisation @relation(fields: [orgId], references: [id], onDelete: Cascade)
}
```
✅ Cascade - Delete all org data when org deleted

### Pattern 2: User Assignments
```prisma
model LeaveRequest {
  reviewedBy String?
  reviewer User? @relation(fields: [reviewedBy], references: [id], onDelete: SetNull)
}
```
✅ SetNull - Preserve leave request, remove reviewer assignment

### Pattern 3: Financial Records
```prisma
model Invoice {
  clientId String?
  client Client? @relation(fields: [clientId], references: [id], onDelete: Restrict)
}
```
✅ Restrict - Cannot delete client if they have invoices

### Pattern 4: Auth Records
```prisma
model Session {
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
✅ Cascade - Delete sessions when user deleted

---

## Decision Tree

```
Is the child record meaningless without parent?
├─ Yes → Use CASCADE
│  └─ Example: Session without User, Message without Conversation
│
└─ No → Is this a financial/critical record?
   ├─ Yes → Use RESTRICT
   │  └─ Example: Invoice with Customer, Bill with Vendor
   │
   └─ No → Is the relationship optional?
      ├─ Yes → Use SET NULL
      │  └─ Example: Leave Request with Reviewer
      │
      └─ No → Use CASCADE or RESTRICT based on business logic
```

---

## Testing Your Cascade Rules

### Test Cascade
```typescript
// Should delete child records
const user = await prisma.user.create({ data: {...} });
const session = await prisma.session.create({ data: { userId: user.id, ... } });

await prisma.user.delete({ where: { id: user.id } });

const deletedSession = await prisma.session.findUnique({ where: { id: session.id } });
expect(deletedSession).toBeNull(); // ✅ Cascaded
```

### Test SetNull
```typescript
// Should nullify foreign key
const reviewer = await prisma.user.create({ data: {...} });
const leave = await prisma.leaveRequest.create({
  data: { reviewedBy: reviewer.id, ... }
});

await prisma.user.delete({ where: { id: reviewer.id } });

const updatedLeave = await prisma.leaveRequest.findUnique({
  where: { id: leave.id }
});
expect(updatedLeave.reviewedBy).toBeNull(); // ✅ Nullified
```

### Test Restrict
```typescript
// Should prevent deletion
const customer = await prisma.customer.create({ data: {...} });
const invoice = await prisma.invoice.create({
  data: { customerId: customer.id, ... }
});

await expect(
  prisma.customer.delete({ where: { id: customer.id } })
).rejects.toThrow(); // ✅ Prevented
```

---

## Common Mistakes

### ❌ WRONG: Missing onDelete
```prisma
user User @relation(fields: [userId], references: [id])
```
**Problem**: Defaults to Restrict, may cause unexpected errors

### ✅ RIGHT: Explicit onDelete
```prisma
user User @relation(fields: [userId], references: [id], onDelete: SetNull)
```

---

### ❌ WRONG: Cascade on financial records
```prisma
customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
```
**Problem**: Deleting customer would delete all invoices!

### ✅ RIGHT: Restrict on financial records
```prisma
customer Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
```

---

### ❌ WRONG: Restrict on sessions
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Restrict)
```
**Problem**: Can't delete user if they have sessions

### ✅ RIGHT: Cascade on sessions
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

---

## Multi-Tenant Considerations

### Organization Data (Always Cascade)
```prisma
model AnyOrgData {
  orgId String
  organisation Organisation @relation(fields: [orgId], references: [id], onDelete: Cascade)
}
```
✅ Ensures tenant isolation - deleting org deletes all data

### User Data (Usually SetNull)
```prisma
model AuditLog {
  userId String?
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```
✅ Preserves history - user deleted but logs remain

---

## GDPR Compliance

### Right to Erasure
```prisma
// User's personal data cascades
model UserProfile {
  userId String @unique
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Business records preserve reference
model Invoice {
  createdBy String
  creator User @relation(fields: [createdBy], references: [id], onDelete: Restrict)
}
```

---

## Performance Tips

1. **Cascade deletions can be slow** with large datasets
   - Consider soft deletes for organizations
   - Use batch operations for cleanup

2. **Restrict prevents deletion** - plan cleanup workflows
   - Archive customers before deletion
   - Transfer invoices to archived customer

3. **SetNull is fast** but may create many null records
   - Periodically clean up orphaned records
   - Consider archiving strategy

---

## Need Help?

- 📖 Full documentation: `audits/fixes/p1-db003-db007-cascade-relations.md`
- 🚀 Migration guide: `audits/fixes/MIGRATION_GUIDE_DB003_DB007.md`
- 🔍 Audit tool: `scripts/audit-cascade-rules.js`
- 💬 Contact: VAULT (Database Specialist)

---

*Always test cascade rules in development before production deployment!*
