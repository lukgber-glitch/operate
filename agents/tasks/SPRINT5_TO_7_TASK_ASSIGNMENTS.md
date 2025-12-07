# Sprints 5-7: Tax Filing, Cash Flow & Production Hardening

**Coordinator**: ATLAS (Project Manager)
**Duration**: Week 9-14

---

# SPRINT 5: Tax Filing & Compliance

**Sprint Goal**: File taxes automatically (with user approval)
**Duration**: Week 9-10

## Tasks Overview

| ID | Task | Agent | Priority | Complexity |
|----|------|-------|----------|------------|
| S5-01 | Wire Tax Wizard to Real ELSTER API | PRISM | P1 | Medium |
| S5-02 | Wire Tax Wizard to Real FinanzOnline API | PRISM | P1 | Medium |
| S5-03 | Build VAT Return Preview & Approval | FORGE | P1 | Medium |
| S5-04 | Create Tax Calendar with Deadlines | ORACLE | P1 | Low |
| S5-05 | Auto-Generate VAT Return Data | ORACLE | P1 | Medium |
| S5-06 | Add Tax Filing Reminders to Proactive | ORACLE | P1 | Low |
| S5-07 | Create Tax Document Archive | BRIDGE | P2 | Low |

---

## TASK-S5-01: Wire Tax Wizard to Real ELSTER API

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Dependencies**: None

### Context
Tax wizard UI exists at `apps/web/src/components/tax/elster/` but uses MOCKED data - doesn't call real API.

### Objective
Connect frontend tax wizard to real ELSTER backend API.

### Files to Modify
1. `apps/web/src/components/tax/elster/ElsterWizard.tsx`
   - Replace mock data with API calls
   - Wire to `apps/api/src/modules/tax/elster/services/elster-vat.service.ts`

2. `apps/web/src/lib/api/tax.ts`
   - Add `submitVatReturn()` method
   - Add `getVatReturnStatus()` method
   - Add `downloadVatReceipt()` method

### Acceptance Criteria
- [ ] Wizard calls real ELSTER API
- [ ] VAT return submission works
- [ ] Error handling for ELSTER errors
- [ ] Receipt download works

---

## TASK-S5-02: Wire Tax Wizard to Real FinanzOnline API

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Dependencies**: None

### Context
Austria tax wizard exists but is also mocked.

### Objective
Connect frontend to real FinanzOnline API.

### Files to Modify
1. `apps/web/src/components/tax/finanz-online/FinanzOnlineWizard.tsx`
2. `apps/web/src/lib/api/tax.ts`

### Acceptance Criteria
- [ ] Austrian VAT submission works
- [ ] UID verification works
- [ ] Error handling for FinanzOnline errors

---

## TASK-S5-03: Build VAT Return Preview & Approval

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Dependencies**: S5-01, S5-02

### Objective
Before submission, show user what will be submitted and get explicit approval.

### Files to Create
1. `apps/api/src/modules/tax/vat-return/vat-return-preview.service.ts`
   - Generate preview of VAT return data
   - Show all invoices/expenses included
   - Calculate totals with breakdown

2. `apps/api/src/modules/tax/vat-return/vat-return.entity.ts`
   - Store VAT returns with status (DRAFT, PENDING_APPROVAL, SUBMITTED, ACCEPTED, REJECTED)

### Acceptance Criteria
- [ ] Preview shows all transactions included
- [ ] User must approve before submission
- [ ] Submission status tracked
- [ ] Receipt stored after submission

---

## TASK-S5-04: Create Tax Calendar with Deadlines

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Dependencies**: None

### Objective
Automatic tax calendar based on organisation country and tax obligations.

### Files to Create
1. `apps/api/src/modules/tax/calendar/tax-calendar.service.ts`
```typescript
@Injectable()
export class TaxCalendarService {
  getDeadlines(orgId: string): TaxDeadline[] {
    // Based on org country, return:
    // - Germany: Monthly/quarterly VAT (by 10th of following month)
    // - Austria: Monthly/quarterly VAT
    // - Generic: Estimated deadlines
  }

  getUpcomingDeadlines(orgId: string, days: number = 30): TaxDeadline[] {
    // Deadlines in next N days
  }
}
```

### Acceptance Criteria
- [ ] Tax deadlines based on country
- [ ] Monthly/quarterly VAT deadlines
- [ ] Annual filing deadlines
- [ ] Custom deadline support

---

## TASK-S5-05: Auto-Generate VAT Return Data

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Dependencies**: S3-01 (reconciliation), S5-03

### Objective
Automatically generate VAT return from transactions.

### Files to Create
1. `apps/api/src/modules/tax/vat-return/vat-calculation.service.ts`
   - Sum all invoices in period (output VAT)
   - Sum all deductible expenses (input VAT)
   - Calculate net VAT payable/refundable

### Acceptance Criteria
- [ ] Auto-calculate output VAT from invoices
- [ ] Auto-calculate input VAT from expenses
- [ ] Handle different VAT rates (0%, 7%, 19%)
- [ ] Generate XML for ELSTER submission

---

## TASK-S5-06: Add Tax Filing Reminders to Proactive

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Dependencies**: S1-04 (proactive scheduler), S5-04

### Objective
Add tax deadline reminders to daily proactive suggestions.

### Files to Modify
1. `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
   - Check tax calendar for upcoming deadlines
   - Generate suggestions: "VAT return due in 5 days"

### Acceptance Criteria
- [ ] Tax deadline reminders at 14, 7, 3, 1 days
- [ ] Show estimated VAT amount
- [ ] Link to tax filing wizard

---

## TASK-S5-07: Create Tax Document Archive

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P2
**Dependencies**: S4-02 (document entity)

### Objective
Archive all tax-related documents with proper retention.

### Files to Create
1. `apps/api/src/modules/tax/archive/tax-archive.service.ts`
   - Archive submitted VAT returns
   - Archive ELSTER receipts
   - Set 10-year retention policy

### Acceptance Criteria
- [ ] VAT returns archived with documents
- [ ] Receipts stored and linked
- [ ] 10-year retention policy applied
- [ ] Search tax documents by year/type

---

# SPRINT 6: Cash Flow Intelligence & Polish

**Sprint Goal**: Predictive business intelligence
**Duration**: Week 11-12

## Tasks Overview

| ID | Task | Agent | Priority | Complexity |
|----|------|-------|----------|------------|
| S6-01 | Surface Cash Flow to Chat | ORACLE | P1 | Medium |
| S6-02 | Add Cash Flow Alerts to Proactive | ORACLE | P1 | Low |
| S6-03 | Create AR Aging Report | FORGE | P2 | Low |
| S6-04 | Create AP Aging Report | FORGE | P2 | Low |
| S6-05 | Build Financial Dashboard | PRISM | P2 | Medium |
| S6-06 | Implement Scenario Planning | ORACLE | P2 | Medium |
| S6-07 | Add "What-If" to Chat | ORACLE | P2 | Medium |

---

## TASK-S6-01: Surface Cash Flow to Chat

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Dependencies**: None

### Context
Cash flow service EXISTS at `apps/api/src/modules/reports/cashflow-report/cashflow-report.service.ts` but chat can't access it.

### Objective
Add cash flow queries to chat.

### Files to Modify
1. `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
   - Add: GET_CASH_FLOW, GET_RUNWAY, GET_BURN_RATE

2. `apps/api/src/modules/chatbot/chat.service.ts`
   - Update prompts for cash flow queries

### Chat Examples
```
User: "How's my cash flow?"
Bot: "Current balance: €45,000. Burn rate: €12,000/month. Runway: 3.7 months."

User: "When will I run out of cash?"
Bot: "At current burn rate, runway is ~4 months (April 2025)."
```

### Acceptance Criteria
- [ ] "How's my cash flow?" works
- [ ] Burn rate calculation works
- [ ] Runway calculation works
- [ ] Forecast visualization

---

## TASK-S6-02: Add Cash Flow Alerts to Proactive

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Dependencies**: S1-04, S6-01

### Objective
Proactive warnings when cash flow is concerning.

### Files to Modify
1. `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
   - Add cash flow analysis
   - Alert if runway < 3 months
   - Alert if large expenses upcoming

### Acceptance Criteria
- [ ] Alert when runway < 3 months
- [ ] Alert when large bills due
- [ ] Alert when cash balance drops significantly

---

## TASK-S6-03: Create AR Aging Report

**Agent**: FORGE (Backend Specialist)
**Priority**: P2
**Dependencies**: None

### Objective
Accounts receivable aging: 0-30, 30-60, 60-90, 90+ days.

### Files to Create
1. `apps/api/src/modules/reports/ar-aging/ar-aging.service.ts`

### Acceptance Criteria
- [ ] Aging buckets calculated correctly
- [ ] Show by customer
- [ ] Export to PDF/CSV

---

## TASK-S6-04: Create AP Aging Report

**Agent**: FORGE (Backend Specialist)
**Priority**: P2
**Dependencies**: S2-03 (bills)

### Objective
Accounts payable aging: bills by due date buckets.

### Files to Create
1. `apps/api/src/modules/reports/ap-aging/ap-aging.service.ts`

### Acceptance Criteria
- [ ] Aging buckets for bills
- [ ] Show by vendor
- [ ] Export to PDF/CSV

---

## TASK-S6-05: Build Financial Dashboard

**Agent**: PRISM (Frontend Specialist)
**Priority**: P2
**Dependencies**: S6-01, S6-03, S6-04

### Objective
Main dashboard with financial KPIs.

### Files to Create
1. `apps/web/src/app/(dashboard)/dashboard/page.tsx`
   - Cash balance widget
   - AR/AP summary
   - Revenue chart
   - Expense breakdown
   - Upcoming bills/invoices

### Acceptance Criteria
- [ ] Cash balance prominently displayed
- [ ] AR/AP totals shown
- [ ] Revenue trend chart
- [ ] Top 5 overdue invoices
- [ ] Top 5 upcoming bills

---

## TASK-S6-06: Implement Scenario Planning

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P2
**Dependencies**: S6-01

### Objective
"What-if" scenarios for business planning.

### Files to Create
1. `apps/api/src/modules/reports/scenario/scenario-planning.service.ts`
```typescript
interface Scenario {
  name: string;
  changes: {
    newHires?: number;
    revenueChange?: number; // percentage
    newExpense?: { description: string; amount: number; recurring: boolean };
    lostCustomer?: string;
  };
}

async calculateScenario(orgId: string, scenario: Scenario): Promise<ScenarioResult> {
  // Calculate impact on:
  // - Monthly burn rate
  // - Runway
  // - Break-even point
  // - Cash flow projection
}
```

### Acceptance Criteria
- [ ] "Hire 2 people" scenario
- [ ] "Lose customer X" scenario
- [ ] "New monthly expense" scenario
- [ ] Compare multiple scenarios

---

## TASK-S6-07: Add "What-If" to Chat

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P2
**Dependencies**: S6-06

### Objective
Natural language scenario queries in chat.

### Chat Examples
```
User: "What if I hire 2 developers at €5000 each?"
Bot: "New monthly burn: €22,000. Runway drops to 2 months."

User: "What if customer X stops paying?"
Bot: "Revenue drops 15%. Would need to reduce costs by €3,000/month."
```

### Acceptance Criteria
- [ ] Parse hiring scenarios
- [ ] Parse expense scenarios
- [ ] Parse revenue change scenarios
- [ ] Show impact on runway

---

# SPRINT 7: Production Hardening

**Sprint Goal**: Ready for real money
**Duration**: Week 13-14

## Tasks Overview

| ID | Task | Agent | Priority | Complexity |
|----|------|-------|----------|------------|
| S7-01 | Switch Plaid to Production | BRIDGE | P1 | Low |
| S7-02 | Switch TrueLayer to Production | BRIDGE | P1 | Low |
| S7-03 | Add Bull Board Queue Monitor | FLUX | P2 | Low |
| S7-04 | Implement Sentry Error Alerting | FLUX | P2 | Low |
| S7-05 | Create E2E Test Suite | VERIFY | P1 | High |
| S7-06 | Performance Optimization | FLUX | P2 | Medium |
| S7-07 | Security Audit | SENTINEL | P1 | High |

---

## TASK-S7-01: Switch Plaid to Production

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P1
**Dependencies**: All automation sprints

### Objective
Switch from Plaid sandbox to production.

### Requirements
- Production API keys
- Plaid compliance review
- User agreements

### Acceptance Criteria
- [ ] Production keys configured
- [ ] Real bank connections work
- [ ] Transaction sync working

---

## TASK-S7-02: Switch TrueLayer to Production

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P1
**Dependencies**: All automation sprints

### Objective
Switch TrueLayer from sandbox to production for EU/UK banks.

### Acceptance Criteria
- [ ] Production keys configured
- [ ] PSD2 compliance verified
- [ ] Real EU bank connections work

---

## TASK-S7-03: Add Bull Board Queue Monitor

**Agent**: FLUX (DevOps Specialist)
**Priority**: P2
**Dependencies**: None

### Objective
Add visual queue monitoring at `/admin/queues`.

### Files to Create
1. Configure Bull Board in NestJS
2. Add authentication for admin route

### Acceptance Criteria
- [ ] View all queues
- [ ] View pending/active/completed/failed jobs
- [ ] Retry failed jobs
- [ ] Clear queues

---

## TASK-S7-04: Implement Sentry Error Alerting

**Agent**: FLUX (DevOps Specialist)
**Priority**: P2
**Dependencies**: None

### Objective
Error monitoring and alerting.

### Files to Modify
1. Add Sentry SDK to API and Web
2. Configure error boundaries
3. Set up alert rules

### Acceptance Criteria
- [ ] Errors captured in Sentry
- [ ] Source maps uploaded
- [ ] Alert on critical errors
- [ ] User context attached

---

## TASK-S7-05: Create E2E Test Suite

**Agent**: VERIFY (QA Specialist)
**Priority**: P1
**Dependencies**: All sprints

### Objective
End-to-end tests for critical flows.

### Test Scenarios
1. Email sync → Invoice extraction → Bill creation
2. Bank sync → Transaction classification → Expense creation
3. Invoice creation → Send → Payment → Reconciliation
4. Chat → Action → Execution → Result
5. Tax return generation → Preview → Submission

### Acceptance Criteria
- [ ] All critical paths tested
- [ ] 80%+ coverage on core modules
- [ ] CI/CD integration
- [ ] Test data fixtures

---

## TASK-S7-06: Performance Optimization

**Agent**: FLUX (DevOps Specialist)
**Priority**: P2
**Dependencies**: S7-05

### Objective
Optimize slow queries and add caching.

### Tasks
1. Profile slow database queries
2. Add Redis caching for frequent queries
3. Optimize N+1 queries
4. Add database indexes

### Acceptance Criteria
- [ ] Dashboard loads < 2 seconds
- [ ] Search results < 1 second
- [ ] No N+1 queries in hot paths

---

## TASK-S7-07: Security Audit

**Agent**: SENTINEL (Security Specialist)
**Priority**: P1
**Dependencies**: All sprints

### Objective
Full security review before production.

### Checklist
1. Authentication & authorization review
2. Input validation audit
3. SQL injection check
4. XSS prevention
5. CSRF protection
6. Rate limiting
7. API key security
8. Secrets management
9. HTTPS enforcement
10. Data encryption at rest

### Acceptance Criteria
- [ ] No critical vulnerabilities
- [ ] No high-severity issues
- [ ] OWASP Top 10 addressed
- [ ] Penetration test passed

---

# LAUNCH SEQUENCE FOR SPRINTS 5-7

## Sprint 5 Phases

### Phase 5.1 (Parallel)
- PRISM: S5-01 (ELSTER Wizard)
- PRISM: S5-02 (FinanzOnline Wizard)

### Phase 5.2 (After 5.1)
- FORGE: S5-03 (VAT Preview)
- ORACLE: S5-04 (Tax Calendar)

### Phase 5.3 (After 5.2)
- ORACLE: S5-05 (Auto-Generate VAT)
- ORACLE: S5-06 (Tax Reminders)
- BRIDGE: S5-07 (Tax Archive)

## Sprint 6 Phases

### Phase 6.1 (Parallel)
- ORACLE: S6-01 (Cash Flow Chat)
- ORACLE: S6-02 (Cash Flow Alerts)
- FORGE: S6-03 (AR Aging)
- FORGE: S6-04 (AP Aging)

### Phase 6.2 (After 6.1)
- PRISM: S6-05 (Financial Dashboard)
- ORACLE: S6-06 (Scenario Planning)

### Phase 6.3 (After 6.2)
- ORACLE: S6-07 (What-If Chat)

## Sprint 7 Phases

### Phase 7.1 (Parallel)
- BRIDGE: S7-01 (Plaid Production)
- BRIDGE: S7-02 (TrueLayer Production)
- FLUX: S7-03 (Bull Board)
- FLUX: S7-04 (Sentry)

### Phase 7.2 (After 7.1)
- VERIFY: S7-05 (E2E Tests)

### Phase 7.3 (After 7.2)
- FLUX: S7-06 (Performance)
- SENTINEL: S7-07 (Security Audit)

---

# FINAL SUCCESS STATE

After Sprint 7, the app achieves **100% Automation**:

## Automated Flows

| Flow | Status |
|------|--------|
| Email → Invoice Extraction | Automatic |
| Email → Bill Creation | Automatic |
| Bank → Transaction Classification | Automatic |
| Bank → Expense Creation | Automatic |
| Payment → Invoice/Bill Status | Automatic |
| Customer/Vendor Creation | Automatic |
| Tax Data Generation | Automatic |
| Proactive Suggestions | Daily |
| Payment Reminders | Escalating |
| Document Indexing | Automatic |

## User Actions Required

Only these actions need human approval:
1. **Chat Actions** - Confirm before execution
2. **Tax Filing** - Review and approve VAT return
3. **Large Transactions** - Flag for review (configurable threshold)
4. **Expense Approval** - Low-confidence classifications

## The Promise Fulfilled

**"Focus on working, app handles everything else"**

- Open app → See proactive suggestions
- Ask questions → Get instant answers
- Request actions → Confirm → Done
- Tax time → Preview → Submit
- Cash low → Warning → Take action
- Documents → Search → Find instantly
