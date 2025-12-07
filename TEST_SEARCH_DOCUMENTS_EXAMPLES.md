# Search Documents Handler - Test Examples

## Test Scenarios

### Test 1: Find invoices from October 2024
**User Message:** "Find invoices from October"

**Expected Action:**
```json
{
  "type": "search_documents",
  "parameters": {
    "query": "October",
    "documentType": "INVOICE",
    "dateFrom": "2024-10-01",
    "dateTo": "2024-10-31"
  },
  "confirmationRequired": false,
  "description": "Search for invoice documents from October 2024"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Found 5 documents of type INVOICE matching \"October\"",
  "entityType": "DocumentSearchResult",
  "data": {
    "count": 5,
    "total": 5,
    "hasMore": false,
    "query": "October",
    "filters": {
      "documentType": "INVOICE",
      "status": "ACTIVE",
      "dateFrom": "2024-10-01",
      "dateTo": "2024-10-31"
    },
    "documents": [
      {
        "id": "doc_abc123",
        "name": "Invoice - Acme Corp",
        "description": "Monthly consulting services",
        "type": "INVOICE",
        "status": "ACTIVE",
        "fileName": "invoice-acme-oct.pdf",
        "fileSize": "142.5 KB",
        "mimeType": "application/pdf",
        "url": "https://storage.example.com/invoice-acme-oct.pdf",
        "tags": ["invoice", "acme", "consulting"],
        "version": 1,
        "uploadedBy": "user_456",
        "createdAt": "2024-10-15T14:30:00Z",
        "updatedAt": "2024-10-15T14:30:00Z"
      }
    ]
  }
}
```

---

### Test 2: Search contracts with "Acme"
**User Message:** "Show me all contracts with Acme Corp"

**Expected Action:**
```json
{
  "type": "search_documents",
  "parameters": {
    "query": "Acme",
    "documentType": "CONTRACT"
  },
  "confirmationRequired": false,
  "description": "Search for contract documents containing Acme"
}
```

**Expected Response:**
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
    "documents": [
      {
        "id": "doc_xyz789",
        "name": "Service Agreement - Acme Corporation",
        "description": "Annual service agreement for consulting services",
        "type": "CONTRACT",
        "status": "ACTIVE",
        "fileName": "acme-service-agreement-2024.pdf",
        "fileSize": "1.2 MB",
        "mimeType": "application/pdf",
        "url": "https://storage.example.com/acme-contract.pdf",
        "tags": ["contract", "acme", "annual"],
        "version": 2,
        "uploadedBy": "user_789",
        "createdAt": "2024-01-10T09:00:00Z",
        "updatedAt": "2024-02-15T11:30:00Z"
      }
    ]
  }
}
```

---

### Test 3: Show all receipts
**User Message:** "Show me all receipts"

**Expected Action:**
```json
{
  "type": "search_documents",
  "parameters": {
    "query": "receipt",
    "documentType": "RECEIPT",
    "limit": 20
  },
  "confirmationRequired": false,
  "description": "Search for all receipt documents"
}
```

---

### Test 4: Find Q3 reports
**User Message:** "Find Q3 2024 reports"

**Expected Action:**
```json
{
  "type": "search_documents",
  "parameters": {
    "query": "Q3",
    "documentType": "REPORT",
    "dateFrom": "2024-07-01",
    "dateTo": "2024-09-30"
  },
  "confirmationRequired": false,
  "description": "Search for Q3 2024 report documents"
}
```

---

### Test 5: No results found
**User Message:** "Find documents about unicorns"

**Expected Response:**
```json
{
  "success": true,
  "message": "No documents found matching \"unicorns\"",
  "entityType": "DocumentSearchResult",
  "data": {
    "count": 0,
    "total": 0,
    "hasMore": false,
    "query": "unicorns",
    "filters": {
      "status": "ACTIVE"
    },
    "documents": []
  }
}
```

---

### Test 6: Large result set with pagination
**User Message:** "Search for all invoices" (assuming 50+ invoices exist)

**Expected Response:**
```json
{
  "success": true,
  "message": "Found 20 documents of type INVOICE matching \"invoices\" (showing first 20 of 50 total results)",
  "entityType": "DocumentSearchResult",
  "data": {
    "count": 20,
    "total": 50,
    "hasMore": true,
    "query": "invoices",
    "filters": {
      "documentType": "INVOICE",
      "status": "ACTIVE"
    },
    "documents": [...]
  }
}
```

---

### Test 7: Permission denied
**User Message:** "Search for contracts" (user without documents:view permission)

**Expected Response:**
```json
{
  "success": false,
  "message": "You do not have permission to search documents",
  "error": "PERMISSION_DENIED"
}
```

---

### Test 8: Multiple filters
**User Message:** "Find contract documents from 2024"

**Expected Action:**
```json
{
  "type": "search_documents",
  "parameters": {
    "query": "contract",
    "documentType": "CONTRACT",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31"
  },
  "confirmationRequired": false,
  "description": "Search for contract documents from 2024"
}
```

---

## Integration Test Script

To test the handler in your application:

```typescript
// Test function
async function testSearchDocuments() {
  const context: ActionContext = {
    userId: 'test_user_123',
    organizationId: 'test_org_456',
    conversationId: 'conv_789',
    permissions: ['documents:view'],
  };

  const params = {
    query: 'invoice',
    documentType: 'INVOICE',
    dateFrom: '2024-10-01',
    dateTo: '2024-10-31',
    limit: 10,
  };

  // Execute the action
  const result = await searchDocumentsHandler.execute(params, context);

  console.log('Search Result:', JSON.stringify(result, null, 2));

  // Assertions
  assert(result.success === true, 'Search should succeed');
  assert(result.data.documents.length <= 10, 'Should respect limit');
  assert(result.entityType === 'DocumentSearchResult', 'Correct entity type');
}
```

---

## Manual Testing Steps

1. **Set up test data:**
   - Create sample documents in database with various types
   - Include documents with different creation dates
   - Add documents with various tags and descriptions

2. **Test via chatbot:**
   - Send chat messages with document search requests
   - Verify action parsing detects search_documents intent
   - Confirm correct parameters are extracted
   - Check response format and data accuracy

3. **Test edge cases:**
   - Empty query string (should fail validation)
   - Invalid document type (should be ignored)
   - Invalid date format (should be handled gracefully)
   - Limit exceeding max (should be capped at 100)
   - User without permissions (should return error)

4. **Performance testing:**
   - Test with large document collections (1000+ documents)
   - Verify query performance with indexes
   - Check pagination behavior with hasMore flag

---

## Expected Database Queries

### Basic search query
```sql
SELECT * FROM "Document"
WHERE "orgId" = $1
  AND "status" = 'ACTIVE'
  AND (
    "name" ILIKE '%invoice%' OR
    "description" ILIKE '%invoice%' OR
    "fileName" ILIKE '%invoice%'
  )
ORDER BY "createdAt" DESC
LIMIT 20;
```

### With document type filter
```sql
SELECT * FROM "Document"
WHERE "orgId" = $1
  AND "status" = 'ACTIVE'
  AND "type" = 'INVOICE'
  AND (
    "name" ILIKE '%october%' OR
    "description" ILIKE '%october%' OR
    "fileName" ILIKE '%october%'
  )
ORDER BY "createdAt" DESC
LIMIT 20;
```

### With date range
```sql
SELECT * FROM "Document"
WHERE "orgId" = $1
  AND "status" = 'ACTIVE'
  AND "type" = 'REPORT'
  AND "createdAt" >= '2024-07-01'
  AND "createdAt" <= '2024-09-30'
  AND (
    "name" ILIKE '%Q3%' OR
    "description" ILIKE '%Q3%' OR
    "fileName" ILIKE '%Q3%'
  )
ORDER BY "createdAt" DESC
LIMIT 20;
```

---

## Success Criteria

- ✅ Handler executes without errors
- ✅ Search returns relevant documents
- ✅ Filters work correctly (type, date, status)
- ✅ Pagination info is accurate
- ✅ File sizes are human-readable
- ✅ Permission checks prevent unauthorized access
- ✅ Error handling gracefully manages failures
- ✅ Response format matches expected structure
- ✅ Logging provides audit trail

---

## Next Steps After Testing

1. **Add unit tests** for handler logic
2. **Add integration tests** with real database
3. **Monitor performance** with large document sets
4. **Consider adding:**
   - Tag-based search
   - Folder-based filtering
   - Advanced search operators
   - Search within file content (OCR/PDF parsing)
   - Search suggestions/autocomplete
