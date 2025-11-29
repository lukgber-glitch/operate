# HR Schema Quick Reference

Quick reference guide for using the HR database schema in Operate/CoachOS.

---

## Models Overview

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Employee` | Core employee data | `employeeNumber`, `email`, `status`, `hireDate` |
| `EmploymentContract` | Contract terms & salary | `contractType`, `salaryAmount`, `weeklyHours` |
| `LeaveEntitlement` | Annual leave balances | `year`, `leaveType`, `totalDays`, `usedDays` |
| `LeaveRequest` | Leave requests | `startDate`, `endDate`, `status` |
| `TimeEntry` | Time tracking | `date`, `totalHours`, `overtimeHours` |
| `PayrollPeriod` | Monthly payroll cycles | `year`, `month`, `status` |
| `Payslip` | Individual payslips | `grossSalary`, `netSalary`, `deductions` |
| `SocialSecurityRegistration` | Insurance registrations | `countryCode`, `provider`, `type` |
| `HrAuditLog` | HR audit trail | `action`, `entityType`, `oldValues`, `newValues` |

---

## Common Queries

### Get Active Employees for Organization
```typescript
const employees = await prisma.employee.findMany({
  where: {
    orgId: 'org-id',
    status: 'ACTIVE',
    deletedAt: null,
  },
  include: {
    contracts: {
      where: { isActive: true },
    },
  },
});
```

### Get Employee with Current Contract
```typescript
const employee = await prisma.employee.findUnique({
  where: { id: 'employee-id' },
  include: {
    contracts: {
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
      take: 1,
    },
  },
});
```

### Get Leave Balance for Year
```typescript
const leaveBalance = await prisma.leaveEntitlement.findUnique({
  where: {
    employeeId_year_leaveType: {
      employeeId: 'employee-id',
      year: 2024,
      leaveType: 'ANNUAL',
    },
  },
});

const remaining = leaveBalance.totalDays - leaveBalance.usedDays;
```

### Get Pending Leave Requests
```typescript
const pendingRequests = await prisma.leaveRequest.findMany({
  where: {
    employee: { orgId: 'org-id' },
    status: 'PENDING',
  },
  include: {
    employee: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
  orderBy: { createdAt: 'asc' },
});
```

### Get Payroll Period with Payslips
```typescript
const payroll = await prisma.payrollPeriod.findUnique({
  where: {
    orgId_year_month: {
      orgId: 'org-id',
      year: 2024,
      month: 11,
    },
  },
  include: {
    payslips: {
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    },
  },
});
```

### Get Employee Time Entries for Period
```typescript
const timeEntries = await prisma.timeEntry.findMany({
  where: {
    employeeId: 'employee-id',
    date: {
      gte: new Date('2024-11-01'),
      lte: new Date('2024-11-30'),
    },
  },
  orderBy: { date: 'asc' },
});

const totalHours = timeEntries.reduce((sum, entry) =>
  sum + entry.totalHours.toNumber(), 0
);
```

---

## Enums Reference

### EmploymentStatus
- `ACTIVE` - Currently employed
- `ON_LEAVE` - On extended leave
- `TERMINATED` - Employment ended
- `PENDING` - Onboarding in progress

### ContractType
- `PERMANENT` - Unbefristeter Vertrag
- `FIXED_TERM` - Befristeter Vertrag
- `PART_TIME` - Teilzeit
- `MINIJOB` - Geringfügige Beschäftigung (≤520€/month)
- `MIDIJOB` - Übergangsbereich (520-2000€/month)
- `FREELANCE` - Freiberufler
- `INTERNSHIP` - Praktikum
- `APPRENTICESHIP` - Ausbildung

### LeaveType
- `ANNUAL` - Jahresurlaub
- `SICK` - Krankheit
- `PARENTAL` - Elternzeit
- `UNPAID` - Unbezahlter Urlaub
- `SPECIAL` - Sonderurlaub
- `TRAINING` - Fortbildung

### LeaveRequestStatus
- `PENDING` - Awaiting approval
- `APPROVED` - Approved
- `REJECTED` - Rejected
- `CANCELLED` - Cancelled by employee

### PayrollStatus
- `OPEN` - Can add/edit payslips
- `PROCESSING` - Currently processing
- `COMPLETED` - Processing complete
- `LOCKED` - Locked, no changes allowed

---

## Business Rules

### Employee Number
- Must be unique per organization
- Format: `EMP-XXX` (recommended)
- Composite unique constraint: `(orgId, employeeNumber)`

### Leave Entitlements
- One entitlement per employee, per year, per leave type
- Cannot use more days than total + carriedOver
- Carried over days can expire

### Leave Requests
- Cannot overlap for same employee
- Must have sufficient leave balance
- Total days must match date range

### Payroll Periods
- One period per organization per month
- Must be in OPEN status to add payslips
- Lock period before processing next month

### Payslips
- One payslip per employee per payroll period
- Must have both gross and net salary
- Deductions stored as JSON for flexibility

### Time Entries
- One entry per employee per date (recommended)
- Break minutes must be ≥ 0
- Total hours should include breaks

---

## Indexing Strategy

### Performance Optimizations
- All foreign keys are indexed
- Status fields are indexed for filtering
- Date ranges have composite indexes
- Email indexed for lookups
- Unique constraints on business keys

### Query Patterns
```typescript
// Optimized: Uses index on (orgId, status)
WHERE orgId = ? AND status = 'ACTIVE'

// Optimized: Uses index on (employeeId, date)
WHERE employeeId = ? AND date >= ? AND date <= ?

// Optimized: Uses composite index
WHERE startDate >= ? AND endDate <= ?
```

---

## Audit Logging

### HR Audit Log Usage
```typescript
await prisma.hrAuditLog.create({
  data: {
    orgId: employee.orgId,
    employeeId: employee.id,
    userId: currentUser.id,
    action: 'UPDATE',
    entityType: 'Employee',
    entityId: employee.id,
    oldValues: { salary: 50000 },
    newValues: { salary: 55000 },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
});
```

### Actions to Audit
- Employee creation/update/deletion
- Contract changes
- Salary adjustments
- Leave approvals/rejections
- Payroll processing
- Time entry approvals

---

## Data Types

### Decimals
- **Salary:** `DECIMAL(10,2)` - Max €99,999,999.99
- **Hours:** `DECIMAL(4,2)` - Max 99.99 hours
- **Days:** `DECIMAL(4,1)` - Max 999.9 days

### JSON Fields
```typescript
// Contract benefits
{
  healthInsurance: true,
  pensionPlan: true,
  gymMembership: true,
  companyPhone: true,
  publicTransport: true
}

// Payslip deductions
{
  incomeTax: 1150.00,
  healthInsurance: 500.00,
  pensionInsurance: 300.00,
  unemploymentInsurance: 100.00,
  churchTax: 50.00,
  other: 100.00
}

// Payslip additions
{
  bonus: 1000.00,
  overtime: 250.00,
  allowances: 150.00,
  other: 50.00
}
```

---

## Type Imports

```typescript
// Import from @operate/database
import {
  Employee,
  EmploymentContract,
  LeaveRequest,
  Payslip,
  EmploymentStatus,
  ContractType,
  LeaveType,
  EmployeeWithRelations,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeFilter,
} from '@operate/database';
```

---

## Soft Delete Pattern

```typescript
// Soft delete an employee
await prisma.employee.update({
  where: { id: 'employee-id' },
  data: { deletedAt: new Date() },
});

// Filter out deleted employees
const activeEmployees = await prisma.employee.findMany({
  where: {
    orgId: 'org-id',
    deletedAt: null,
  },
});

// Include deleted employees in admin view
const allEmployees = await prisma.employee.findMany({
  where: { orgId: 'org-id' },
  // Don't filter deletedAt
});
```

---

## Relations

### Employee Relations
- `organisation` → Organisation (required)
- `user` → User (optional, for self-service access)
- `contracts` → EmploymentContract[] (one-to-many)
- `leaveEntitlements` → LeaveEntitlement[] (one-to-many)
- `leaveRequests` → LeaveRequest[] (one-to-many)
- `timeEntries` → TimeEntry[] (one-to-many)
- `payslips` → Payslip[] (one-to-many)
- `socialSecurityRegs` → SocialSecurityRegistration[] (one-to-many)

### Include Examples
```typescript
// Full employee data
const employee = await prisma.employee.findUnique({
  where: { id: 'employee-id' },
  include: {
    organisation: true,
    user: true,
    contracts: { where: { isActive: true } },
    leaveEntitlements: { where: { year: 2024 } },
    leaveRequests: { where: { status: 'PENDING' } },
    payslips: {
      orderBy: { createdAt: 'desc' },
      take: 3,
    },
  },
});
```

---

## Migration & Seeding

### Apply Migration
```bash
cd packages/database
npm run db:migrate:deploy
```

### Run Seed (Development)
```bash
npm run db:seed
```

### Seed Data Included
- 3 sample employees
- 3 employment contracts
- Leave entitlements for current year
- Sample leave requests
- Last month's payroll with payslips
- Time entries
- Social security registrations

---

## Next Steps

1. **Backend (FORGE):** Implement HR module with services and controllers
2. **Frontend (PRISM):** Build HR UI components and workflows
3. **Security (SENTINEL):** Add RBAC and data masking for sensitive fields
4. **Testing (VERIFY):** Create comprehensive test suites

---

**For detailed implementation report, see:** `OP-030_HR_SCHEMA_IMPLEMENTATION.md`
