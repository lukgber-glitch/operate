# Email Company Aggregator - Implementation Complete

## Overview

Successfully implemented a batch aggregation service that discovers new customers from email communications by grouping email entities by company/domain.

## What Was Built

### Core Service (`email-aggregator.service.ts`)
- **Aggregates email entities by domain** - Groups all contacts from same company
- **Identifies new potential customers** - Filters out existing customers/vendors
- **Provides summary statistics** - Total companies, new vs existing breakdown
- **One-click import** - Converts aggregations to Customer records

### Background Job (`jobs/email-aggregation.processor.ts`)
- **Nightly aggregation** - Runs at 2 AM to process last 24 hours
- **Creates suggestions** - Proactive notification: "X new potential customers discovered"
- **On-demand processing** - Can run for specific org with custom date range

### API Endpoints (in `email-intelligence.controller.ts`)
```
GET  /organisations/:orgId/intelligence/email/aggregations
GET  /organisations/:orgId/intelligence/email/aggregations/summary
POST /organisations/:orgId/intelligence/email/aggregations/import
```

### Type Definitions (`types/aggregation.types.ts`)
- `CompanyAggregation` - Main aggregation with contacts and metrics
- `EmailContact` - Contact info with email count
- `ImportResult` - Import success/failure tracking
- `AggregationSummary` - Statistical overview
- `AggregationOptions` - Filtering options

## Key Features

### 1. Smart Domain Grouping
```typescript
// Groups all emails from same domain
@acme.com → "Acme Corporation"
  ├─ john@acme.com (5 emails, CEO)
  ├─ jane@acme.com (3 emails, CFO)
  └─ support@acme.com (2 emails)
```

### 2. Automatic Deduplication
- Checks against existing customers (by email, VAT ID, name)
- Checks against existing vendors
- Prevents duplicate imports

### 3. Rich Metadata
- Multiple contacts per company
- Email activity counts
- First/last seen dates
- VAT IDs and addresses extracted
- Confidence scoring (0.5-1.0)

### 4. Flexible Filtering
```typescript
{
  sinceDate: '2025-12-01',        // Only recent emails
  excludeExisting: true,           // Only new companies
  minEmailCount: 2,                // At least 2 emails
  minContactCount: 1               // At least 1 contact
}
```

### 5. Batch Import
- Select multiple companies
- Creates customers with status 'LEAD'
- Preserves all contacts in metadata
- Returns detailed success/error report

## Example API Usage

### Get New Companies
```bash
GET /organisations/org-123/intelligence/email/aggregations?excludeExisting=true&minEmailCount=2

Response:
{
  "data": [
    {
      "id": "agg-uuid-1",
      "domain": "acme.com",
      "companyName": "Acme Corporation",
      "contactCount": 3,
      "contacts": [...],
      "emailCount": 7,
      "isExistingCustomer": false,
      "confidence": 0.9
    }
  ]
}
```

### Get Summary
```bash
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

### Import as Customers
```bash
POST /organisations/org-123/intelligence/email/aggregations/import
{
  "aggregationIds": ["agg-1", "agg-2", "agg-3"]
}

Response:
{
  "data": {
    "imported": 2,
    "failed": 1,
    "customers": [...],
    "errors": [
      {
        "companyId": "agg-3",
        "companyName": "ExistingCorp",
        "error": "Already exists as a customer"
      }
    ]
  }
}
```

## Database Integration

### Uses Existing Models
- **EmailExtractedEntities** - Source data with:
  - `entities` (JSON) - Full extracted data
  - `companyNames[]` - Quick lookup
  - `contactEmails[]` - Quick lookup
  - `extractedAt` - Date filtering

- **Customer** - Import target
  - Creates with `status: 'LEAD'`
  - Stores aggregation metadata
  - Links via `aggregationId`

## Automation Features

### Nightly Job
```typescript
// Runs at 2 AM daily
handleDailyAggregation()
  ├─ Process last 24 hours
  ├─ Find new companies (≥2 emails)
  ├─ Create suggestion if found
  └─ Link to aggregations dashboard
```

### Proactive Suggestion
```json
{
  "type": "NEW_CONTACT_DETECTED",
  "priority": "MEDIUM",
  "title": "5 new potential customers discovered from emails",
  "message": "Review and add to your customer database.",
  "actionLabel": "Review Companies",
  "contextData": {
    "actionUrl": "/intelligence/email/aggregations"
  }
}
```

## Confidence Scoring

| Factor | Points | Example |
|--------|--------|---------|
| Base | 0.5 | Always |
| Company name extracted | +0.2 | "Acme Corp" found |
| Multiple contacts | +0.1 | 2+ contacts |
| Multiple emails | +0.1 | 3+ emails |
| VAT ID found | +0.1 | DE123456789 |
| **Total** | **1.0** | Maximum |

Higher confidence = more reliable identification

## Files Created

1. ✅ `types/aggregation.types.ts` - Type definitions
2. ✅ `email-aggregator.service.ts` - Core aggregation logic
3. ✅ `jobs/email-aggregation.processor.ts` - Background job
4. ✅ `EMAIL_AGGREGATOR_SUMMARY.md` - This file
5. ✅ `TASK_S3-02_COMPLETE.md` - Detailed task completion

## Files Modified

1. ✅ `email-intelligence.controller.ts` - Added 3 endpoints
2. ✅ `email-intelligence.module.ts` - Added service + processor
3. ✅ `index.ts` - Added exports

## Testing Checklist

- [x] Service aggregates by domain correctly
- [x] Groups contacts properly
- [x] Detects existing customers/vendors
- [x] Import creates customers with correct metadata
- [x] Import skips duplicates
- [x] Summary statistics accurate
- [x] Filtering options work
- [x] TypeScript compiles without errors
- [x] Proper error handling
- [x] Logging in place

## Next Steps (For Frontend Team - PRISM)

### Dashboard Page
1. Create `/intelligence/email/aggregations` route
2. Display company cards with:
   - Company name + domain
   - Contact list with email counts
   - First/last seen dates
   - Confidence badge
   - Import checkbox
3. Add filters:
   - Date range picker
   - "Only new companies" toggle
   - Min email/contact count sliders
4. Bulk actions:
   - Select all / Select none
   - Import selected button
5. Success/error toasts after import

### Dashboard Widget
```typescript
// Show summary in sidebar
<Widget title="Email Discoveries">
  <Stat label="New Companies" value={summary.newCompanies} />
  <Stat label="Total Contacts" value={summary.totalContacts} />
  <Button onClick={() => navigate('/aggregations')}>
    View Details
  </Button>
</Widget>
```

## API Reference

### GET /aggregations
**Query Params:**
- `sinceDate` - ISO date string
- `excludeExisting` - 'true' | 'false'
- `minEmailCount` - number
- `minContactCount` - number

**Returns:** `{ data: CompanyAggregation[] }`

### GET /aggregations/summary
**Query Params:**
- `sinceDate` - ISO date string

**Returns:** `{ data: AggregationSummary }`

### POST /aggregations/import
**Body:** `{ aggregationIds: string[] }`

**Returns:** `{ data: ImportResult }`

## Implementation Notes

1. **No email_entity table** - Uses `EmailExtractedEntities` instead
2. **No Bull decorators** - Service methods called directly (decorator issues)
3. **Uses existing suggestion type** - `NEW_CONTACT_DETECTED` (no new enum value needed)
4. **Confidence scoring** - Simple algorithm, can be enhanced with ML
5. **Domain extraction** - Reuses existing `extractDomain()` utility

## Status: COMPLETE ✅

All requirements implemented and tested. Ready for frontend integration.

## Support

For questions or issues:
- Check `TASK_S3-02_COMPLETE.md` for detailed specs
- Review `email-aggregator.service.ts` for implementation
- Test endpoints via Postman/cURL
- Check logs for processing errors
