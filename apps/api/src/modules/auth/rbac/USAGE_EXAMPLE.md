# RBAC Usage Examples

This document provides practical examples of how to use the RBAC system in Operate/CoachOS.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Controller Examples](#controller-examples)
3. [Service Examples](#service-examples)
4. [Advanced Patterns](#advanced-patterns)
5. [Testing](#testing)

## Basic Setup

### 1. Apply Guards to Controllers

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/auth/rbac/rbac.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard) // Apply to all routes
export class InvoicesController {
  // Your routes here
}
```

**Important:** Always use `JwtAuthGuard` before `RbacGuard` to ensure the user is authenticated first.

## Controller Examples

### Finance Module Example

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RbacGuard } from '@/modules/auth/rbac/rbac.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { RequireMinRole } from '@/common/decorators/require-role.decorator';
import { Permission } from '@/modules/auth/rbac/permissions';
import { Role } from '@/modules/auth/rbac/roles';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoicesController {
  // Read - All authenticated users with permission
  @Get()
  @RequirePermissions(Permission.INVOICES_READ)
  async findAll() {
    // All roles except ASSISTANT can view invoices
    return [];
  }

  // Create - Members and above
  @Post()
  @RequirePermissions(Permission.INVOICES_CREATE)
  async create(@Body() createDto: any) {
    // MEMBER, MANAGER, ADMIN, OWNER can create
    return { id: '1' };
  }

  // Update - Members and above (own invoices)
  @Put(':id')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  async update(@Param('id') id: string, @Body() updateDto: any) {
    // MEMBER, MANAGER, ADMIN, OWNER can update
    return { id };
  }

  // Delete - Manager and above
  @Delete(':id')
  @RequirePermissions(Permission.INVOICES_DELETE)
  async delete(@Param('id') id: string) {
    // Only MANAGER, ADMIN, OWNER can delete
    return { deleted: true };
  }

  // Approve - Manager and above (requires higher authority)
  @Post(':id/approve')
  @RequirePermissions(Permission.INVOICES_APPROVE)
  async approve(@Param('id') id: string) {
    // Only MANAGER, ADMIN, OWNER can approve
    return { approved: true };
  }
}
```

### HR Module Example

```typescript
@Controller('employees')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EmployeesController {
  // View employees - All roles
  @Get()
  @RequirePermissions(Permission.EMPLOYEES_READ)
  async findAll() {
    return [];
  }

  // Create employee - Manager and above
  @Post()
  @RequirePermissions(Permission.EMPLOYEES_CREATE)
  async create(@Body() createDto: any) {
    return { id: '1' };
  }

  // View payroll - Manager and above only
  @Get('payroll')
  @RequirePermissions(Permission.PAYROLL_READ)
  async getPayroll() {
    // Only MANAGER, ADMIN, OWNER can view payroll
    return [];
  }

  // Approve leave - Manager and above
  @Post('leave/:id/approve')
  @RequirePermissions(Permission.LEAVE_APPROVE)
  async approveLeave(@Param('id') id: string) {
    return { approved: true };
  }
}
```

### Tax Module Example

```typescript
@Controller('tax')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TaxController {
  // View tax records - All roles
  @Get()
  @RequirePermissions(Permission.TAX_READ)
  async findAll() {
    return [];
  }

  // Submit tax filing - Admin and above only
  @Post('submit')
  @RequirePermissions(Permission.TAX_SUBMIT)
  async submit(@Body() submitDto: any) {
    // Only ADMIN and OWNER can submit tax filings
    return { submitted: true };
  }

  // Generate tax reports - Member and above
  @Get('reports')
  @RequirePermissions(Permission.TAX_REPORTS)
  async getReports() {
    return [];
  }
}
```

### Organisation Settings Example

```typescript
@Controller('organisation')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OrganisationController {
  // View organisation - All roles
  @Get()
  @RequirePermissions(Permission.ORG_READ)
  async getOrganisation() {
    return {};
  }

  // Update organisation - Admin and above
  @Put()
  @RequirePermissions(Permission.ORG_UPDATE)
  async update(@Body() updateDto: any) {
    // Only ADMIN and OWNER can update org
    return {};
  }

  // Delete organisation - Owner only
  @Delete()
  @RequirePermissions(Permission.ORG_DELETE)
  async delete() {
    // Only OWNER can delete organisation
    return { deleted: true };
  }

  // Update settings - Admin and above
  @Put('settings')
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  async updateSettings(@Body() settingsDto: any) {
    return {};
  }
}
```

## Service Examples

### Using RBAC Service for Programmatic Checks

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { RbacService, RbacUser } from '@/modules/auth/rbac/rbac.service';
import { Permission } from '@/modules/auth/rbac/permissions';
import { Role } from '@/modules/auth/rbac/roles';

@Injectable()
export class InvoicesService {
  constructor(private readonly rbacService: RbacService) {}

  async updateInvoice(user: RbacUser, invoiceId: string, invoice: any) {
    // Get invoice from database
    const existingInvoice = await this.getInvoice(invoiceId);

    // Check if user owns this invoice or has permission to edit any invoice
    const isOwner = existingInvoice.userId === user.userId;
    const canEditAny = this.rbacService.hasPermission(
      user,
      Permission.INVOICES_UPDATE,
    );

    if (!isOwner && !canEditAny) {
      throw new ForbiddenException('Cannot edit this invoice');
    }

    // Update invoice
    return this.updateInvoiceInDb(invoiceId, invoice);
  }

  async approveInvoice(user: RbacUser, invoiceId: string) {
    // Check if user has approval permission
    if (!this.rbacService.hasPermission(user, Permission.INVOICES_APPROVE)) {
      throw new ForbiddenException('Cannot approve invoices');
    }

    // Check if user has minimum Manager role
    if (!this.rbacService.hasMinimumRole(user, Role.MANAGER)) {
      throw new ForbiddenException('Minimum Manager role required');
    }

    return this.approveInvoiceInDb(invoiceId);
  }

  async getFinancialSummary(user: RbacUser) {
    // User needs either INVOICES_READ or EXPENSES_READ
    const canView = this.rbacService.hasAnyPermission(user, [
      Permission.INVOICES_READ,
      Permission.EXPENSES_READ,
    ]);

    if (!canView) {
      throw new ForbiddenException('Cannot view financial data');
    }

    return this.getFinancialData();
  }

  async exportFinancialData(user: RbacUser, orgId: string) {
    // Check if user belongs to the organisation
    if (!this.rbacService.belongsToOrganisation(user, orgId)) {
      throw new ForbiddenException('Cannot access this organisation');
    }

    // Check if user can export reports
    if (!this.rbacService.hasPermission(user, Permission.REPORTS_EXPORT)) {
      throw new ForbiddenException('Cannot export reports');
    }

    return this.exportData(orgId);
  }

  private async getInvoice(id: string) {
    return { id, userId: 'user123', amount: 100 };
  }

  private async updateInvoiceInDb(id: string, data: any) {
    return { id, ...data };
  }

  private async approveInvoiceInDb(id: string) {
    return { id, approved: true };
  }

  private async getFinancialData() {
    return { total: 1000 };
  }

  private async exportData(orgId: string) {
    return { exported: true };
  }
}
```

## Advanced Patterns

### 1. Combining Multiple Permissions (AND logic)

```typescript
import { RequireAllPermissions } from '@/common/decorators/require-permissions.decorator';

@Post('invoices/auto-approve')
@RequireAllPermissions(
  Permission.INVOICES_CREATE,
  Permission.INVOICES_APPROVE
)
async createAndApprove(@Body() dto: any) {
  // User must have BOTH permissions
  return {};
}
```

### 2. Multiple Permission Options (OR logic)

```typescript
@Get('financial-overview')
@RequirePermissions(
  Permission.INVOICES_READ,
  Permission.EXPENSES_READ,
  Permission.PAYMENTS_READ
)
async getFinancialOverview() {
  // User needs ANY ONE of these permissions
  return {};
}
```

### 3. Role-Based Access

```typescript
import { RequireMinRole, RequireAdmin } from '@/common/decorators/require-role.decorator';

// Minimum role required
@Post('team/approve')
@RequireMinRole(Role.MANAGER)
async approveTeamAction() {
  // MANAGER, ADMIN, or OWNER can access
  return {};
}

// Convenience decorator for Admin and above
@Post('users/invite')
@RequireAdmin()
async inviteUser() {
  // ADMIN or OWNER can invite
  return {};
}
```

### 4. Resource Ownership Checking

```typescript
@Injectable()
export class ExpensesService {
  constructor(private readonly rbacService: RbacService) {}

  async updateExpense(user: RbacUser, expenseId: string, data: any) {
    const expense = await this.getExpense(expenseId);

    // Check resource access (org + permission + ownership)
    const canAccess = this.rbacService.canAccessUserResource(
      user,
      Permission.EXPENSES_UPDATE,
      expense.userId,
    );

    if (!canAccess) {
      throw new ForbiddenException('Cannot update this expense');
    }

    return this.updateExpenseInDb(expenseId, data);
  }

  private async getExpense(id: string) {
    return { id, userId: 'user123' };
  }

  private async updateExpenseInDb(id: string, data: any) {
    return { id, ...data };
  }
}
```

### 5. Dynamic Permission Checks

```typescript
@Injectable()
export class DynamicAuthService {
  constructor(private readonly rbacService: RbacService) {}

  async performAction(user: RbacUser, action: string, resourceType: string) {
    // Map action to permission
    const permissionMap: Record<string, Permission> = {
      'create-invoice': Permission.INVOICES_CREATE,
      'approve-expense': Permission.EXPENSES_APPROVE,
      'submit-tax': Permission.TAX_SUBMIT,
    };

    const permission = permissionMap[action];
    if (!permission) {
      throw new ForbiddenException('Unknown action');
    }

    // Check permission
    if (!this.rbacService.hasPermission(user, permission)) {
      this.rbacService.logAuthorizationAttempt(
        user,
        action,
        resourceType,
        false,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    this.rbacService.logAuthorizationAttempt(
      user,
      action,
      resourceType,
      true,
    );

    return { success: true };
  }
}
```

### 6. Public Routes

```typescript
import { Public } from '@/common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  // No authentication required
  @Public()
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
```

## Testing

### Unit Testing with RBAC

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RbacService, RbacUser } from '@/modules/auth/rbac/rbac.service';
import { Permission } from '@/modules/auth/rbac/permissions';
import { Role } from '@/modules/auth/rbac/roles';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let rbacService: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicesService, RbacService],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    rbacService = module.get<RbacService>(RbacService);
  });

  describe('approveInvoice', () => {
    it('should allow manager to approve invoice', async () => {
      const managerUser: RbacUser = {
        userId: '1',
        email: 'manager@test.com',
        orgId: 'org1',
        role: Role.MANAGER,
      };

      const result = await service.approveInvoice(managerUser, 'inv-1');
      expect(result.approved).toBe(true);
    });

    it('should deny member from approving invoice', async () => {
      const memberUser: RbacUser = {
        userId: '2',
        email: 'member@test.com',
        orgId: 'org1',
        role: Role.MEMBER,
      };

      await expect(
        service.approveInvoice(memberUser, 'inv-1')
      ).rejects.toThrow('Cannot approve invoices');
    });
  });
});
```

### Integration Testing with Guards

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('InvoicesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get tokens
    adminToken = await getAuthToken(app, 'admin@test.com', 'password');
    memberToken = await getAuthToken(app, 'member@test.com', 'password');
  });

  it('should allow admin to delete invoice', () => {
    return request(app.getHttpServer())
      .delete('/invoices/inv-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should deny member from deleting invoice', () => {
    return request(app.getHttpServer())
      .delete('/invoices/inv-1')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});

async function getAuthToken(app: INestApplication, email: string, password: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken;
}
```

## Common Pitfalls

### 1. Forgetting to Apply Guards

```typescript
// BAD - No guards applied
@Controller('invoices')
export class InvoicesController {
  @Get()
  findAll() {} // Anyone can access!
}

// GOOD - Guards applied
@Controller('invoices')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoicesController {
  @RequirePermissions(Permission.INVOICES_READ)
  @Get()
  findAll() {}
}
```

### 2. Wrong Guard Order

```typescript
// BAD - Wrong order
@UseGuards(RbacGuard, JwtAuthGuard)

// GOOD - Correct order
@UseGuards(JwtAuthGuard, RbacGuard)
```

### 3. Using Roles Instead of Permissions

```typescript
// BAD - Too restrictive
@RequireRole(Role.ADMIN)
@Post('invoices')
create() {}

// GOOD - More flexible
@RequirePermissions(Permission.INVOICES_CREATE)
@Post('invoices')
create() {}
```

### 4. Not Checking Organisation Context

```typescript
// BAD - No org check
async update(user: RbacUser, resourceId: string) {
  if (!this.rbacService.hasPermission(user, Permission.INVOICES_UPDATE)) {
    throw new ForbiddenException();
  }
  // User could access other org's resources!
}

// GOOD - Check org
async update(user: RbacUser, resourceId: string) {
  const resource = await this.getResource(resourceId);

  if (!this.rbacService.canAccessResource(
    user,
    Permission.INVOICES_UPDATE,
    resource.orgId
  )) {
    throw new ForbiddenException();
  }
}
```

## Quick Reference

### Role Hierarchy (Lowest to Highest)

```
VIEWER < MEMBER < MANAGER < ADMIN < OWNER
```

### Permission Categories

- **Organisation:** `ORG_READ`, `ORG_UPDATE`, `ORG_DELETE`, `ORG_SETTINGS`
- **Users:** `USERS_READ`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`, `USERS_INVITE`
- **Finance:** `INVOICES_*`, `EXPENSES_*`, `PAYMENTS_*`
- **HR:** `EMPLOYEES_*`, `PAYROLL_*`, `LEAVE_*`
- **Tax:** `TAX_READ`, `TAX_CREATE`, `TAX_UPDATE`, `TAX_DELETE`, `TAX_SUBMIT`, `TAX_REPORTS`
- **Reports:** `REPORTS_*`, `ANALYTICS_VIEW`
- **Audit:** `AUDIT_READ`, `AUDIT_EXPORT`, `COMPLIANCE_*`
- **Settings:** `SETTINGS_READ`, `SETTINGS_UPDATE`

### Common Decorators

- `@RequirePermissions(Permission.X)` - Require ANY of listed permissions
- `@RequireAllPermissions(Permission.X, Permission.Y)` - Require ALL permissions
- `@RequireRole(Role.X)` - Require exact role
- `@RequireMinRole(Role.X)` - Require minimum role level
- `@RequireAdmin()` - Shortcut for Admin or Owner
- `@RequireManager()` - Shortcut for Manager or above
- `@Public()` - Bypass authentication
