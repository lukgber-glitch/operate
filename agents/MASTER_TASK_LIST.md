# OPERATE - Master Task List to 100% Completion

**Created**: 2025-12-07
**Project Manager**: ATLAS
**Goal**: Bring all components to 100% completion

---

## Current State Summary

| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| Frontend/UX | 100% | 100% | 0% |
| Database Schema | 100% | 100% | 0% |
| Backend Services | 90% | 100% | 10% |
| Integrations | 75% | 100% | 25% |
| Security/Compliance | 70% | 100% | 30% |
| Full Automation | 60% | 100% | 40% |

---

## Phase 1: Critical Security & Compliance (Priority: HIGHEST)
**Duration**: 2-3 days | **Blocker for**: Production deployment

### Task 1.1: PII Masking Service [SENTINEL]
**File**: `apps/api/src/common/services/pii-masking.service.ts`
**Priority**: CRITICAL
**Dependencies**: None

**Requirements**:
- Create PIIMaskingService that detects and masks:
  - Email addresses → `***@***.com`
  - Phone numbers → `***-****`
  - IBAN/Bank accounts → `DE**************1234`
  - Tax IDs → `***-**-1234`
  - Names (when flagged) → `[PERSON]`
  - Addresses → `[ADDRESS]`
- Integrate with ClaudeService before all API calls
- Add configuration for masking levels (strict/moderate/minimal)
- Log masked fields for audit trail

**Acceptance Criteria**:
- [ ] PIIMaskingService created with regex patterns
- [ ] Integrated into ClaudeService.chat() method
- [ ] Unit tests for all PII types
- [ ] Configuration via environment variables

---

### Task 1.2: Prompt Injection Prevention [SENTINEL]
**File**: `apps/api/src/modules/chatbot/guards/prompt-sanitizer.guard.ts`
**Priority**: CRITICAL
**Dependencies**: None

**Requirements**:
- Create PromptSanitizerGuard that:
  - Detects injection patterns (ignore previous, system:, etc.)
  - Blocks or sanitizes malicious inputs
  - Logs attempted injections
  - Returns safe error messages
- Apply to all chat endpoints

**Acceptance Criteria**:
- [ ] Guard created with injection pattern detection
- [ ] Applied to ChatController endpoints
- [ ] Unit tests for known injection patterns
- [ ] Audit logging for blocked attempts

---

### Task 1.3: GDPR Compliance Endpoints [SENTINEL]
**Files**:
- `apps/api/src/modules/gdpr/gdpr.module.ts`
- `apps/api/src/modules/gdpr/gdpr.controller.ts`
- `apps/api/src/modules/gdpr/gdpr.service.ts`
**Priority**: HIGH
**Dependencies**: None

**Requirements**:
- POST `/api/v1/gdpr/export` - Export all user data as JSON/ZIP
- DELETE `/api/v1/gdpr/delete` - Delete user account and all data
- GET `/api/v1/gdpr/consent` - Get consent status
- POST `/api/v1/gdpr/consent` - Update consent preferences
- Data retention policy enforcement
- Right to be forgotten implementation

**Acceptance Criteria**:
- [ ] All 4 GDPR endpoints implemented
- [ ] Data export includes all user-related tables
- [ ] Deletion cascades properly through all relations
- [ ] Consent management with audit trail
- [ ] 30-day deletion grace period

---

### Task 1.4: Move Pending Actions to Redis [SENTINEL]
**File**: `apps/api/src/modules/chatbot/actions/confirmation.service.ts`
**Priority**: HIGH
**Dependencies**: Redis configured

**Requirements**:
- Replace in-memory Map with Redis storage
- Add TTL (5 minutes) for pending actions
- Handle Redis connection failures gracefully
- Maintain same API interface

**Acceptance Criteria**:
- [ ] Redis client integrated
- [ ] Pending actions stored with TTL
- [ ] Fallback to in-memory if Redis unavailable
- [ ] No breaking changes to existing code

---

## Phase 2: Chat-HR Connection (Priority: HIGH)
**Duration**: 2-3 days | **Blocker for**: HR automation via chat

### Task 2.1: Hire Employee Action Handler [FORGE]
**File**: `apps/api/src/modules/chatbot/actions/handlers/hire-employee.handler.ts`
**Priority**: HIGH
**Dependencies**: Phase 1 complete

**Requirements**:
- Create handler following existing pattern (see create-invoice.handler.ts)
- Parameters: firstName, lastName, email, department, position, startDate, salary
- Require confirmation (high-risk action)
- Create employee record via EmployeesService
- Return created employee details

**Acceptance Criteria**:
- [ ] Handler registered in action-executor.service.ts
- [ ] Validation for all required fields
- [ ] Permission check: hr:employees:create
- [ ] Integration test with chat flow

---

### Task 2.2: Terminate Employee Action Handler [FORGE]
**File**: `apps/api/src/modules/chatbot/actions/handlers/terminate-employee.handler.ts`
**Priority**: HIGH
**Dependencies**: Task 2.1

**Requirements**:
- Parameters: employeeId OR employeeName, terminationDate, reason
- Require confirmation (high-risk action)
- Lookup employee by ID or name
- Update employee status to TERMINATED
- Set terminationDate on active contract

**Acceptance Criteria**:
- [ ] Handler registered
- [ ] Employee lookup by name with fuzzy matching
- [ ] Permission check: hr:employees:terminate
- [ ] Audit log entry created

---

### Task 2.3: Request Leave Action Handler [FORGE]
**File**: `apps/api/src/modules/chatbot/actions/handlers/request-leave.handler.ts`
**Priority**: MEDIUM
**Dependencies**: Task 2.1

**Requirements**:
- Parameters: employeeId, startDate, endDate, leaveType, reason
- Auto-execute (low-risk action)
- Create leave request via LeaveService
- Check leave balance before creating

**Acceptance Criteria**:
- [ ] Handler registered
- [ ] Leave balance validation
- [ ] Permission check: hr:leave:request
- [ ] Notification to manager

---

### Task 2.4: Approve Leave Action Handler [FORGE]
**File**: `apps/api/src/modules/chatbot/actions/handlers/approve-leave.handler.ts`
**Priority**: MEDIUM
**Dependencies**: Task 2.3

**Requirements**:
- Parameters: leaveRequestId, approved (boolean), comment
- Require confirmation for approval
- Update leave request status
- Update leave balance if approved

**Acceptance Criteria**:
- [ ] Handler registered
- [ ] Permission check: hr:leave:approve
- [ ] Balance deduction on approval
- [ ] Notification to employee

---

### Task 2.5: Update System Prompt with HR Actions [ORACLE]
**File**: `apps/api/src/modules/chatbot/prompts/system-prompt.ts`
**Priority**: HIGH
**Dependencies**: Tasks 2.1-2.4

**Requirements**:
- Add HR action documentation to system prompt
- Include examples for each HR action
- Add HR context type to CONTEXT_PROMPTS
- Update capabilities section

**New Actions to Document**:
```
14. **hire_employee** - Create new employee record
    Example: [ACTION:hire_employee params={"firstName":"John","lastName":"Doe","email":"john@company.com","department":"Engineering","position":"Developer","startDate":"2024-01-15"}]

15. **terminate_employee** - Terminate employee
    Example: [ACTION:terminate_employee params={"employeeName":"John Doe","terminationDate":"2024-03-31","reason":"Resignation"}]

16. **request_leave** - Request time off
    Example: [ACTION:request_leave params={"startDate":"2024-02-01","endDate":"2024-02-05","leaveType":"VACATION","reason":"Family vacation"}]

17. **approve_leave** - Approve/reject leave request
    Example: [ACTION:approve_leave params={"leaveRequestId":"leave_123","approved":true}]
```

**Acceptance Criteria**:
- [ ] All 4 HR actions documented in prompt
- [ ] HR context added to CONTEXT_PROMPTS
- [ ] Examples are accurate and tested

---

## Phase 3: Background Automation (Priority: HIGH)
**Duration**: 3-4 days | **Blocker for**: Proactive AI

### Task 3.1: Daily Insight Job Service [ORACLE]
**Files**:
- `apps/api/src/modules/jobs/daily-insight.job.ts`
- `apps/api/src/modules/jobs/jobs.module.ts`
**Priority**: HIGH
**Dependencies**: BullMQ configured

**Requirements**:
- BullMQ job that runs at 6:00 AM for each organization
- Generate insights:
  - Cash flow alerts (low balance, unusual spending)
  - Overdue invoice reminders
  - Upcoming tax deadlines
  - Dormant customer alerts
- Store to Notification table
- Surface in chat suggestions

**Acceptance Criteria**:
- [ ] Job registered with BullMQ
- [ ] Runs per-organization with proper isolation
- [ ] Generates at least 4 insight types
- [ ] Insights visible in suggestions API

---

### Task 3.2: Email Company Aggregator Service [BRIDGE]
**File**: `apps/api/src/modules/ai/email-intelligence/email-company-aggregator.service.ts`
**Priority**: HIGH
**Dependencies**: None

**Requirements**:
- Nightly batch job that:
  - Queries all extracted entities from past 24 hours
  - Groups by company domain/name
  - Deduplicates contacts
  - Creates "New Companies Discovered" suggestion
- Threshold: 3+ emails from same domain = suggest as customer

**Acceptance Criteria**:
- [ ] Service created with batch processing
- [ ] Deduplication by domain and fuzzy name matching
- [ ] Creates actionable suggestions
- [ ] One-click import to customer database

---

### Task 3.3: Tax Deadline Reminder Job [ORACLE]
**File**: `apps/api/src/modules/jobs/tax-deadline.job.ts`
**Priority**: MEDIUM
**Dependencies**: Task 3.1

**Requirements**:
- Weekly job that checks upcoming tax deadlines
- Generate reminders at: 30 days, 14 days, 7 days, 1 day
- Country-specific deadlines (DE, AT, UK)
- Create urgent notification for past-due

**Acceptance Criteria**:
- [ ] Job registered with BullMQ
- [ ] Multi-stage reminders
- [ ] Country-aware deadline logic
- [ ] Notification created for each reminder

---

### Task 3.4: Cash Flow Optimization Service [ORACLE]
**File**: `apps/api/src/modules/ai/bank-intelligence/cash-flow-optimizer.service.ts`
**Priority**: MEDIUM
**Dependencies**: Task 3.1

**Requirements**:
- Analyze spending patterns with Claude
- Identify optimization opportunities:
  - Recurring subscriptions (cancel unused)
  - Bulk purchase discounts
  - Payment timing optimization
  - Tax-saving opportunities
- Generate "You could save €X" suggestions

**Acceptance Criteria**:
- [ ] Service created with Claude integration
- [ ] At least 4 optimization types
- [ ] Confidence scoring for suggestions
- [ ] Actionable recommendations

---

### Task 3.5: Proactive Suggestion Scheduler [ORACLE]
**File**: `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
**Priority**: HIGH
**Dependencies**: Tasks 3.1-3.4

**Requirements**:
- Coordinate all background jobs
- Manage suggestion lifecycle (create, expire, dismiss)
- Priority-based surfacing in chat
- Rate limiting (max 5 suggestions per session)

**Acceptance Criteria**:
- [ ] Scheduler orchestrates all insight jobs
- [ ] Suggestions expire after 7 days
- [ ] Priority ordering implemented
- [ ] Rate limiting per user session

---

## Phase 4: Integration Completion (Priority: MEDIUM)
**Duration**: 2-3 days | **Blocker for**: US market

### Task 4.1: Plaid Production Activation [BRIDGE]
**File**: `apps/api/src/modules/integrations/plaid/plaid.service.ts`
**Priority**: MEDIUM
**Dependencies**: Plaid production credentials

**Requirements**:
- Switch from sandbox to production environment
- Update API endpoints and credentials
- Test with real bank connections
- Handle production error codes

**Acceptance Criteria**:
- [ ] Production environment configured
- [ ] OAuth flow works with real banks
- [ ] Transaction sync verified
- [ ] Error handling for production scenarios

---

### Task 4.2: TrueLayer Payment Initiation [BRIDGE]
**File**: `apps/api/src/modules/integrations/truelayer/truelayer-payments.service.ts`
**Priority**: MEDIUM
**Dependencies**: TrueLayer payments API access

**Requirements**:
- Add payment initiation capability
- Support SEPA and Faster Payments
- Integrate with bill payment workflow
- Handle payment status callbacks

**Acceptance Criteria**:
- [ ] Payment initiation endpoint created
- [ ] Bill payment automation possible
- [ ] Webhook handling for payment status
- [ ] Error handling and retry logic

---

### Task 4.3: Document RAG Search [ORACLE]
**Files**:
- `apps/api/src/modules/documents/document-indexer.service.ts`
- `apps/api/src/modules/documents/document-search.service.ts`
**Priority**: MEDIUM
**Dependencies**: Vector database (Pinecone/Weaviate)

**Requirements**:
- Index uploaded documents (invoices, contracts, receipts)
- Generate embeddings via Claude/OpenAI
- Natural language search: "Find all AWS invoices > €1000"
- Return relevant document excerpts

**Acceptance Criteria**:
- [ ] Document indexing pipeline
- [ ] Vector storage configured
- [ ] Search endpoint with natural language
- [ ] Relevance scoring

---

### Task 4.4: Multi-Step Action Sequences [FORGE]
**File**: `apps/api/src/modules/chatbot/actions/action-sequence.service.ts`
**Priority**: LOW
**Dependencies**: Phase 2 complete

**Requirements**:
- Allow AI to plan multi-step workflows
- Example: "Create invoice → Send → Log in CRM"
- Confirmation between steps
- Rollback on failure

**Acceptance Criteria**:
- [ ] Sequence definition format
- [ ] Step-by-step execution with confirmation
- [ ] Rollback mechanism
- [ ] Progress tracking

---

## Phase 5: Testing & Hardening (Priority: HIGH)
**Duration**: 2-3 days | **Blocker for**: Production release

### Task 5.1: E2E Test Suite Expansion [VERIFY]
**Directory**: `apps/web/e2e/`
**Priority**: HIGH
**Dependencies**: Phases 1-4 complete

**Requirements**:
- E2E tests for:
  - Chat flow with all 17 actions
  - HR workflows (hire, terminate, leave)
  - Tax filing wizards
  - Bank connection flow
  - Billing/subscription flow
- Run in CI/CD pipeline

**Acceptance Criteria**:
- [ ] 80%+ code coverage for critical paths
- [ ] All action handlers tested
- [ ] CI/CD integration
- [ ] Test report generation

---

### Task 5.2: Security Penetration Testing [SENTINEL]
**Priority**: HIGH
**Dependencies**: Task 1.1-1.4 complete

**Requirements**:
- Test prompt injection protection
- Test PII masking effectiveness
- Test GDPR deletion completeness
- Test multi-tenancy isolation
- Test rate limiting

**Acceptance Criteria**:
- [ ] No critical vulnerabilities
- [ ] Penetration test report
- [ ] All findings remediated

---

### Task 5.3: Performance Optimization [FLUX]
**Priority**: MEDIUM
**Dependencies**: Phase 3 complete

**Requirements**:
- Optimize background job performance
- Add caching for frequently accessed data
- Database query optimization
- API response time < 200ms for 95th percentile

**Acceptance Criteria**:
- [ ] Job execution time < 30s
- [ ] Redis caching implemented
- [ ] Query optimization verified
- [ ] Performance benchmarks documented

---

### Task 5.4: Production Deployment Checklist [FLUX]
**Priority**: HIGH
**Dependencies**: All phases complete

**Requirements**:
- Environment variables verified
- Database migrations ready
- Monitoring dashboards configured
- Rollback procedure documented
- Health checks implemented

**Acceptance Criteria**:
- [ ] Deployment runbook created
- [ ] All secrets in vault
- [ ] Monitoring alerts configured
- [ ] Rollback tested

---

## Task Summary by Agent

| Agent | Tasks | Priority |
|-------|-------|----------|
| **SENTINEL** | 1.1, 1.2, 1.3, 1.4, 5.2 | CRITICAL → HIGH |
| **FORGE** | 2.1, 2.2, 2.3, 2.4, 4.4 | HIGH → LOW |
| **ORACLE** | 2.5, 3.1, 3.3, 3.4, 3.5, 4.3 | HIGH → MEDIUM |
| **BRIDGE** | 3.2, 4.1, 4.2 | HIGH → MEDIUM |
| **VERIFY** | 5.1 | HIGH |
| **FLUX** | 5.3, 5.4 | MEDIUM → HIGH |

---

## Execution Order (Critical Path)

```
Week 1: Security & Chat-HR
├── Day 1-2: SENTINEL executes Phase 1 (Security)
│   ├── Task 1.1: PII Masking [CRITICAL]
│   ├── Task 1.2: Prompt Injection [CRITICAL]
│   └── Task 1.3: GDPR Endpoints [HIGH]
├── Day 2-3: FORGE executes Phase 2 (Chat-HR) in parallel
│   ├── Task 2.1: Hire Employee Handler
│   ├── Task 2.2: Terminate Employee Handler
│   ├── Task 2.3: Request Leave Handler
│   └── Task 2.4: Approve Leave Handler
└── Day 3: ORACLE executes Task 2.5 (System Prompt)

Week 2: Background Automation & Integration
├── Day 4-5: ORACLE executes Phase 3 (Background Jobs)
│   ├── Task 3.1: Daily Insight Job
│   ├── Task 3.3: Tax Deadline Job
│   ├── Task 3.4: Cash Flow Optimizer
│   └── Task 3.5: Proactive Scheduler
├── Day 4-5: BRIDGE executes Phase 3 & 4 in parallel
│   ├── Task 3.2: Email Company Aggregator
│   ├── Task 4.1: Plaid Production
│   └── Task 4.2: TrueLayer Payments
└── Day 6: ORACLE executes Task 4.3 (Document RAG)

Week 3: Testing & Hardening
├── Day 7-8: VERIFY executes Task 5.1 (E2E Tests)
├── Day 8: SENTINEL executes Task 5.2 (Pen Testing)
├── Day 8-9: FLUX executes Tasks 5.3, 5.4
└── Day 9: Final integration testing & deployment prep
```

---

## Definition of Done

A task is complete when:
1. Code implemented and committed
2. Unit tests passing (>80% coverage)
3. Integration tests passing
4. Code review approved
5. Documentation updated
6. No TypeScript errors
7. No security vulnerabilities

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Redis not configured | Use in-memory fallback |
| Plaid production rejected | Keep sandbox for US demo |
| Vector DB not available | Defer document RAG to Phase 2 |
| Claude API limits | Implement request queuing |

---

*Generated by ATLAS Project Manager - 2025-12-07*
