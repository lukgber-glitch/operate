# Sprint 3: Email Intelligence

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: Turn email inbox into automated CRM + document processor
**Duration**: Week 5-6
**Depends On**: Sprint 2 completion

---

## VISION

Transform the email sync from "extract invoices" to "understand all business communications":

```
📧 Every Email → Analyzed → Customer/Vendor Profile Updated → Smart Suggestions Generated
```

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - Foundation]
├── TASK-S3-01: Email Classifier Service (ORACLE)
└── TASK-S3-02: Entity Extractor Service (ORACLE)

[PARALLEL GROUP 2 - Profile Builders]
├── TASK-S3-03: Customer Auto-Creator (BRIDGE)
└── TASK-S3-04: Vendor Auto-Creator (BRIDGE)

[PARALLEL GROUP 3 - Intelligence Layer]
├── TASK-S3-05: Relationship Tracker (ORACLE)
└── TASK-S3-06: Email-Based Suggestions (ORACLE)

[FINAL]
└── TASK-S3-07: Email Intelligence Dashboard (PRISM)
```

---

## TASK-S3-01: Email Classifier Service

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: High
**Dependencies**: None

### Context
Currently emails are only checked for invoice attachments. We need to classify the EMAIL ITSELF to understand business context.

### Objective
Create a service that classifies each email into business-relevant categories.

### Classification Categories

```typescript
enum EmailClassification {
  // Financial
  INVOICE_RECEIVED = 'INVOICE_RECEIVED',     // Vendor sent us an invoice
  INVOICE_SENT = 'INVOICE_SENT',             // We sent an invoice (from sent folder)
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',     // Customer paid us
  PAYMENT_SENT = 'PAYMENT_SENT',             // We paid vendor
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',     // Payment reminder (in or out)

  // Sales
  QUOTE_REQUEST = 'QUOTE_REQUEST',           // Customer asking for quote
  QUOTE_SENT = 'QUOTE_SENT',                 // We sent a quote
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION', // Order confirmed

  // Customer Service
  CUSTOMER_INQUIRY = 'CUSTOMER_INQUIRY',     // General question
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',       // Help needed
  COMPLAINT = 'COMPLAINT',                   // Unhappy customer
  FEEDBACK = 'FEEDBACK',                     // Customer feedback

  // Administrative
  CONTRACT = 'CONTRACT',                     // Contract related
  LEGAL = 'LEGAL',                          // Legal matters
  TAX_DOCUMENT = 'TAX_DOCUMENT',            // Tax related

  // Low Priority
  NEWSLETTER = 'NEWSLETTER',                 // Marketing emails
  NOTIFICATION = 'NOTIFICATION',             // Automated notifications
  SPAM = 'SPAM',                            // Spam/irrelevant

  // Catch-all
  BUSINESS_GENERAL = 'BUSINESS_GENERAL',     // General business
  PERSONAL = 'PERSONAL',                     // Not business related
  UNKNOWN = 'UNKNOWN'                        // Couldn't classify
}
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/email-classifier.service.ts`
```typescript
@Injectable()
export class EmailClassifierService {
  async classifyEmail(email: {
    subject: string;
    body: string;
    from: string;
    to: string;
    hasAttachments: boolean;
    attachmentTypes?: string[];
  }): Promise<{
    classification: EmailClassification;
    confidence: number;
    reasoning: string;
    extractedIntent?: string;
    suggestedAction?: string;
  }>;

  async classifyBatch(emails: Email[]): Promise<ClassificationResult[]>;
}
```

2. `apps/api/src/modules/ai/email-intelligence/email-intelligence.module.ts`

3. `apps/api/src/modules/ai/email-intelligence/types/email-classification.types.ts`

### Technical Requirements
- Use Claude/GPT for classification (existing AI service)
- Batch processing for efficiency
- Cache results in database
- Confidence threshold: 0.7 for auto-actions
- Store classification in EmailMessage table

### Acceptance Criteria
- [ ] All email types classified correctly
- [ ] Confidence scores provided
- [ ] Classifications stored in database
- [ ] Batch processing works efficiently
- [ ] Low-confidence flags for review

---

## TASK-S3-02: Entity Extractor Service

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: High
**Dependencies**: None

### Context
Emails contain valuable entity information that should be extracted automatically.

### Objective
Extract business entities from email content.

### Entities to Extract

```typescript
interface ExtractedEntities {
  // People & Organizations
  companies: Array<{
    name: string;
    confidence: number;
    role: 'CUSTOMER' | 'VENDOR' | 'PARTNER' | 'UNKNOWN';
  }>;

  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;  // "CEO", "Billing", etc.
    company?: string;
  }>;

  // Financial
  amounts: Array<{
    value: number;
    currency: string;
    context: string;  // "invoice total", "payment", "quote"
  }>;

  invoiceNumbers: string[];

  // Dates
  dates: Array<{
    date: Date;
    context: string;  // "due date", "meeting", "deadline"
  }>;

  // References
  projectNames: string[];
  orderNumbers: string[];
  trackingNumbers: string[];

  // Location
  addresses: Array<{
    full: string;
    city?: string;
    country?: string;
  }>;
}
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/entity-extractor.service.ts`
```typescript
@Injectable()
export class EntityExtractorService {
  async extractEntities(email: {
    subject: string;
    body: string;
    from: string;
    to: string;
  }): Promise<ExtractedEntities>;

  async extractFromSignature(emailBody: string): Promise<ContactInfo>;
}
```

2. `apps/api/src/modules/ai/email-intelligence/types/extracted-entities.types.ts`

### Technical Requirements
- Use Claude/GPT for extraction
- Parse email signatures for contact info
- Handle multiple languages (DE, EN)
- Extract from both subject and body
- Normalize company names (remove GmbH, Inc variations)

### Acceptance Criteria
- [ ] Companies extracted and role identified
- [ ] Contact info extracted from signatures
- [ ] Amounts with currency detected
- [ ] Dates with context extracted
- [ ] Invoice/order numbers found

---

## TASK-S3-03: Customer Auto-Creator

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: S3-01, S3-02

### Context
When we detect a customer from email, automatically create/update their profile.

### Objective
Create customers automatically from email patterns and extracted entities.

### Customer Detection Rules

```
Email FROM unknown sender + Classification = QUOTE_REQUEST
  → Create Customer (status: LEAD)

Email TO recipient + Classification = INVOICE_SENT
  → Create/Update Customer (status: ACTIVE)

Email FROM sender + Classification = PAYMENT_RECEIVED
  → Update Customer (mark as paying customer)

Multiple emails from same domain
  → Group as single Customer with multiple contacts
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/customer-auto-creator.service.ts`
```typescript
@Injectable()
export class CustomerAutoCreatorService {
  async processEmail(
    email: EmailMessage,
    classification: EmailClassification,
    entities: ExtractedEntities
  ): Promise<{
    customer?: Customer;
    action: 'CREATED' | 'UPDATED' | 'MATCHED' | 'SKIPPED';
    changes?: string[];
  }>;

  async matchToExistingCustomer(
    companyName: string,
    email: string,
    orgId: string
  ): Promise<Customer | null>;

  async createFromEmail(
    entities: ExtractedEntities,
    classification: EmailClassification,
    orgId: string
  ): Promise<Customer>;
}
```

2. `apps/api/src/modules/ai/email-intelligence/matchers/customer-matcher.service.ts`

### Technical Requirements
- Fuzzy match company names (Acme Corp ≈ Acme Corporation)
- Match by email domain (john@acme.com → Acme)
- Don't create duplicates
- Track source: EMAIL_AUTO_CREATED
- Store email history link

### Acceptance Criteria
- [ ] New customers created from quote requests
- [ ] Existing customers matched and updated
- [ ] Contact info added from signatures
- [ ] No duplicate customers created
- [ ] Source tracking works

---

## TASK-S3-04: Vendor Auto-Creator

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: S3-01, S3-02

### Context
When we receive an invoice/bill from a vendor, automatically create/update their profile.

### Objective
Create vendors automatically from incoming invoices and payment communications.

### Vendor Detection Rules

```
Email FROM sender + Classification = INVOICE_RECEIVED
  → Create Vendor + Create Bill

Email FROM sender + Attachment = Invoice PDF
  → Create Vendor from extracted invoice data

Email TO recipient + Classification = PAYMENT_SENT
  → Update Vendor payment history

Regular emails from same @company.com domain with invoices
  → Establish as recurring vendor
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/vendor-auto-creator.service.ts`
```typescript
@Injectable()
export class VendorAutoCreatorService {
  async processEmail(
    email: EmailMessage,
    classification: EmailClassification,
    entities: ExtractedEntities,
    extractedInvoice?: ExtractedInvoice
  ): Promise<{
    vendor?: Vendor;
    bill?: Bill;
    action: 'CREATED' | 'UPDATED' | 'MATCHED' | 'SKIPPED';
  }>;

  async createVendorFromInvoice(
    extractedInvoice: ExtractedInvoice,
    email: EmailMessage,
    orgId: string
  ): Promise<Vendor>;
}
```

### Technical Requirements
- Extract vendor details from invoice
- Match by VAT/Tax ID if available
- Set default payment terms
- Link vendor to source email
- Auto-create bill when invoice detected

### Acceptance Criteria
- [ ] Vendors created from received invoices
- [ ] Bills auto-created and linked
- [ ] Tax ID matching works
- [ ] No duplicate vendors
- [ ] Payment terms set from invoice

---

## TASK-S3-05: Relationship Tracker

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S3-03, S3-04

### Context
Track the health of customer/vendor relationships based on email patterns.

### Objective
Calculate relationship health scores and detect engagement patterns.

### Metrics to Track

```typescript
interface RelationshipMetrics {
  // Communication
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  avgResponseTime: number;  // hours
  lastContactDate: Date;
  daysSinceLastContact: number;

  // Engagement
  communicationFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPORADIC' | 'DORMANT';
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';

  // Financial (for customers)
  totalInvoiced?: number;
  totalPaid?: number;
  avgPaymentDays?: number;
  paymentBehavior?: 'EARLY' | 'ON_TIME' | 'LATE' | 'VERY_LATE';

  // Health Score
  healthScore: number;  // 0-100
  healthStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'AT_RISK' | 'DORMANT';

  // Alerts
  alerts: Array<{
    type: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/relationship-tracker.service.ts`
```typescript
@Injectable()
export class RelationshipTrackerService {
  async updateRelationshipMetrics(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR',
    email: EmailMessage
  ): Promise<RelationshipMetrics>;

  async calculateHealthScore(
    entityId: string,
    entityType: 'CUSTOMER' | 'VENDOR'
  ): Promise<number>;

  async getAtRiskRelationships(orgId: string): Promise<Array<{
    entity: Customer | Vendor;
    metrics: RelationshipMetrics;
    suggestedAction: string;
  }>>;
}
```

2. Add to Prisma schema:
```prisma
model RelationshipMetrics {
  id              String   @id @default(cuid())
  entityId        String
  entityType      String   // CUSTOMER or VENDOR
  organisationId  String

  // Metrics stored as JSON for flexibility
  metrics         Json
  healthScore     Int
  lastUpdated     DateTime @updatedAt

  @@unique([entityId, entityType])
  @@index([organisationId])
  @@index([healthScore])
}
```

### Technical Requirements
- Update metrics on each email processed
- Daily health score recalculation
- Detect dormant relationships (>60 days no contact)
- Track response time patterns
- Store historical snapshots monthly

### Acceptance Criteria
- [ ] Health scores calculated correctly
- [ ] Dormant relationships detected
- [ ] Payment patterns tracked (customers)
- [ ] Alerts generated for at-risk relationships
- [ ] Historical trends available

---

## TASK-S3-06: Email-Based Suggestions

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S3-05

### Context
Generate actionable suggestions based on email analysis and relationship health.

### Objective
Create proactive suggestions that help users manage relationships.

### Suggestion Types

```typescript
enum EmailSuggestionType {
  // Follow-ups
  FOLLOW_UP_QUOTE = 'FOLLOW_UP_QUOTE',           // "Quote sent 5 days ago - follow up?"
  FOLLOW_UP_INVOICE = 'FOLLOW_UP_INVOICE',       // "Invoice overdue - send reminder?"
  FOLLOW_UP_INQUIRY = 'FOLLOW_UP_INQUIRY',       // "Customer asked question - respond?"

  // Re-engagement
  REENGAGE_DORMANT = 'REENGAGE_DORMANT',         // "No contact in 60 days - reach out?"
  REENGAGE_PAST_CUSTOMER = 'REENGAGE_PAST_CUSTOMER', // "They ordered 3 months ago"

  // Opportunities
  UPSELL_OPPORTUNITY = 'UPSELL_OPPORTUNITY',     // Based on purchase patterns
  NEW_CONTACT_DETECTED = 'NEW_CONTACT_DETECTED', // "New person at Acme Corp"

  // Warnings
  RELATIONSHIP_DECLINING = 'RELATIONSHIP_DECLINING', // Response times increasing
  PAYMENT_PATTERN_CHANGE = 'PAYMENT_PATTERN_CHANGE', // Started paying late

  // Actions
  CREATE_INVOICE = 'CREATE_INVOICE',             // "Work completed - create invoice?"
  CREATE_BILL = 'CREATE_BILL',                   // "Received invoice - create bill?"
  UPDATE_CONTACT = 'UPDATE_CONTACT',             // "New phone number detected"
}
```

### Files to Create

1. `apps/api/src/modules/ai/email-intelligence/email-suggestions.service.ts`
```typescript
@Injectable()
export class EmailSuggestionsService {
  async generateSuggestions(
    orgId: string
  ): Promise<EmailSuggestion[]>;

  async processEmailForSuggestions(
    email: EmailMessage,
    classification: EmailClassification,
    entities: ExtractedEntities
  ): Promise<EmailSuggestion[]>;
}
```

### Technical Requirements
- Generate suggestions in real-time as emails arrive
- Deduplicate similar suggestions
- Priority based on urgency
- Link to action (chat action or page)
- Expire old suggestions

### Acceptance Criteria
- [ ] Follow-up suggestions for unanswered emails
- [ ] Re-engagement for dormant relationships
- [ ] New contact detection works
- [ ] Suggestions link to actions
- [ ] Priority levels correct

---

## TASK-S3-07: Email Intelligence Dashboard

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S3-05, S3-06

### Context
Users need visibility into what the email intelligence is doing.

### Objective
Create a dashboard showing email-derived insights and suggestions.

### Dashboard Components

1. **Email Activity Feed**
   - Recent emails processed
   - Classifications and extracted entities
   - Actions taken (customer created, bill created, etc.)

2. **Relationship Health Overview**
   - Customers needing attention
   - Dormant relationships
   - At-risk accounts

3. **Suggestions Panel**
   - Actionable suggestions
   - One-click actions
   - Dismiss/snooze options

4. **Auto-Created Entities**
   - New customers from email
   - New vendors from invoices
   - Bills auto-created

### Files to Create

1. `apps/web/src/app/(dashboard)/intelligence/page.tsx`
2. `apps/web/src/app/(dashboard)/intelligence/email/page.tsx`
3. `apps/web/src/components/intelligence/EmailActivityFeed.tsx`
4. `apps/web/src/components/intelligence/RelationshipHealthCard.tsx`
5. `apps/web/src/components/intelligence/SuggestionsPanel.tsx`
6. `apps/web/src/components/intelligence/AutoCreatedEntities.tsx`
7. `apps/web/src/lib/api/intelligence.ts`

### Acceptance Criteria
- [ ] Email activity feed shows recent processing
- [ ] Relationship health visible at glance
- [ ] Suggestions actionable with one click
- [ ] Auto-created entities reviewable
- [ ] Mobile responsive

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel - Start Immediately)
1. **ORACLE Agent #1**: TASK-S3-01 (Email Classifier)
2. **ORACLE Agent #2**: TASK-S3-02 (Entity Extractor)

### Phase 2 (After Phase 1 Completes)
3. **BRIDGE Agent #1**: TASK-S3-03 (Customer Auto-Creator)
4. **BRIDGE Agent #2**: TASK-S3-04 (Vendor Auto-Creator)

### Phase 3 (After Phase 2 Completes)
5. **ORACLE Agent #3**: TASK-S3-05 (Relationship Tracker)
6. **ORACLE Agent #4**: TASK-S3-06 (Email-Based Suggestions)

### Phase 4 (After Phase 3 Completes)
7. **PRISM Agent**: TASK-S3-07 (Email Intelligence Dashboard)

---

## SUCCESS METRICS

When Sprint 3 is complete:

1. **Email → Customer**: Quote request email → Customer profile auto-created
2. **Email → Vendor**: Invoice received → Vendor + Bill auto-created
3. **Relationship Health**: Dashboard shows "Acme needs attention - no contact 45 days"
4. **Smart Suggestions**: "Follow up on quote sent to BigCorp 5 days ago"
5. **Contact Discovery**: "New contact found: Sarah at Acme (sarah@acme.com)"

---

## INTEGRATION POINTS

- **Email Sync Module**: `apps/api/src/modules/integrations/email-sync/`
- **Invoice Extractor**: `apps/api/src/modules/ai/extractors/invoice-extractor.service.ts`
- **Customer Module**: `apps/api/src/modules/crm/customers/`
- **Vendor Module**: `apps/api/src/modules/crm/vendors/`
- **Proactive Suggestions**: `apps/api/src/modules/chatbot/suggestions/`
