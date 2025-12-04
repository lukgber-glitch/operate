# ComplyAdvantage AML Integration

ComplyAdvantage integration for comprehensive AML (Anti-Money Laundering) screening and compliance.

## Features

- **PEP Screening**: Politically Exposed Persons detection
- **Sanctions Screening**: Check against UN, OFAC, EU, UK-HMT sanctions lists
- **Watchlist Screening**: Monitor against global watchlists
- **Adverse Media Screening**: Detect negative news and adverse media
- **Ongoing Monitoring**: Continuous monitoring with configurable frequency (daily/weekly/monthly)
- **Case Management**: Alert review workflow with status tracking
- **Webhook Support**: Real-time updates from ComplyAdvantage
- **Security**: AES-256-GCM encrypted credential storage
- **Audit Logging**: Comprehensive audit trail for compliance

## Configuration

Add to `.env`:

```bash
# ComplyAdvantage API Configuration
COMPLY_ADVANTAGE_API_KEY=your_api_key_here
COMPLY_ADVANTAGE_API_URL=https://api.complyadvantage.com
COMPLY_ADVANTAGE_WEBHOOK_SECRET=your_webhook_secret
COMPLY_ADVANTAGE_ENVIRONMENT=sandbox  # or production
COMPLY_ADVANTAGE_MOCK_MODE=false
COMPLY_ADVANTAGE_ENCRYPTION_KEY=your_32_char_encryption_key
```

## API Endpoints

### Screening

- `POST /aml/screen` - Create new AML screening
- `GET /aml/screenings/:id` - Get screening by ID
- `GET /aml/screenings/organization/:orgId` - List screenings
- `POST /aml/screenings/:id/rescreen` - Re-screen entity

### Monitoring

- `POST /aml/monitoring` - Enable ongoing monitoring
- `PUT /aml/monitoring/:screeningId/disable` - Disable monitoring
- `GET /aml/monitoring/:screeningId` - Get monitoring status
- `GET /aml/monitoring/organization/:orgId` - List active monitoring

### Case Management

- `PUT /aml/alerts/:id/review` - Review alert
- `GET /aml/alerts/:id` - Get alert details
- `GET /aml/screenings/:id/alerts` - List alerts for screening
- `GET /aml/statistics/:orgId` - Get alert statistics
- `GET /aml/pending-reviews/:orgId` - Get pending review cases
- `GET /aml/overdue-reviews/:orgId` - Get overdue reviews
- `POST /aml/alerts/:id/escalate` - Escalate alert

### Webhooks

- `POST /aml/webhooks` - Receive webhook events

## Usage Examples

### Create AML Screening

```typescript
POST /aml/screen
{
  "searchTerm": "John Doe",
  "searchType": "person",
  "dateOfBirth": "1980-01-01",
  "countryCode": "US",
  "organizationId": "org_123",
  "userId": "user_456",
  "matchTypes": ["pep", "sanction"],
  "fuzziness": 0.7
}
```

### Enable Ongoing Monitoring

```typescript
POST /aml/monitoring
{
  "screeningId": "screening_789",
  "frequency": "weekly"
}
```

### Review Alert

```typescript
PUT /aml/alerts/:alertId/review
{
  "status": "dismissed",
  "reviewedBy": "user_123",
  "reviewNotes": "False positive - different person with same name"
}
```

## Risk Levels

- `LOW` - No matches or low confidence matches
- `MEDIUM` - Moderate confidence matches
- `HIGH` - High confidence matches or PEP/sanctions hits
- `CRITICAL` - Confirmed sanctions or high-risk PEP matches

## Screening Status

- `CLEAR` - No matches found
- `POTENTIAL_MATCH` - Possible matches require review
- `PENDING_REVIEW` - High-risk matches awaiting review
- `CONFIRMED_MATCH` - Confirmed match after review

## Alert Status

- `OPEN` - New alert awaiting review
- `REVIEWED` - Alert reviewed, deemed acceptable risk
- `ESCALATED` - Alert escalated to compliance team
- `DISMISSED` - False positive, dismissed
- `CONFIRMED` - True match confirmed

## Match Types

- `PEP` - Politically Exposed Person
- `SANCTION` - Sanctions list match
- `WATCHLIST` - Watchlist match
- `ADVERSE_MEDIA` - Negative news/media

## Source Lists

- `UN` - United Nations sanctions
- `OFAC` - US Office of Foreign Assets Control
- `EU` - European Union sanctions
- `UK-HMT` - UK Her Majesty's Treasury
- `INTERPOL` - International Criminal Police Organization
- `FBI` - Federal Bureau of Investigation
- `FATF` - Financial Action Task Force

## Security

- API credentials encrypted with AES-256-GCM
- Webhook signature verification
- TLS 1.3 enforced for API calls
- Comprehensive audit logging
- PII encryption at rest

## Database Schema

```prisma
model AmlScreening {
  id               String   @id @default(uuid())
  searchId         String   @unique
  entityType       String
  entityName       String
  dateOfBirth      DateTime?
  countryCode      String?
  userId           String?
  organisationId   String
  riskLevel        String
  matchCount       Int
  status           String
  lastScreenedAt   DateTime
  nextReviewAt     DateTime?
  alerts           AmlAlert[]
  monitoring       AmlMonitoring[]
}

model AmlAlert {
  id              String   @id @default(uuid())
  screeningId     String
  alertType       String
  matchName       String
  matchScore      Float
  sourceList      String
  sourceUrl       String?
  status          String
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
}

model AmlMonitoring {
  id              String   @id @default(uuid())
  screeningId     String
  monitoringId    String   @unique
  frequency       String
  isActive        Boolean
  lastCheckedAt   DateTime?
  nextCheckAt     DateTime?
}
```

## Testing

Mock mode is available for development:

```bash
COMPLY_ADVANTAGE_MOCK_MODE=true
```

This generates synthetic screening results without calling the ComplyAdvantage API.

## Compliance Notes

- All screening activity is logged for audit purposes
- Retention policies should be defined per jurisdiction
- Review workflows should align with organization's risk policy
- Regular re-screening recommended based on risk level
- Document reasons for alert dismissal/confirmation

## Support

For issues or questions:
- ComplyAdvantage API docs: https://docs.complyadvantage.com
- Internal support: compliance@operate-coachos.com
