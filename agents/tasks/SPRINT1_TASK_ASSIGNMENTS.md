# Sprint 1: Foundation Pipeline Tasks

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: Connect existing services to create working automation pipelines
**Duration**: Week 1-2

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - No Dependencies]
├── TASK-001: Wire Invoice Extraction Pipeline (BRIDGE)
├── TASK-002: Wire Transaction Classification Pipeline (BRIDGE)
└── TASK-003: Implement Email Delivery Service (BRIDGE)

[PARALLEL GROUP 2 - After Group 1]
├── TASK-004: Create Proactive Suggestions Scheduler (ORACLE)
└── TASK-005: Build Action Confirmation Endpoints (FORGE)

[PARALLEL GROUP 3 - After Group 2]
└── TASK-006: Wire Frontend Action Handler (PRISM)
```

---

## TASK-001: Wire Invoice Extraction Pipeline

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
The invoice extractor service EXISTS and is COMPLETE at:
- `apps/api/src/modules/ai/extractors/invoice-extractor.service.ts`
- `apps/api/src/modules/ai/extractors/invoice-extractor.processor.ts`

The attachment processor has a TODO at line 419-426 in:
- `apps/api/src/modules/integrations/email-sync/attachment/attachment-processor.service.ts`

### Objective
Connect the email attachment processor to the invoice extraction queue so that when emails with invoice attachments are synced, they automatically get extracted.

### Files to Modify
1. `apps/api/src/modules/integrations/email-sync/attachment/attachment-processor.module.ts`
   - Import `InvoiceExtractorModule` and `ReceiptExtractorModule`
   - Register `invoice-extraction` and `receipt-extraction` queues

2. `apps/api/src/modules/integrations/email-sync/attachment/attachment-processor.service.ts`
   - Inject invoice and receipt extraction queues
   - Implement `routeToExtractor()` method (currently TODO at line 419-426)
   - Queue extraction jobs with attachment data

3. `apps/api/src/modules/ai/extractors/invoice-extractor.processor.ts`
   - Add `attachmentId` to job interface
   - Update EmailAttachment record when extraction completes

### Technical Requirements
- Use BullMQ job queues (already configured)
- Pass file buffer from storage to extraction queue
- Update `extractionStatus` field on EmailAttachment
- Link `extractedDataId` to ExtractedInvoice record

### Acceptance Criteria
- [ ] When email with PDF/image attachment classified as INVOICE syncs
- [ ] Attachment is automatically queued for extraction
- [ ] Invoice data is extracted using GPT-4 Vision
- [ ] EmailAttachment.extractionStatus updates to COMPLETED
- [ ] ExtractedInvoice record is created and linked

### Reference Files
- Invoice Extractor Service: `apps/api/src/modules/ai/extractors/invoice-extractor.service.ts`
- Attachment Classifier: `apps/api/src/modules/integrations/email-sync/attachment/attachment-classifier.service.ts`
- Storage Service: `apps/api/src/modules/integrations/email-sync/attachment/attachment-storage.service.ts`

---

## TASK-002: Wire Transaction Classification Pipeline

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
Transaction categorization service EXISTS at:
- `apps/api/src/modules/ai/transaction-categorization/transaction-categorization.service.ts`

Bank sync service creates transactions but DOESN'T trigger classification:
- `apps/api/src/modules/finance/bank-sync/bank-sync.service.ts`

### Objective
When bank transactions sync, automatically classify them and suggest tax deductions.

### Files to Modify
1. `apps/api/src/modules/finance/bank-sync/bank-sync.service.ts`
   - After `syncTransactions()`, emit event or call classification service
   - Batch classify new transactions

2. Create new file: `apps/api/src/modules/banking/transaction-pipeline.service.ts`
   - Listen for `bank.sync.completed` events
   - Batch categorize new unclassified transactions
   - Apply tax deduction suggestions
   - Emit `transaction.classified` events

3. `apps/api/src/modules/finance/bank-sync/jobs/bank-import.processor.ts`
   - After sync completes, trigger classification pipeline

### Technical Requirements
- Use NestJS EventEmitter for decoupled processing
- Batch transactions (max 50) for categorization
- Only process UNMATCHED transactions
- Store classification results with confidence scores

### Acceptance Criteria
- [ ] When bank syncs new transactions
- [ ] Each transaction is automatically categorized
- [ ] Tax deduction suggestions are generated for eligible expenses
- [ ] Classification confidence is stored
- [ ] High-confidence (>0.8) transactions auto-categorized

### Reference Files
- Transaction Categorization: `apps/api/src/modules/ai/transaction-categorization/transaction-categorization.service.ts`
- Tax Deduction Classifier: `apps/api/src/modules/ai/classification/tax-deduction-classifier.service.ts`
- Bank Import Processor: `apps/api/src/modules/finance/bank-sync/jobs/bank-import.processor.ts`

---

## TASK-003: Implement Email Delivery Service

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Low
**Dependencies**: None

### Context
Email notification service is a STUB at:
- `apps/api/src/modules/notifications/channels/email.service.ts`
- Currently only logs, doesn't actually send emails

Payment reminders are complete but can't send because email is stubbed.

### Objective
Implement actual email sending using SendGrid or AWS SES.

### Files to Modify
1. `apps/api/src/modules/notifications/channels/email.service.ts`
   - Integrate SendGrid SDK (recommended) or AWS SES
   - Implement `sendNotification()` method
   - Add template support for different email types

2. Add environment variables to `.env.example`:
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`
   - `SENDGRID_FROM_NAME`

3. Update `apps/api/src/modules/notifications/notifications.module.ts`
   - Ensure EmailService is properly exported

### Technical Requirements
- Use SendGrid (easier setup) or AWS SES
- Support HTML and plain text emails
- Implement retry logic for failed sends
- Track delivery status

### Acceptance Criteria
- [ ] Email service sends actual emails
- [ ] Payment reminders are delivered to customers
- [ ] Notification preferences are respected
- [ ] Failed emails are retried (3 attempts)
- [ ] Delivery events are logged

### Reference Files
- Current Stub: `apps/api/src/modules/notifications/channels/email.service.ts`
- Payment Reminders: `apps/api/src/modules/finance/payment-reminders/`

---

## TASK-004: Create Proactive Suggestions Scheduler

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: TASK-003 (for sending notifications)

### Context
ProactiveSuggestionsService EXISTS but is NEVER called automatically:
- `apps/api/src/modules/chatbot/suggestions/proactive-suggestions.service.ts`
- Has methods: `getSuggestions()`, `getInsights()`, `getDeadlineReminders()`
- Currently only triggered when user asks

### Objective
Create a scheduler that runs daily at 8AM to analyze business data and generate proactive suggestions for users.

### Files to Create
1. `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
   - Daily cron job at 8AM (Europe/Berlin timezone)
   - For each organization with active subscription
   - Call ProactiveSuggestionsService.getSuggestions()
   - Store suggestions in database
   - Send notification to user (push/email based on preference)

### Files to Modify
1. `apps/api/src/modules/chatbot/suggestions/suggestions.module.ts`
   - Register ProactiveScheduler
   - Import ScheduleModule

2. Database: Add table for storing generated suggestions
   - `ProactiveSuggestion` model with fields: orgId, type, title, description, priority, actionData, createdAt, readAt, dismissedAt

### Technical Requirements
- Use NestJS @Cron decorator with Europe/Berlin timezone
- Process organizations in batches (avoid memory issues)
- Dedup suggestions (don't repeat same suggestion daily)
- Priority levels: URGENT, HIGH, MEDIUM, LOW
- Suggestion types: OVERDUE_INVOICE, TAX_DEADLINE, CASH_FLOW_WARNING, OPPORTUNITY

### Acceptance Criteria
- [ ] Scheduler runs daily at 8AM
- [ ] Generates suggestions for all active organizations
- [ ] Stores suggestions in database
- [ ] Sends notifications to users
- [ ] Suggestions appear in chat interface

### Reference Files
- Proactive Service: `apps/api/src/modules/chatbot/suggestions/proactive-suggestions.service.ts`
- Business Analyzer: `apps/api/src/modules/chatbot/suggestions/business-analyzer.service.ts`

---

## TASK-005: Build Action Confirmation Endpoints

**Agent**: FORGE (Backend Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Low
**Dependencies**: None

### Context
ActionExecutorService EXISTS and is COMPLETE:
- `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
- Supports: CREATE_INVOICE, CREATE_EXPENSE, SEND_REMINDER, GENERATE_REPORT, UPDATE_STATUS

Missing: API endpoints for frontend to confirm/cancel actions.

### Objective
Add REST endpoints for action confirmation flow.

### Files to Modify
1. `apps/api/src/modules/chatbot/chatbot.controller.ts`
   - Add `POST /chatbot/actions/:confirmationId/confirm`
   - Add `POST /chatbot/actions/:confirmationId/cancel`
   - Add `GET /chatbot/actions/:confirmationId/status`

2. Create: `apps/api/src/modules/chatbot/dto/action-confirmation.dto.ts`
   - ConfirmActionDto
   - ActionStatusResponseDto

### Technical Requirements
- Use existing ActionExecutorService
- Validate confirmationId exists and not expired
- Rate limiting (use existing guards)
- Return action result with created entity ID

### Acceptance Criteria
- [ ] User can confirm pending action via API
- [ ] User can cancel pending action via API
- [ ] Action executes and returns result
- [ ] Expired actions return appropriate error
- [ ] Created entities (invoice, expense) are returned

### Reference Files
- Action Executor: `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
- Chatbot Controller: `apps/api/src/modules/chatbot/chatbot.controller.ts`

---

## TASK-006: Wire Frontend Action Handler

**Agent**: PRISM (Frontend Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: TASK-005

### Context
Chat interface exists but doesn't handle action execution:
- `apps/web/src/components/chat/ChatInterface.tsx`
- Claude returns actions in response but frontend ignores them

### Objective
Wire frontend to display action confirmations and execute them.

### Files to Create
1. `apps/web/src/components/chat/ActionConfirmationDialog.tsx`
   - Modal dialog showing action details
   - Confirm/Cancel buttons
   - Loading state during execution

2. `apps/web/src/components/chat/ActionResultCard.tsx`
   - Display action result (e.g., "Invoice #123 created")
   - Link to created entity

3. `apps/web/src/hooks/useActionExecution.ts`
   - Hook to handle action confirmation flow
   - Call confirm/cancel endpoints
   - Handle loading/error states

### Files to Modify
1. `apps/web/src/components/chat/ChatInterface.tsx`
   - Parse action data from Claude response
   - Show ActionConfirmationDialog when action detected
   - Display ActionResultCard after execution

2. `apps/web/src/lib/api/chat.ts`
   - Add confirmAction() method
   - Add cancelAction() method

### Technical Requirements
- Use existing UI components (Dialog, Button, Card)
- Handle optimistic updates
- Show loading spinner during API call
- Toast notification on success/failure

### Acceptance Criteria
- [ ] When Claude suggests action, confirmation dialog appears
- [ ] User can confirm or cancel action
- [ ] On confirm, action executes via API
- [ ] Result card shows created entity with link
- [ ] Errors are handled gracefully

### Reference Files
- Chat Interface: `apps/web/src/components/chat/ChatInterface.tsx`
- UI Components: `apps/web/src/components/ui/`
- API Client: `apps/web/src/lib/api/`

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel - Start Immediately)
Launch these 3 agents simultaneously:

1. **BRIDGE Agent #1**: TASK-001 (Invoice Extraction Pipeline)
2. **BRIDGE Agent #2**: TASK-002 (Transaction Classification Pipeline)
3. **BRIDGE Agent #3**: TASK-003 (Email Delivery Service)

### Phase 2 (After Phase 1 Completes)
Launch these 2 agents simultaneously:

4. **ORACLE Agent**: TASK-004 (Proactive Suggestions Scheduler)
5. **FORGE Agent**: TASK-005 (Action Confirmation Endpoints)

### Phase 3 (After Phase 2 Completes)
Launch this agent:

6. **PRISM Agent**: TASK-006 (Frontend Action Handler)

---

## SUCCESS METRICS

When Sprint 1 is complete:

1. **Email → Invoice**: Sync Gmail → Invoice PDFs auto-extracted → Viewable in dashboard
2. **Bank → Tax**: Sync bank → Transactions classified → Tax deductions suggested
3. **Proactive AI**: Daily 8AM → "3 invoices overdue" notification
4. **Chat → Action**: "Create invoice for Acme €500" → Confirmation → Invoice created
5. **Reminders Work**: Overdue invoices → Customer receives email reminder

---

## NOTES FOR AGENTS

- All services use NestJS dependency injection
- Database access via PrismaService
- Queue system is BullMQ with Redis
- AI calls use either OpenAI (GPT-4) or Anthropic (Claude)
- Follow existing code patterns in the codebase
- Add proper logging with NestJS Logger
- Handle errors gracefully with try/catch
- Write JSDoc comments for public methods
