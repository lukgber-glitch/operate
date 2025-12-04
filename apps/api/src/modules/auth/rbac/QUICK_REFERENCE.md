# RBAC Quick Reference Card

## Quick Start (30 seconds)

### 1. Protect a Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/auth/rbac/rbac.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard) // ← Add these two guards
export class InvoicesController {
  // Your routes here
}
```

### 2. Require Permission

```typescript
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/modules/auth/rbac/permissions';

@RequirePermissions(Permission.INVOICES_CREATE) // ← Add decorator
@Post()
create() {
  return {};
}
```

### 3. Done! 🎉

That's it! Your route is now protected.

---

## Common Patterns

### Read-Only Access

```typescript
@RequirePermissions(Permission.INVOICES_READ)
@Get()
findAll() {}
```

### Create Access

```typescript
@RequirePermissions(Permission.INVOICES_CREATE)
@Post()
create() {}
```

### Approval (Manager+)

```typescript
@RequirePermissions(Permission.INVOICES_APPROVE)
@Post(':id/approve')
approve() {}
```

### Admin Only

```typescript
import { RequireAdmin } from '@/common/decorators/require-role.decorator';

@RequireAdmin() // ← ADMIN or OWNER only
@Delete('organisation')
deleteOrg() {}
```

### Owner Only

```typescript
import { RequireOwner } from '@/common/decorators/require-role.decorator';

@RequireOwner() // ← OWNER only (super admin)
@Delete('organisation')
deleteOrg() {}
```

---

## All Decorators

### Permission Decorators

| Decorator | Logic | Example |
|-----------|-------|---------|
| `@RequirePermissions(P1, P2)` | ANY (OR) | User needs P1 OR P2 |
| `@RequireAllPermissions(P1, P2)` | ALL (AND) | User needs P1 AND P2 |

### Role Decorators

| Decorator | Meaning |
|-----------|---------|
| `@RequireRole(Role.X)` | Exact role match |
| `@RequireMinRole(Role.X)` | Minimum role (hierarchy) |
| `@RequireOwner()` | OWNER only |
| `@RequireAdmin()` | ADMIN or OWNER |
| `@RequireManager()` | MANAGER or above |

### Special Decorators

| Decorator | Meaning |
|-----------|---------|
| `@Public()` | Skip authentication |

---

## Permission Categories Quick Lookup

### Finance Permissions

```typescript
Permission.INVOICES_READ
Permission.INVOICES_CREATE
Permission.INVOICES_UPDATE
Permission.INVOICES_DELETE
Permission.INVOICES_APPROVE

Permission.EXPENSES_READ
Permission.EXPENSES_CREATE
Permission.EXPENSES_UPDATE
Permission.EXPENSES_DELETE
Permission.EXPENSES_APPROVE

Permission.PAYMENTS_READ
Permission.PAYMENTS_CREATE
Permission.PAYMENTS_UPDATE
Permission.PAYMENTS_DELETE
```

### HR Permissions

```typescript
Permission.EMPLOYEES_READ
Permission.EMPLOYEES_CREATE
Permission.EMPLOYEES_UPDATE
Permission.EMPLOYEES_DELETE

Permission.PAYROLL_READ      // Sensitive!
Permission.PAYROLL_CREATE
Permission.PAYROLL_UPDATE
Permission.PAYROLL_DELETE
Permission.PAYROLL_APPROVE

Permission.LEAVE_READ
Permission.LEAVE_CREATE
Permission.LEAVE_UPDATE
Permission.LEAVE_DELETE
Permission.LEAVE_APPROVE
```

### Tax Permissions

```typescript
Permission.TAX_READ
Permission.TAX_CREATE
Permission.TAX_UPDATE
Permission.TAX_DELETE
Permission.TAX_SUBMIT        // Admin only!
Permission.TAX_REPORTS
```

### Organisation Permissions

```typescript
Permission.ORG_READ
Permission.ORG_UPDATE        // Admin+
Permission.ORG_DELETE        // Owner only!
Permission.ORG_SETTINGS      // Admin+
```

### User Management

```typescript
Permission.USERS_READ
Permission.USERS_CREATE      // Admin+
Permission.USERS_UPDATE      // Admin+
Permission.USERS_DELETE      // Admin+
Permission.USERS_INVITE      // Manager+
```

### Reports & Analytics

```typescript
Permission.REPORTS_READ
Permission.REPORTS_CREATE
Permission.REPORTS_EXPORT
Permission.ANALYTICS_VIEW
```

### Settings

```typescript
Permission.SETTINGS_READ
Permission.SETTINGS_UPDATE   // Admin+
```

---

## Role Capabilities Matrix

| Action | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|--------|-------|-------|---------|--------|--------|
| View data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit resources | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete resources | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit tax | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Programmatic Checks (in Services)

### Inject RbacService

```typescript
import { Injectable } from '@nestjs/common';
import { RbacService, RbacUser } from '@/modules/auth/rbac/rbac.service';

@Injectable()
export class MyService {
  constructor(private readonly rbacService: RbacService) {}
}
```

### Check Single Permission

```typescript
if (this.rbacService.hasPermission(user, Permission.INVOICES_CREATE)) {
  // User can create invoices
}
```

### Check Multiple Permissions (OR)

```typescript
if (this.rbacService.hasAnyPermission(user, [
  Permission.INVOICES_READ,
  Permission.EXPENSES_READ
])) {
  // User can view financial data
}
```

### Check Multiple Permissions (AND)

```typescript
if (this.rbacService.hasAllPermissions(user, [
  Permission.INVOICES_CREATE,
  Permission.INVOICES_APPROVE
])) {
  // User can create AND approve
}
```

### Check Role

```typescript
if (this.rbacService.hasRole(user, Role.ADMIN)) {
  // User is admin
}
```

### Check Minimum Role

```typescript
if (this.rbacService.hasMinimumRole(user, Role.MANAGER)) {
  // User is Manager, Admin, or Owner
}
```

### Check Organisation Access

```typescript
if (this.rbacService.belongsToOrganisation(user, orgId)) {
  // User belongs to this org
}
```

### Check Resource Access (Permission + Org)

```typescript
if (this.rbacService.canAccessResource(
  user,
  Permission.INVOICES_UPDATE,
  invoice.orgId
)) {
  // User can update this invoice
}
```

---

## Common Mistakes ⚠️

### ❌ WRONG: Forgetting Guards

```typescript
@Controller('invoices')
export class InvoicesController {
  @Post()  // ← Anyone can access!
  create() {}
}
```

### ✅ CORRECT: Always Use Guards

```typescript
@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoicesController {
  @RequirePermissions(Permission.INVOICES_CREATE)
  @Post()
  create() {}
}
```

### ❌ WRONG: Wrong Guard Order

```typescript
@UseGuards(RbacGuard, JwtAuthGuard) // ← Wrong order!
```

### ✅ CORRECT: JWT First, Then RBAC

```typescript
@UseGuards(JwtAuthGuard, RbacGuard) // ← Correct order
```

### ❌ WRONG: Using Roles Instead of Permissions

```typescript
@RequireRole(Role.ADMIN) // ← Too restrictive
@Post('invoices')
create() {}
```

### ✅ CORRECT: Use Permissions

```typescript
@RequirePermissions(Permission.INVOICES_CREATE) // ← Flexible
@Post('invoices')
create() {}
```

### ❌ WRONG: Not Checking Organisation

```typescript
async update(user: RbacUser, id: string) {
  // No org check - security hole!
  return this.updateInDb(id);
}
```

### ✅ CORRECT: Always Check Org

```typescript
async update(user: RbacUser, id: string) {
  const resource = await this.getResource(id);

  if (!this.rbacService.canAccessResource(
    user,
    Permission.INVOICES_UPDATE,
    resource.orgId
  )) {
    throw new ForbiddenException();
  }

  return this.updateInDb(id);
}
```

---

## Testing

### Test Permission Denial

```typescript
it('should deny member from approving', () => {
  const memberUser: RbacUser = {
    userId: '1',
    email: 'member@test.com',
    orgId: 'org1',
    role: Role.MEMBER,
  };

  expect(
    service.hasPermission(memberUser, Permission.INVOICES_APPROVE)
  ).toBe(false);
});
```

### Test Permission Grant

```typescript
it('should allow admin to approve', () => {
  const adminUser: RbacUser = {
    userId: '1',
    email: 'admin@test.com',
    orgId: 'org1',
    role: Role.ADMIN,
  };

  expect(
    service.hasPermission(adminUser, Permission.INVOICES_APPROVE)
  ).toBe(true);
});
```

---

## Emergency Bypass (Development Only!)

### Make Route Public

```typescript
import { Public } from '@/common/decorators/public.decorator';

@Public() // ← Bypasses ALL guards
@Get('debug')
debugRoute() {
  return { debug: true };
}
```

**⚠️ WARNING:** Never use `@Public()` on production routes with sensitive data!

---

## Need Help?

1. **Documentation:** Read `README.md` in rbac folder
2. **Examples:** See `USAGE_EXAMPLE.md`
3. **Architecture:** Review `ARCHITECTURE.md`
4. **Full Report:** Check `IMPLEMENTATION_REPORT.md`

---

## Cheat Sheet

```typescript
// 1. Import guards
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/auth/rbac/rbac.guard';

// 2. Import decorators
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/modules/auth/rbac/permissions';

// 3. Apply to controller
@Controller('my-resource')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MyController {

  // 4. Add permission to route
  @RequirePermissions(Permission.RESOURCE_ACTION)
  @Post()
  myRoute() {
    return {};
  }
}
```

**That's all you need to remember!** 🎯

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-11-28
