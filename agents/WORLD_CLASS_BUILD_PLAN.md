# OPERATE - World Class Business Automation Build Plan

## Executive Summary

Based on comprehensive analysis by 6 specialist agents, the Operate app has **80% of backend infrastructure built** but critical **automation pipelines are disconnected**. This plan connects all pieces to create a world-class business assistant.

---

## CURRENT STATE ASSESSMENT

### What's WORKING (Backend Ready)
| Component | Status | Notes |
|-----------|--------|-------|
| Email OAuth (Gmail/Outlook) | 100% | Can read emails, download attachments |
| Bank Connections (Plaid/Tink/TrueLayer) | 100% | OAuth flows complete, SANDBOX mode |
| Chat with Claude AI | 100% | Real responses, conversation history |
| Invoice CRUD | 100% | Create/edit/delete, multi-currency |
| Expense Management | 100% | Full CRUD with categories |
| Tax Deduction Classifier | 100% | AI-powered, confidence scoring |
| Fraud Detection | 100% | Statistical + AI anomaly detection |
| Background Jobs (BullMQ) | 100% | 28 cron jobs, 21 processors |
| Redis Infrastructure | 100% | Production deployed |
| Payment Reminders | 100% | 7-level escalation system |

### What's BROKEN (Disconnected Pipelines)
| Pipeline | Issue | Impact |
|----------|-------|--------|
| Email → Invoice | No extraction service | Can't auto-create bills from emails |
| Bank → Tax | No classification trigger | Transactions not analyzed |
| AI → Proactive | No scheduler | User must ask for suggestions |
| Chat → Actions | Frontend not wired | Claude can't execute commands |
| Reminders → Email | Stub implementation | Emails not actually sent |

---

## MASTER TASK LIST

### PHASE 1: Core Automation Pipelines (CRITICAL)
**Goal: Make data flow automatically**

#### P1-T1: Invoice Extraction Service
- **Priority**: P0 (Blocker)
- **Agent**: ORACLE (AI/ML)
- **Files to Create**:
  - `apps/api/src/modules/integrations/email-sync/invoice-extractor.service.ts`
  - `apps/api/src/modules/integrations/email-sync/jobs/process-email-attachments.processor.ts`
- **What it does**: Extract invoice data from email attachments using Claude Vision
- **Connects**: Email Sync → Invoice Creation

#### P1-T2: Transaction Classification Pipeline
- **Priority**: P0 (Blocker)
- **Agent**: BRIDGE (Integrations)
- **Files to Create**:
  - `apps/api/src/modules/banking/jobs/transaction-classification.processor.ts`
  - `apps/api/src/modules/banking/transaction-pipeline.service.ts`
- **What it does**: Auto-classify synced transactions, suggest tax deductions
- **Connects**: Bank Sync → Classification → Tax Deductions

#### P1-T3: Expense Auto-Creation from Bank
- **Priority**: P1
- **Agent**: FORGE (Backend)
- **Files to Create**:
  - `apps/api/src/modules/banking/transaction-to-expense.service.ts`
- **What it does**: Create expense records from classified bank transactions
- **Connects**: Classification → Expense Records

---

### PHASE 2: Proactive AI Intelligence
**Goal: AI suggests without being asked**

#### P2-T1: Proactive Suggestions Scheduler
- **Priority**: P0 (Blocker)
- **Agent**: ORACLE (AI/ML)
- **Files to Create**:
  - `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
- **What it does**: Daily 8AM scan of all business data, generate suggestions
- **Triggers**: Overdue invoices, unpaid bills, tax deadlines, anomalies

#### P2-T2: Business Intelligence Analyzer
- **Priority**: P1
- **Agent**: ORACLE (AI/ML)
- **Files to Create**:
  - `apps/api/src/modules/chatbot/suggestions/business-analyzer.service.ts`
- **What it does**: Analyze patterns, predict cash flow, identify risks
- **Output**: "Customer X typically pays late - consider deposit requirement"

#### P2-T3: Notification Pipeline
- **Priority**: P1
- **Agent**: FORGE (Backend)
- **Files to Modify**:
  - `apps/api/src/modules/notifications/channels/email.service.ts`
- **What it does**: Actually send emails (currently stub)
- **Integration**: SendGrid or AWS SES

---

### PHASE 3: Chat Action Execution
**Goal: User says "create invoice" → it happens**

#### P3-T1: Action Confirmation Endpoint
- **Priority**: P0 (Blocker)
- **Agent**: FORGE (Backend)
- **Files to Create**:
  - Add to `apps/api/src/modules/chatbot/chatbot.controller.ts`:
    - `POST /chatbot/actions/:confirmationId/confirm`
    - `POST /chatbot/actions/:confirmationId/cancel`

#### P3-T2: Frontend Action Handler
- **Priority**: P0 (Blocker)
- **Agent**: PRISM (Frontend)
- **Files to Modify**:
  - `apps/web/src/components/chat/ChatInterface.tsx`
  - `apps/web/src/components/chat/MessageActions.tsx`
- **Files to Create**:
  - `apps/web/src/components/chat/ActionConfirmationDialog.tsx`
  - `apps/web/src/hooks/useActionExecution.ts`
- **What it does**: Show confirmation dialog, execute actions, display results

#### P3-T3: Action Result Display
- **Priority**: P1
- **Agent**: PRISM (Frontend)
- **Files to Create**:
  - `apps/web/src/components/chat/ActionResultCard.tsx`
- **What it does**: Show "Invoice #123 created" with link to invoice

---

### PHASE 4: Accounts Receivable Automation
**Goal: Never miss a payment**

#### P4-T1: Email Delivery Implementation
- **Priority**: P0 (Blocker)
- **Agent**: BRIDGE (Integrations)
- **Files to Modify**:
  - `apps/api/src/modules/notifications/channels/email.service.ts`
- **Integration**: SendGrid API
- **What it does**: Actually send reminder emails to customers

#### P4-T2: Payment Reconciliation
- **Priority**: P1
- **Agent**: BRIDGE (Integrations)
- **Files to Create**:
  - `apps/api/src/modules/finance/reconciliation/auto-reconcile.service.ts`
- **What it does**: Match bank deposits to invoices automatically

#### P4-T3: AR Aging Reports
- **Priority**: P2
- **Agent**: FORGE (Backend)
- **Files to Create**:
  - `apps/api/src/modules/reports/ar-aging.service.ts`
- **What it does**: Generate 0-30, 30-60, 60-90, 90+ day reports

---

### PHASE 5: Production Readiness
**Goal: Ready for real money**

#### P5-T1: Bank Integration Production Mode
- **Priority**: P1
- **Agent**: BRIDGE (Integrations)
- **Config Changes**: Switch Plaid from SANDBOX to PRODUCTION
- **Requirements**: Plaid production credentials, compliance review

#### P5-T2: Queue Monitoring Dashboard
- **Priority**: P2
- **Agent**: FLUX (DevOps)
- **Files to Add**:
  - Bull Board UI at `/admin/queues`
- **What it does**: Monitor job queues, retry failed jobs

#### P5-T3: Error Alerting
- **Priority**: P2
- **Agent**: FLUX (DevOps)
- **Integration**: Sentry or similar
- **What it does**: Alert on critical failures

---

### PHASE 6: Polish & Testing
**Goal: World-class UX**

#### P6-T1: E2E Testing Suite
- **Priority**: P1
- **Agent**: VERIFY (QA)
- **What it does**: Test all automation pipelines end-to-end

#### P6-T2: Performance Optimization
- **Priority**: P2
- **Agent**: FLUX (DevOps)
- **What it does**: Optimize slow queries, add caching

#### P6-T3: Documentation
- **Priority**: P2
- **Agent**: ATLAS (PM)
- **What it does**: User guides, API documentation

---

## DEPENDENCY GRAPH

```
P1-T1 (Email Extraction) ──────────────────────┐
                                               │
P1-T2 (Transaction Classification) ────────────┼──► P2-T1 (Proactive Scheduler)
                                               │         │
P1-T3 (Expense Auto-Creation) ─────────────────┘         │
                                                         │
P3-T1 (Action Endpoint) ───────────────────────┐         │
                                               │         │
P3-T2 (Frontend Handler) ──────────────────────┼──► P2-T3 (Notification Pipeline)
                                               │         │
P4-T1 (Email Delivery) ────────────────────────┘         │
                                                         ▼
                                               P6-T1 (E2E Testing)
```

---

## AGENT ASSIGNMENTS

| Agent | Specialty | Tasks |
|-------|-----------|-------|
| **ORACLE** | AI/ML | P1-T1, P2-T1, P2-T2 |
| **BRIDGE** | Integrations | P1-T2, P4-T1, P4-T2, P5-T1 |
| **FORGE** | Backend | P1-T3, P2-T3, P3-T1, P4-T3 |
| **PRISM** | Frontend | P3-T2, P3-T3 |
| **FLUX** | DevOps | P5-T2, P5-T3, P6-T2 |
| **VERIFY** | QA | P6-T1 |
| **ATLAS** | PM | Coordination, P6-T3 |

---

## IMPLEMENTATION ORDER

### Sprint 1 (Week 1-2): Foundation
1. P1-T1: Invoice Extraction Service
2. P1-T2: Transaction Classification Pipeline
3. P4-T1: Email Delivery Implementation
4. P3-T1: Action Confirmation Endpoint

### Sprint 2 (Week 3-4): Intelligence
5. P2-T1: Proactive Suggestions Scheduler
6. P3-T2: Frontend Action Handler
7. P1-T3: Expense Auto-Creation
8. P3-T3: Action Result Display

### Sprint 3 (Week 5-6): Automation
9. P2-T2: Business Intelligence Analyzer
10. P2-T3: Notification Pipeline (complete)
11. P4-T2: Payment Reconciliation
12. P4-T3: AR Aging Reports

### Sprint 4 (Week 7-8): Production
13. P5-T1: Bank Production Mode
14. P5-T2: Queue Monitoring
15. P5-T3: Error Alerting
16. P6-T1: E2E Testing

---

## SUCCESS METRICS

When complete, the app will:

1. **Email → Invoice**: User connects Gmail → Invoices auto-extracted
2. **Bank → Tax**: Bank syncs → "This purchase saves you €150 in taxes"
3. **Proactive AI**: Without asking → "3 customers haven't paid (€5,000 overdue)"
4. **Chat Actions**: "Create invoice for Acme €500" → Invoice created
5. **Auto Reminders**: Overdue 30 days → Customer receives email
6. **Cash Flow**: "You'll run out of cash in 45 days at current rate"

---

## READY TO BUILD

This plan transforms Operate from "pretty screens" to "runs your business".

Start with: **P1-T1: Invoice Extraction Service** - this unblocks the entire email pipeline.
