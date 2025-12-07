# Sprint 4: Document Intelligence & Search Tasks

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: "Find all invoices from Acme in 2024"
**Duration**: Week 7-8
**Depends On**: Sprint 1, 2, 3 completion

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - No Dependencies within Sprint]
├── TASK-S4-01: Unify Document Storage (BRIDGE)
└── TASK-S4-02: Create Document Entity with Lineage (VAULT)

[PARALLEL GROUP 2 - After Group 1]
├── TASK-S4-03: Build Document Search Index (ORACLE)
└── TASK-S4-04: Implement Cross-Entity Document Linking (FORGE)

[PARALLEL GROUP 3 - After Group 2]
├── TASK-S4-05: Add Document Audit Trail (FORGE)
├── TASK-S4-06: Create Document Search UI (PRISM)
└── TASK-S4-07: Wire Document Search to Chat (ORACLE)
```

---

## TASK-S4-01: Unify Document Storage

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
Current document storage is fragmented:
- Email attachments: `apps/api/src/modules/integrations/email-sync/attachment/attachment-storage.service.ts`
- Invoice PDFs: Generated but stored inconsistently
- Receipts: Expense module storage

Need unified storage with consistent paths and URLs.

### Objective
Create unified document storage service that all modules use.

### Files to Create
1. `apps/api/src/modules/documents/storage/document-storage.service.ts`
```typescript
@Injectable()
export class DocumentStorageService {
  private readonly storageBackend: 'LOCAL' | 'S3';
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storageBackend = configService.get('DOCUMENT_STORAGE_BACKEND', 'LOCAL');
    this.basePath = configService.get('DOCUMENT_STORAGE_PATH', './storage/documents');
  }

  /**
   * Store document with consistent path structure
   * Path format: /{orgId}/{year}/{month}/{entityType}/{entityId}/{filename}
   */
  async store(params: StoreDocumentParams): Promise<StoredDocument> {
    const { orgId, entityType, entityId, file, filename, mimeType } = params;

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const storagePath = `${orgId}/${year}/${month}/${entityType}/${entityId}`;
    const fullPath = `${this.basePath}/${storagePath}/${filename}`;

    if (this.storageBackend === 'S3') {
      return this.storeToS3(storagePath, filename, file, mimeType);
    } else {
      return this.storeToLocal(fullPath, file, mimeType);
    }
  }

  async retrieve(path: string): Promise<Buffer> {
    if (this.storageBackend === 'S3') {
      return this.retrieveFromS3(path);
    } else {
      return this.retrieveFromLocal(path);
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    if (this.storageBackend === 'S3') {
      return this.getS3SignedUrl(path, expiresIn);
    } else {
      return `/api/documents/download?path=${encodeURIComponent(path)}`;
    }
  }

  async delete(path: string): Promise<void> {
    // Soft delete - move to archive folder
    // Keep for compliance (7 years for tax documents)
  }

  private async storeToS3(...) { /* S3 implementation */ }
  private async storeToLocal(...) { /* Local implementation */ }
  private async retrieveFromS3(...) { /* S3 implementation */ }
  private async retrieveFromLocal(...) { /* Local implementation */ }
}
```

2. `apps/api/src/modules/documents/storage/document-storage.module.ts`

3. Update existing storage services to use unified storage:
   - `apps/api/src/modules/integrations/email-sync/attachment/attachment-storage.service.ts`
   - Invoice PDF generation
   - Receipt storage

### Technical Requirements
- Support both LOCAL and S3 backends
- Consistent path structure: `{orgId}/{year}/{month}/{entityType}/{entityId}/{filename}`
- Signed URLs for secure access
- Retention policies (no hard delete for tax documents)
- Migrate existing files to new structure

### Acceptance Criteria
- [ ] Unified storage service created
- [ ] Local storage works with new paths
- [ ] S3 storage works with new paths
- [ ] Signed URL generation
- [ ] Existing services updated to use unified storage

---

## TASK-S4-02: Create Document Entity with Lineage

**Agent**: VAULT (Database Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: None

### Context
Documents exist in various tables (EmailAttachment, InvoiceFile, etc.) but there's no unified Document entity that tracks lineage (email → attachment → invoice → expense).

### Objective
Create Document entity that tracks document lifecycle and relationships.

### Files to Create/Modify
1. Add to `packages/database/prisma/schema.prisma`:
```prisma
model Document {
  id              String         @id @default(cuid())
  organisationId  String

  // File info
  filename        String
  mimeType        String
  size            Int            // bytes
  storagePath     String         @unique
  checksum        String?        // MD5/SHA256 for deduplication

  // Classification
  documentType    DocumentType
  category        String?
  tags            String[]       @default([])

  // AI extraction
  extractedText   String?        // OCR/extracted text for search
  extractedData   Json?          // Structured data from extraction
  extractionStatus ExtractionStatus @default(PENDING)

  // Source tracking (where did this document come from)
  sourceType      DocumentSourceType
  sourceId        String?        // ID in source system

  // Lineage (chain of derived documents)
  parentDocumentId String?
  parentDocument   Document?     @relation("DocumentLineage", fields: [parentDocumentId], references: [id])
  childDocuments   Document[]    @relation("DocumentLineage")

  // Linked entities (what business objects reference this document)
  linkedEntities   DocumentEntityLink[]

  // Audit
  uploadedBy      String?
  uploadedAt      DateTime       @default(now())
  lastAccessedAt  DateTime?
  accessCount     Int            @default(0)

  // Retention
  retentionPolicy RetentionPolicy @default(STANDARD)
  retentionUntil  DateTime?
  deletedAt       DateTime?

  // Relations
  organisation    Organisation   @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  auditLogs       DocumentAuditLog[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([organisationId])
  @@index([documentType])
  @@index([sourceType, sourceId])
  @@index([checksum])
}

enum DocumentType {
  INVOICE_SENT      // Invoice we sent
  INVOICE_RECEIVED  // Invoice we received (bill)
  RECEIPT
  CONTRACT
  TAX_DOCUMENT
  BANK_STATEMENT
  REPORT
  CORRESPONDENCE
  OTHER
}

enum DocumentSourceType {
  EMAIL_ATTACHMENT
  MANUAL_UPLOAD
  GENERATED        // System generated (invoice PDF)
  API_IMPORT
  SCAN
}

enum ExtractionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  NOT_APPLICABLE
}

enum RetentionPolicy {
  STANDARD         // 7 years (tax compliance)
  EXTENDED         // 10 years (contracts)
  PERMANENT        // Never delete
  SHORT_TERM       // 1 year (temporary docs)
}

model DocumentEntityLink {
  id           String     @id @default(cuid())
  documentId   String
  entityType   String     // 'INVOICE', 'EXPENSE', 'BILL', 'CUSTOMER', etc.
  entityId     String
  linkType     String     // 'PRIMARY', 'SUPPORTING', 'RELATED'

  document     Document   @relation(fields: [documentId], references: [id], onDelete: Cascade)

  createdAt    DateTime   @default(now())

  @@unique([documentId, entityType, entityId])
  @@index([entityType, entityId])
}

model DocumentAuditLog {
  id           String     @id @default(cuid())
  documentId   String
  action       String     // 'VIEWED', 'DOWNLOADED', 'MODIFIED', 'SHARED'
  userId       String?
  ipAddress    String?
  userAgent    String?
  details      Json?

  document     Document   @relation(fields: [documentId], references: [id], onDelete: Cascade)

  timestamp    DateTime   @default(now())

  @@index([documentId])
  @@index([timestamp])
}
```

### Technical Requirements
- Document lineage: parent → child relationships
- Entity linking: document ↔ invoice/expense/bill/etc.
- Full text search support (extractedText)
- Deduplication via checksum
- Audit logging for compliance
- Retention policies for tax documents

### Acceptance Criteria
- [ ] Document model created
- [ ] DocumentEntityLink for cross-references
- [ ] DocumentAuditLog for access tracking
- [ ] Lineage tracking (parent/child)
- [ ] Migration runs successfully

---

## TASK-S4-03: Build Document Search Index

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: High
**Dependencies**: S4-01, S4-02

### Context
With unified Document entity, we need full-text search across all documents.

### Objective
Create search service that indexes documents and enables natural language queries.

### Files to Create
1. `apps/api/src/modules/documents/search/document-search.service.ts`
```typescript
@Injectable()
export class DocumentSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Search documents using natural language query
   */
  async search(params: DocumentSearchParams): Promise<DocumentSearchResult> {
    const { orgId, query, filters, page, limit } = params;

    // Parse natural language query
    const parsedQuery = await this.parseQuery(query);

    // Build database query
    const where: Prisma.DocumentWhereInput = {
      organisationId: orgId,
      deletedAt: null,
      ...this.buildFilters(parsedQuery, filters),
    };

    // Execute search
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          linkedEntities: true,
        },
        orderBy: this.getOrderBy(parsedQuery),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    // Rank and highlight results
    const rankedResults = await this.rankResults(documents, query);

    return {
      documents: rankedResults,
      total,
      page,
      limit,
      query: parsedQuery,
    };
  }

  /**
   * Parse natural language query into structured search params
   * Examples:
   * - "invoices from Acme 2024" → { entityName: 'Acme', year: 2024, type: 'INVOICE' }
   * - "tax deductible receipts over $500" → { taxDeductible: true, minAmount: 500, type: 'RECEIPT' }
   */
  private async parseQuery(query: string): Promise<ParsedQuery> {
    const prompt = `Parse this document search query into structured parameters:
Query: "${query}"

Extract:
- documentType: INVOICE_SENT, INVOICE_RECEIVED, RECEIPT, CONTRACT, TAX_DOCUMENT, etc.
- entityName: customer/vendor name mentioned
- dateRange: year, month, or specific dates
- amountRange: min/max amounts
- keywords: other search terms

Return JSON.`;

    const result = await this.aiService.chat(prompt);
    return JSON.parse(result);
  }

  /**
   * Full-text search in extracted text
   */
  async fullTextSearch(orgId: string, searchTerms: string[]): Promise<Document[]> {
    // PostgreSQL full-text search on extractedText
    return this.prisma.$queryRaw`
      SELECT * FROM "Document"
      WHERE "organisationId" = ${orgId}
      AND "extractedText" @@ plainto_tsquery('english', ${searchTerms.join(' ')})
      ORDER BY ts_rank("extractedText", plainto_tsquery('english', ${searchTerms.join(' ')})) DESC
      LIMIT 50
    `;
  }

  /**
   * Index document text for search
   */
  async indexDocument(documentId: string): Promise<void> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId }
    });

    if (doc.extractionStatus !== 'COMPLETED') {
      // Trigger text extraction
      await this.extractText(doc);
    }

    // Update search index (if using external search like Elasticsearch)
    // For now, PostgreSQL full-text search uses extractedText field
  }
}
```

2. `apps/api/src/modules/documents/search/text-extractor.service.ts`
   - OCR for images/PDFs
   - Text extraction for office documents
   - Use existing GPT-4 Vision for complex documents

3. `apps/api/src/modules/documents/search/document-search.controller.ts`
   - `GET /documents/search?q=...`
   - `GET /documents/search/suggestions` - autocomplete

### Technical Requirements
- Natural language query parsing
- PostgreSQL full-text search
- OCR for images and scanned PDFs
- Result ranking by relevance
- Search suggestions/autocomplete
- Filter by document type, date range, entity

### Acceptance Criteria
- [ ] Natural language search works
- [ ] "Invoices from Acme 2024" returns correct results
- [ ] Full-text search in document content
- [ ] Filters by type, date, amount
- [ ] Pagination and result count

---

## TASK-S4-04: Implement Cross-Entity Document Linking

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-02

### Context
Documents should be linked to business entities (Invoice, Expense, Bill, Customer, Vendor) for navigation and audit trails.

### Objective
Create service to manage document-entity links and auto-link when documents are created.

### Files to Create
1. `apps/api/src/modules/documents/linking/document-linking.service.ts`
```typescript
@Injectable()
export class DocumentLinkingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Link document to an entity
   */
  async link(params: LinkDocumentParams): Promise<DocumentEntityLink> {
    return this.prisma.documentEntityLink.create({
      data: {
        documentId: params.documentId,
        entityType: params.entityType,
        entityId: params.entityId,
        linkType: params.linkType || 'PRIMARY',
      }
    });
  }

  /**
   * Get all documents for an entity
   */
  async getDocumentsForEntity(entityType: string, entityId: string): Promise<Document[]> {
    const links = await this.prisma.documentEntityLink.findMany({
      where: { entityType, entityId },
      include: { document: true }
    });
    return links.map(l => l.document);
  }

  /**
   * Get all entities linked to a document
   */
  async getLinkedEntities(documentId: string): Promise<LinkedEntity[]> {
    const links = await this.prisma.documentEntityLink.findMany({
      where: { documentId }
    });

    return Promise.all(links.map(async (link) => {
      const entity = await this.resolveEntity(link.entityType, link.entityId);
      return {
        ...link,
        entity,
      };
    }));
  }

  /**
   * Auto-link document based on extraction results
   */
  async autoLink(document: Document): Promise<void> {
    if (!document.extractedData) return;

    const data = document.extractedData as any;

    // If has invoice number, try to link to invoice
    if (data.invoiceNumber) {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          organisationId: document.organisationId,
          invoiceNumber: data.invoiceNumber,
        }
      });
      if (invoice) {
        await this.link({
          documentId: document.id,
          entityType: 'INVOICE',
          entityId: invoice.id,
          linkType: 'PRIMARY',
        });
      }
    }

    // If has customer/vendor name, link to customer/vendor
    if (data.vendorName) {
      const vendor = await this.prisma.vendor.findFirst({
        where: {
          organisationId: document.organisationId,
          name: { contains: data.vendorName, mode: 'insensitive' },
        }
      });
      if (vendor) {
        await this.link({
          documentId: document.id,
          entityType: 'VENDOR',
          entityId: vendor.id,
          linkType: 'RELATED',
        });
      }
    }
  }

  private async resolveEntity(type: string, id: string): Promise<any> {
    switch (type) {
      case 'INVOICE': return this.prisma.invoice.findUnique({ where: { id } });
      case 'EXPENSE': return this.prisma.expense.findUnique({ where: { id } });
      case 'BILL': return this.prisma.bill.findUnique({ where: { id } });
      case 'CUSTOMER': return this.prisma.customer.findUnique({ where: { id } });
      case 'VENDOR': return this.prisma.vendor.findUnique({ where: { id } });
      default: return null;
    }
  }
}
```

2. Update existing services to create Document records:
   - Invoice service → create Document when PDF generated
   - Email attachment processor → create Document when attachment saved
   - Expense service → create Document when receipt uploaded

### Technical Requirements
- Bidirectional linking (document ↔ entity)
- Multiple links per document (invoice + customer)
- Link types (PRIMARY, SUPPORTING, RELATED)
- Auto-link based on extracted data
- Resolve entity details for display

### Acceptance Criteria
- [ ] Link document to invoice/expense/bill/customer/vendor
- [ ] Get all documents for an entity
- [ ] Get all entities for a document
- [ ] Auto-link from extraction results
- [ ] Support multiple link types

---

## TASK-S4-05: Add Document Audit Trail

**Agent**: FORGE (Backend Specialist)
**Priority**: P2
**Estimated Complexity**: Low
**Dependencies**: S4-02

### Context
For compliance (GoBD, tax audits), need to track who accessed/modified documents.

### Objective
Create audit logging for all document operations.

### Files to Create
1. `apps/api/src/modules/documents/audit/document-audit.service.ts`
```typescript
@Injectable()
export class DocumentAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.documentAuditLog.create({
      data: {
        documentId: params.documentId,
        action: params.action,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details,
      }
    });

    // Update last accessed
    if (params.action === 'VIEWED' || params.action === 'DOWNLOADED') {
      await this.prisma.document.update({
        where: { id: params.documentId },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 },
        }
      });
    }
  }

  async getHistory(documentId: string): Promise<DocumentAuditLog[]> {
    return this.prisma.documentAuditLog.findMany({
      where: { documentId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getActivityReport(orgId: string, dateRange: DateRange): Promise<AuditReport> {
    // Generate audit report for compliance
  }
}
```

2. `apps/api/src/modules/documents/audit/document-audit.interceptor.ts`
   - NestJS interceptor to auto-log document access

### Technical Requirements
- Log all document operations: view, download, modify, share, delete
- Capture user, IP, timestamp
- Generate compliance reports
- Retention for audit period (10 years)

### Acceptance Criteria
- [ ] All document views logged
- [ ] All downloads logged
- [ ] Modifications logged with details
- [ ] Audit history viewable
- [ ] Compliance report generation

---

## TASK-S4-06: Create Document Search UI

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-03

### Context
Backend has document search API, frontend needs UI.

### Objective
Create document browser with search, filters, and preview.

### Files to Create
1. `apps/web/src/app/(dashboard)/documents/page.tsx`
   - Document list with search bar
   - Filters sidebar (type, date, entity)
   - Grid/list view toggle

2. `apps/web/src/app/(dashboard)/documents/[id]/page.tsx`
   - Document detail view
   - Preview (PDF viewer, image viewer)
   - Linked entities list
   - Audit history

3. `apps/web/src/components/documents/DocumentSearch.tsx`
   - Natural language search input
   - Search suggestions/autocomplete

4. `apps/web/src/components/documents/DocumentGrid.tsx`
   - Thumbnail grid view

5. `apps/web/src/components/documents/DocumentList.tsx`
   - Table list view

6. `apps/web/src/components/documents/DocumentPreview.tsx`
   - PDF viewer (use react-pdf)
   - Image viewer
   - Fallback for other types

7. `apps/web/src/components/documents/DocumentFilters.tsx`
   - Type filter
   - Date range picker
   - Entity filter (linked to invoice/expense/etc.)

8. `apps/web/src/lib/api/documents.ts`
   - API client for document operations

### Technical Requirements
- Natural language search bar
- Real-time search suggestions
- Document preview without download
- Filter by type, date, entity
- Responsive grid/list views
- Drag-and-drop upload

### Acceptance Criteria
- [ ] Search documents by query
- [ ] Filter by type and date
- [ ] Preview PDF and images inline
- [ ] View linked entities
- [ ] Upload new documents
- [ ] Mobile responsive

---

## TASK-S4-07: Wire Document Search to Chat

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-03, S4-06

### Context
Users should be able to search documents from chat: "Find invoices from Acme in 2024"

### Objective
Add document search capability to chat actions.

### Files to Modify
1. `apps/api/src/modules/chatbot/actions/action-executor.service.ts`
```typescript
// Add new action types
SEARCH_DOCUMENTS = 'SEARCH_DOCUMENTS',
GET_DOCUMENT = 'GET_DOCUMENT',
UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',

// Add executor
case 'SEARCH_DOCUMENTS':
  return this.executeDocumentSearch(action.parameters);
```

2. `apps/api/src/modules/chatbot/chat.service.ts`
   - Update system prompt with document capabilities
   - Handle document search results in response

3. `apps/api/src/modules/chatbot/prompts/system-prompt.ts`
   - Add document action examples

### Chat Examples
```
User: "Find all invoices from Acme Corp"
Bot: [Shows list of invoices from Acme Corp with preview links]

User: "Show me tax documents from last year"
Bot: [Shows list of tax documents from 2024]

User: "Find the contract we signed with AWS"
Bot: [Shows contract document with preview]
```

### Technical Requirements
- Natural language document queries
- Return document list with preview links
- Support date ranges ("last year", "Q3 2024")
- Support entity references ("from Acme", "for customer X")
- Show document previews in chat

### Acceptance Criteria
- [ ] "Find invoices from X" works
- [ ] "Show tax documents" works
- [ ] Results include preview links
- [ ] Date range parsing works
- [ ] Entity name matching works

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel - Start Immediately)
Launch these 2 agents simultaneously:

1. **BRIDGE Agent**: TASK-S4-01 (Unify Document Storage)
2. **VAULT Agent**: TASK-S4-02 (Document Entity)

### Phase 2 (After Phase 1 Completes)
Launch these 2 agents simultaneously:

3. **ORACLE Agent**: TASK-S4-03 (Document Search Index)
4. **FORGE Agent**: TASK-S4-04 (Cross-Entity Linking)

### Phase 3 (After Phase 2 Completes)
Launch these 3 agents simultaneously:

5. **FORGE Agent #2**: TASK-S4-05 (Document Audit Trail)
6. **PRISM Agent**: TASK-S4-06 (Document Search UI)
7. **ORACLE Agent #2**: TASK-S4-07 (Wire Search to Chat)

---

## SUCCESS METRICS

When Sprint 4 is complete:

1. **Unified Storage**: All documents in consistent paths
2. **Document Lineage**: email → attachment → invoice → expense tracked
3. **Natural Language Search**: "Find invoices from Acme 2024" works
4. **Visual Browser**: Grid/list view with filters
5. **Chat Integration**: "Show me the AWS contract" works
6. **Audit Trail**: All access logged for compliance

---

## NOTES FOR AGENTS

- Use existing PDF viewer library (react-pdf or similar)
- PostgreSQL full-text search is sufficient (no Elasticsearch needed initially)
- Store extracted text for search indexing
- Respect retention policies (no hard delete for tax documents)
- Document checksums for deduplication
- Handle large files efficiently (streaming, chunked upload)
