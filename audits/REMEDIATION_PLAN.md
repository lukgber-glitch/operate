# Operate Remediation Plan
**Date:** 2025-12-08
**Based on:** Comprehensive Audit Report
**Target:** 95% Production-Ready in 3 Weeks

---

## Overview

This remediation plan addresses 20 prioritized issues discovered in the comprehensive audit. Tasks are organized by priority (P0-P3) and sequenced to maximize impact while respecting dependencies.

**Current Status:** 82% Production-Ready
**Target:** 95% Production-Ready
**Timeline:** 3 weeks (15 business days)
**Estimated Effort:** 120 hours

---

## Priority 0 - Critical (Do First)

### C-001: Generate NPM Lockfiles & Security Audit
**Priority:** P0 - BLOCKER
**Impact:** Cannot audit dependencies for vulnerabilities
**Effort:** 1 hour
**Owner:** FLUX (DevOps)

**Tasks:**
1. Generate lockfiles for API and Web
   ```bash
   cd apps/api && npm install --package-lock-only
   cd apps/web && npm install --package-lock-only
   ```

2. Run security audit
   ```bash
   npm audit --json > audits/npm-audit-api.json
   npm audit --json > audits/npm-audit-web.json
   ```

3. Review vulnerabilities and create remediation tickets

4. Commit lockfiles to git
   ```bash
   git add apps/api/package-lock.json apps/web/package-lock.json
   git commit -m "chore: Add package-lock.json files for security auditing"
   ```

**Acceptance Criteria:**
- ✅ `package-lock.json` exists in `apps/api/` and `apps/web/`
- ✅ `npm audit` runs without errors
- ✅ No critical or high vulnerabilities (or tickets created for fixes)
- ✅ Lockfiles committed to git

**Blockers:** None
**Dependencies:** None

---

### C-002: Implement Receipt Scanning Feature
**Priority:** P0 - CRITICAL
**Impact:** Core automation feature advertised but non-functional
**Effort:** 16 hours
**Owner:** BRIDGE (Integrations)

**Current State:**
All 7 receipt endpoints return TODO placeholders:
- `POST /receipts/upload` ❌
- `GET /receipts/scan/:id/status` ❌
- `GET /receipts/scan/:id/result` ❌
- `POST /receipts/scan/:id/confirm` ❌
- `POST /receipts/scan/:id/reject` ❌
- `GET /receipts/scans` ❌
- `POST /receipts/scan/:id/rescan` ❌

**Tasks:**

1. **Wire MindeeService into ReceiptsModule** (2 hours)
   ```typescript
   // apps/api/src/modules/finance/expenses/receipts/receipts.module.ts
   import { MindeeModule } from '../../../integrations/mindee/mindee.module';

   @Module({
     imports: [MindeeModule], // Add this
     providers: [ReceiptsService], // Now can inject MindeeService
   })
   ```

2. **Implement ReceiptsService** (8 hours)
   ```typescript
   // apps/api/src/modules/finance/expenses/receipts/receipts.service.ts
   @Injectable()
   export class ReceiptsService {
     constructor(
       private prisma: PrismaService,
       private mindeeService: MindeeService,
       private storageService: StorageService,
     ) {}

     async uploadAndScan(orgId: string, file: Express.Multer.File) {
       // 1. Upload file to S3/storage
       const fileUrl = await this.storageService.upload(file);

       // 2. Create ReceiptScan record
       const scan = await this.prisma.receiptScan.create({
         data: {
           organizationId: orgId,
           status: 'PROCESSING',
           fileUrl,
           fileName: file.originalname,
         },
       });

       // 3. Send to Mindee OCR (async)
       this.mindeeService.scanReceipt(scan.id, fileUrl).catch(err => {
         this.handleScanError(scan.id, err);
       });

       return scan;
     }
   }
   ```

3. **Implement all 7 controller endpoints** (4 hours)
   - Replace TODO placeholders with service calls
   - Add proper error handling
   - Add validation

4. **Test end-to-end flow** (2 hours)
   - Upload receipt → OCR → create expense
   - Test error scenarios (invalid file, OCR failure)
   - Test confirmation/rejection flow

**Acceptance Criteria:**
- ✅ All 7 receipt endpoints functional
- ✅ File upload to storage works
- ✅ Mindee OCR integration works
- ✅ ReceiptScan records created/updated
- ✅ Can create expense from confirmed scan
- ✅ Error handling for OCR failures
- ✅ Manual testing completed

**Blockers:** None (MindeeModule already exists)
**Dependencies:** C-001 (npm audit might reveal Mindee SDK vulnerabilities)

---

### C-003: Remove Hardcoded JWT Secrets
**Priority:** P0 - CRITICAL
**Impact:** Security vulnerability if defaults reach production
**Effort:** 2 hours
**Owner:** SENTINEL (Security)

**Current State:**
```typescript
// apps/api/src/config/configuration.ts (lines 11-12)
jwt: {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production',
```

**Tasks:**

1. **Remove default fallbacks** (15 min)
   ```typescript
   // apps/api/src/config/configuration.ts
   jwt: {
     accessSecret: process.env.JWT_ACCESS_SECRET, // Remove fallback
     refreshSecret: process.env.JWT_REFRESH_SECRET, // Remove fallback
   ```

2. **Add startup validation** (30 min)
   ```typescript
   // apps/api/src/main.ts
   async function validateEnv() {
     const required = [
       'JWT_ACCESS_SECRET',
       'JWT_REFRESH_SECRET',
       'DATABASE_URL',
       'ANTHROPIC_API_KEY',
     ];

     for (const key of required) {
       if (!process.env[key]) {
         throw new Error(`Missing required environment variable: ${key}`);
       }
     }
   }

   async function bootstrap() {
     validateEnv(); // Add this
     // ... rest of bootstrap
   }
   ```

3. **Update .env.example** (15 min)
   ```bash
   # .env.example
   JWT_ACCESS_SECRET=generate-with-openssl-rand-base64-32
   JWT_REFRESH_SECRET=generate-with-openssl-rand-base64-32
   DATABASE_URL=postgresql://user:password@localhost:5432/operate
   ANTHROPIC_API_KEY=your-api-key-here
   ```

4. **Add CI/CD deployment check** (1 hour)
   ```yaml
   # .github/workflows/deploy.yml (if exists)
   - name: Validate environment variables
     run: |
       if [ -z "$JWT_ACCESS_SECRET" ]; then
         echo "Error: JWT_ACCESS_SECRET not set"
         exit 1
       fi
   ```

**Acceptance Criteria:**
- ✅ No hardcoded secret fallbacks in code
- ✅ App fails to start if secrets missing
- ✅ `.env.example` documents all required vars
- ✅ CI/CD check prevents deployment without secrets
- ✅ Documentation updated with secret generation instructions

**Blockers:** None
**Dependencies:** None

---

## Priority 1 - High

### H-001: Complete Email→Bill Automation
**Priority:** P1 - HIGH
**Impact:** Core automation feature for AP management
**Effort:** 12 hours
**Owner:** BRIDGE (Integrations)

**Current State:**
- `BillCreatorService` exists but has TODOs
- `email-aggregator.service.ts` has invoice extraction placeholders
- `vendor-auto-creator.service.ts` incomplete

**Tasks:**

1. **Complete EmailAggregatorService** (4 hours)
   - Implement invoice attachment detection
   - Wire InvoiceExtractorService (already exists)
   - Handle extraction errors

2. **Complete VendorAutoCreatorService** (3 hours)
   - Implement vendor matching logic
   - Auto-create vendor if no match found
   - Handle duplicate detection

3. **Wire services into BillCreatorService** (3 hours)
   - Combine extraction + vendor creation + bill creation
   - Add transaction logging
   - Emit events for notifications

4. **Test end-to-end** (2 hours)
   - Email with invoice → Bill created
   - Test vendor matching edge cases
   - Test error scenarios

**Acceptance Criteria:**
- ✅ Email with invoice attachment → Bill created
- ✅ Vendor auto-created or matched correctly
- ✅ Bill linked to vendor
- ✅ Extraction errors logged
- ✅ Events emitted for downstream processing

**Blockers:** None
**Dependencies:** C-002 (similar OCR flow)

---

### H-002: Replace `any` Types in Critical Services
**Priority:** P1 - HIGH
**Impact:** Type safety, developer experience, runtime errors
**Effort:** 16 hours
**Owner:** ORACLE (AI/ML) + FORGE (Backend)

**Current State:**
20+ services using `any` type, primarily in AI/ML services

**Tasks:**

1. **Create shared type definitions** (4 hours)
   ```typescript
   // packages/shared/src/types/transaction.ts
   export interface Transaction {
     id: string;
     organizationId: string;
     amount: Decimal;
     currency: string;
     date: Date;
     description: string;
     category?: string;
     confidence?: number;
   }

   // packages/shared/src/types/classification.ts
   export interface Classification {
     category: string;
     subcategory?: string;
     confidence: number;
     suggestedTaxDeduction: boolean;
     reasoning: string;
   }
   ```

2. **Replace `any` in bank-intelligence services** (6 hours - ORACLE)
   - `transaction-classifier.service.ts`
   - `bill-matcher.service.ts`
   - `invoice-matcher.service.ts`
   - `cash-flow-predictor.service.ts`
   - `tax-deduction-analyzer.service.ts`

3. **Replace `any` in email-intelligence services** (4 hours - BRIDGE)
   - `email-suggestions.service.ts`
   - `customer-auto-creator.service.ts`
   - `vendor-auto-creator.service.ts`
   - `entity-extractor.service.ts`

4. **Enable stricter TypeScript checking** (2 hours)
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true, // Enable gradually
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

**Acceptance Criteria:**
- ✅ Shared types package created
- ✅ 20+ services refactored to use proper types
- ✅ No `any` types in critical AI services
- ✅ TypeScript strict mode enabled
- ✅ Code compiles without type errors

**Blockers:** None
**Dependencies:** None

---

### H-003: Add Webhook Signature Validation
**Priority:** P1 - HIGH
**Impact:** Security vulnerability - unauthorized webhooks
**Effort:** 12 hours (3 hours × 4 providers)
**Owner:** SENTINEL (Security)

**Current State:**
4 webhook controllers lack signature validation:
- Tink ❌
- Gusto ❌
- GoCardless ❌
- ComplyAdvantage ❌

**Tasks:**

1. **Tink Webhook Validation** (3 hours)
   ```typescript
   // apps/api/src/modules/integrations/tink/tink-webhook.controller.ts
   @Post('webhook')
   @Public()
   async handleWebhook(
     @Headers('x-tink-signature') signature: string,
     @RawBody() rawBody: Buffer,
     @Body() payload: any,
   ) {
     // Validate signature
     this.tinkService.validateWebhookSignature(signature, rawBody);

     // Process webhook
     return this.tinkService.handleWebhook(payload);
   }
   ```

2. **Gusto Webhook Validation** (3 hours)
   - Implement HMAC SHA-256 signature verification
   - Add secret from env vars
   - Test with sample webhooks

3. **GoCardless Webhook Validation** (3 hours)
   - Implement GoCardless signature scheme
   - Add webhook secret to config
   - Test webhook delivery

4. **ComplyAdvantage Webhook Validation** (3 hours)
   - Implement signature validation
   - Add error handling for invalid signatures
   - Log validation failures

**Acceptance Criteria:**
- ✅ All 4 webhooks validate signatures
- ✅ Invalid signatures rejected with 401
- ✅ Signature validation logged
- ✅ Secrets stored in environment variables
- ✅ Integration tests pass

**Blockers:** None
**Dependencies:** None

---

### H-004: Add Missing API Bulk Operations
**Priority:** P1 - MEDIUM-HIGH
**Impact:** User productivity for multi-entity actions
**Effort:** 10 hours
**Owner:** FORGE (Backend)

**Missing Endpoints:**
- `POST /invoices/bulk-send`
- `POST /expenses/bulk-approve`
- `DELETE /clients/bulk-archive`
- `POST /automation/execute-batch`

**Tasks:**

1. **Bulk Invoice Send** (2.5 hours)
   ```typescript
   // apps/api/src/modules/finance/invoices/invoices.controller.ts
   @Post('bulk-send')
   @RequirePermissions(Permission.INVOICES_SEND)
   async bulkSend(
     @Param('orgId') orgId: string,
     @Body() dto: BulkSendInvoicesDto,
   ) {
     return this.invoicesService.bulkSend(orgId, dto.invoiceIds);
   }
   ```

2. **Bulk Expense Approve** (2.5 hours)
   - Similar pattern to bulk invoice send
   - Add transaction for atomicity
   - Return summary of successes/failures

3. **Bulk Client Archive** (2.5 hours)
   - Soft delete with `deletedAt` timestamp
   - Check for active invoices before archiving
   - Return confirmation

4. **Batch Suggestion Execution** (2.5 hours)
   - Execute multiple suggestions atomically
   - Roll back on any failure
   - Return detailed results

**Acceptance Criteria:**
- ✅ 4 new bulk operation endpoints
- ✅ Transactional integrity maintained
- ✅ Proper error handling and rollback
- ✅ Permissions enforced
- ✅ Return detailed success/failure summary

**Blockers:** None
**Dependencies:** None

---

### H-005: Wire Chat Persistence to Backend
**Priority:** P1 - HIGH
**Impact:** UX - conversations lost on refresh
**Effort:** 6 hours
**Owner:** PRISM (Frontend)

**Current State:**
Chat uses local React state, doesn't persist to backend

**Tasks:**

1. **Create useConversation hook** (2 hours)
   ```typescript
   // apps/web/src/hooks/useConversation.ts
   export function useConversation(conversationId?: string) {
     const [conversation, setConversation] = useState<Conversation | null>(null);
     const [messages, setMessages] = useState<Message[]>([]);
     const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
       if (conversationId) {
         loadConversation(conversationId);
       } else {
         createConversation();
       }
     }, [conversationId]);

     const loadConversation = async (id: string) => {
       const res = await fetch(`/api/v1/chatbot/conversations/${id}`);
       const data = await res.json();
       setConversation(data);
       setMessages(data.messages);
     };

     const sendMessage = async (content: string) => {
       const res = await fetch(`/api/v1/chatbot/conversations/${conversation.id}/messages`, {
         method: 'POST',
         body: JSON.stringify({ content }),
       });
       const data = await res.json();
       setMessages(prev => [...prev, ...data]); // userMessage + assistantMessage
     };

     return { conversation, messages, sendMessage, isLoading };
   }
   ```

2. **Refactor ChatContainer** (3 hours)
   ```typescript
   // apps/web/src/components/chat/ChatContainer.tsx
   export function ChatContainer({ isOpen, onClose }: ChatContainerProps) {
     const { conversation, messages, sendMessage, isLoading } = useConversation();

     // Remove local state
     // const [messages, setMessages] = useState([...]); // DELETE

     const handleSend = async (content: string) => {
       await sendMessage(content); // Now persists to backend
     };

     return (
       // ... render messages from hook
     );
   }
   ```

3. **Add conversation list sidebar** (1 hour)
   - Show recent conversations
   - Click to load conversation
   - New conversation button

**Acceptance Criteria:**
- ✅ Chat messages persist to backend
- ✅ Conversations load on mount
- ✅ Can switch between conversations
- ✅ No data loss on refresh
- ✅ Loading states handled

**Blockers:** None
**Dependencies:** Backend API already exists

---

## Priority 2 - Medium

### M-001: Add Database Performance Indexes
**Priority:** P2 - MEDIUM
**Impact:** Query performance at scale
**Effort:** 3 hours
**Owner:** VAULT (Database)

**Missing Indexes:**
- Invoice.dueDate
- Transaction.date
- Bill.status
- Expense.date

**Tasks:**

1. **Create migration** (1 hour)
   ```prisma
   // packages/database/prisma/migrations/.../migration.sql
   -- Add index for invoice due date queries
   CREATE INDEX "Invoice_organizationId_dueDate_idx" ON "Invoice"("organizationId", "dueDate");

   -- Add index for transaction date range queries
   CREATE INDEX "Transaction_organizationId_date_idx" ON "Transaction"("organizationId", "date");

   -- Add index for bill status filtering
   CREATE INDEX "Bill_organizationId_status_idx" ON "Bill"("organizationId", "status");

   -- Add index for expense date reporting
   CREATE INDEX "Expense_organizationId_date_idx" ON "Expense"("organizationId", "date");
   ```

2. **Update schema.prisma** (30 min)
   ```prisma
   model Invoice {
     // ...
     @@index([organizationId, dueDate])
   }

   model Transaction {
     // ...
     @@index([organizationId, date])
   }

   model Bill {
     // ...
     @@index([organizationId, status])
   }

   model Expense {
     // ...
     @@index([organizationId, date])
   }
   ```

3. **Test migration** (30 min)
   ```bash
   npx prisma migrate dev --name add_performance_indexes
   npx prisma migrate deploy # Production
   ```

4. **Verify index usage** (1 hour)
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM "Invoice"
   WHERE "organizationId" = '...'
   AND "dueDate" < NOW()
   ORDER BY "dueDate" ASC;
   -- Should use index
   ```

**Acceptance Criteria:**
- ✅ 4 new indexes created
- ✅ Migration tested on dev database
- ✅ `EXPLAIN ANALYZE` confirms index usage
- ✅ No performance regression
- ✅ Migration ready for production

**Blockers:** None
**Dependencies:** None

---

### M-002: Complete Frontend Quick Actions
**Priority:** P2 - MEDIUM
**Impact:** UX - incomplete features in chat
**Effort:** 8 hours
**Owner:** PRISM (Frontend)

**Missing Implementations:**
- Document viewer (TODO)
- Export functionality (TODO)
- Bookmark feature (TODO)

**Tasks:**

1. **Document Viewer** (4 hours)
   ```typescript
   // Reuse existing DocumentModal component
   const handleDocumentView = (documentId: string) => {
     setDocumentToView(documentId);
     setIsDocumentModalOpen(true);
   };

   return (
     <>
       {/* Chat UI */}
       <DocumentModal
         isOpen={isDocumentModalOpen}
         onClose={() => setIsDocumentModalOpen(false)}
         documentId={documentToView}
       />
     </>
   );
   ```

2. **Export Functionality** (2 hours)
   ```typescript
   const handleExport = async (entityType: string, entityId: string) => {
     const response = await fetch(`/api/v1/reports/export/${entityType}/${entityId}`, {
       method: 'POST',
       body: JSON.stringify({ format: 'PDF' }),
     });

     const blob = await response.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${entityType}-${entityId}.pdf`;
     a.click();
   };
   ```

3. **Bookmark Feature** (2 hours)
   ```typescript
   const { bookmarks, addBookmark, removeBookmark } = useBookmarks();

   const handleBookmark = async (message: ChatMessage) => {
     if (bookmarks.includes(message.id)) {
       await removeBookmark(message.id);
     } else {
       await addBookmark(message.id);
     }
   };
   ```

**Acceptance Criteria:**
- ✅ Document viewer opens for document actions
- ✅ Export downloads PDF/CSV
- ✅ Bookmark saves message reference
- ✅ Bookmark list accessible from UI
- ✅ All quick actions functional

**Blockers:** None
**Dependencies:** Backend export API exists

---

### M-003: Add Action Confirmation Dialogs
**Priority:** P2 - MEDIUM
**Impact:** Prevent accidental high-stakes actions
**Effort:** 4 hours
**Owner:** PRISM (Frontend)

**High-Stakes Actions:**
- Send invoice
- Approve expense
- Create payment
- Delete client
- Archive vendor

**Tasks:**

1. **Create ConfirmationDialog component** (2 hours)
   ```typescript
   // apps/web/src/components/ui/ConfirmationDialog.tsx
   export function ConfirmationDialog({
     isOpen,
     onClose,
     onConfirm,
     title,
     description,
     confirmText = 'Confirm',
     cancelText = 'Cancel',
     variant = 'default', // 'default' | 'danger'
   }: ConfirmationDialogProps) {
     return (
       <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{title}</DialogTitle>
             <DialogDescription>{description}</DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={onClose}>
               {cancelText}
             </Button>
             <Button
               variant={variant === 'danger' ? 'destructive' : 'default'}
               onClick={() => {
                 onConfirm();
                 onClose();
               }}
             >
               {confirmText}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. **Wire confirmations into chat actions** (2 hours)
   ```typescript
   const handleSendInvoice = (invoice: Invoice) => {
     setConfirmation({
       title: 'Send Invoice',
       description: `Send Invoice #${invoice.number} to ${invoice.client.email}?`,
       onConfirm: () => executeSendInvoice(invoice.id),
     });
     setIsConfirmationOpen(true);
   };
   ```

**Acceptance Criteria:**
- ✅ ConfirmationDialog component created
- ✅ High-stakes actions require confirmation
- ✅ Danger actions use destructive styling
- ✅ Can cancel without executing
- ✅ Confirmation messages clear and specific

**Blockers:** None
**Dependencies:** None

---

### M-004: Daily Morning Briefing (Proactive Suggestions)
**Priority:** P2 - MEDIUM
**Impact:** Proactive automation value proposition
**Effort:** 14 hours
**Owner:** ORACLE (AI/ML) + BRIDGE (Cron)

**Goal:**
Generate overnight insights and present as morning briefing

**Tasks:**

1. **Create MorningBriefingService** (4 hours)
   ```typescript
   // apps/api/src/modules/chatbot/suggestions/morning-briefing.service.ts
   @Injectable()
   export class MorningBriefingService {
     async generateBriefing(orgId: string): Promise<MorningBriefing> {
       const [overdueInvoices, newTransactions, upcomingDeadlines] = await Promise.all([
         this.getOverdueInvoices(orgId),
         this.getNewTransactions(orgId),
         this.getUpcomingDeadlines(orgId),
       ]);

       return {
         greeting: this.getGreeting(),
         insights: [
           { type: 'OVERDUE_INVOICES', count: overdueInvoices.length, items: overdueInvoices },
           { type: 'NEW_TRANSACTIONS', count: newTransactions.length, items: newTransactions },
           { type: 'UPCOMING_DEADLINES', count: upcomingDeadlines.length, items: upcomingDeadlines },
         ],
         suggestedActions: this.generateActions(overdueInvoices, newTransactions, upcomingDeadlines),
       };
     }
   }
   ```

2. **Create BullMQ job** (3 hours)
   ```typescript
   // apps/workers/src/jobs/morning-briefing.processor.ts
   @Processor('morning-briefing')
   export class MorningBriefingProcessor {
     @Process('generate')
     async generateBriefings(job: Job) {
       const orgs = await this.prisma.organisation.findMany({
         where: { subscriptionTier: { not: 'free' } }, // Only paid users
       });

       for (const org of orgs) {
         const briefing = await this.morningBriefingService.generateBriefing(org.id);
         await this.notificationService.sendMorningBriefing(org.id, briefing);
       }
     }
   }
   ```

3. **Schedule cron job** (1 hour)
   ```typescript
   // Schedule daily at 8am local time
   @Cron('0 8 * * *')
   async scheduleMorningBriefings() {
     await this.morningBriefingQueue.add('generate', {}, {
       repeat: { cron: '0 8 * * *' }
     });
   }
   ```

4. **Frontend briefing panel** (6 hours)
   - Show briefing on dashboard
   - Expand/collapse sections
   - Quick action buttons
   - "Approve all" bulk action

**Acceptance Criteria:**
- ✅ Briefing generated daily at 8am
- ✅ Includes overdue invoices, new transactions, deadlines
- ✅ Suggested actions generated
- ✅ Frontend panel displays briefing
- ✅ Can execute actions from briefing

**Blockers:** None
**Dependencies:** H-004 (bulk operations)

---

## Priority 3 - Low

### L-001: Clean Up Historical Artifacts
**Priority:** P3 - LOW
**Impact:** Code cleanliness
**Effort:** 1 hour
**Owner:** FLUX (DevOps)

**Tasks:**

1. **Remove deleted animation files from git** (15 min)
   ```bash
   git rm -r apps/web/src/components/animation
   git rm -r apps/web/src/lib/gsap
   git rm -r apps/web/src/styles/themes
   ```

2. **Remove backup files** (15 min)
   ```bash
   git rm apps/api/src/main.ts.backup
   git rm apps/api/src/modules/cache/redis.service.ts.backup
   ```

3. **Remove demo/example files** (15 min)
   ```bash
   find apps/web/src -name "*.example.tsx" -delete
   find apps/web/src -name "*.demo.tsx" -delete
   ```

4. **Commit cleanup** (15 min)
   ```bash
   git commit -m "chore: Remove historical artifacts and demo files"
   ```

**Acceptance Criteria:**
- ✅ No deleted files in git status
- ✅ No `.backup` files
- ✅ No `.example.tsx` or `.demo.tsx` files
- ✅ Clean git history

**Blockers:** None
**Dependencies:** None

---

### L-002: Update Documentation
**Priority:** P3 - LOW
**Impact:** Developer onboarding
**Effort:** 4 hours
**Owner:** ATLAS (Project Manager)

**Tasks:**

1. **Update README files** (2 hours)
   - `receipt-scanner/README.md` - Remove TODO notes
   - `data-tools/README.md` - Update rate limiting status
   - Root `README.md` - Update feature coverage

2. **Create API documentation** (2 hours)
   - Generate OpenAPI/Swagger docs
   - Add example requests/responses
   - Document authentication flow

**Acceptance Criteria:**
- ✅ READMEs reflect current state
- ✅ API docs generated
- ✅ Authentication flow documented
- ✅ No stale TODO markers in docs

**Blockers:** None
**Dependencies:** All other tasks (docs should reflect final state)

---

## Execution Order

### Week 1: Critical Foundation (40 hours)
**Focus:** Security, automation core

**Day 1-2 (Monday-Tuesday):**
- C-001: NPM Lockfiles (FLUX) - 1h
- C-003: JWT Secrets (SENTINEL) - 2h
- H-002: Type Safety (ORACLE + FORGE) - 16h
- **Total:** 19h

**Day 3-4 (Wednesday-Thursday):**
- C-002: Receipt Scanning (BRIDGE) - 16h
- H-003: Webhook Validation (SENTINEL) - 12h *(start)*
- **Total:** 28h *(12h carries to Week 2)*

**Day 5 (Friday):**
- H-003: Webhook Validation (SENTINEL) - complete 12h
- H-001: Email→Bill (BRIDGE) - 12h *(start)*
- **Total:** 24h *(start H-001)*

---

### Week 2: API Completion & UX (40 hours)
**Focus:** Complete automation APIs, frontend polish

**Day 6-7 (Monday-Tuesday):**
- H-001: Email→Bill (BRIDGE) - complete 12h
- H-004: Bulk Operations (FORGE) - 10h
- H-005: Chat Persistence (PRISM) - 6h
- **Total:** 28h

**Day 8-9 (Wednesday-Thursday):**
- M-001: Database Indexes (VAULT) - 3h
- M-002: Frontend Quick Actions (PRISM) - 8h
- M-003: Confirmation Dialogs (PRISM) - 4h
- **Total:** 15h

**Day 10 (Friday):**
- M-004: Morning Briefing (ORACLE + BRIDGE) - 14h *(start)*
- **Total:** 14h *(carries to Week 3)*

---

### Week 3: Proactive Features & Polish (40 hours)
**Focus:** Proactive automation, cleanup

**Day 11-12 (Monday-Tuesday):**
- M-004: Morning Briefing (ORACLE + BRIDGE) - complete 14h
- L-001: Cleanup (FLUX) - 1h
- **Total:** 15h

**Day 13-14 (Wednesday-Thursday):**
- L-002: Documentation (ATLAS) - 4h
- **Buffer for testing & bug fixes** - 16h
- **Total:** 20h

**Day 15 (Friday):**
- **Final integration testing** - 8h
- **Deploy to production** - 2h
- **Total:** 10h

---

## Agent Assignments

| Agent | Total Hours | Tasks |
|-------|------------|-------|
| **FLUX** (DevOps) | 2h | C-001 (Lockfiles), L-001 (Cleanup) |
| **SENTINEL** (Security) | 14h | C-003 (JWT), H-003 (Webhooks) |
| **BRIDGE** (Integrations) | 40h | C-002 (Receipts), H-001 (Email→Bill), M-004 (Briefing cron) |
| **ORACLE** (AI/ML) | 24h | H-002 (Type safety AI), M-004 (Briefing generation) |
| **FORGE** (Backend) | 18h | H-002 (Type safety backend), H-004 (Bulk ops) |
| **PRISM** (Frontend) | 18h | H-005 (Chat persistence), M-002 (Quick actions), M-003 (Confirmations) |
| **VAULT** (Database) | 3h | M-001 (Indexes) |
| **ATLAS** (PM) | 4h | L-002 (Documentation) |
| **Buffer** | 24h | Testing, bug fixes, deployment |
| **TOTAL** | **147h** | 20 tasks |

---

## Success Metrics

### Pre-Remediation (Current State)
- **Production Readiness:** 82%
- **Security Score:** 95% (post Sprint 1)
- **Automation Score:** 90% (post Sprint 3)
- **Type Safety:** 70% (many `any` types)
- **Feature Completeness:** 85%
- **UX Polish:** 80%

### Post-Remediation (Target)
- **Production Readiness:** 95%+ ⬆️
- **Security Score:** 98% ⬆️
- **Automation Score:** 95% ⬆️
- **Type Safety:** 95% ⬆️
- **Feature Completeness:** 95% ⬆️
- **UX Polish:** 92% ⬆️

### Key Metrics
- ✅ 0 critical vulnerabilities
- ✅ 0 hardcoded secrets
- ✅ 100% webhook signature validation
- ✅ 0 `any` types in AI services
- ✅ All advertised features functional
- ✅ Chat conversations persist
- ✅ Morning briefing generates daily
- ✅ < 500ms p95 API response time

---

## Risk Mitigation

### High Risks

**R-001: Receipt Scanning Complexity**
- **Risk:** Mindee integration more complex than expected
- **Mitigation:** Allocate 16h + 8h buffer, spike investigation if needed
- **Fallback:** Use simpler OCR library (Tesseract.js)

**R-002: Type Safety Migration**
- **Risk:** Breaking changes when removing `any` types
- **Mitigation:** Do incrementally, test each service
- **Fallback:** Keep `any` types with `@ts-expect-error` comments

**R-003: Database Migration Downtime**
- **Risk:** Index creation locks tables
- **Mitigation:** Use `CREATE INDEX CONCURRENTLY` (PostgreSQL)
- **Fallback:** Create indexes during low-traffic window

### Medium Risks

**R-004: Morning Briefing Performance**
- **Risk:** Generating briefings for all orgs takes too long
- **Mitigation:** Process in batches, parallelize
- **Fallback:** Only generate for active orgs (last login < 7 days)

---

## Dependencies Graph

```
C-001 (Lockfiles) ─────────┐
                           ├──> C-002 (Receipts)
                           │
C-003 (JWT) ──────────────┤
                           │
H-002 (Types) ────────────┤
                           ├──> H-001 (Email→Bill)
H-003 (Webhooks) ─────────┤
                           │
H-004 (Bulk Ops) ─────────┼──> M-004 (Briefing)
                           │
H-005 (Chat Persist) ─────┤
                           │
M-001 (Indexes) ──────────┤
                           │
M-002 (Quick Actions) ────┤
                           ├──> L-002 (Docs)
M-003 (Confirmations) ────┤
                           │
L-001 (Cleanup) ──────────┘
```

---

## Approval & Sign-Off

**Reviewed by:** ATLAS (Project Manager)
**Date:** 2025-12-08
**Approved for Execution:** ✅

**Next Steps:**
1. Review this plan with stakeholders
2. Assign agents to tasks
3. Create GitHub issues/tickets for tracking
4. Launch Week 1 execution (Monday)

---

**Total Timeline:** 3 weeks (15 business days)
**Total Effort:** 147 hours (includes 24h buffer)
**Target Outcome:** 95% Production-Ready Operate Platform
