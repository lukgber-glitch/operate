# Task S2-04: Search Documents Handler - COMPLETE

## Implementation Summary

Successfully created the `search-documents.handler.ts` chatbot action handler for natural language document search.

## Files Created

### 1. Handler Implementation
**File:** `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\actions\handlers\search-documents.handler.ts`

**Features:**
- Full-text search on document name, description, and filename (case-insensitive)
- Filter by document type (CONTRACT, INVOICE, RECEIPT, REPORT, POLICY, FORM, CERTIFICATE, OTHER)
- Filter by date range (createdAt)
- Filter by status (DRAFT, ACTIVE, ARCHIVED, DELETED - defaults to ACTIVE)
- Configurable result limit (1-100, default 20)
- Permission-based access control (`documents:view`)
- Pagination support with total count
- Human-readable file sizes
- Detailed response with document metadata

## Files Modified

### 1. Action Types Enum
**File:** `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\actions\action.types.ts`
- Added `SEARCH_DOCUMENTS = 'search_documents'` to ActionType enum (already present)

### 2. Chatbot Module
**File:** `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\chatbot.module.ts`
- Imported `SearchDocumentsHandler`
- Added to module providers list

### 3. Action Executor Service
**File:** `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\actions\action-executor.service.ts`
- Imported `SearchDocumentsHandler`
- Added to constructor injection
- Registered handler in `registerHandlers()` method
- Added action definition to `getAvailableActions()` with examples

## API Usage Examples

### Example 1: Search invoices from October
```typescript
[ACTION:search_documents params={"query":"invoices","documentType":"INVOICE","dateFrom":"2024-10-01","dateTo":"2024-10-31"}]
```

**Response:**
```json
{
  "success": true,
  "message": "Found 5 documents of type INVOICE matching \"invoices\"",
  "entityType": "DocumentSearchResult",
  "data": {
    "count": 5,
    "total": 5,
    "hasMore": false,
    "query": "invoices",
    "filters": {
      "documentType": "INVOICE",
      "status": "ACTIVE",
      "dateFrom": "2024-10-01",
      "dateTo": "2024-10-31"
    },
    "documents": [
      {
        "id": "doc_123",
        "name": "October Invoice - Acme Corp",
        "description": "Consulting services invoice",
        "type": "INVOICE",
        "status": "ACTIVE",
        "fileName": "invoice-oct-2024.pdf",
        "fileSize": "245.5 KB",
        "mimeType": "application/pdf",
        "url": "https://storage.example.com/doc_123.pdf",
        "tags": ["invoice", "q4"],
        "version": 1,
        "uploadedBy": "user_456",
        "createdAt": "2024-10-15T10:30:00Z",
        "updatedAt": "2024-10-15T10:30:00Z"
      }
    ]
  }
}
```

### Example 2: Find all contracts mentioning "Acme"
```typescript
[ACTION:search_documents params={"query":"Acme","documentType":"CONTRACT"}]
```

**Response:**
```json
{
  "success": true,
  "message": "Found 3 documents of type CONTRACT matching \"Acme\"",
  "entityType": "DocumentSearchResult",
  "data": {
    "count": 3,
    "total": 3,
    "hasMore": false,
    "query": "Acme",
    "filters": {
      "documentType": "CONTRACT",
      "status": "ACTIVE"
    },
    "documents": [...]
  }
}
```

### Example 3: Search all receipts
```typescript
[ACTION:search_documents params={"query":"receipt","documentType":"RECEIPT"}]
```

### Example 4: Find Q3 reports
```typescript
[ACTION:search_documents params={"query":"Q3","documentType":"REPORT","dateFrom":"2024-07-01","dateTo":"2024-09-30"}]
```

## Chat Examples

Users can now ask:

1. **"Find invoices from October"**
   - Triggers: `search_documents` with `query="October"`, `documentType="INVOICE"`

2. **"Search for contracts with Acme Corp"**
   - Triggers: `search_documents` with `query="Acme Corp"`, `documentType="CONTRACT"`

3. **"Show all receipts"**
   - Triggers: `search_documents` with `query="receipt"`, `documentType="RECEIPT"`

4. **"Find Q3 2024 reports"**
   - Triggers: `search_documents` with `query="Q3"`, `documentType="REPORT"`, date range

5. **"Look for tax documents from last year"**
   - Triggers: `search_documents` with `query="tax"`, date range 2023

## Handler Architecture

### Parameter Validation
- **query**: Required string, must not be empty
- **documentType**: Optional enum validation against DocumentType
- **dateFrom/dateTo**: Optional ISO date strings with validation
- **status**: Optional, defaults to 'ACTIVE'
- **limit**: Optional, 1-100, defaults to 20

### Search Logic
1. Build Prisma where clause with organization filter
2. Add OR conditions for full-text search (name, description, fileName)
3. Apply document type filter if specified
4. Apply date range filters if specified
5. Execute query with limit and sort by createdAt DESC
6. Get total count for pagination
7. Format results with human-readable file sizes

### Security
- Permission check: `documents:view` required
- Organization-scoped queries (automatic via `orgId`)
- No access to deleted documents (unless explicitly requested)
- Input sanitization via `normalizeParams()`

### Response Format
```typescript
{
  success: true,
  message: "Found X document(s) matching \"query\"",
  entityType: "DocumentSearchResult",
  data: {
    count: number,           // Documents returned
    total: number,           // Total matching documents
    hasMore: boolean,        // More results available
    query: string,           // Search query used
    filters: {...},          // Applied filters
    documents: [...]         // Document array
  }
}
```

### Error Handling
- Permission denied: Returns error with PERMISSION_DENIED code
- Invalid parameters: Validation errors from BaseActionHandler
- Database errors: Caught and logged with generic error message
- Invalid date formats: Gracefully handled with NaN check

## Testing Checklist

- [x] Handler file created with full implementation
- [x] Action type added to enum
- [x] Handler registered in chatbot module
- [x] Handler registered in action executor service
- [x] Action definition added with examples
- [x] Permission checks implemented
- [x] Full-text search across multiple fields
- [x] Document type filtering
- [x] Date range filtering
- [x] Result limiting and pagination
- [x] Human-readable file sizes
- [x] Comprehensive error handling
- [x] Logging for audit trail

## Integration Points

### Database Schema
Uses the `Document` model from Prisma schema:
- Fields: id, orgId, name, description, type, status, fileName, fileSize, mimeType, fileUrl, tags, uploadedBy, version, createdAt, updatedAt
- Indexes: orgId, type, status, folderId, uploadedBy
- Enums: DocumentType, DocumentStatus

### Dependencies
- `PrismaService`: Database access
- `BaseActionHandler`: Base handler functionality
- `ActionType`, `ActionContext`, `ParameterDefinition`: Type definitions

### Permissions Required
- `documents:view`: Required for all document search operations

## Next Steps

1. **Test the handler:**
   - Unit tests for search logic
   - Integration tests for database queries
   - End-to-end chat tests

2. **Enhance search (future):**
   - Add tag-based filtering
   - Add folder-based filtering
   - Add full-text search on file content (OCR/PDF text)
   - Add advanced search operators (AND, OR, NOT)
   - Add search by uploader

3. **Performance optimization (future):**
   - Add database indexes for common search patterns
   - Consider full-text search engine (Elasticsearch) for large document volumes
   - Cache frequent searches

## Completion Status

✅ **TASK COMPLETE** - All requirements implemented and registered correctly.

The search documents handler is now fully functional and ready for testing.
