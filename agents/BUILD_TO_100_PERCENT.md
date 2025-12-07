# BUILD TO 100% - Master Task List

**Target:** Fully Automatic AI Business Operating System
**Current:** 78% Complete
**Sprints:** 8 (6-8 weeks)
**Total Tasks:** 52

---

## SPRINT 1: Security Hardening (Week 1)
**Priority:** P0 - CRITICAL
**Owner:** SENTINEL
**Dependencies:** None (parallel safe)

### S1-01: Fix OAuth Token Exposure [2h]
- File: apps/api/src/modules/auth/oauth.controller.ts
- Change: Remove tokens from redirect URL, use httpOnly cookies only
- Test: OAuth flow works without URL tokens
- Status: PENDING

### S1-02: Create TenantGuard Middleware [8h]
- File: apps/api/src/common/guards/tenant.guard.ts (CREATE)
- Change: Enforce orgId on all database queries
- Test: Cross-tenant access blocked
- Status: PENDING

### S1-03: Apply TenantGuard to All Controllers [8h]
- Files: All controller files in apps/api/src/modules/*/
- Change: Add @UseGuards(TenantGuard) decorator
- Test: All endpoints verify tenant context
- Depends: S1-02
- Status: PENDING

### S1-04: Audit Raw SQL Queries [6h]
- Files: elster.service.ts, tink.service.ts, peppol.service.ts, others
- Change: Convert to Prisma ORM or add tenant filter
- Test: No raw SQL without organization filter
- Status: PENDING

### S1-05: Hash Refresh Tokens [4h]
- File: apps/api/src/modules/auth/auth.service.ts
- Change: Hash refresh tokens before storing in Session table
- Test: Token validation still works
- Status: PENDING

### S1-06: Add Financial Access Audit Logs [6h]
- Files: invoices.service.ts, expenses.service.ts, transactions.service.ts
- Change: Log all read/write operations
- Test: Audit trail for all financial data access
- Status: PENDING

**Sprint 1 Total: 34h**

---

## SPRINT 2: Chatbot Connectivity (Week 2)
**Priority:** P0 - CRITICAL
**Owner:** ORACLE + BRIDGE
**Dependencies:** S1-02 (TenantGuard)

### S2-01: Inject TinkService into Chatbot [4h]
- File: apps/api/src/modules/chatbot/chatbot.module.ts
- Change: Import TinkModule, inject TinkService
- Test: Chatbot can query bank accounts
- Owner: BRIDGE
- Status: PENDING

### S2-02: Inject StripeService into Chatbot [4h]
- File: apps/api/src/modules/chatbot/chatbot.module.ts
- Change: Import StripeModule, inject StripeService
- Test: Chatbot can execute Stripe payments
- Owner: BRIDGE
- Status: PENDING

### S2-03: Create BankingContextProvider [6h]
- File: apps/api/src/modules/chatbot/context/providers/banking-context.provider.ts (CREATE)
- Change: Provide account balances, recent transactions to chat
- Test: Chat shows real bank data
- Owner: BRIDGE
- Depends: S2-01
- Status: PENDING

### S2-04: Create search-documents.handler.ts [3h]
- File: apps/api/src/modules/chatbot/actions/handlers/search-documents.handler.ts (CREATE)
- Change: Natural language document search via chat
- Test: "Find invoices from Q3" returns results
- Owner: ORACLE
- Status: PENDING

### S2-05: Create reduce-expenses.handler.ts [4h]
- File: apps/api/src/modules/chatbot/actions/handlers/reduce-expenses.handler.ts (CREATE)
- Change: AI expense analysis and reduction recommendations
- Test: "Where can I reduce spending?" returns insights
- Owner: ORACLE
- Status: PENDING

### S2-06: Create tax-consultation.handler.ts [4h]
- File: apps/api/src/modules/chatbot/actions/handlers/tax-consultation.handler.ts (CREATE)
- Change: Interactive tax questions via chat
- Test: "Can I deduct this purchase?" returns answer
- Owner: ORACLE
- Status: PENDING

### S2-07: Create create-customer.handler.ts [3h]
- File: apps/api/src/modules/chatbot/actions/handlers/create-customer.handler.ts (CREATE)
- Change: Create customers via chat
- Test: "Create customer Acme Corp" works
- Owner: ORACLE
- Status: PENDING

### S2-08: Update ActionType Enum [1h]
- File: apps/api/src/modules/chatbot/actions/action.types.ts
- Change: Add SEARCH_DOCUMENTS, REDUCE_EXPENSES, CONSULT_TAXES, CREATE_CUSTOMER
- Test: All new actions registered
- Owner: ORACLE
- Status: PENDING

**Sprint 2 Total: 29h**

---

## SPRINT 3: Data Flow Automation (Week 3)
**Priority:** P1 - HIGH
**Owner:** BRIDGE + FORGE
**Dependencies:** S2-01, S2-02

### S3-01: Create Email→Bill Pipeline [8h]
- File: apps/api/src/modules/ai/email-intelligence/bill-creator.service.ts (CREATE)
- Change: Auto-create Bill from ExtractedInvoice
- Test: Email with invoice → Bill automatically created
- Owner: BRIDGE
- Status: PENDING

### S3-02: Vendor Deduplication Service [4h]
- File: apps/api/src/modules/crm/vendors/vendor-deduplication.service.ts (CREATE)
- Change: Match extracted vendors to existing contacts
- Test: Same vendor email → same Contact record
- Owner: BRIDGE
- Depends: S3-01
- Status: PENDING

### S3-03: Enhance Transaction Classifier [6h]
- File: apps/api/src/modules/ai/bank-intelligence/transaction-classifier.service.ts
- Change: Full AI categorization with vendor matching
- Test: Transactions auto-categorized with 90%+ accuracy
- Owner: ORACLE
- Status: PENDING

### S3-04: Create Auto-Reconciliation Service [8h]
- File: apps/api/src/modules/finance/reconciliation/auto-reconciliation.service.ts (CREATE)
- Change: Match payments to invoices automatically
- Test: Bank payment → Invoice marked paid
- Owner: FORGE
- Depends: S3-03
- Status: PENDING

### S3-05: Invoice→Payment Allocation [4h]
- File: packages/database/prisma/schema.prisma
- Change: Add PaymentAllocation model
- Migration: Create table with FK to Invoice and Transaction
- Owner: VAULT
- Status: PENDING

### S3-06: Transaction Webhooks [4h]
- File: apps/api/src/modules/integrations/tink/tink-webhook.controller.ts (CREATE)
- Change: Real-time transaction updates
- Test: New bank transaction → immediate notification
- Owner: BRIDGE
- Status: PENDING

**Sprint 3 Total: 34h**

---

## SPRINT 4: Frontend Integration (Week 4)
**Priority:** P1 - HIGH
**Owner:** PRISM
**Dependencies:** S2-03, S3-04

### S4-01: Connect Chat to Real API Data [8h]
- File: apps/web/src/app/(app)/chat/page.tsx
- Change: Replace placeholder cards with real API data
- Test: Chat shows actual balances, invoices, transactions
- Status: PENDING

### S4-02: Create CustomerCard Component [4h]
- File: apps/web/src/components/chat/CustomerCard.tsx (CREATE)
- Change: Rich customer card for chat messages
- Test: Customer info displays inline in chat
- Status: PENDING

### S4-03: Create TransactionInsight Component [4h]
- File: apps/web/src/components/chat/TransactionInsight.tsx (CREATE)
- Change: Transaction summary card for chat
- Test: Bank insights display in chat messages
- Status: PENDING

### S4-04: Create InvoicePreview Component [4h]
- File: apps/web/src/components/chat/InvoicePreview.tsx (CREATE)
- Change: Invoice preview card for chat
- Test: Invoice details display inline
- Status: PENDING

### S4-05: Contextual Quick Actions [6h]
- File: apps/web/src/components/chat/QuickActionPills.tsx
- Change: Dynamic pills based on current page/context
- Test: Different actions on Invoice vs HR pages
- Status: PENDING

### S4-06: Entity Navigation [4h]
- File: apps/web/src/components/chat/SuggestionCard.tsx
- Change: Click suggestion → navigate to entity
- Test: "Invoice #123 overdue" → opens invoice
- Status: PENDING

### S4-07: Split-View Document Modal [6h]
- File: apps/web/src/components/chat/DocumentViewer.tsx (CREATE)
- Change: View documents without leaving chat
- Test: "View document" opens side panel
- Status: PENDING

**Sprint 4 Total: 36h**

---

## SPRINT 5: Payroll Module (Week 5)
**Priority:** P1 - HIGH
**Owner:** FORGE
**Dependencies:** None (parallel safe)

### S5-01: Create Payroll Module Structure [4h]
- Directory: apps/api/src/modules/hr/payroll/
- Files: payroll.module.ts, payroll.service.ts, payroll.controller.ts
- Status: PENDING

### S5-02: Wage Calculation Service [8h]
- File: apps/api/src/modules/hr/payroll/wage-calculation.service.ts (CREATE)
- Change: Calculate gross/net wages with deductions
- Test: Salary → correct net pay
- Status: PENDING

### S5-03: Tax Withholding Calculator [8h]
- File: apps/api/src/modules/hr/payroll/tax-withholding.service.ts (CREATE)
- Change: Calculate income tax withholding (DE, AT, CH, UK, US)
- Test: Correct tax calculations per country
- Status: PENDING

### S5-04: Social Insurance Calculator [6h]
- File: apps/api/src/modules/hr/payroll/social-insurance.service.ts (CREATE)
- Change: Calculate pension, health, unemployment contributions
- Test: Correct social insurance per country
- Status: PENDING

### S5-05: Payslip Generator [6h]
- File: apps/api/src/modules/hr/payroll/payslip-generator.service.ts (CREATE)
- Change: Generate PDF payslips
- Test: Professional payslip PDF generated
- Status: PENDING

### S5-06: Payroll Chatbot Actions [4h]
- File: apps/api/src/modules/chatbot/actions/handlers/run-payroll.handler.ts (CREATE)
- Change: Run payroll via chat
- Test: "Run December payroll" works
- Depends: S5-01 to S5-05
- Status: PENDING

**Sprint 5 Total: 36h**

---

## SPRINT 6: Automation Engine (Week 6)
**Priority:** P2 - MEDIUM
**Owner:** FORGE + ORACLE
**Dependencies:** S3-04

### S6-01: Event Bus Infrastructure [6h]
- File: apps/api/src/common/events/event-bus.service.ts (CREATE)
- Change: Pub/sub event system
- Test: Events can be published and subscribed
- Owner: FORGE
- Status: PENDING

### S6-02: Workflow Engine [8h]
- File: apps/api/src/modules/automation/workflow-engine.service.ts (CREATE)
- Change: If/then/else workflow execution
- Test: Custom automation rules work
- Owner: FORGE
- Depends: S6-01
- Status: PENDING

### S6-03: Custom Automation Rules UI [8h]
- File: apps/web/src/app/(app)/settings/automation/page.tsx
- Change: Visual rule builder
- Test: User can create custom automations
- Owner: PRISM
- Depends: S6-02
- Status: PENDING

### S6-04: Proactive AI Alerts [6h]
- File: apps/api/src/modules/chatbot/suggestions/proactive-alerts.service.ts (CREATE)
- Change: AI-triggered notifications
- Test: Cash flow warning appears automatically
- Owner: ORACLE
- Status: PENDING

### S6-05: Scheduled Task System [4h]
- File: apps/api/src/modules/automation/scheduled-tasks.service.ts (CREATE)
- Change: Cron-based task scheduling
- Test: "Send report every Monday" works
- Owner: FORGE
- Status: PENDING

**Sprint 6 Total: 32h**

---

## SPRINT 7: Database Enhancements (Week 7)
**Priority:** P2 - MEDIUM
**Owner:** VAULT
**Dependencies:** S3-05

### S7-01: Add Missing Transaction Fields [2h]
- File: packages/database/prisma/schema.prisma
- Change: Add invoiceId, vendorId, reconciliationDate to Transaction
- Migration: Alter table
- Status: PENDING

### S7-02: Add Invoice Approval Workflow [2h]
- File: packages/database/prisma/schema.prisma
- Change: Add approvedBy, approvedAt, rejectedBy, rejectedAt to Invoice
- Migration: Alter table
- Status: PENDING

### S7-03: Add Document Search Fields [2h]
- File: packages/database/prisma/schema.prisma
- Change: Add searchableText, ocrConfidence to Document
- Migration: Alter table
- Status: PENDING

### S7-04: Create TaxDeductionRule Model [3h]
- File: packages/database/prisma/schema.prisma
- Change: Add configurable deduction rules table
- Migration: Create table
- Status: PENDING

### S7-05: Create UserPreferences Model [2h]
- File: packages/database/prisma/schema.prisma
- Change: Add user preferences storage for chat context
- Migration: Create table
- Status: PENDING

### S7-06: Add ConversationMemory LinkedEntities [2h]
- File: packages/database/prisma/schema.prisma
- Change: Add linkedEntities JSON field for RAG
- Migration: Alter table
- Status: PENDING

### S7-07: Run All Migrations [2h]
- Command: npx prisma migrate dev
- Test: All migrations apply cleanly
- Depends: S7-01 to S7-06
- Status: PENDING

**Sprint 7 Total: 15h**

---

## SPRINT 8: Polish & Testing (Week 8)
**Priority:** P2 - MEDIUM
**Owner:** VERIFY + ALL
**Dependencies:** All previous sprints

### S8-01: End-to-End Test Suite [12h]
- Files: apps/api/test/e2e/
- Change: Full automation flow tests
- Test: Email→Invoice→Payment→Reconciliation works
- Owner: VERIFY
- Status: PENDING

### S8-02: Security Penetration Test [8h]
- External: Run security scan
- Test: No critical vulnerabilities
- Owner: SENTINEL
- Status: PENDING

### S8-03: Performance Load Test [6h]
- Tool: k6 or Artillery
- Test: 100 concurrent users, <500ms response
- Owner: FLUX
- Status: PENDING

### S8-04: Mobile Responsiveness Audit [4h]
- Tool: Chrome DevTools
- Test: All chat features work on mobile
- Owner: PRISM
- Status: PENDING

### S8-05: Documentation Update [6h]
- Files: CLAUDE.md, README.md
- Change: Update with new features
- Owner: ATLAS
- Status: PENDING

### S8-06: Production Deployment [4h]
- Server: Cloudways
- Change: Deploy all changes to live
- Test: Production works correctly
- Owner: FLUX
- Status: PENDING

**Sprint 8 Total: 40h**

---

## SUMMARY

| Sprint | Focus | Tasks | Hours | Owner |
|--------|-------|-------|-------|-------|
| 1 | Security | 6 | 34h | SENTINEL |
| 2 | Chatbot | 8 | 29h | ORACLE/BRIDGE |
| 3 | Data Flow | 6 | 34h | BRIDGE/FORGE |
| 4 | Frontend | 7 | 36h | PRISM |
| 5 | Payroll | 6 | 36h | FORGE |
| 6 | Automation | 5 | 32h | FORGE/ORACLE |
| 7 | Database | 7 | 15h | VAULT |
| 8 | Testing | 6 | 40h | VERIFY/ALL |
| **TOTAL** | | **51** | **256h** | |

---

## PARALLEL EXECUTION OPPORTUNITIES

### Week 1 (Sprint 1)
- All S1 tasks can run in parallel (6 agents)

### Week 2 (Sprint 2)
- S2-01, S2-02 parallel (BRIDGE)
- S2-04, S2-05, S2-06, S2-07, S2-08 parallel (ORACLE)

### Week 3 (Sprint 3)
- S3-01, S3-03, S3-05, S3-06 parallel
- S3-02, S3-04 sequential after S3-01, S3-03

### Week 4-5 (Sprint 4 & 5)
- Sprint 4 (PRISM) and Sprint 5 (FORGE) run in PARALLEL

### Week 6 (Sprint 6)
- S6-01 first, then S6-02, then S6-03
- S6-04, S6-05 parallel

### Week 7 (Sprint 7)
- S7-01 to S7-06 parallel, then S7-07 sequential

### Week 8 (Sprint 8)
- S8-01 to S8-04 parallel, then S8-05, S8-06 sequential

---

## AGENT ASSIGNMENTS

| Agent | Sprints | Tasks | Hours |
|-------|---------|-------|-------|
| SENTINEL | 1, 8 | 8 | 42h |
| ORACLE | 2, 3, 6 | 10 | 27h |
| BRIDGE | 2, 3 | 10 | 34h |
| FORGE | 3, 5, 6 | 14 | 62h |
| PRISM | 4, 6, 8 | 9 | 48h |
| VAULT | 3, 7 | 8 | 19h |
| VERIFY | 8 | 1 | 12h |
| FLUX | 8 | 2 | 10h |
| ATLAS | 8 | 1 | 6h |

**Note:** FORGE has highest workload (payroll module is substantial)
