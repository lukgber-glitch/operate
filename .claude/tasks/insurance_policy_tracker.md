# Insurance & Policy Tracker - FORGE Agent Task

## Task ID: INSURANCE-001

## Objective
Create a complete Insurance & Policy Tracker backend module for the Operate app, enabling businesses to track insurance policies, premiums, renewals, and compliance.

## Context
This is a new feature module that adds insurance policy management capabilities to Operate. The system should:
- Track multiple insurance policies per organization
- Manage premium payments and schedules
- Send renewal reminders before expiration
- Store policy documents
- Provide dashboard summaries

## Key Files to Create

### 1. Module Structure
**Location**: `apps/api/src/modules/insurance/`

Create the following files:
- `insurance.module.ts` - Main module registration
- `insurance.controller.ts` - API endpoints
- `insurance.service.ts` - Business logic
- `dto/create-insurance-policy.dto.ts` - Create DTO
- `dto/update-insurance-policy.dto.ts` - Update DTO
- `dto/insurance-policy-filters.dto.ts` - Query filters
- `dto/mark-payment-paid.dto.ts` - Payment marking DTO
- `processors/insurance-reminder.processor.ts` - Cron job for reminders

### 2. Database Schema
**Location**: `packages/database/prisma/schema.prisma`

Add the following models:

```prisma
model InsurancePolicy {
  id              String      @id @default(cuid())
  organizationId  String
  organization    Organisation @relation(fields: [organizationId], references: [id])

  name            String      // "Business Liability Insurance"
  type            InsuranceType
  provider        String      // Insurance company name
  policyNumber    String?

  description     String?

  coverageAmount  Decimal?    @db.Decimal(19, 4)
  deductible      Decimal?    @db.Decimal(19, 4)
  currency        String      @default("EUR")

  premiumAmount   Decimal     @db.Decimal(19, 4)
  premiumFrequency PaymentFrequency @default(MONTHLY)

  startDate       DateTime
  endDate         DateTime
  renewalDate     DateTime?

  autoRenew       Boolean     @default(false)

  status          PolicyStatus @default(ACTIVE)

  contactName     String?
  contactPhone    String?
  contactEmail    String?

  documents       InsuranceDocument[]
  payments        InsurancePayment[]

  notes           String?

  reminderDays    Int         @default(30) // Days before expiry to remind

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([organizationId])
  @@index([status])
  @@index([endDate])
}

model InsuranceDocument {
  id          String          @id @default(cuid())
  policyId    String
  policy      InsurancePolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  name        String
  fileUrl     String
  fileType    String?
  fileSize    Int?

  uploadedAt  DateTime        @default(now())
}

model InsurancePayment {
  id          String          @id @default(cuid())
  policyId    String
  policy      InsurancePolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  amount      Decimal         @db.Decimal(19, 4)
  currency    String          @default("EUR")

  dueDate     DateTime
  paidDate    DateTime?

  status      PaymentStatus   @default(PENDING)

  expenseId   String?         // Link to expense if tracked

  createdAt   DateTime        @default(now())
}

enum InsuranceType {
  LIABILITY
  PROFESSIONAL_INDEMNITY
  PROPERTY
  HEALTH
  LIFE
  DISABILITY
  CYBER
  VEHICLE
  WORKERS_COMP
  OTHER
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
}

enum PaymentFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
  ONE_TIME
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
}
```

**IMPORTANT**: Add the relation to the `Organisation` model:
```prisma
// In Organisation model, add:
insurancePolicies InsurancePolicy[]
```

### 3. Module Registration
**Location**: `apps/api/src/app.module.ts`

Add to imports array (after CostsModule):
```typescript
import { InsuranceModule } from './modules/insurance/insurance.module';

// In @Module imports array:
InsuranceModule,
```

## API Endpoints Specification

### Policy Management
- `GET /api/v1/insurance/policies` - List policies with filters
  - Query params: `type`, `status`, `provider`, `expiringBefore`
  - Returns paginated list with summary data

- `GET /api/v1/insurance/policies/:id` - Get policy details
  - Returns policy with payments array and documents array

- `POST /api/v1/insurance/policies` - Create new policy
  - Auto-generates payment schedule based on frequency

- `PATCH /api/v1/insurance/policies/:id` - Update policy
  - Can update all fields except organizationId

- `DELETE /api/v1/insurance/policies/:id` - Delete policy
  - Cascades to documents and payments

### Document Management
- `POST /api/v1/insurance/policies/:id/documents` - Upload document
  - Accepts multipart/form-data
  - Stores file URL in database

- `DELETE /api/v1/insurance/policies/:id/documents/:docId` - Delete document

### Payment Management
- `GET /api/v1/insurance/policies/:id/payments` - Get payment schedule
  - Returns all payments for a policy

- `POST /api/v1/insurance/policies/:id/payments/:paymentId/mark-paid` - Mark payment as paid
  - Sets paidDate to current date
  - Updates status to PAID

### Dashboard & Reporting
- `GET /api/v1/insurance/expiring` - Get policies expiring soon
  - Query param: `days` (default: 30)
  - Returns policies where endDate <= now + days

- `GET /api/v1/insurance/summary` - Dashboard summary
  - Returns:
    - Total active policies count
    - Total expiring policies count (within 30 days)
    - Total annual premium cost
    - Breakdown by insurance type

## Service Methods

### Core Methods
```typescript
// Policy CRUD
async create(organizationId: string, dto: CreateInsurancePolicyDto): Promise<InsurancePolicy>
async findAll(organizationId: string, filters?: InsurancePolicyFiltersDto): Promise<InsurancePolicy[]>
async findOne(organizationId: string, id: string): Promise<InsurancePolicy>
async update(organizationId: string, id: string, dto: UpdateInsurancePolicyDto): Promise<InsurancePolicy>
async remove(organizationId: string, id: string): Promise<void>

// Payment Schedule
async generatePaymentSchedule(policy: InsurancePolicy): Promise<InsurancePayment[]>
async markPaymentPaid(organizationId: string, policyId: string, paymentId: string): Promise<InsurancePayment>

// Reminders & Expiration
async checkExpiring(organizationId: string, days: number): Promise<InsurancePolicy[]>
async sendRenewalReminder(policy: InsurancePolicy): Promise<void>

// Dashboard
async getDashboardSummary(organizationId: string): Promise<InsuranceDashboardSummary>
async calculateAnnualCost(organizationId: string): Promise<number>

// Documents
async uploadDocument(organizationId: string, policyId: string, file: Express.Multer.File): Promise<InsuranceDocument>
async deleteDocument(organizationId: string, policyId: string, docId: string): Promise<void>

// Expense Linking
async linkToExpense(policyId: string, paymentId: string, expenseId: string): Promise<InsurancePayment>
```

## Cron Job

**File**: `processors/insurance-reminder.processor.ts`

```typescript
@Processor('insurance-reminders')
export class InsuranceReminderProcessor {
  @Cron('0 9 * * *') // Daily at 9 AM
  async handleDailyReminderCheck() {
    // Check all organizations for expiring policies
    // Send notifications for policies expiring within reminderDays
  }
}
```

## Implementation Requirements

1. **Tenant Isolation**: All queries MUST filter by organizationId
2. **Validation**: Use class-validator decorators in DTOs
3. **Error Handling**: Throw NotFoundException, BadRequestException appropriately
4. **Logging**: Use NestJS Logger for all operations
5. **Testing**: Follow existing patterns in other modules
6. **Payment Schedule Generation**:
   - MONTHLY: Create 12 payments per year
   - QUARTERLY: Create 4 payments per year
   - SEMI_ANNUAL: Create 2 payments per year
   - ANNUAL: Create 1 payment per year
   - ONE_TIME: Create 1 payment at startDate
7. **Renewal Logic**: When endDate approaches, check if autoRenew is true
8. **Document Upload**: Store files using existing file upload service pattern

## Acceptance Criteria

- ✅ All Prisma models created and migration generated
- ✅ Module registered in app.module.ts
- ✅ All API endpoints working and tested
- ✅ Payment schedule auto-generation working
- ✅ Expiring policies detection working
- ✅ Dashboard summary endpoint returns correct data
- ✅ Document upload/delete working
- ✅ Cron job for daily reminder checks implemented
- ✅ All DTOs have proper validation
- ✅ Proper error handling and logging
- ✅ Tenant isolation enforced on all queries

## Example Usage

### Create Policy
```bash
POST /api/v1/insurance/policies
{
  "name": "Business Liability Insurance",
  "type": "LIABILITY",
  "provider": "Allianz",
  "policyNumber": "POL-2025-001",
  "coverageAmount": 1000000,
  "deductible": 5000,
  "currency": "EUR",
  "premiumAmount": 250,
  "premiumFrequency": "MONTHLY",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "autoRenew": true,
  "reminderDays": 30,
  "contactEmail": "insurance@company.com"
}
```

### Get Expiring Policies
```bash
GET /api/v1/insurance/expiring?days=30
```

### Mark Payment Paid
```bash
POST /api/v1/insurance/policies/{policyId}/payments/{paymentId}/mark-paid
{
  "paidDate": "2025-01-15"
}
```

## Notes

- Follow existing NestJS patterns in the codebase
- Use Prisma client from DatabaseModule
- Integrate with NotificationsModule for renewal reminders
- Consider future integration with chat/AI for policy recommendations
- Payment linking to expenses enables automatic expense tracking
