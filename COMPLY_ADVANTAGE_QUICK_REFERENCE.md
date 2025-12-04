# ComplyAdvantage AML - Quick Reference

## Setup

```bash
# Environment variables
COMPLY_ADVANTAGE_API_KEY=your_api_key
COMPLY_ADVANTAGE_WEBHOOK_SECRET=your_secret
COMPLY_ADVANTAGE_ENVIRONMENT=sandbox
COMPLY_ADVANTAGE_ENCRYPTION_KEY=min_32_char_key

# Run migration
npx prisma migrate dev --name add_aml_screening
```

## Common Operations

### Screen a Person
```typescript
POST /aml/screen
{
  "searchTerm": "John Doe",
  "searchType": "person",
  "dateOfBirth": "1980-01-01",
  "countryCode": "US",
  "organizationId": "org_123",
  "matchTypes": ["pep", "sanction"]
}
```

### Screen a Company
```typescript
POST /aml/screen
{
  "searchTerm": "ACME Corp",
  "searchType": "company",
  "countryCode": "US",
  "organizationId": "org_123"
}
```

### Enable Monitoring
```typescript
POST /aml/monitoring
{
  "screeningId": "screening_123",
  "frequency": "weekly"
}
```

### Review Alert
```typescript
PUT /aml/alerts/:alertId/review
{
  "status": "dismissed",  // or "confirmed", "reviewed"
  "reviewedBy": "user_123",
  "reviewNotes": "Reason for decision"
}
```

### Escalate Alert
```typescript
POST /aml/alerts/:alertId/escalate
{
  "escalatedBy": "user_123",
  "reason": "Requires compliance team review"
}
```

## Dashboard Queries

### Pending Reviews
```
GET /aml/pending-reviews/:orgId
```

### Overdue Reviews
```
GET /aml/overdue-reviews/:orgId
```

### Statistics
```
GET /aml/statistics/:orgId
```

### List Screenings
```
GET /aml/screenings/organization/:orgId?status=pending_review&riskLevel=high
```

## Risk Levels

- **LOW:** No significant matches
- **MEDIUM:** Moderate confidence matches
- **HIGH:** High confidence or PEP matches
- **CRITICAL:** Confirmed sanctions or high-risk PEP

## Screening Status

- **CLEAR:** No matches
- **POTENTIAL_MATCH:** Requires review
- **PENDING_REVIEW:** High-risk awaiting review
- **CONFIRMED_MATCH:** Verified match

## Alert Actions

1. **OPEN** → Review → **DISMISSED** (false positive)
2. **OPEN** → Review → **REVIEWED** (acceptable risk)
3. **OPEN** → Review → **CONFIRMED** → Escalate → **ESCALATED**

## Monitoring Frequencies

- **DAILY:** Critical risk entities
- **WEEKLY:** High/medium risk
- **MONTHLY:** Low risk or regulatory requirement

## Match Types

- **PEP:** Politically Exposed Persons
- **SANCTION:** UN, OFAC, EU, UK sanctions
- **WATCHLIST:** Various watchlists
- **ADVERSE_MEDIA:** Negative news

## Source Lists

- **UN** - United Nations
- **OFAC** - US Treasury
- **EU** - European Union
- **UK-HMT** - UK Treasury
- **INTERPOL** - International Police
- **FBI** - Federal Bureau
- **FATF** - Financial Action Task Force

## Best Practices

### When to Screen
- New customer onboarding
- Periodic re-screening (annually minimum)
- Before high-value transactions
- Relationship changes (new beneficial owners)

### Review Timing
- **CRITICAL:** Within 24 hours
- **HIGH:** Within 3 days
- **MEDIUM:** Within 7 days
- **LOW:** Within 30 days

### Documentation
- Always add review notes
- Document verification sources
- Record decision rationale
- Maintain audit trail

### Monitoring
- Enable for all medium+ risk
- Daily for critical risk
- Weekly for high risk
- Monthly for medium risk

## Webhook Events

```typescript
POST /aml/webhooks
{
  "event_type": "monitoring_match",
  "search_id": "search_123",
  "monitoring_id": "mon_456",
  "data": {
    "new_hits": [...]
  }
}
```

**Event Types:**
- `search_updated` - Screening updated
- `monitoring_match` - New match found
- `new_source_added` - New source added to match

## Error Handling

### Common Issues
1. **Invalid API Key:** Check `COMPLY_ADVANTAGE_API_KEY`
2. **Webhook Signature Failed:** Verify `COMPLY_ADVANTAGE_WEBHOOK_SECRET`
3. **Encryption Error:** Ensure key is 32+ characters
4. **Rate Limit:** Wait and retry with exponential backoff

## File Locations

```
apps/api/src/modules/integrations/comply-advantage/
├── comply-advantage.module.ts
├── comply-advantage.service.ts
├── comply-advantage.controller.ts
├── comply-advantage-webhook.controller.ts
├── services/
│   ├── screening.service.ts
│   ├── monitoring.service.ts
│   └── case-management.service.ts
├── dto/
│   ├── create-search.dto.ts
│   ├── alert.dto.ts
│   └── webhook-payload.dto.ts
└── types/
    └── comply-advantage.types.ts
```

## Database Tables

- `aml_screenings` - Screening records
- `aml_alerts` - Individual matches/alerts
- `aml_monitoring` - Ongoing monitoring configs

## Support

- **API Docs:** https://docs.complyadvantage.com
- **Module README:** `apps/api/src/modules/integrations/comply-advantage/README.md`
- **Examples:** `comply-advantage/examples/usage-examples.ts`
