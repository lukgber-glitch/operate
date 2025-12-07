# OPERATE - Full Automation Master Plan

## Vision
Transform Operate into a **fully autonomous business assistant** where the user can focus on working while the app handles:
- All financial paperwork (invoices, bills, expenses)
- Tax compliance and optimization
- Customer relationship management
- Cash flow monitoring and predictions
- Proactive business intelligence

---

## CURRENT STATE ASSESSMENT

### What's COMPLETE (80% Backend)
| Area | Status | Details |
|------|--------|---------|
| Email OAuth | 100% | Gmail/Outlook sync, attachment download |
| Bank Connections | 100% | Plaid, Tink, TrueLayer (sandbox) |
| Chat with Claude | 100% | Streaming, conversation history |
| Invoice CRUD | 100% | Create, edit, send, multi-currency |
| Expense Management | 100% | Categories, receipts, tax flags |
| Tax Deduction Classifier | 100% | AI-powered, confidence scoring |
| Fraud Detection | 100% | Statistical + AI anomaly detection |
| Cash Flow Reports | 100% | Burn rate, runway, forecasting |
| Payment Reminders | 100% | 7-level escalation system |
| Background Jobs | 100% | 28 cron jobs, 21 BullMQ processors |
| ELSTER Integration | 90% | VAT returns, backend complete |
| FinanzOnline | 90% | Austria tax, backend complete |

### What's MISSING (The 20% That Matters)

#### Category 1: Pipeline Connections
| Gap | Impact | Priority |
|-----|--------|----------|
| Email → Invoice Pipeline | Can't auto-extract bills from emails | P0 |
| Bank → Classification Pipeline | Transactions not analyzed | P0 |
| Email Service (stub) | Reminders don't actually send | P0 |
| Proactive Scheduler | AI doesn't suggest without asking | P0 |
| Action Confirmation API | Chat can't execute commands | P0 |

#### Category 2: Missing Modules
| Gap | Impact | Priority |
|-----|--------|----------|
| Bills/AP Module | Can't track outgoing payments | P1 |
| Vendor Master | No supplier management | P1 |
| Document Management | Fragmented storage, no search | P1 |
| Approval Workflows | No expense/invoice approval | P2 |

#### Category 3: Automation Logic
| Gap | Impact | Priority |
|-----|--------|----------|
| Auto-Customer Creation | Manual customer entry | P1 |
| Payment → Invoice Linking | Paid invoices not auto-updated | P1 |
| Transaction → Expense | Manual expense entry | P1 |
| Escalation Automation | Manual follow-ups | P2 |

#### Category 4: Frontend Gaps
| Gap | Impact | Priority |
|-----|--------|----------|
| Tax Filing Wizards | Mocked, don't call real API | P1 |
| Action Execution UI | Can't confirm chat actions | P0 |
| Proactive Suggestions Display | Not shown in chat | P1 |
| Document Search | No "find invoice from Acme" | P2 |

---

## SPRINT BREAKDOWN

### SPRINT 1: Core Pipeline Connections (Week 1-2)
**Goal**: Make data flow automatically

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S1-01 | Wire Invoice Extraction Pipeline | BRIDGE | P0 | None |
| S1-02 | Wire Transaction Classification Pipeline | BRIDGE | P0 | None |
| S1-03 | Implement Email Delivery Service | BRIDGE | P0 | None |
| S1-04 | Create Proactive Suggestions Scheduler | ORACLE | P0 | S1-03 |
| S1-05 | Build Action Confirmation Endpoints | FORGE | P0 | None |
| S1-06 | Wire Frontend Action Handler | PRISM | P0 | S1-05 |

**Sprint 1 Deliverables**:
- Email attachments auto-extracted to invoices
- Bank transactions auto-classified
- Payment reminder emails actually sent
- Daily proactive suggestions generated
- Chat actions executable with confirmation

---

### SPRINT 2: Accounts Payable & Vendor Management (Week 3-4)
**Goal**: Track what you OWE, not just what you're OWED

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S2-01 | Create Bill Entity & Module | VAULT | P1 | None |
| S2-02 | Create Vendor Entity & Module | VAULT | P1 | None |
| S2-03 | Build Bill CRUD API | FORGE | P1 | S2-01, S2-02 |
| S2-04 | Auto-Create Bills from Email Invoices | ORACLE | P1 | S1-01, S2-03 |
| S2-05 | Build Vendor Management UI | PRISM | P1 | S2-02, S2-03 |
| S2-06 | Create Bill Payment Reminders | FORGE | P1 | S2-03 |
| S2-07 | Wire Bills to Chat Actions | ORACLE | P1 | S2-03, S1-06 |

**Sprint 2 Deliverables**:
- Complete Bills/AP module with CRUD
- Vendor master with contact info
- Bills auto-created from received invoices
- Outgoing payment reminders
- "Pay bill for Acme" works from chat

---

### SPRINT 3: Auto-Reconciliation & Expense Automation (Week 5-6)
**Goal**: Close the loop - payments update records automatically

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S3-01 | Auto-Update Invoice Status on Payment Match | FORGE | P1 | S1-02 |
| S3-02 | Auto-Create Expenses from Bank Transactions | FORGE | P1 | S1-02 |
| S3-03 | Auto-Create Customers from Invoice Recipients | FORGE | P1 | S1-01 |
| S3-04 | Implement Expense Approval Workflow | FORGE | P2 | S3-02 |
| S3-05 | Build Transaction → Expense Matching Rules | ORACLE | P1 | S3-02 |
| S3-06 | Create Expense Report Generation | FORGE | P2 | S3-02 |
| S3-07 | Wire Reconciliation to Notifications | BRIDGE | P1 | S3-01 |

**Sprint 3 Deliverables**:
- Invoices auto-marked PAID when payment arrives
- Expenses auto-created from bank transactions
- Customers auto-created from invoice recipients
- Transaction matching rules (vendor → category)
- "Invoice #123 was paid" notifications

---

### SPRINT 4: Document Intelligence & Search (Week 7-8)
**Goal**: "Find all invoices from Acme in 2024"

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S4-01 | Unify Document Storage (S3/Local) | BRIDGE | P1 | None |
| S4-02 | Create Document Entity with Lineage | VAULT | P1 | S4-01 |
| S4-03 | Build Document Search Index | ORACLE | P1 | S4-02 |
| S4-04 | Implement Cross-Entity Document Linking | FORGE | P1 | S4-02 |
| S4-05 | Add Document Audit Trail | FORGE | P2 | S4-02 |
| S4-06 | Create Document Search UI | PRISM | P1 | S4-03 |
| S4-07 | Wire Document Search to Chat | ORACLE | P1 | S4-03, S4-06 |

**Sprint 4 Deliverables**:
- Unified document storage with proper paths
- Document lineage (email → attachment → invoice → expense)
- "Find invoices from Acme" works from chat
- Document audit trail with timestamps
- Visual document browser with search

---

### SPRINT 5: Tax Filing & Compliance (Week 9-10)
**Goal**: File taxes automatically (with user approval)

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S5-01 | Wire Tax Wizard to Real ELSTER API | PRISM | P1 | None |
| S5-02 | Wire Tax Wizard to Real FinanzOnline API | PRISM | P1 | None |
| S5-03 | Build VAT Return Preview & Approval | FORGE | P1 | S5-01, S5-02 |
| S5-04 | Create Tax Calendar with Deadlines | ORACLE | P1 | S5-03 |
| S5-05 | Auto-Generate VAT Return Data | ORACLE | P1 | S3-01 |
| S5-06 | Add Tax Filing Reminders to Proactive | ORACLE | P1 | S5-04, S1-04 |
| S5-07 | Create Tax Document Archive | BRIDGE | P2 | S4-02 |

**Sprint 5 Deliverables**:
- Real ELSTER VAT submission (Germany)
- Real FinanzOnline submission (Austria)
- Auto-generated VAT returns from transactions
- Tax deadline reminders in proactive suggestions
- Tax document archive for audits

---

### SPRINT 6: Cash Flow Intelligence & Polish (Week 11-12)
**Goal**: Predictive business intelligence

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S6-01 | Surface Cash Flow to Chat | ORACLE | P1 | None |
| S6-02 | Add Cash Flow Alerts to Proactive | ORACLE | P1 | S1-04 |
| S6-03 | Create AR Aging Report | FORGE | P2 | S3-01 |
| S6-04 | Create AP Aging Report | FORGE | P2 | S2-03 |
| S6-05 | Build Financial Dashboard | PRISM | P2 | S6-03, S6-04 |
| S6-06 | Implement Scenario Planning | ORACLE | P2 | S6-01 |
| S6-07 | Add "What-If" to Chat | ORACLE | P2 | S6-06 |

**Sprint 6 Deliverables**:
- "How's my cash flow?" works in chat
- "You'll run out of cash in 45 days" proactive alert
- AR/AP aging reports
- Financial dashboard with KPIs
- "What if I hire 2 people?" scenario planning

---

### SPRINT 7: Production Hardening (Week 13-14)
**Goal**: Ready for real money

| ID | Task | Agent | Priority | Dependencies |
|----|------|-------|----------|--------------|
| S7-01 | Switch Plaid to Production | BRIDGE | P1 | All sprints |
| S7-02 | Switch TrueLayer to Production | BRIDGE | P1 | All sprints |
| S7-03 | Add Bull Board Queue Monitor | FLUX | P2 | None |
| S7-04 | Implement Sentry Error Alerting | FLUX | P2 | None |
| S7-05 | Create E2E Test Suite | VERIFY | P1 | All sprints |
| S7-06 | Performance Optimization | FLUX | P2 | S7-05 |
| S7-07 | Security Audit | SENTINEL | P1 | All sprints |

**Sprint 7 Deliverables**:
- Real bank connections (not sandbox)
- Error monitoring and alerting
- Comprehensive test coverage
- Optimized performance
- Security-audited codebase

---

## AGENT ASSIGNMENTS

### Primary Agent Responsibilities

| Agent | Specialty | Task Count | Sprint Focus |
|-------|-----------|------------|--------------|
| **ATLAS** | Project Manager | 0 (coordination) | All sprints |
| **BRIDGE** | Integrations | 9 tasks | S1, S4, S5, S7 |
| **ORACLE** | AI/ML | 14 tasks | S1, S2, S3, S4, S5, S6 |
| **FORGE** | Backend | 14 tasks | S1, S2, S3, S4, S5, S6 |
| **PRISM** | Frontend | 6 tasks | S1, S2, S4, S5, S6 |
| **VAULT** | Database | 4 tasks | S2, S4 |
| **FLUX** | DevOps | 4 tasks | S7 |
| **VERIFY** | QA | 1 task | S7 |
| **SENTINEL** | Security | 1 task | S7 |

### Agent Launch Sequence by Sprint

#### Sprint 1 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── BRIDGE: S1-01 (Invoice Extraction Pipeline)
├── BRIDGE: S1-02 (Transaction Classification Pipeline)
└── BRIDGE: S1-03 (Email Delivery Service)

[PARALLEL GROUP 2 - After Group 1]
├── ORACLE: S1-04 (Proactive Scheduler)
└── FORGE: S1-05 (Action Confirmation Endpoints)

[PARALLEL GROUP 3 - After Group 2]
└── PRISM: S1-06 (Frontend Action Handler)
```

#### Sprint 2 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── VAULT: S2-01 (Bill Entity)
└── VAULT: S2-02 (Vendor Entity)

[PARALLEL GROUP 2 - After Group 1]
├── FORGE: S2-03 (Bill CRUD API)
└── PRISM: S2-05 (Vendor Management UI)

[PARALLEL GROUP 3 - After Group 2]
├── ORACLE: S2-04 (Auto-Create Bills from Email)
├── FORGE: S2-06 (Bill Payment Reminders)
└── ORACLE: S2-07 (Wire Bills to Chat)
```

#### Sprint 3 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── FORGE: S3-01 (Auto-Update Invoice on Payment)
├── FORGE: S3-02 (Auto-Create Expenses)
└── FORGE: S3-03 (Auto-Create Customers)

[PARALLEL GROUP 2 - After Group 1]
├── ORACLE: S3-05 (Transaction Matching Rules)
└── BRIDGE: S3-07 (Reconciliation Notifications)

[PARALLEL GROUP 3 - After Group 2]
├── FORGE: S3-04 (Expense Approval Workflow)
└── FORGE: S3-06 (Expense Report Generation)
```

#### Sprint 4 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── BRIDGE: S4-01 (Unify Document Storage)
└── VAULT: S4-02 (Document Entity)

[PARALLEL GROUP 2 - After Group 1]
├── ORACLE: S4-03 (Document Search Index)
└── FORGE: S4-04 (Cross-Entity Linking)

[PARALLEL GROUP 3 - After Group 2]
├── FORGE: S4-05 (Document Audit Trail)
├── PRISM: S4-06 (Document Search UI)
└── ORACLE: S4-07 (Wire Search to Chat)
```

#### Sprint 5 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── PRISM: S5-01 (Wire ELSTER Wizard)
└── PRISM: S5-02 (Wire FinanzOnline Wizard)

[PARALLEL GROUP 2 - After Group 1]
├── FORGE: S5-03 (VAT Return Approval)
└── ORACLE: S5-04 (Tax Calendar)

[PARALLEL GROUP 3 - After Group 2]
├── ORACLE: S5-05 (Auto-Generate VAT Data)
├── ORACLE: S5-06 (Tax Reminders to Proactive)
└── BRIDGE: S5-07 (Tax Document Archive)
```

#### Sprint 6 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── ORACLE: S6-01 (Cash Flow to Chat)
├── ORACLE: S6-02 (Cash Flow Alerts)
├── FORGE: S6-03 (AR Aging Report)
└── FORGE: S6-04 (AP Aging Report)

[PARALLEL GROUP 2 - After Group 1]
├── PRISM: S6-05 (Financial Dashboard)
└── ORACLE: S6-06 (Scenario Planning)

[PARALLEL GROUP 3 - After Group 2]
└── ORACLE: S6-07 ("What-If" Chat)
```

#### Sprint 7 Launch Order
```
[PARALLEL GROUP 1 - Day 1]
├── BRIDGE: S7-01 (Plaid Production)
├── BRIDGE: S7-02 (TrueLayer Production)
├── FLUX: S7-03 (Bull Board)
└── FLUX: S7-04 (Sentry Alerting)

[PARALLEL GROUP 2 - After Group 1]
└── VERIFY: S7-05 (E2E Test Suite)

[PARALLEL GROUP 3 - After Group 2]
├── FLUX: S7-06 (Performance Optimization)
└── SENTINEL: S7-07 (Security Audit)
```

---

## AUTOMATION ACHIEVEMENT MATRIX

### After Each Sprint, User Can:

| Sprint | New Automation Capabilities |
|--------|----------------------------|
| **Sprint 1** | Email invoices auto-extracted, transactions classified, proactive daily suggestions, execute actions from chat |
| **Sprint 2** | Track bills/AP, manage vendors, auto-create bills from received invoices, outgoing payment reminders |
| **Sprint 3** | Invoices auto-marked paid, expenses auto-created, customers auto-created, reconciliation notifications |
| **Sprint 4** | Find any document by query, document lineage tracking, unified file storage |
| **Sprint 5** | File VAT returns from app, auto-generated tax data, tax deadline reminders |
| **Sprint 6** | Cash flow predictions in chat, "what-if" scenarios, financial dashboards |
| **Sprint 7** | Real bank connections, production-ready, fully tested |

### Automation Coverage by Area

| Business Area | Before | After Sprint 7 |
|--------------|--------|----------------|
| Invoice Creation | Manual | Auto from chat |
| Invoice Tracking | Manual | Auto-status updates |
| Bill Tracking | None | Fully automated |
| Expense Management | Manual entry | Auto from bank |
| Customer Management | Manual | Auto-created |
| Vendor Management | None | Full CRUD |
| Tax Compliance | Manual | Auto-generated |
| Tax Filing | None | One-click submit |
| Payment Reminders | Stubbed | Fully working |
| Cash Flow | Reports only | Proactive alerts |
| Document Management | Fragmented | Unified + searchable |

---

## SUCCESS METRICS

When all sprints complete, the app achieves **"Zero Touch Operations"**:

1. **Email Arrives** → Invoice/Bill auto-extracted → Categorized → Tax flags applied
2. **Bank Transaction** → Classified → Expense created → Matched to bill
3. **Invoice Due** → Reminder sent → Payment received → Invoice marked paid
4. **Tax Deadline** → Proactive alert → One-click file → Confirmation received
5. **Cash Low** → Proactive warning → Scenario options → Action taken
6. **User Question** → Chat answers → Action suggested → One-click execute

**The user's only job**: Approve actions and make business decisions.

---

## FILE LOCATIONS FOR EACH TASK

### Sprint 1 Reference Files
- **S1-01**: `apps/api/src/modules/integrations/email-sync/attachment/attachment-processor.service.ts` (line 419-426)
- **S1-02**: `apps/api/src/modules/finance/bank-sync/bank-sync.service.ts`
- **S1-03**: `apps/api/src/modules/notifications/channels/email.service.ts`
- **S1-04**: Create `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
- **S1-05**: `apps/api/src/modules/chatbot/chatbot.controller.ts`
- **S1-06**: `apps/web/src/components/chat/ChatInterface.tsx`

### Sprint 2 Reference Files
- **S2-01**: Create `apps/api/src/modules/finance/bills/entities/bill.entity.ts`
- **S2-02**: Create `apps/api/src/modules/crm/vendors/entities/vendor.entity.ts`
- **S2-03**: Create `apps/api/src/modules/finance/bills/bills.controller.ts`
- **S2-04**: Extend invoice extraction to create Bill records
- **S2-05**: Create `apps/web/src/app/(dashboard)/vendors/page.tsx`
- **S2-06**: Extend `apps/api/src/modules/finance/payment-reminders/`
- **S2-07**: Extend `apps/api/src/modules/chatbot/actions/action-executor.service.ts`

### Sprint 3 Reference Files
- **S3-01**: `apps/api/src/modules/finance/reconciliation/reconciliation.service.ts`
- **S3-02**: Create `apps/api/src/modules/banking/transaction-to-expense.service.ts`
- **S3-03**: Extend invoice service to auto-create customers
- **S3-04**: Create `apps/api/src/modules/expenses/approval/`
- **S3-05**: Create `apps/api/src/modules/banking/matching-rules.service.ts`
- **S3-06**: Create `apps/api/src/modules/reports/expense-report.service.ts`
- **S3-07**: Extend reconciliation to emit notification events

### Sprint 4 Reference Files
- **S4-01**: `apps/api/src/modules/integrations/email-sync/attachment/attachment-storage.service.ts`
- **S4-02**: Create `packages/database/prisma/schema.prisma` Document model
- **S4-03**: Create `apps/api/src/modules/documents/search/document-search.service.ts`
- **S4-04**: Create `apps/api/src/modules/documents/linking.service.ts`
- **S4-05**: Add audit fields to Document model
- **S4-06**: Create `apps/web/src/app/(dashboard)/documents/page.tsx`
- **S4-07**: Extend chat to handle document search queries

### Sprint 5 Reference Files
- **S5-01**: `apps/web/src/components/tax/elster/` (wire to real API)
- **S5-02**: `apps/web/src/components/tax/finanz-online/` (wire to real API)
- **S5-03**: `apps/api/src/modules/tax/elster/services/elster-vat.service.ts`
- **S5-04**: Create `apps/api/src/modules/tax/tax-calendar.service.ts`
- **S5-05**: Extend VAT service for auto-generation
- **S5-06**: Add tax deadlines to proactive scheduler
- **S5-07**: Create `apps/api/src/modules/tax/archive/tax-archive.service.ts`

### Sprint 6 Reference Files
- **S6-01**: `apps/api/src/modules/reports/cashflow-report/cashflow-report.service.ts`
- **S6-02**: Extend proactive scheduler for cash flow alerts
- **S6-03**: Create `apps/api/src/modules/reports/ar-aging.service.ts`
- **S6-04**: Create `apps/api/src/modules/reports/ap-aging.service.ts`
- **S6-05**: Create `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- **S6-06**: Create `apps/api/src/modules/reports/scenario-planning.service.ts`
- **S6-07**: Extend chat for scenario queries

### Sprint 7 Reference Files
- **S7-01**: `apps/api/src/modules/integrations/plaid/` configuration
- **S7-02**: `apps/api/src/modules/integrations/truelayer/` configuration
- **S7-03**: Add Bull Board at `/admin/queues`
- **S7-04**: Configure Sentry SDK
- **S7-05**: Create `apps/api/test/e2e/`
- **S7-06**: Profile and optimize slow queries
- **S7-07**: Security review all endpoints

---

## READY TO EXECUTE

This plan transforms Operate from "80% backend" to **"100% automated business assistant"**.

**Total Tasks**: 49 tasks across 7 sprints
**Total Agents**: 9 specialists
**Estimated Duration**: 14 weeks (can be accelerated with parallel work)

**Start with**: Sprint 1 - this unblocks all downstream automation.

---

## NOTES FOR AGENTS

### Code Standards
- All services use NestJS dependency injection
- Database access via PrismaService
- Queue system is BullMQ with Redis
- AI calls use Anthropic Claude or OpenAI GPT-4
- Follow existing code patterns
- Add proper logging with NestJS Logger
- Handle errors with try/catch
- Write JSDoc comments for public methods

### Testing Requirements
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for critical flows
- Minimum 80% coverage

### Documentation
- Update OpenAPI/Swagger specs
- Add README for new modules
- Document environment variables
