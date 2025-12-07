# Phase 3 Task 3.2: Email Company Aggregator Service - COMPLETE

## Implementation Summary

Successfully created a batch aggregation service that discovers new customers from email communications.

## Files Created

### 1. Types Definition
**File**: `types/aggregation.types.ts`
- `CompanyAggregation` - Main aggregation interface with company/domain grouping
- `EmailContact` - Contact information within a company
- `ImportResult` - Result of importing aggregations as customers
- `ImportError` - Error tracking for failed imports
- `AggregationSummary` - Statistical summary of aggregations
- `AggregationOptions` - Filtering options for aggregation

### 2. Aggregator Service
**File**: `email-aggregator.service.ts`

**Key Features**:
- Groups email entities by domain/company
- Identifies potential new customers not in database
- Generates aggregation summaries
- Supports one-click import to customer database

**Main Methods**:
```typescript
aggregateByCompany(orgId, options): Promise<CompanyAggregation[]>
  - Aggregates email entities into company groups
  - Filters by email/contact count
  - Checks against existing customers/vendors
  - Returns sorted, enriched aggregations

getAggregationSummary(orgId, options): Promise<AggregationSummary>
  - Returns statistics: total companies, new companies, existing customers/vendors
  - Useful for dashboard widgets

importAsCustomers(orgId, aggregationIds, userId): Promise<ImportResult>
  - Imports selected aggregations as new customers
  - Skips existing customers
  - Returns success/failure counts with detailed errors
```

**Aggregation Logic**:
1. Fetch all EmailExtractedEntities for the organization
2. Group by email domain (e.g., @acme.com)
3. For each domain:
   - Collect all company names found
   - Aggregate contacts (name, email, role, email count)
   - Track first/last seen dates
   - Extract VAT ID and address if available
   - Calculate confidence score
4. Check against existing customers/vendors
5. Filter by options (min email count, exclude existing, etc.)

### 3. Background Job
**File**: `jobs/email-aggregation.processor.ts`

**Queue**: `email-intelligence`

**Jobs**:
1. `aggregate-emails-daily` - Runs nightly at 2 AM
   - Processes all active organizations
   - Aggregates emails from last 24 hours
   - Creates suggestions for new companies (≥2 emails)
   - Example: "5 new potential customers discovered from emails"

2. `aggregate-emails-org` - On-demand aggregation
   - Runs for specific organization
   - Supports custom date ranges
   - Returns summary in job metadata

### 4. API Endpoints
**Added to**: `email-intelligence.controller.ts`

**Routes** (under `/organisations/:orgId/intelligence/email`):

```
GET /aggregations
  Query params:
    - sinceDate: ISO date string
    - excludeExisting: 'true' to only show new companies
    - minEmailCount: minimum emails to include
    - minContactCount: minimum contacts to include
  Returns: { data: CompanyAggregation[] }

GET /aggregations/summary
  Query params:
    - sinceDate: ISO date string
  Returns: { data: AggregationSummary }

POST /aggregations/import
  Body: { aggregationIds: string[] }
  Returns: { data: ImportResult }
  - Creates customers from selected aggregations
  - Skips existing customers
  - Returns detailed results
```

### 5. Module Updates
**File**: `email-intelligence.module.ts`

**Changes**:
- Added `EmailAggregatorService` to providers and exports
- Added `EmailAggregationProcessor` to providers
- Registered `email-intelligence` Bull queue
- Updated imports to include BullModule

**File**: `index.ts`
- Exported `EmailAggregatorService`
- Exported all aggregation types

## Database Integration

**Uses Existing Models**:
- `EmailExtractedEntities` - Source of email data
  - `entities` JSON field contains full ExtractedEntities
  - `companyNames[]` for quick company lookup
  - `contactEmails[]` for quick contact lookup
  - `extractedAt` for date filtering

- `Customer` - Target for imports
  - Creates with status: 'LEAD'
  - Metadata includes aggregation source and contacts
  - Links to original aggregation via `aggregationId`

- `Vendor` - Checked to avoid duplicates

## Example Usage

### 1. Get New Potential Customers
```typescript
GET /organisations/org-123/intelligence/email/aggregations?excludeExisting=true&minEmailCount=2

Response:
{
  "data": [
    {
      "id": "agg-uuid-1",
      "domain": "acme.com",
      "companyName": "Acme Corporation",
      "contactCount": 3,
      "contacts": [
        {
          "email": "john@acme.com",
          "name": "John Smith",
          "role": "CEO",
          "emailCount": 5,
          "lastSeen": "2025-12-07T10:00:00Z"
        },
        ...
      ],
      "emailCount": 7,
      "firstSeen": "2025-11-20T08:30:00Z",
      "lastSeen": "2025-12-07T10:00:00Z",
      "isExistingCustomer": false,
      "isExistingVendor": false,
      "confidence": 0.9,
      "vatId": "DE123456789",
      "address": "123 Main St, Berlin, Germany"
    }
  ]
}
```

### 2. Get Summary Statistics
```typescript
GET /organisations/org-123/intelligence/email/aggregations/summary

Response:
{
  "data": {
    "totalCompanies": 15,
    "newCompanies": 10,
    "existingCustomers": 3,
    "existingVendors": 2,
    "totalContacts": 45,
    "totalEmails": 127
  }
}
```

### 3. Import as Customers
```typescript
POST /organisations/org-123/intelligence/email/aggregations/import
{
  "aggregationIds": ["agg-uuid-1", "agg-uuid-2", "agg-uuid-3"]
}

Response:
{
  "data": {
    "imported": 2,
    "failed": 1,
    "customers": [
      { id: "cust-1", name: "Acme Corporation", ... },
      { id: "cust-2", name: "TechCorp GmbH", ... }
    ],
    "errors": [
      {
        "companyId": "agg-uuid-3",
        "companyName": "ExistingCorp",
        "error": "Already exists as a customer"
      }
    ]
  }
}
```

## Automation Features

### Nightly Aggregation Job
- Runs at 2 AM every night
- Processes last 24 hours of emails
- Filters: excludeExisting=true, minEmailCount=2
- Creates EmailSuggestion when new companies found
- Suggestion links to `/intelligence/email/aggregations`

### Proactive Suggestions
Example suggestion created:
```typescript
{
  type: 'NEW_CUSTOMER_DETECTED',
  priority: 'MEDIUM',
  title: '5 new potential customers discovered from emails',
  message: 'We found 5 new companies in your email communications. Review and add to your customer database.',
  actionLabel: 'Review Companies',
  actionUrl: '/intelligence/email/aggregations',
  metadata: {
    newCompanyCount: 5,
    aggregationDate: '2025-12-07T02:00:00Z',
    source: 'EMAIL_AGGREGATION_JOB'
  }
}
```

## Benefits

### 1. Automatic Discovery
- No manual data entry required
- Discovers customers from natural email flow
- Groups multiple contacts from same company

### 2. Intelligent Deduplication
- Checks against existing customers and vendors
- Matches by VAT ID, email domain, company name
- Prevents duplicate entries

### 3. Rich Contact Information
- Multiple contacts per company
- Email counts show activity level
- Roles and names automatically extracted
- First/last seen dates for context

### 4. One-Click Import
- Select multiple companies at once
- Automatic customer creation with metadata
- Status automatically set to 'LEAD'
- All contacts preserved in metadata

### 5. Dashboard Integration
- Summary statistics widget
- New customer count badge
- Activity-sorted lists
- Confidence scoring

## Confidence Scoring

Confidence calculated based on:
- Base: 0.5
- +0.2 if company name extracted
- +0.1 if multiple contacts found (>1)
- +0.1 if multiple emails found (>2)
- +0.1 if VAT ID extracted
- Max: 1.0

Higher confidence = more reliable match/identification

## Error Handling

**Service Level**:
- Validates input parameters
- Handles missing/invalid data gracefully
- Logs errors without breaking batch operations
- Returns partial results with detailed errors

**API Level**:
- 400 Bad Request for invalid aggregationIds
- 401 Unauthorized if not authenticated
- 404 if organization not found
- 500 with detailed error logs

**Job Level**:
- Continues processing if one org fails
- Logs errors per organization
- Reports total success/failure counts
- Retryable on failure

## Testing Checklist

- [x] Service creates correct aggregations
- [x] Domain grouping works correctly
- [x] Existing customer/vendor detection works
- [x] Import creates customers with correct metadata
- [x] Import skips existing customers
- [x] API endpoints return correct data
- [x] Background job processes correctly
- [x] Suggestions created when new companies found
- [x] Error handling for edge cases
- [x] Module exports all necessary types

## Next Steps

### Frontend Integration (PRISM)
1. Create aggregations dashboard page
2. Display company cards with contacts
3. Import selection UI with checkboxes
4. Success/error notifications
5. Link from email suggestions

### Enhancements (Future)
1. Machine learning for better company name extraction
2. LinkedIn/web enrichment for companies
3. Automatic lead scoring
4. Email template suggestions for new leads
5. Integration with CRM workflows

## Files Modified

1. `types/aggregation.types.ts` (NEW)
2. `email-aggregator.service.ts` (NEW)
3. `jobs/email-aggregation.processor.ts` (NEW)
4. `email-intelligence.controller.ts` (MODIFIED - added 3 endpoints)
5. `email-intelligence.module.ts` (MODIFIED - added service + processor)
6. `index.ts` (MODIFIED - added exports)

## Dependencies

**Existing Services**:
- `PrismaService` - Database access
- `CustomerAutoCreatorService` - Customer matching logic (reused)
- `EmailSuggestionsService` - Creating proactive suggestions

**Utilities**:
- `extractDomain()` - from parsers/signature-parser
- `normalizeCompanyName()` - from parsers/signature-parser
- `uuid` - for generating aggregation IDs

**External**:
- `@nestjs/bull` - Background job queue
- `bull` - Job processing

## Status: COMPLETE ✅

All requirements implemented:
- ✅ Aggregates email entities by company/domain
- ✅ Groups contacts from same domain
- ✅ Identifies potential new customers
- ✅ Generates summary statistics
- ✅ Supports one-click import
- ✅ Background job runs nightly
- ✅ Creates proactive suggestions
- ✅ API endpoints for dashboard
- ✅ Proper error handling
- ✅ Module integration complete
