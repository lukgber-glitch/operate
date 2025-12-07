# Sprint 2: Accounts Payable & Vendor Management Tasks

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: Track what you OWE, not just what you're OWED
**Duration**: Week 3-4
**Depends On**: Sprint 1 completion

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - No Dependencies]
├── TASK-S2-01: Create Bill Entity & Module (VAULT)
└── TASK-S2-02: Create Vendor Entity & Module (VAULT)

[PARALLEL GROUP 2 - After Group 1]
├── TASK-S2-03: Build Bill CRUD API (FORGE)
└── TASK-S2-05: Build Vendor Management UI (PRISM)

[PARALLEL GROUP 3 - After Group 2]
├── TASK-S2-04: Auto-Create Bills from Email Invoices (ORACLE)
├── TASK-S2-06: Create Bill Payment Reminders (FORGE)
└── TASK-S2-07: Wire Bills to Chat Actions (ORACLE)
```

---

## TASK-S2-01: Create Bill Entity & Module

**Agent**: VAULT (Database Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
The app tracks invoices you SEND (accounts receivable) but has NO system for invoices you RECEIVE (accounts payable/bills). This is critical for cash flow management.

### Objective
Create the Bill entity and database schema to track money the business owes to vendors.

### Files to Create
1. `packages/database/prisma/schema.prisma` - Add Bill model:
```prisma
model Bill {
  id                String         @id @default(cuid())
  organisationId    String
  vendorId          String?

  // Bill Details
  billNumber        String?
  reference         String?
  description       String?

  // Amounts
  amount            Decimal        @db.Decimal(15, 2)
  currency          String         @default("EUR")
  taxAmount         Decimal?       @db.Decimal(15, 2)
  totalAmount       Decimal        @db.Decimal(15, 2)
  paidAmount        Decimal        @default(0) @db.Decimal(15, 2)

  // Status
  status            BillStatus     @default(DRAFT)
  paymentStatus     PaymentStatus  @default(UNPAID)

  // Dates
  issueDate         DateTime
  dueDate           DateTime
  paidDate          DateTime?

  // Source tracking
  sourceType        BillSourceType @default(MANUAL)
  sourceEmailId     String?
  sourceAttachmentId String?
  extractedDataId   String?

  // Categorization
  categoryId        String?
  taxDeductible     Boolean        @default(false)
  deductionCategory String?

  // Relations
  organisation      Organisation   @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  vendor            Vendor?        @relation(fields: [vendorId], references: [id])
  category          Category?      @relation(fields: [categoryId], references: [id])
  lineItems         BillLineItem[]
  payments          BillPayment[]
  attachments       BillAttachment[]

  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([organisationId])
  @@index([vendorId])
  @@index([status])
  @@index([dueDate])
}

enum BillStatus {
  DRAFT
  PENDING
  APPROVED
  PAID
  OVERDUE
  CANCELLED
}

enum BillSourceType {
  MANUAL
  EMAIL_EXTRACTION
  UPLOAD
  API_IMPORT
}

model BillLineItem {
  id          String   @id @default(cuid())
  billId      String
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  unitPrice   Decimal  @db.Decimal(15, 2)
  amount      Decimal  @db.Decimal(15, 2)
  taxRate     Decimal? @db.Decimal(5, 2)
  taxAmount   Decimal? @db.Decimal(15, 2)

  bill        Bill     @relation(fields: [billId], references: [id], onDelete: Cascade)

  @@index([billId])
}

model BillPayment {
  id            String        @id @default(cuid())
  billId        String
  transactionId String?
  amount        Decimal       @db.Decimal(15, 2)
  paymentDate   DateTime
  paymentMethod PaymentMethod
  reference     String?

  bill          Bill          @relation(fields: [billId], references: [id], onDelete: Cascade)
  transaction   Transaction?  @relation(fields: [transactionId], references: [id])

  createdAt     DateTime      @default(now())

  @@index([billId])
  @@index([transactionId])
}
```

2. `apps/api/src/modules/finance/bills/bills.module.ts`
3. `apps/api/src/modules/finance/bills/entities/bill.entity.ts`

### Technical Requirements
- Use existing Category and Currency patterns
- Support line items for itemized bills
- Track payment history with BillPayment
- Link to bank transactions when matched
- Support source tracking (email extraction, upload, manual)

### Acceptance Criteria
- [ ] Bill model in Prisma schema
- [ ] BillLineItem for itemized bills
- [ ] BillPayment for tracking payments
- [ ] Migration runs successfully
- [ ] Prisma Client regenerated

---

## TASK-S2-02: Create Vendor Entity & Module

**Agent**: VAULT (Database Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
The app has Customers (who you bill) but NO Vendors (who bill you). Vendor management is essential for AP automation.

### Objective
Create the Vendor entity to track suppliers and service providers.

### Files to Create
1. Add to `packages/database/prisma/schema.prisma`:
```prisma
model Vendor {
  id              String        @id @default(cuid())
  organisationId  String

  // Basic Info
  name            String
  displayName     String?
  email           String?
  phone           String?
  website         String?

  // Address
  addressLine1    String?
  addressLine2    String?
  city            String?
  state           String?
  postalCode      String?
  country         String?

  // Tax Info
  taxId           String?       // VAT number
  taxIdType       TaxIdType?

  // Payment Info
  paymentTerms    Int           @default(30)  // Days
  preferredPaymentMethod PaymentMethod?
  bankAccountName String?
  bankIban        String?
  bankBic         String?

  // Categorization
  defaultCategoryId String?
  defaultTaxDeductible Boolean   @default(true)

  // Status
  status          VendorStatus  @default(ACTIVE)

  // Relations
  organisation    Organisation  @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  bills           Bill[]
  defaultCategory Category?     @relation(fields: [defaultCategoryId], references: [id])

  // Metadata
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([organisationId, taxId])
  @@index([organisationId])
  @@index([name])
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

enum TaxIdType {
  VAT_EU
  VAT_DE
  VAT_AT
  EIN_US
  OTHER
}
```

2. `apps/api/src/modules/crm/vendors/vendors.module.ts`
3. `apps/api/src/modules/crm/vendors/entities/vendor.entity.ts`
4. `apps/api/src/modules/crm/vendors/dto/create-vendor.dto.ts`
5. `apps/api/src/modules/crm/vendors/dto/update-vendor.dto.ts`

### Technical Requirements
- Store payment details (IBAN, BIC) for future payment automation
- Default category for automatic expense categorization
- Payment terms for due date calculation
- VAT number validation (use existing VIES service if available)

### Acceptance Criteria
- [ ] Vendor model in Prisma schema
- [ ] Migration runs successfully
- [ ] Vendor has payment info fields
- [ ] Vendor linked to default category
- [ ] Organisation-scoped unique taxId

---

## TASK-S2-03: Build Bill CRUD API

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S2-01, S2-02

### Context
With Bill and Vendor entities created, we need full CRUD API endpoints.

### Objective
Create complete REST API for bill management.

### Files to Create
1. `apps/api/src/modules/finance/bills/bills.controller.ts`
```typescript
@Controller('bills')
@ApiTags('Bills')
@UseGuards(JwtAuthGuard, OrganisationGuard)
export class BillsController {
  // GET /bills - List bills with filters
  // GET /bills/:id - Get single bill
  // POST /bills - Create bill
  // PATCH /bills/:id - Update bill
  // DELETE /bills/:id - Delete bill
  // POST /bills/:id/approve - Approve bill
  // POST /bills/:id/pay - Record payment
  // GET /bills/overdue - List overdue bills
  // GET /bills/due-soon - Bills due in next 7 days
}
```

2. `apps/api/src/modules/finance/bills/bills.service.ts`
3. `apps/api/src/modules/finance/bills/dto/create-bill.dto.ts`
4. `apps/api/src/modules/finance/bills/dto/update-bill.dto.ts`
5. `apps/api/src/modules/finance/bills/dto/bill-filter.dto.ts`
6. `apps/api/src/modules/finance/bills/dto/record-payment.dto.ts`

### Files to Create for Vendors
1. `apps/api/src/modules/crm/vendors/vendors.controller.ts`
2. `apps/api/src/modules/crm/vendors/vendors.service.ts`

### Technical Requirements
- Pagination and filtering (status, vendor, date range)
- Auto-calculate due date from vendor payment terms
- Support partial payments
- Update status based on payment (UNPAID → PARTIAL → PAID)
- Auto-mark OVERDUE when past due date
- Emit events for bill creation/payment (for notifications)

### Acceptance Criteria
- [ ] Full CRUD for Bills
- [ ] Full CRUD for Vendors
- [ ] Pagination with filters
- [ ] Payment recording with partial support
- [ ] Auto status updates
- [ ] OpenAPI/Swagger documentation

---

## TASK-S2-04: Auto-Create Bills from Email Invoices

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: High
**Dependencies**: S1-01, S2-03

### Context
Sprint 1 extracts invoice data from email attachments. Now we need to automatically create Bill records from those extractions when the invoice is FROM a vendor (not TO a customer).

### Objective
Detect vendor invoices (bills) from email extractions and auto-create Bill records.

### Files to Modify
1. `apps/api/src/modules/ai/extractors/invoice-extractor.processor.ts`
   - After extraction, determine if this is a RECEIVABLE (customer owes us) or PAYABLE (we owe vendor)
   - If PAYABLE → Create Bill record

2. Create `apps/api/src/modules/finance/bills/bill-auto-creator.service.ts`
```typescript
@Injectable()
export class BillAutoCreatorService {
  async createFromExtraction(extractedInvoice: ExtractedInvoice, orgId: string): Promise<Bill> {
    // 1. Find or create vendor from sender info
    // 2. Create Bill with extracted data
    // 3. Link to source attachment
    // 4. Auto-categorize based on vendor defaults or AI
    // 5. Flag for tax deduction if applicable
  }

  private async determineInvoiceDirection(extraction: ExtractedInvoice, org: Organisation): Promise<'RECEIVABLE' | 'PAYABLE'> {
    // If seller matches org → RECEIVABLE (invoice we sent)
    // If buyer matches org → PAYABLE (bill we received)
  }
}
```

3. `apps/api/src/modules/finance/bills/vendor-matcher.service.ts`
   - Match extracted sender to existing vendor
   - Create new vendor if not found (with extracted details)

### Technical Requirements
- Use extracted seller/vendor name to match or create Vendor
- Copy all line items from extraction
- Set due date from extracted data or vendor default terms
- Link bill to source email and attachment for audit trail
- Auto-apply vendor's default category if set

### Acceptance Criteria
- [ ] Incoming invoices detected as PAYABLE
- [ ] Bill auto-created from extraction
- [ ] Vendor auto-created if new
- [ ] Line items copied accurately
- [ ] Source tracking (email → attachment → bill)
- [ ] Category auto-applied

---

## TASK-S2-05: Build Vendor Management UI

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S2-02, S2-03

### Context
Backend has Vendor API, frontend needs UI to manage vendors.

### Objective
Create vendor management pages with list, detail, and edit views.

### Files to Create
1. `apps/web/src/app/(dashboard)/vendors/page.tsx` - Vendor list
2. `apps/web/src/app/(dashboard)/vendors/[id]/page.tsx` - Vendor detail
3. `apps/web/src/app/(dashboard)/vendors/new/page.tsx` - Create vendor
4. `apps/web/src/components/vendors/VendorTable.tsx`
5. `apps/web/src/components/vendors/VendorForm.tsx`
6. `apps/web/src/components/vendors/VendorCard.tsx`
7. `apps/web/src/lib/api/vendors.ts` - API client

### Technical Requirements
- Use existing Table, Form, Card UI components
- Show vendor stats (total bills, outstanding amount)
- Quick actions (create bill, view bills)
- Import from existing bill data
- Search and filter

### Acceptance Criteria
- [ ] Vendor list with search/filter
- [ ] Create vendor form
- [ ] Edit vendor form
- [ ] Vendor detail with bill history
- [ ] Mobile responsive

---

## TASK-S2-06: Create Bill Payment Reminders

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Low
**Dependencies**: S2-03

### Context
Payment reminder system exists for invoices (AR). We need similar reminders for bills (AP) to help users pay on time.

### Objective
Extend payment reminder system to include bills due soon.

### Files to Modify
1. `apps/api/src/modules/finance/payment-reminders/payment-reminder.service.ts`
   - Add `getBillsDueSoon()` method
   - Add `createBillReminders()` method

2. `apps/api/src/modules/finance/payment-reminders/jobs/bill-reminder.processor.ts`
   - Daily job to check for bills due in 7, 3, 1 days
   - Create in-app notifications (not email - those go to customers)

### Files to Create
1. `apps/api/src/modules/finance/bills/jobs/bill-overdue.processor.ts`
   - Update bill status to OVERDUE when past due date
   - Create urgent notification

### Technical Requirements
- In-app notifications only (don't email yourself)
- Reminder levels: 7 days, 3 days, 1 day, overdue
- Link to bill in notification
- Include amount and vendor name

### Acceptance Criteria
- [ ] Bills due in 7 days trigger notification
- [ ] Bills due in 3 days trigger notification
- [ ] Bills due in 1 day trigger urgent notification
- [ ] Overdue bills marked and alerted
- [ ] Notifications link to bill

---

## TASK-S2-07: Wire Bills to Chat Actions

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S2-03, S1-06

### Context
Chat can execute actions like "create invoice". We need to add bill-related actions.

### Objective
Add bill management actions to the chat action executor.

### Files to Modify
1. `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
   - Add actions: CREATE_BILL, PAY_BILL, LIST_BILLS, BILL_STATUS

```typescript
// Add to action types
CREATE_BILL = 'CREATE_BILL',
PAY_BILL = 'PAY_BILL',
LIST_BILLS = 'LIST_BILLS',
BILL_STATUS = 'BILL_STATUS',
```

2. `apps/api/src/modules/chatbot/chat.service.ts`
   - Update system prompt to include bill capabilities
   - "You can help users manage bills (money they owe to vendors)"

3. `apps/api/src/modules/chatbot/prompts/system-prompt.ts`
   - Add bill action examples
   - "User: Record a bill for $500 from Office Depot"
   - "User: When is my AWS bill due?"
   - "User: Mark the electricity bill as paid"

### Technical Requirements
- CREATE_BILL: Create bill from natural language
- PAY_BILL: Record payment on existing bill
- LIST_BILLS: Show overdue or upcoming bills
- BILL_STATUS: Get specific bill status

### Acceptance Criteria
- [ ] "Create a bill for €200 from AWS" → creates bill
- [ ] "Show overdue bills" → lists overdue bills
- [ ] "Mark bill #123 as paid" → records payment
- [ ] "When is the office rent due?" → shows due date
- [ ] Actions require confirmation before execution

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel - Start Immediately)
Launch these 2 agents simultaneously:

1. **VAULT Agent #1**: TASK-S2-01 (Bill Entity)
2. **VAULT Agent #2**: TASK-S2-02 (Vendor Entity)

### Phase 2 (After Phase 1 Completes)
Launch these 2 agents simultaneously:

3. **FORGE Agent**: TASK-S2-03 (Bill CRUD API)
4. **PRISM Agent**: TASK-S2-05 (Vendor Management UI)

### Phase 3 (After Phase 2 Completes)
Launch these 3 agents simultaneously:

5. **ORACLE Agent #1**: TASK-S2-04 (Auto-Create Bills from Email)
6. **FORGE Agent #2**: TASK-S2-06 (Bill Payment Reminders)
7. **ORACLE Agent #2**: TASK-S2-07 (Wire Bills to Chat)

---

## SUCCESS METRICS

When Sprint 2 is complete:

1. **Vendor Management**: Full CRUD with payment details stored
2. **Bill Tracking**: Create, edit, approve, pay bills
3. **Auto-Creation**: Email invoice → Bill record automatically
4. **Reminders**: "AWS bill due in 3 days" notification
5. **Chat Integration**: "Create bill for €500 from Acme" works

---

## NOTES FOR AGENTS

- Bills are the INVERSE of invoices (AP vs AR)
- Use same patterns as existing Invoice module
- Vendor is the INVERSE of Customer
- Payment reminders go to USER (in-app), not vendor (no email)
- All amounts in cents/minor units for precision
