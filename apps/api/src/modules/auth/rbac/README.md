# RBAC (Role-Based Access Control) System

## Overview

The RBAC system provides comprehensive role-based and permission-based access control for the Operate/CoachOS platform. It supports fine-grained permissions, role hierarchies, and flexible authorization rules.

## Components

### Core Files

1. **rbac.module.ts** - NestJS module that registers RBAC services
2. **rbac.service.ts** - Core service for permission and role checking
3. **rbac.guard.ts** - Guard that enforces RBAC on routes
4. **permissions.ts** - Permission definitions and metadata
5. **roles.ts** - Role definitions, hierarchy, and mappings
6. **permissions.enum.ts** - Re-export for convenience
7. **roles.config.ts** - Re-export for convenience

### Decorators

Located in `src/common/decorators/`:

1. **require-permissions.decorator.ts** - Permission-based authorization
2. **require-role.decorator.ts** - Role-based authorization

## Quick Start

### 1. Import the RBAC Module

```typescript
import { Module } from '@nestjs/common';
import { RbacModule } from './auth/rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [YourController],
})
export class YourModule {}
```

### 2. Apply Guards to Controllers

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/auth/rbac/rbac.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoicesController {
  // Your routes here
}
```

### 3. Use Decorators on Routes

```typescript
import { Post, Get } from '@nestjs/common';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/modules/auth/rbac/permissions';

@RequirePermissions(Permission.INVOICES_CREATE)
@Post()
createInvoice() {
  // Only users with INVOICES_CREATE permission can access
}

@RequirePermissions(Permission.INVOICES_READ)
@Get()
getInvoices() {
  // Only users with INVOICES_READ permission can access
}
```

## Roles

The system supports 5 hierarchical roles:

| Role | Level | Description |
|------|-------|-------------|
| **OWNER** | 4 | Full access including org deletion |
| **ADMIN** | 3 | Full access except org deletion |
| **MANAGER** | 2 | Team management and approvals |
| **MEMBER** | 1 | Standard user with CRUD access |
| **VIEWER** | 0 | Read-only access |

### Role Hierarchy

```
OWNER (highest)
  ↓
ADMIN
  ↓
MANAGER
  ↓
MEMBER
  ↓
VIEWER (lowest)
```

## Permissions

Permissions are organized into categories:

### Organisation
- `ORG_READ` - View organisation details
- `ORG_UPDATE` - Edit organisation details
- `ORG_DELETE` - Delete organisation (OWNER only)
- `ORG_SETTINGS` - Configure organisation settings

### Users & Members
- `USERS_READ`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`, `USERS_INVITE`
- `MEMBERS_READ`, `MEMBERS_CREATE`, `MEMBERS_UPDATE`, `MEMBERS_DELETE`, `MEMBERS_ROLES`

### Finance
- **Invoices**: `INVOICES_READ`, `INVOICES_CREATE`, `INVOICES_UPDATE`, `INVOICES_DELETE`, `INVOICES_APPROVE`
- **Expenses**: `EXPENSES_READ`, `EXPENSES_CREATE`, `EXPENSES_UPDATE`, `EXPENSES_DELETE`, `EXPENSES_APPROVE`
- **Payments**: `PAYMENTS_READ`, `PAYMENTS_CREATE`, `PAYMENTS_UPDATE`, `PAYMENTS_DELETE`

### HR
- **Employees**: `EMPLOYEES_READ`, `EMPLOYEES_CREATE`, `EMPLOYEES_UPDATE`, `EMPLOYEES_DELETE`
- **Payroll**: `PAYROLL_READ`, `PAYROLL_CREATE`, `PAYROLL_UPDATE`, `PAYROLL_DELETE`, `PAYROLL_APPROVE`
- **Leave**: `LEAVE_READ`, `LEAVE_CREATE`, `LEAVE_UPDATE`, `LEAVE_DELETE`, `LEAVE_APPROVE`

### Tax
- `TAX_READ`, `TAX_CREATE`, `TAX_UPDATE`, `TAX_DELETE`, `TAX_SUBMIT`, `TAX_REPORTS`

### Reports & Analytics
- `REPORTS_READ`, `REPORTS_CREATE`, `REPORTS_EXPORT`, `ANALYTICS_VIEW`

### Audit & Compliance
- `AUDIT_READ`, `AUDIT_EXPORT`, `COMPLIANCE_VIEW`, `COMPLIANCE_MANAGE`

### Settings
- `SETTINGS_READ`, `SETTINGS_UPDATE`

### Admin
- `ADMIN_FULL` - Wildcard permission (grants all permissions)

## Usage Examples

### Permission-Based Authorization

#### Single Permission
```typescript
@RequirePermissions(Permission.INVOICES_CREATE)
@Post('invoices')
createInvoice() {
  // Only users with INVOICES_CREATE permission
}
```

#### Any Permission (OR logic)
```typescript
@RequirePermissions(Permission.INVOICES_READ, Permission.EXPENSES_READ)
@Get('financial-summary')
getSummary() {
  // Users with EITHER permission can access
}
```

#### All Permissions (AND logic)
```typescript
@RequireAllPermissions(
  Permission.INVOICES_CREATE,
  Permission.INVOICES_APPROVE
)
@Post('invoices/approved')
createApprovedInvoice() {
  // User must have BOTH permissions
}
```

### Role-Based Authorization

#### Exact Role
```typescript
@RequireRole(Role.ADMIN)
@Delete('organisation')
deleteOrganisation() {
  // Only ADMIN role (not OWNER, not MANAGER)
}
```

#### Any Role (OR logic)
```typescript
@RequireAnyRole(Role.ADMIN, Role.MANAGER)
@Post('approve-expense')
approveExpense() {
  // ADMIN or MANAGER can access
}
```

#### Minimum Role (Hierarchy)
```typescript
@RequireMinRole(Role.MANAGER)
@Post('approve-leave')
approveLeave() {
  // MANAGER, ADMIN, or OWNER can access
}
```

#### Convenience Decorators
```typescript
@RequireOwner()
@Delete('organisation')
deleteOrg() {
  // Only OWNER
}

@RequireAdmin()
@Post('users/invite')
inviteUser() {
  // ADMIN or OWNER
}

@RequireManager()
@Post('expenses/approve')
approveExpense() {
  // MANAGER, ADMIN, or OWNER
}
```

### Programmatic Permission Checks

```typescript
import { RbacService } from '@/modules/auth/rbac/rbac.service';

@Injectable()
export class MyService {
  constructor(private readonly rbacService: RbacService) {}

  async processAction(user: RbacUser) {
    // Check single permission
    if (this.rbacService.hasPermission(user, Permission.INVOICES_CREATE)) {
      // User has permission
    }

    // Check any permission
    if (this.rbacService.hasAnyPermission(user, [
      Permission.INVOICES_READ,
      Permission.EXPENSES_READ,
    ])) {
      // User has at least one permission
    }

    // Check all permissions
    if (this.rbacService.hasAllPermissions(user, [
      Permission.INVOICES_CREATE,
      Permission.INVOICES_APPROVE,
    ])) {
      // User has all permissions
    }

    // Check role
    if (this.rbacService.hasRole(user, Role.ADMIN)) {
      // User is an admin
    }

    // Check minimum role
    if (this.rbacService.hasMinimumRole(user, Role.MANAGER)) {
      // User is manager or higher
    }

    // Get all user permissions
    const permissions = this.rbacService.getUserPermissions(user);
  }
}
```

### Public Routes

Mark routes as public to bypass authentication and authorization:

```typescript
import { Public } from '@/common/decorators/public.decorator';

@Public()
@Get('health')
healthCheck() {
  // Anyone can access, no auth required
}
```

## Role Permission Matrix

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| ORG_DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |
| ORG_UPDATE | ✅ | ✅ | ❌ | ❌ | ❌ |
| ORG_READ | ✅ | ✅ | ✅ | ✅ | ✅ |
| USERS_DELETE | ✅ | ✅ | ❌ | ❌ | ❌ |
| INVOICES_APPROVE | ✅ | ✅ | ✅ | ❌ | ❌ |
| INVOICES_CREATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| INVOICES_READ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TAX_SUBMIT | ✅ | ✅ | ❌ | ❌ | ❌ |
| PAYROLL_READ | ✅ | ✅ | ✅ | ❌ | ❌ |

*OWNER has ADMIN_FULL permission which grants all permissions*

## Best Practices

### 1. Use Guards at Controller Level
```typescript
@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard) // Apply to all routes
export class InvoicesController {}
```

### 2. Prefer Permissions Over Roles
```typescript
// Good - Permission-based
@RequirePermissions(Permission.INVOICES_CREATE)

// Avoid - Role-based (less flexible)
@RequireRole(Role.ADMIN)
```

### 3. Combine Guards Properly
```typescript
// Correct order: Authentication first, then authorization
@UseGuards(JwtAuthGuard, RbacGuard)
```

### 4. Use Descriptive Permission Names
```typescript
// Good
Permission.INVOICES_APPROVE

// Avoid generic permissions
Permission.ADMIN
```

### 5. Log Authorization Decisions
```typescript
this.rbacService.logAuthorizationAttempt(
  user,
  'create_invoice',
  'Invoice #123',
  granted
);
```

## Error Handling

The RBAC guard throws `ForbiddenException` when authorization fails:

```typescript
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: invoices:create",
  "error": "Forbidden"
}
```

## Testing

### Unit Testing RBAC Service

```typescript
describe('RbacService', () => {
  let service: RbacService;

  beforeEach(() => {
    service = new RbacService();
  });

  it('should grant permission to admin', () => {
    const user: RbacUser = {
      userId: '1',
      email: 'admin@example.com',
      orgId: 'org1',
      role: Role.ADMIN,
    };

    expect(service.hasPermission(user, Permission.INVOICES_CREATE)).toBe(true);
  });
});
```

### Integration Testing with Guards

```typescript
describe('InvoicesController', () => {
  it('should deny access without permission', () => {
    return request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
```

## Migration Guide

If you have existing authorization logic:

### Before
```typescript
@UseGuards(JwtAuthGuard)
@Post('invoices')
create(@Request() req) {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenException();
  }
  // ...
}
```

### After
```typescript
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions(Permission.INVOICES_CREATE)
@Post('invoices')
create() {
  // Permission check handled by guard
}
```

## Security Considerations

1. **Always use JwtAuthGuard** before RbacGuard
2. **Never trust client-provided roles** - Always use server-side checks
3. **Use permissions for authorization** - Roles are for grouping permissions
4. **Audit sensitive operations** - Use logging for compliance
5. **Validate organisation context** - Ensure users only access their org's data

## Troubleshooting

### Guard not working
- Ensure RbacModule is imported in your module
- Verify guard order: `@UseGuards(JwtAuthGuard, RbacGuard)`
- Check that JWT strategy sets user.role correctly

### Permission always denied
- Verify user role in JWT payload
- Check RolePermissions mapping in roles.ts
- Enable debug logging to see permission checks

### Public route requires auth
- Add `@Public()` decorator
- Ensure it's placed before other decorators
- Verify IS_PUBLIC_KEY in guard logic

## API Reference

See individual file documentation for detailed API reference:
- [RbacService](./rbac.service.ts)
- [RbacGuard](./rbac.guard.ts)
- [Permissions](./permissions.ts)
- [Roles](./roles.ts)
