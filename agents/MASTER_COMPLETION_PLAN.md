# Operate - Master Completion Plan
## 100% Architected, Implemented & Tested

> **Generated:** December 21, 2025
> **Based on:** 10 parallel deep-dive exploration agents
> **Goal:** Achieve 100% completion across architecture, implementation, and testing

---

## Executive Summary

After comprehensive analysis by 10 specialized agents scanning 3,000+ files, here's the reality:

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Architecture** | 95% | 100% | Schema gaps, orphan models |
| **Implementation** | 50% | 100% | Core autopilot, queue disabled |
| **Testing** | 3% | 80% | 50+ controllers untested |
| **Automation** | 10% | 100% | Detection methods empty |

### Critical Blockers Identified

1. **QueueModule & JobsModule DISABLED** - Background processing broken
2. **Autopilot detection methods = empty skeletons** - 6 methods with only TODOs
3. **Receipt scanner returns MOCK data** - Mindee not integrated
4. **Email sync has no scheduler** - Manual trigger only
5. **290+ TODOs across codebase** - Many critical for automation
6. **3% test coverage** - Production safety risk

---

## Phase 0: Critical Blockers (Week 1)

### 0.1 Enable Queue System

**Status:** DISABLED at `app.module.ts:291-292`
**Impact:** ALL background jobs broken

```typescript
// Currently commented out:
// QueueModule,
// JobsModule,
```

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 0.1.1 | Fix Bull Board Redis connection issue | FLUX | 4h |
| 0.1.2 | Re-enable QueueModule in app.module.ts | FORGE | 1h |
| 0.1.3 | Re-enable JobsModule in app.module.ts | FORGE | 1h |
| 0.1.4 | Verify all 25 queue processors start | FLUX | 2h |
| 0.1.5 | Test queue health endpoint | VERIFY | 2h |

**Files:**
- `apps/api/src/app.module.ts:291-292`
- `apps/api/src/modules/queue/queue.module.ts`
- `apps/api/src/modules/jobs/job-scheduler.service.ts`

---

### 0.2 Fix Receipt Scanner Mock

**Status:** Returns hardcoded test data at line 75-76
**Impact:** Receipt scanning doesn't work

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 0.2.1 | Create MindeeModule (BRIDGE was supposed to) | BRIDGE | 4h |
| 0.2.2 | Register MindeeModule in receipt-scanner.module.ts | FORGE | 1h |
| 0.2.3 | Uncomment real Mindee service call (line 69) | FORGE | 30m |
| 0.2.4 | Remove mockOcrResult() method (lines 496-512) | FORGE | 30m |
| 0.2.5 | Test receipt scanning end-to-end | VERIFY | 2h |

**Files:**
- `apps/api/src/modules/ai/receipt-scanner/receipt-scanner.service.ts:69-76, 496-512`
- `apps/api/src/modules/ai/receipt-scanner/receipt-scanner.module.ts:21`

---

### 0.3 Rotate Exposed Secrets

**Status:** API keys in git history (identified in security audit)
**Impact:** Security vulnerability

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 0.3.1 | Revoke Anthropic API key | DevOps | 15m |
| 0.3.2 | Revoke OpenAI API key | DevOps | 15m |
| 0.3.3 | Revoke Stripe keys (3) | DevOps | 15m |
| 0.3.4 | Revoke GoCardless token | DevOps | 15m |
| 0.3.5 | Revoke Google OAuth credentials | DevOps | 15m |
| 0.3.6 | Generate new JWT secrets | DevOps | 15m |
| 0.3.7 | Update Cloudways environment variables | FLUX | 1h |
| 0.3.8 | Remove secrets from git history (BFG) | FLUX | 2h |

---

## Phase 1: Autopilot Core (Weeks 2-3)

### 1.1 Implement Detection Methods

**Status:** 6 methods are empty skeletons with only TODOs
**File:** `apps/api/src/modules/autopilot/autopilot.service.ts`

| Line | Method | What to Implement |
|------|--------|-------------------|
| 210-212 | `detectCategorizableTransactions()` | Query uncategorized bank transactions, call AI classification, create CATEGORIZE actions |
| 222-223 | `detectInvoiceOpportunities()` | Query billable time entries without invoices, create CREATE_INVOICE actions |
| 233-234 | `detectOverdueInvoices()` | Query invoices where dueDate < today AND status != PAID, create SEND_REMINDER actions |
| 244-245 | `detectReconciliationMatches()` | Query unreconciled transactions, match to invoices/bills, create RECONCILE actions |
| 255-256 | `detectUnprocessedReceipts()` | Query EmailAttachment where type=receipt AND processed=false, create EXTRACT actions |
| 266-267 | `detectPayableBills()` | Query bills where dueDate within 3 days, create PAY_BILL actions |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 1.1.1 | Implement detectCategorizableTransactions | ORACLE | 8h |
| 1.1.2 | Implement detectInvoiceOpportunities | FORGE | 4h |
| 1.1.3 | Implement detectOverdueInvoices | FORGE | 4h |
| 1.1.4 | Implement detectReconciliationMatches | ORACLE | 8h |
| 1.1.5 | Implement detectUnprocessedReceipts | BRIDGE | 4h |
| 1.1.6 | Implement detectPayableBills | FORGE | 4h |

---

### 1.2 Implement Action Execution

**Status:** Line 122 has placeholder: `// TODO: Implement actual execution logic`
**File:** `apps/api/src/modules/autopilot/autopilot.service.ts:108-147`

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 1.2.1 | Create action type router (switch/case) | FORGE | 4h |
| 1.2.2 | Wire CATEGORIZE to transaction classifier | ORACLE | 4h |
| 1.2.3 | Wire CREATE_INVOICE to invoice service | FORGE | 4h |
| 1.2.4 | Wire SEND_REMINDER to reminder service | FORGE | 2h |
| 1.2.5 | Wire RECONCILE to reconciliation service | FORGE | 4h |
| 1.2.6 | Wire EXTRACT_RECEIPT to receipt extractor | BRIDGE | 4h |
| 1.2.7 | Wire PAY_BILL to payment service | FORGE | 4h |

---

### 1.3 Implement Daily Summary

**Status:** Line 379 has `// TODO: Generate AI summary of the day's activities`
**File:** `apps/api/src/modules/autopilot/autopilot.service.ts:379`

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 1.3.1 | Create Claude prompt for daily summary | ORACLE | 2h |
| 1.3.2 | Gather daily stats (actions executed, approvals) | FORGE | 2h |
| 1.3.3 | Generate AI narrative | ORACLE | 4h |
| 1.3.4 | Send email summary (line 138 TODO) | BRIDGE | 4h |

---

## Phase 2: Email Automation (Week 3)

### 2.1 Add Email Sync Scheduler

**Status:** Email processing fully implemented but requires manual trigger
**Gap:** No @Cron decorator to auto-fetch emails

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 2.1.1 | Create EmailSyncScheduler service | BRIDGE | 4h |
| 2.1.2 | Add @Cron every 30 minutes | BRIDGE | 1h |
| 2.1.3 | Query active EmailConnections | BRIDGE | 2h |
| 2.1.4 | Trigger sync for each connection | BRIDGE | 2h |
| 2.1.5 | Add per-connection sync frequency config | BRIDGE | 2h |

**New File:** `apps/api/src/modules/integrations/email-sync/email-sync.scheduler.ts`

---

### 2.2 Complete Email Intelligence

**Status:** 6 TODOs in email-intelligence services

**Tasks:**
| # | Task | File | Line | Owner | Est |
|---|------|------|------|-------|-----|
| 2.2.1 | Integrate RelationshipTrackerService | email-suggestions.service.ts | 540 | ORACLE | 4h |
| 2.2.2 | Implement quote follow-up logic | email-suggestions.service.ts | 555 | ORACLE | 4h |
| 2.2.3 | Implement invoice follow-up logic | email-suggestions.service.ts | 559 | ORACLE | 4h |
| 2.2.4 | Make domain config flexible | relationship-tracker.service.ts | 809 | FORGE | 2h |

---

## Phase 3: Database Completion (Week 4)

### 3.1 Add Missing Soft Deletes

**Status:** Only 20 of 201 models have `deletedAt`
**Impact:** Audit trail incomplete for tax/compliance

**Models Needing `deletedAt`:**
- TaxDeductionEntry
- TaxRate
- VatRateConfig
- BillLineItem
- InvoiceItem
- PaymentReminder
- RecurringInvoice
- Contract
- InsurancePolicy
- Project
- BillableTimeEntry
- Document
- ElsterFiling

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 3.1.1 | Add deletedAt to 15 critical models | VAULT | 4h |
| 3.1.2 | Generate Prisma migration | VAULT | 1h |
| 3.1.3 | Run migration on dev | VAULT | 30m |
| 3.1.4 | Update services for soft delete | FORGE | 4h |

---

### 3.2 Fix Missing Relationships

**Status:** 8 models have orphaned references

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 3.2.1 | Add MessageAttachment → Message relation | VAULT | 1h |
| 3.2.2 | Add PaymentAllocation → Invoice/Bill relations | VAULT | 2h |
| 3.2.3 | Add Invoice.paymentAllocations reverse | VAULT | 1h |
| 3.2.4 | Add Bill.paymentAllocations reverse | VAULT | 1h |
| 3.2.5 | Verify DocumentVersion → Document | VAULT | 1h |
| 3.2.6 | Generate migration | VAULT | 1h |

---

### 3.3 Add Missing Indexes

**Status:** 15 models missing foreign key indexes

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 3.3.1 | Add index EmailConnection.orgId | VAULT | 30m |
| 3.3.2 | Add index QuickBooksConnection.orgId | VAULT | 30m |
| 3.3.3 | Add compound Transaction(orgId, date) | VAULT | 30m |
| 3.3.4 | Add compound TimeEntry(orgId, userId, date) | VAULT | 30m |
| 3.3.5 | Add compound Message(conversationId, createdAt) | VAULT | 30m |
| 3.3.6 | Generate index migration | VAULT | 1h |

---

### 3.4 Implement Orphan Model APIs

**Status:** 10 models defined but never used

| Model | Action |
|-------|--------|
| ExchangeRate | Create CurrencyService with CRUD |
| DunningState | Complete dunning implementation or archive |
| RevenueForecast | Add to reports module |
| RevenueCohort | Add cohort analysis endpoints |
| MrrMovement | Add to billing module |
| RetentionHold | Add compliance management endpoints |
| ProcessDocumentation | Enhance GoBD workflow |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 3.4.1 | Create ExchangeRate service & controller | FORGE | 4h |
| 3.4.2 | Complete DunningState implementation | FORGE | 8h |
| 3.4.3 | Add RevenueForecast endpoints | FORGE | 4h |

---

## Phase 4: Integration Completion (Weeks 5-6)

### 4.1 Fix "Not Implemented" Errors

| File | Line | Error | Fix |
|------|------|-------|-----|
| contracts.service.ts | 308 | PDF generation not implemented | Integrate Puppeteer |
| documents.service.ts | 495 | S3 storage not implemented | Implement S3 upload |
| truelayer.controller.ts | 186 | Webhook not implemented | Wire to sync service |
| gusto-webhook.controller.ts | 302 | Webhook not implemented | Wire to payroll service |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 4.1.1 | Implement contract PDF generation | FORGE | 8h |
| 4.1.2 | Implement S3 document storage | BRIDGE | 8h |
| 4.1.3 | Implement TrueLayer webhook handler | BRIDGE | 4h |
| 4.1.4 | Implement Gusto webhook handler | BRIDGE | 4h |

---

### 4.2 Complete Integration Webhooks

**Status:** Multiple integrations have empty webhook handlers

**Plaid (Lines 303-386):**
- Trigger background sync jobs
- Handle auth failures
- Update connection health

**Wise (Lines 117-217):**
- Update transfer status in database
- Notify users of completion
- Handle refund events

**Gusto (16 TODOs):**
- All employee/payroll webhook handlers need DB integration

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 4.2.1 | Complete Plaid webhook handlers | BRIDGE | 8h |
| 4.2.2 | Complete Wise webhook handlers | BRIDGE | 4h |
| 4.2.3 | Complete Gusto webhook handlers | BRIDGE | 12h |

---

### 4.3 Integration Configuration Keys

**Status:** 10+ integrations disabled when encryption keys missing

| Integration | Required Key |
|-------------|--------------|
| Xero | XERO_ENCRYPTION_KEY |
| Plaid | PLAID_ENCRYPTION_KEY |
| Gusto | GUSTO_ENCRYPTION_KEY |
| TrueLayer | TRUELAYER_ENCRYPTION_KEY |
| GoCardless | GOCARDLESS_ENCRYPTION_KEY |
| ComplyAdvantage | COMPLY_ADVANTAGE_API_KEY |
| Document Archive | ARCHIVE_ENCRYPTION_KEY |
| Freee | FREEE_ENCRYPTION_KEY |
| Gmail | GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET |
| Outlook | MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 4.3.1 | Generate all missing encryption keys | FLUX | 2h |
| 4.3.2 | Configure Cloudways environment | FLUX | 2h |
| 4.3.3 | Document key requirements in .env.example | FORGE | 1h |

---

## Phase 5: Testing (Weeks 7-9)

### 5.1 Critical Controller Tests

**Status:** 50+ controllers untested

**Priority 1 - Security:**
| Controller | File | Est |
|------------|------|-----|
| auth.controller | apps/api/src/modules/auth/ | 8h |
| oauth.controller | apps/api/src/modules/auth/ | 4h |
| billing.controller | apps/api/src/modules/billing/ | 8h |

**Priority 2 - Core Business:**
| Controller | Est |
|------------|-----|
| invoices.controller | 8h |
| expenses.controller | 4h |
| banking.controller | 8h |
| chatbot.controller | 8h |

**Priority 3 - Features:**
| Controller | Est |
|------------|-----|
| autopilot.controller | 4h |
| documents.controller | 4h |
| reports.controller | 4h |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 5.1.1 | Create test utilities & mocks library | VERIFY | 8h |
| 5.1.2 | Write auth controller tests | VERIFY | 8h |
| 5.1.3 | Write billing controller tests | VERIFY | 8h |
| 5.1.4 | Write invoices controller tests | VERIFY | 8h |
| 5.1.5 | Write banking controller tests | VERIFY | 8h |
| 5.1.6 | Write chatbot controller tests | VERIFY | 8h |

---

### 5.2 Service Layer Tests

**Priority Services:**
| Service | Reason | Est |
|---------|--------|-----|
| auth.service | Security critical | 8h |
| invoices.service | Financial accuracy | 8h |
| transaction-classifier.service | AI correctness | 8h |
| bank-sync.service | Data integrity | 8h |
| autopilot.service | Core automation | 8h |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 5.2.1 | Write auth.service tests | VERIFY | 8h |
| 5.2.2 | Write invoices.service tests | VERIFY | 8h |
| 5.2.3 | Write transaction-classifier tests | VERIFY | 8h |
| 5.2.4 | Write bank-sync.service tests | VERIFY | 8h |
| 5.2.5 | Write autopilot.service tests | VERIFY | 8h |

---

### 5.3 Integration Tests

**Missing E2E Flows:**
- Payment processing (Stripe checkout)
- Bank connection (TrueLayer/Plaid OAuth)
- Invoice creation & sending
- Document upload & processing
- Chat action execution
- Tax filing submission

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 5.3.1 | Add Stripe payment E2E test | VERIFY | 8h |
| 5.3.2 | Add bank connection E2E test | VERIFY | 8h |
| 5.3.3 | Add invoice creation E2E test | VERIFY | 4h |
| 5.3.4 | Add chat action E2E test | VERIFY | 8h |
| 5.3.5 | Add document upload E2E test | VERIFY | 4h |

---

### 5.4 Frontend Component Tests

**Status:** 19 test files for 56+ component groups

**Priority Components:**
| Component Group | Est |
|-----------------|-----|
| auth/ (login, register, MFA) | 8h |
| chat/ (ChatInput, ChatHistory) | 8h |
| invoices/ | 4h |
| payments/ | 4h |
| banking/ | 4h |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 5.4.1 | Write auth component tests | PRISM | 8h |
| 5.4.2 | Write chat component tests | PRISM | 8h |
| 5.4.3 | Write invoice component tests | PRISM | 4h |

---

## Phase 6: Compliance & Security (Week 10)

### 6.1 Complete Encryption TODOs

| File | Line | Task |
|------|------|------|
| country-context.service.ts | 282, 289, 314 | Encrypt sensitive values before storing |
| connection-hub.service.ts | 617 | Use ConfigService secret for encryption |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 6.1.1 | Implement value encryption in country-context | SENTINEL | 4h |
| 6.1.2 | Implement connection token encryption | SENTINEL | 4h |
| 6.1.3 | Security audit of all encryption | SENTINEL | 8h |

---

### 6.2 Complete Compliance Exports

**Status:** SAF-T, GoBD have multiple TODOs

| File | TODOs |
|------|-------|
| compliance.service.ts | 12 TODOs (cache, queue, downloads) |
| saft-builder.service.ts | Country variant hardcoded |
| document-archive.service.ts | ZIP creation not implemented |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 6.2.1 | Complete SAF-T export implementation | FORGE | 12h |
| 6.2.2 | Complete GoBD export implementation | FORGE | 8h |
| 6.2.3 | Implement document archive ZIP creation | FORGE | 4h |

---

### 6.3 Add MFA Rate Limiting

**Status:** TODO in SECURITY_NOTES.md line 197

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 6.3.1 | Add rate limiting to MFA endpoints | SENTINEL | 4h |
| 6.3.2 | Add application-level mfaSecret encryption | SENTINEL | 4h |

---

## Phase 7: Notification System (Week 11)

### 7.1 Complete Push Notifications

**Status:** Lines 43, 138, 155, 170 all have TODOs

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 7.1.1 | Implement FCM (Firebase) push | BRIDGE | 8h |
| 7.1.2 | Implement APNs (Apple) push | BRIDGE | 8h |
| 7.1.3 | Implement device token storage | FORGE | 4h |
| 7.1.4 | Wire to notification service | FORGE | 4h |

---

### 7.2 Complete Email Notifications

**Status:** Multiple services have `// TODO: Send email` comments

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 7.2.1 | Wire export scheduler email notifications | BRIDGE | 4h |
| 7.2.2 | Wire subscription admin notifications | BRIDGE | 4h |
| 7.2.3 | Wire autopilot summary emails | BRIDGE | 4h |
| 7.2.4 | Wire HR leave notifications | BRIDGE | 4h |

---

## Phase 8: Chat Actions (Week 12)

### 8.1 Complete Chat Container Modals

**Status:** Lines 243, 315, 322, 328, 334 have TODO stubs

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 8.1.1 | Implement file upload in chat | PRISM | 8h |
| 8.1.2 | Implement invoice creation modal | PRISM | 8h |
| 8.1.3 | Implement document viewer | PRISM | 4h |
| 8.1.4 | Implement export functionality | PRISM | 4h |
| 8.1.5 | Implement message bookmarks | PRISM | 4h |

---

### 8.2 Test Action Handlers

**Status:** 40+ action handlers with 0 tests

**Priority Handlers:**
| Handler | Est |
|---------|-----|
| create-invoice.handler | 4h |
| create-expense.handler | 4h |
| pay-bill.handler | 4h |
| hire-employee.handler | 4h |
| generate-report.handler | 4h |

**Tasks:**
| # | Task | Owner | Est |
|---|------|-------|-----|
| 8.2.1 | Write tests for top 10 action handlers | VERIFY | 20h |
| 8.2.2 | Test confirmation flow | VERIFY | 4h |
| 8.2.3 | Test rate limiting | VERIFY | 2h |

---

## Sprint Summary

### Sprint 1 (Weeks 1-2): Critical Blockers
- Enable Queue System
- Fix Receipt Scanner Mock
- Rotate Secrets
- **Deliverable:** Background jobs working, receipts scanning

### Sprint 2 (Weeks 2-3): Autopilot Core
- Implement 6 detection methods
- Implement action execution
- Implement daily summary
- **Deliverable:** Autopilot detects and executes actions

### Sprint 3 (Week 3): Email Automation
- Add email sync scheduler
- Complete email intelligence TODOs
- **Deliverable:** Automatic email processing

### Sprint 4 (Week 4): Database Completion
- Add soft deletes
- Fix relationships
- Add indexes
- Implement orphan model APIs
- **Deliverable:** Complete database schema

### Sprint 5-6 (Weeks 5-6): Integration Completion
- Fix "not implemented" errors
- Complete webhook handlers
- Configure all integration keys
- **Deliverable:** All integrations working

### Sprint 7-9 (Weeks 7-9): Testing
- Controller tests (Priority 1-3)
- Service layer tests
- Integration tests
- Frontend component tests
- **Deliverable:** 80% test coverage

### Sprint 10 (Week 10): Compliance & Security
- Complete encryption TODOs
- Complete compliance exports
- Add MFA rate limiting
- **Deliverable:** Security hardened

### Sprint 11 (Week 11): Notifications
- Complete push notifications
- Complete email notifications
- **Deliverable:** Full notification system

### Sprint 12 (Week 12): Chat Actions
- Complete chat container modals
- Test action handlers
- **Deliverable:** Full chat functionality

---

## Resource Allocation

| Agent | Primary Focus | Weeks |
|-------|---------------|-------|
| **ATLAS** | Coordination only | All |
| **FORGE** | Backend implementation | 1-8 |
| **BRIDGE** | Integrations & email | 1-6, 11 |
| **ORACLE** | AI & detection methods | 2-3 |
| **VAULT** | Database schema | 4 |
| **PRISM** | Frontend & chat | 8, 12 |
| **FLUX** | DevOps & infrastructure | 1, 5-6 |
| **VERIFY** | Testing | 7-9, 12 |
| **SENTINEL** | Security | 1, 10 |

---

## Success Metrics

### After Sprint 2
- [ ] Autopilot detects transactions, invoices, bills
- [ ] Queue processes approved actions
- [ ] Receipt scanning returns real data

### After Sprint 4
- [ ] Database schema complete (201 models, all relationships)
- [ ] Email sync runs automatically every 30 min

### After Sprint 9
- [ ] 80% test coverage
- [ ] All controller tests passing
- [ ] E2E tests for critical flows

### After Sprint 12
- [ ] 100% features implemented
- [ ] Zero "not implemented" errors
- [ ] All TODOs resolved or backlogged
- [ ] Full automation working end-to-end

---

## Files Quick Reference

### Critical Files to Fix
1. `apps/api/src/app.module.ts:291-292` - Enable queues
2. `apps/api/src/modules/autopilot/autopilot.service.ts:122, 210-267, 379` - Autopilot core
3. `apps/api/src/modules/ai/receipt-scanner/receipt-scanner.service.ts:69-76, 496-512` - Receipt mock
4. `apps/api/src/modules/integrations/email-sync/` - Add scheduler

### Test Files to Create
1. `apps/api/src/modules/auth/__tests__/auth.controller.spec.ts`
2. `apps/api/src/modules/billing/__tests__/billing.controller.spec.ts`
3. `apps/api/src/modules/finance/invoices/__tests__/invoices.controller.spec.ts`
4. `apps/api/src/modules/autopilot/__tests__/autopilot.service.spec.ts`

### Database Migrations
1. `add-soft-deletes.migration.ts` - Add deletedAt to 15 models
2. `fix-relationships.migration.ts` - Add FK relations
3. `add-indexes.migration.ts` - Add compound indexes

---

## Tracking

This plan should be tracked in:
- `agents/STATE.json` - Sprint progress
- GitHub Issues - Individual tasks
- CI/CD - Test coverage reports

**Next Step:** Start Sprint 1, Task 0.1.1 - Fix Bull Board Redis connection
