# Agent Index & Launch Summary

## Quick Reference: All Agents

| Agent | Specialty | Task Count | Sprints |
|-------|-----------|------------|---------|
| **ATLAS** | Project Manager | 0 (coordinator) | All |
| **BRIDGE** | Integrations | 9 tasks | 1, 4, 5, 7 |
| **ORACLE** | AI/ML | 14 tasks | 1, 2, 3, 4, 5, 6 |
| **FORGE** | Backend | 14 tasks | 1, 2, 3, 4, 5, 6 |
| **PRISM** | Frontend | 6 tasks | 1, 2, 4, 5, 6 |
| **VAULT** | Database | 4 tasks | 2, 4 |
| **FLUX** | DevOps | 4 tasks | 7 |
| **VERIFY** | QA | 1 task | 7 |
| **SENTINEL** | Security | 1 task | 7 |

---

## Sprint 1: Foundation Pipeline (READY TO LAUNCH)

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S1-01 | Wire Invoice Extraction Pipeline | BRIDGE | attachment-processor.service.ts |
| S1-02 | Wire Transaction Classification Pipeline | BRIDGE | bank-sync.service.ts, transaction-pipeline.service.ts |
| S1-03 | Implement Email Delivery Service | BRIDGE | email.service.ts |
| S1-04 | Create Proactive Suggestions Scheduler | ORACLE | proactive.scheduler.ts |
| S1-05 | Build Action Confirmation Endpoints | FORGE | chatbot.controller.ts |
| S1-06 | Wire Frontend Action Handler | PRISM | ChatInterface.tsx, ActionConfirmationDialog.tsx |

### Launch Command (Phase 1)
```
Launch BRIDGE Agent #1: TASK-S1-01 (Invoice Extraction Pipeline)
Launch BRIDGE Agent #2: TASK-S1-02 (Transaction Classification Pipeline)
Launch BRIDGE Agent #3: TASK-S1-03 (Email Delivery Service)
```

### Launch Command (Phase 2 - After Phase 1)
```
Launch ORACLE Agent: TASK-S1-04 (Proactive Scheduler)
Launch FORGE Agent: TASK-S1-05 (Action Confirmation Endpoints)
```

### Launch Command (Phase 3 - After Phase 2)
```
Launch PRISM Agent: TASK-S1-06 (Frontend Action Handler)
```

---

## Sprint 2: Accounts Payable & Vendors

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S2-01 | Create Bill Entity & Module | VAULT | schema.prisma, bills.module.ts |
| S2-02 | Create Vendor Entity & Module | VAULT | schema.prisma, vendors.module.ts |
| S2-03 | Build Bill CRUD API | FORGE | bills.controller.ts, bills.service.ts |
| S2-04 | Auto-Create Bills from Email | ORACLE | bill-auto-creator.service.ts |
| S2-05 | Build Vendor Management UI | PRISM | vendors/page.tsx |
| S2-06 | Create Bill Payment Reminders | FORGE | bill-reminder.processor.ts |
| S2-07 | Wire Bills to Chat Actions | ORACLE | action-executor.service.ts |

---

## Sprint 3: Auto-Reconciliation & Expenses

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S3-01 | Auto-Update Invoice on Payment | FORGE | reconciliation.service.ts |
| S3-02 | Auto-Create Expenses from Bank | FORGE | transaction-to-expense.service.ts |
| S3-03 | Auto-Create Customers | FORGE | invoices.service.ts |
| S3-04 | Expense Approval Workflow | FORGE | expense-approval.service.ts |
| S3-05 | Transaction Matching Rules | ORACLE | matching-rules.service.ts |
| S3-06 | Expense Report Generation | FORGE | expense-report.service.ts |
| S3-07 | Reconciliation Notifications | BRIDGE | reconciliation.listener.ts |

---

## Sprint 4: Document Intelligence

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S4-01 | Unify Document Storage | BRIDGE | document-storage.service.ts |
| S4-02 | Create Document Entity | VAULT | schema.prisma (Document model) |
| S4-03 | Build Document Search Index | ORACLE | document-search.service.ts |
| S4-04 | Cross-Entity Document Linking | FORGE | document-linking.service.ts |
| S4-05 | Document Audit Trail | FORGE | document-audit.service.ts |
| S4-06 | Document Search UI | PRISM | documents/page.tsx |
| S4-07 | Wire Document Search to Chat | ORACLE | action-executor.service.ts |

---

## Sprint 5: Tax Filing & Compliance

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S5-01 | Wire ELSTER Wizard | PRISM | ElsterWizard.tsx |
| S5-02 | Wire FinanzOnline Wizard | PRISM | FinanzOnlineWizard.tsx |
| S5-03 | VAT Return Preview & Approval | FORGE | vat-return-preview.service.ts |
| S5-04 | Tax Calendar with Deadlines | ORACLE | tax-calendar.service.ts |
| S5-05 | Auto-Generate VAT Data | ORACLE | vat-calculation.service.ts |
| S5-06 | Tax Reminders to Proactive | ORACLE | proactive.scheduler.ts |
| S5-07 | Tax Document Archive | BRIDGE | tax-archive.service.ts |

---

## Sprint 6: Cash Flow Intelligence

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S6-01 | Surface Cash Flow to Chat | ORACLE | action-executor.service.ts |
| S6-02 | Cash Flow Alerts to Proactive | ORACLE | proactive.scheduler.ts |
| S6-03 | AR Aging Report | FORGE | ar-aging.service.ts |
| S6-04 | AP Aging Report | FORGE | ap-aging.service.ts |
| S6-05 | Financial Dashboard | PRISM | dashboard/page.tsx |
| S6-06 | Scenario Planning | ORACLE | scenario-planning.service.ts |
| S6-07 | "What-If" Chat | ORACLE | action-executor.service.ts |

---

## Sprint 7: Production Hardening

### Task Summary
| Task ID | Name | Agent | Files |
|---------|------|-------|-------|
| S7-01 | Plaid to Production | BRIDGE | plaid config |
| S7-02 | TrueLayer to Production | BRIDGE | truelayer config |
| S7-03 | Bull Board Queue Monitor | FLUX | admin routes |
| S7-04 | Sentry Error Alerting | FLUX | sentry config |
| S7-05 | E2E Test Suite | VERIFY | test/e2e/ |
| S7-06 | Performance Optimization | FLUX | query optimization |
| S7-07 | Security Audit | SENTINEL | security review |

---

## Task Files Location

All detailed task assignments are in:
```
agents/tasks/
├── SPRINT1_TASK_ASSIGNMENTS.md   ✅ Ready
├── SPRINT2_TASK_ASSIGNMENTS.md   ✅ Ready
├── SPRINT3_TASK_ASSIGNMENTS.md   ✅ Ready
├── SPRINT4_TASK_ASSIGNMENTS.md   ✅ Ready
└── SPRINT5_TO_7_TASK_ASSIGNMENTS.md ✅ Ready
```

---

## Master Plan Location

Full automation plan with all details:
```
agents/FULL_AUTOMATION_PLAN.md    ✅ Complete
agents/WORLD_CLASS_BUILD_PLAN.md  ✅ Initial version
```

---

## Total Automation Coverage

| Area | Before | After All Sprints |
|------|--------|-------------------|
| Email → Invoice | Manual | Automatic |
| Email → Bill | None | Automatic |
| Bank → Expense | Manual | Automatic |
| Invoice → Paid | Manual | Automatic |
| Tax Filing | None | One-click |
| Cash Flow | Reports | Proactive alerts |
| Documents | Fragmented | Unified + searchable |
| Chat Actions | Limited | Full execution |

---

## How to Start

1. **Read Sprint 1 Task Assignments**:
   ```
   agents/tasks/SPRINT1_TASK_ASSIGNMENTS.md
   ```

2. **Launch Phase 1 Agents** (can run in parallel):
   - BRIDGE Agent: S1-01 (Invoice Extraction)
   - BRIDGE Agent: S1-02 (Transaction Classification)
   - BRIDGE Agent: S1-03 (Email Delivery)

3. **Wait for Phase 1 to Complete**

4. **Launch Phase 2 Agents** (can run in parallel):
   - ORACLE Agent: S1-04 (Proactive Scheduler)
   - FORGE Agent: S1-05 (Action Endpoints)

5. **Wait for Phase 2 to Complete**

6. **Launch Phase 3 Agent**:
   - PRISM Agent: S1-06 (Frontend Action Handler)

7. **Sprint 1 Complete → Move to Sprint 2**

---

## Notes for Agent Launches

When launching an agent, provide:
1. **Task ID**: e.g., S1-01
2. **Task File**: e.g., `agents/tasks/SPRINT1_TASK_ASSIGNMENTS.md`
3. **Specific Section**: e.g., "## TASK-001: Wire Invoice Extraction Pipeline"
4. **Context Files**: Key files the agent needs to read first
5. **Acceptance Criteria**: What defines "done"

Example agent prompt:
```
You are BRIDGE Agent working on TASK-S1-01: Wire Invoice Extraction Pipeline.

Read your task details in: agents/tasks/SPRINT1_TASK_ASSIGNMENTS.md

Key context files to read first:
- apps/api/src/modules/integrations/email-sync/attachment/attachment-processor.service.ts (line 419-426 has TODO)
- apps/api/src/modules/ai/extractors/invoice-extractor.service.ts
- apps/api/src/modules/ai/extractors/invoice-extractor.processor.ts

Your goal: Connect the email attachment processor to the invoice extraction queue.

Do NOT modify code that isn't directly related to your task.
Follow existing code patterns in the codebase.
Add proper error handling and logging.
Update your acceptance criteria when complete.
```
