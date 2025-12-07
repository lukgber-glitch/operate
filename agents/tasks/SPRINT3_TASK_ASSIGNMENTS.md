# Sprint 3: Auto-Reconciliation & Expense Automation Tasks

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: Close the loop - payments update records automatically
**Duration**: Week 5-6
**Depends On**: Sprint 1 & 2 completion

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - No Dependencies within Sprint]
├── TASK-S3-01: Auto-Update Invoice Status on Payment Match (FORGE)
├── TASK-S3-02: Auto-Create Expenses from Bank Transactions (FORGE)
└── TASK-S3-03: Auto-Create Customers from Invoice Recipients (FORGE)

[PARALLEL GROUP 2 - After Group 1]
├── TASK-S3-05: Build Transaction → Expense Matching Rules (ORACLE)
└── TASK-S3-07: Wire Reconciliation to Notifications (BRIDGE)

[PARALLEL GROUP 3 - After Group 2]
├── TASK-S3-04: Implement Expense Approval Workflow (FORGE)
└── TASK-S3-06: Create Expense Report Generation (FORGE)
```

---

## TASK-S3-01: Auto-Update Invoice Status on Payment Match

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S1-02 (Transaction Classification)

### Context
The reconciliation service EXISTS at `apps/api/src/modules/finance/reconciliation/reconciliation.service.ts`. It has `applyMatch()` to link transactions to invoices BUT doesn't auto-update invoice status to PAID.

### Objective
When a bank transaction is matched to an invoice, automatically update the invoice status.

### Files to Modify
1. `apps/api/src/modules/finance/reconciliation/reconciliation.service.ts`
```typescript
async applyMatch(match: ReconciliationMatch): Promise<void> {
  // Existing logic...

  // ADD: Update invoice payment status
  if (match.entityType === 'INVOICE') {
    await this.updateInvoicePaymentStatus(match.entityId, match.transactionId);
  }

  // ADD: Update bill payment status (from Sprint 2)
  if (match.entityType === 'BILL') {
    await this.updateBillPaymentStatus(match.entityId, match.transactionId);
  }
}

private async updateInvoicePaymentStatus(invoiceId: string, transactionId: string): Promise<void> {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true }
  });

  const transaction = await this.prisma.transaction.findUnique({
    where: { id: transactionId }
  });

  // Record payment
  await this.prisma.invoicePayment.create({
    data: {
      invoiceId,
      transactionId,
      amount: transaction.amount,
      paymentDate: transaction.date,
      paymentMethod: 'BANK_TRANSFER'
    }
  });

  // Calculate total paid
  const totalPaid = invoice.paidAmount + transaction.amount;

  // Update status
  const newStatus = totalPaid >= invoice.totalAmount
    ? 'PAID'
    : totalPaid > 0
      ? 'PARTIAL'
      : invoice.status;

  await this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: totalPaid,
      status: newStatus,
      paidDate: newStatus === 'PAID' ? new Date() : null
    }
  });

  // Emit event for notifications
  this.eventEmitter.emit('invoice.paid', { invoiceId, amount: transaction.amount });
}
```

2. `apps/api/src/modules/invoices/invoices.service.ts`
   - Ensure `paidAmount` and `paidDate` fields are used consistently
   - Add method `recordPayment(invoiceId, amount, transactionId)`

### Technical Requirements
- Support partial payments (multiple transactions per invoice)
- Handle over-payment gracefully (log warning, cap at total)
- Emit `invoice.paid` event for notification system
- Update both Invoice and create InvoicePayment record
- Same logic for Bills (from Sprint 2)

### Acceptance Criteria
- [ ] When transaction matched to invoice → invoice status updates
- [ ] Partial payments tracked correctly
- [ ] Full payment → status = PAID, paidDate set
- [ ] InvoicePayment record created with transaction link
- [ ] Event emitted for notification system

---

## TASK-S3-02: Auto-Create Expenses from Bank Transactions

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S1-02 (Transaction Classification)

### Context
Bank transactions are classified with categories by Sprint 1. Now we need to auto-create Expense records from outgoing (debit) transactions.

### Objective
When bank transactions sync and are classified, automatically create Expense records for debit transactions.

### Files to Create
1. `apps/api/src/modules/banking/transaction-to-expense.service.ts`
```typescript
@Injectable()
export class TransactionToExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger,
  ) {}

  /**
   * Create expense from classified bank transaction
   */
  async createExpenseFromTransaction(
    transaction: Transaction,
    classification: TransactionClassification
  ): Promise<Expense | null> {
    // Only process debit (outgoing) transactions
    if (transaction.amount >= 0) {
      return null; // Credit/income - not an expense
    }

    // Check if expense already exists for this transaction
    const existing = await this.prisma.expense.findFirst({
      where: { sourceTransactionId: transaction.id }
    });
    if (existing) {
      return existing;
    }

    // Create expense
    const expense = await this.prisma.expense.create({
      data: {
        organisationId: transaction.organisationId,
        description: transaction.description || 'Bank transaction',
        amount: Math.abs(transaction.amount), // Positive for expense
        currency: transaction.currency,
        date: transaction.date,
        categoryId: classification.categoryId,
        taxDeductible: classification.taxDeductible,
        deductionCategory: classification.deductionCategory,
        sourceTransactionId: transaction.id,
        sourceType: 'BANK_SYNC',
        status: classification.confidence > 0.8 ? 'APPROVED' : 'PENDING_REVIEW',
        vendorName: this.extractVendorName(transaction.description),
      }
    });

    this.eventEmitter.emit('expense.created', { expense, source: 'bank_sync' });

    return expense;
  }

  /**
   * Process batch of transactions
   */
  async processTransactionBatch(transactionIds: string[]): Promise<void> {
    for (const txId of transactionIds) {
      const tx = await this.prisma.transaction.findUnique({
        where: { id: txId },
        include: { classification: true }
      });

      if (tx && tx.classification) {
        await this.createExpenseFromTransaction(tx, tx.classification);
      }
    }
  }

  private extractVendorName(description: string): string | null {
    // Use transaction description to extract vendor
    // Remove common prefixes like "CARD PAYMENT", "DIRECT DEBIT"
    // Return cleaned vendor name
  }
}
```

2. Modify `apps/api/src/modules/banking/transaction-pipeline.service.ts` (from S1-02)
   - After classification, call `transactionToExpenseService.createExpenseFromTransaction()`

3. Add to Prisma schema in Expense model:
```prisma
model Expense {
  // ... existing fields
  sourceTransactionId String?  @unique
  sourceType          ExpenseSourceType @default(MANUAL)

  sourceTransaction   Transaction? @relation(fields: [sourceTransactionId], references: [id])
}

enum ExpenseSourceType {
  MANUAL
  BANK_SYNC
  RECEIPT_SCAN
  EMAIL_EXTRACTION
}
```

### Technical Requirements
- Only create expenses for DEBIT (outgoing) transactions
- Skip if expense already exists for transaction (idempotent)
- High confidence (>0.8) → auto-approve expense
- Low confidence → pending review
- Extract vendor name from transaction description
- Link expense to source transaction for audit

### Acceptance Criteria
- [ ] Debit transactions create Expense records
- [ ] Category from classification applied
- [ ] Tax deduction flag from classification applied
- [ ] High-confidence expenses auto-approved
- [ ] Low-confidence expenses flagged for review
- [ ] No duplicate expenses for same transaction

---

## TASK-S3-03: Auto-Create Customers from Invoice Recipients

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Low
**Dependencies**: S1-01 (Invoice Extraction)

### Context
When invoices are extracted from emails or created manually, the customer details are often new. Currently requires manual customer creation.

### Objective
Auto-create Customer records when creating invoices with new customer details.

### Files to Modify
1. `apps/api/src/modules/invoices/invoices.service.ts`
```typescript
async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
  // If customerId not provided but customer details are
  if (!createInvoiceDto.customerId && createInvoiceDto.customerDetails) {
    const customer = await this.findOrCreateCustomer(
      createInvoiceDto.organisationId,
      createInvoiceDto.customerDetails
    );
    createInvoiceDto.customerId = customer.id;
  }

  // ... existing create logic
}

private async findOrCreateCustomer(
  orgId: string,
  details: CustomerDetails
): Promise<Customer> {
  // Try to find by email first
  if (details.email) {
    const existing = await this.prisma.customer.findFirst({
      where: { organisationId: orgId, email: details.email }
    });
    if (existing) return existing;
  }

  // Try to find by name + taxId
  if (details.taxId) {
    const existing = await this.prisma.customer.findFirst({
      where: { organisationId: orgId, taxId: details.taxId }
    });
    if (existing) return existing;
  }

  // Create new customer
  return this.prisma.customer.create({
    data: {
      organisationId: orgId,
      name: details.name,
      email: details.email,
      phone: details.phone,
      addressLine1: details.address?.line1,
      city: details.address?.city,
      postalCode: details.address?.postalCode,
      country: details.address?.country,
      taxId: details.taxId,
      status: 'ACTIVE',
    }
  });
}
```

2. `apps/api/src/modules/ai/extractors/invoice-extractor.service.ts`
   - When creating invoice from extraction, include customer details

3. `apps/api/src/modules/invoices/dto/create-invoice.dto.ts`
   - Add optional `customerDetails` field for inline customer creation

### Technical Requirements
- Match by email first (most reliable)
- Match by taxId second
- Match by name + address as last resort
- Create new customer if no match
- Return existing customer if found (no duplicates)

### Acceptance Criteria
- [ ] Invoice creation with new customer auto-creates Customer
- [ ] Existing customer matched by email not duplicated
- [ ] Existing customer matched by taxId not duplicated
- [ ] Customer details populated from invoice extraction
- [ ] Works for manual invoice creation too

---

## TASK-S3-04: Implement Expense Approval Workflow

**Agent**: FORGE (Backend Specialist)
**Priority**: P2
**Estimated Complexity**: Medium
**Dependencies**: S3-02

### Context
Auto-created expenses from bank sync need review before being counted for tax deductions. Need simple approval workflow.

### Objective
Add expense approval workflow with status tracking.

### Files to Create
1. `apps/api/src/modules/expenses/approval/expense-approval.service.ts`
```typescript
@Injectable()
export class ExpenseApprovalService {
  async approve(expenseId: string, userId: string): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      }
    });
  }

  async reject(expenseId: string, userId: string, reason: string): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      }
    });
  }

  async bulkApprove(expenseIds: string[], userId: string): Promise<number> {
    const result = await this.prisma.expense.updateMany({
      where: { id: { in: expenseIds }, status: 'PENDING_REVIEW' },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      }
    });
    return result.count;
  }

  async getPendingReview(orgId: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: { organisationId: orgId, status: 'PENDING_REVIEW' },
      orderBy: { date: 'desc' }
    });
  }
}
```

2. Add to `apps/api/src/modules/expenses/expenses.controller.ts`:
   - `POST /expenses/:id/approve`
   - `POST /expenses/:id/reject`
   - `POST /expenses/bulk-approve`
   - `GET /expenses/pending-review`

3. Update Prisma schema:
```prisma
model Expense {
  // ... existing fields
  status          ExpenseStatus @default(PENDING_REVIEW)
  approvedBy      String?
  approvedAt      DateTime?
  rejectedBy      String?
  rejectedAt      DateTime?
  rejectionReason String?
}

enum ExpenseStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  ARCHIVED
}
```

### Technical Requirements
- Single and bulk approval
- Rejection with reason
- Track who approved/rejected
- Only tax-deductible expenses need approval
- Non-deductible can be auto-approved

### Acceptance Criteria
- [ ] Approve single expense
- [ ] Reject expense with reason
- [ ] Bulk approve multiple expenses
- [ ] List pending review expenses
- [ ] Approval audit trail (who, when)

---

## TASK-S3-05: Build Transaction → Expense Matching Rules

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S3-02

### Context
Some transactions should always be categorized the same way. Need user-defined rules for automatic categorization.

### Objective
Create matching rules that auto-categorize transactions based on patterns.

### Files to Create
1. `apps/api/src/modules/banking/matching-rules.service.ts`
```typescript
@Injectable()
export class MatchingRulesService {
  async applyRules(transaction: Transaction): Promise<TransactionClassification | null> {
    const rules = await this.prisma.transactionRule.findMany({
      where: { organisationId: transaction.organisationId, enabled: true },
      orderBy: { priority: 'asc' }
    });

    for (const rule of rules) {
      if (this.matchesRule(transaction, rule)) {
        return {
          categoryId: rule.categoryId,
          taxDeductible: rule.taxDeductible,
          deductionCategory: rule.deductionCategory,
          vendorId: rule.vendorId,
          confidence: 1.0, // Rules have 100% confidence
          source: 'RULE',
          ruleId: rule.id,
        };
      }
    }

    return null; // No rule matched, use AI classification
  }

  private matchesRule(tx: Transaction, rule: TransactionRule): boolean {
    // Pattern matching on description
    if (rule.descriptionPattern) {
      const regex = new RegExp(rule.descriptionPattern, 'i');
      if (!regex.test(tx.description)) return false;
    }

    // Amount range matching
    if (rule.minAmount && Math.abs(tx.amount) < rule.minAmount) return false;
    if (rule.maxAmount && Math.abs(tx.amount) > rule.maxAmount) return false;

    // Merchant matching
    if (rule.merchantPattern) {
      const regex = new RegExp(rule.merchantPattern, 'i');
      if (!regex.test(tx.merchantName || '')) return false;
    }

    return true;
  }

  async createRuleFromTransaction(
    tx: Transaction,
    classification: TransactionClassification,
    orgId: string
  ): Promise<TransactionRule> {
    // Extract pattern from transaction
    const pattern = this.extractPattern(tx.description);

    return this.prisma.transactionRule.create({
      data: {
        organisationId: orgId,
        name: `Rule for ${tx.merchantName || pattern}`,
        descriptionPattern: pattern,
        categoryId: classification.categoryId,
        taxDeductible: classification.taxDeductible,
        deductionCategory: classification.deductionCategory,
        enabled: true,
        priority: 100,
      }
    });
  }
}
```

2. Add to Prisma schema:
```prisma
model TransactionRule {
  id                 String   @id @default(cuid())
  organisationId     String
  name               String
  description        String?

  // Matching criteria
  descriptionPattern String?  // Regex pattern
  merchantPattern    String?
  minAmount          Decimal? @db.Decimal(15, 2)
  maxAmount          Decimal? @db.Decimal(15, 2)

  // Classification output
  categoryId         String?
  taxDeductible      Boolean  @default(false)
  deductionCategory  String?
  vendorId           String?

  // Control
  enabled            Boolean  @default(true)
  priority           Int      @default(100)

  organisation       Organisation @relation(fields: [organisationId], references: [id])
  category           Category?    @relation(fields: [categoryId], references: [id])
  vendor             Vendor?      @relation(fields: [vendorId], references: [id])

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([organisationId])
}
```

3. `apps/api/src/modules/banking/matching-rules.controller.ts`
   - CRUD for rules
   - "Create rule from transaction" endpoint

### Technical Requirements
- Rules evaluated before AI classification
- First matching rule wins (by priority)
- Regex patterns for description matching
- Amount range filters
- User can create rules from classified transactions

### Acceptance Criteria
- [ ] Rules auto-categorize matching transactions
- [ ] Rules have 100% confidence (trusted)
- [ ] Create rule from existing transaction
- [ ] Enable/disable rules
- [ ] Rule priority ordering

---

## TASK-S3-06: Create Expense Report Generation

**Agent**: FORGE (Backend Specialist)
**Priority**: P2
**Estimated Complexity**: Low
**Dependencies**: S3-02, S3-04

### Context
Users need to generate expense reports for accounting and tax purposes.

### Objective
Create expense report generation with date range and category filters.

### Files to Create
1. `apps/api/src/modules/reports/expense-report.service.ts`
```typescript
@Injectable()
export class ExpenseReportService {
  async generate(params: ExpenseReportParams): Promise<ExpenseReport> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        organisationId: params.orgId,
        date: { gte: params.startDate, lte: params.endDate },
        status: 'APPROVED',
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.taxDeductible !== undefined && { taxDeductible: params.taxDeductible }),
      },
      include: { category: true, vendor: true },
      orderBy: { date: 'asc' }
    });

    const byCategory = this.groupByCategory(expenses);
    const byMonth = this.groupByMonth(expenses);
    const totals = this.calculateTotals(expenses);

    return {
      period: { start: params.startDate, end: params.endDate },
      expenses,
      byCategory,
      byMonth,
      totals,
      taxDeductibleTotal: totals.taxDeductible,
      nonDeductibleTotal: totals.nonDeductible,
    };
  }

  async exportToCsv(reportId: string): Promise<Buffer> {
    // Generate CSV export
  }

  async exportToPdf(reportId: string): Promise<Buffer> {
    // Generate PDF export (use existing PDF service)
  }
}
```

2. `apps/api/src/modules/reports/reports.controller.ts`
   - `POST /reports/expenses` - Generate report
   - `GET /reports/expenses/:id/csv` - Download CSV
   - `GET /reports/expenses/:id/pdf` - Download PDF

### Technical Requirements
- Date range selection (default: current month)
- Filter by category, tax deductible status
- Group by category with subtotals
- Group by month for trends
- Export to CSV and PDF

### Acceptance Criteria
- [ ] Generate expense report for date range
- [ ] Filter by category
- [ ] Show tax-deductible breakdown
- [ ] Export to CSV
- [ ] Export to PDF

---

## TASK-S3-07: Wire Reconciliation to Notifications

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P1
**Estimated Complexity**: Low
**Dependencies**: S3-01

### Context
When invoice is matched/paid via reconciliation, user should be notified.

### Objective
Connect reconciliation events to notification system.

### Files to Modify
1. `apps/api/src/modules/finance/reconciliation/reconciliation.service.ts`
   - Ensure events are emitted after successful matches

2. Create `apps/api/src/modules/notifications/listeners/reconciliation.listener.ts`
```typescript
@Injectable()
export class ReconciliationListener {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('invoice.paid')
  async handleInvoicePaid(payload: { invoiceId: string; amount: number }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      include: { customer: true }
    });

    await this.notificationService.create({
      type: 'INVOICE_PAID',
      title: 'Invoice Paid',
      message: `Invoice ${invoice.invoiceNumber} (€${payload.amount}) from ${invoice.customer.name} has been paid`,
      entityType: 'INVOICE',
      entityId: payload.invoiceId,
      orgId: invoice.organisationId,
      priority: 'NORMAL',
    });
  }

  @OnEvent('bill.paid')
  async handleBillPaid(payload: { billId: string; amount: number }) {
    // Similar notification for bills
  }

  @OnEvent('reconciliation.matched')
  async handleMatched(payload: { entityType: string; entityId: string; transactionId: string }) {
    // Notification for successful match
  }
}
```

3. Register listener in `apps/api/src/modules/notifications/notifications.module.ts`

### Technical Requirements
- Listen for reconciliation events
- Create in-app notifications
- Include links to entities (invoice/bill/transaction)
- Notification preferences respected

### Acceptance Criteria
- [ ] Invoice paid → notification appears
- [ ] Bill paid → notification appears
- [ ] Transaction matched → notification appears
- [ ] Notifications link to entity

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel - Start Immediately)
Launch these 3 agents simultaneously:

1. **FORGE Agent #1**: TASK-S3-01 (Auto-Update Invoice on Payment)
2. **FORGE Agent #2**: TASK-S3-02 (Auto-Create Expenses)
3. **FORGE Agent #3**: TASK-S3-03 (Auto-Create Customers)

### Phase 2 (After Phase 1 Completes)
Launch these 2 agents simultaneously:

4. **ORACLE Agent**: TASK-S3-05 (Transaction Matching Rules)
5. **BRIDGE Agent**: TASK-S3-07 (Reconciliation Notifications)

### Phase 3 (After Phase 2 Completes)
Launch these 2 agents simultaneously:

6. **FORGE Agent #4**: TASK-S3-04 (Expense Approval Workflow)
7. **FORGE Agent #5**: TASK-S3-06 (Expense Report Generation)

---

## SUCCESS METRICS

When Sprint 3 is complete:

1. **Invoice Auto-Paid**: Bank payment matches invoice → status = PAID
2. **Expense Auto-Created**: Bank debit → Expense record created
3. **Customer Auto-Created**: New invoice → Customer record created
4. **Matching Rules**: User patterns auto-categorize future transactions
5. **Notifications**: "Invoice #123 was paid" notification appears
6. **Reports**: Generate expense report with tax breakdown

---

## NOTES FOR AGENTS

- Use existing EventEmitter2 for event-driven architecture
- Follow patterns from existing reconciliation service
- Expenses are NEGATIVE amounts (outgoing money)
- Invoices are POSITIVE amounts (incoming money)
- All financial amounts in minor units (cents)
- Status transitions must be logged for audit
