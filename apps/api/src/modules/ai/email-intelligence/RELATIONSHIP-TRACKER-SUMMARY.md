# Relationship Tracker Service - Implementation Summary

## Overview

The Relationship Tracker Service monitors customer and vendor relationship health based on email communication patterns. It calculates health scores (0-100), identifies at-risk relationships, detects dormant contacts, and provides actionable alerts.

## Files Created

### 1. Type Definitions
**File:** `types/relationship-metrics.types.ts`

Defines all TypeScript interfaces and enums:
- `RelationshipMetrics` - Complete metrics for a customer/vendor
- `CommunicationFrequency` - DAILY, WEEKLY, MONTHLY, SPORADIC, DORMANT
- `CommunicationTrend` - INCREASING, STABLE, DECREASING
- `PaymentBehavior` - EARLY, ON_TIME, LATE, VERY_LATE, UNKNOWN
- `HealthStatus` - EXCELLENT, GOOD, NEEDS_ATTENTION, AT_RISK, DORMANT
- `RelationshipAlert` - Alert with type, message, and priority
- `AtRiskRelationship` - Entity with metrics and suggested actions
- `RelationshipSummary` - Organization-wide health distribution

### 2. Main Service
**File:** `relationship-tracker.service.ts`

Core functionality:

#### Public Methods

```typescript
// Update metrics after processing an email
updateRelationshipMetrics(
  entityId: string,
  entityType: 'CUSTOMER' | 'VENDOR',
  email: EmailMessage,
  orgId: string
): Promise<RelationshipMetrics>

// Calculate health score for an entity
calculateHealthScore(
  entityId: string,
  entityType: 'CUSTOMER' | 'VENDOR',
  orgId: string
): Promise<number>

// Get relationships needing attention
getAtRiskRelationships(orgId: string): Promise<AtRiskRelationship[]>

// Get dormant relationships (90+ days no contact)
getDormantRelationships(
  orgId: string,
  daysSinceContact?: number
): Promise<AtRiskRelationship[]>

// Get organization-wide summary
getRelationshipSummary(orgId: string): Promise<RelationshipSummary>
```

### 3. Database Schema
**File:** `packages/database/prisma/schema.prisma`

Added `RelationshipMetrics` model:

```prisma
model RelationshipMetrics {
  id             String   @id @default(uuid())
  entityId       String
  entityType     String   // CUSTOMER or VENDOR
  organisationId String
  metrics        Json     // Full metrics stored as JSON
  healthScore    Int      // 0-100 score
  healthStatus   String   // EXCELLENT/GOOD/NEEDS_ATTENTION/AT_RISK/DORMANT
  createdAt      DateTime @default(now())
  lastUpdated    DateTime @updatedAt
  organisation   Organisation @relation(...)

  @@unique([entityId, entityType, organisationId])
  @@index([organisationId])
  @@index([healthScore])
  @@index([healthStatus])
  @@index([lastUpdated])
}
```

### 4. Module Integration
**File:** `email-intelligence.module.ts`

Added `RelationshipTrackerService` to providers and exports.

### 5. Example Usage
**File:** `relationship-tracker.example.ts`

Comprehensive examples showing:
- Updating metrics after email processing
- Finding at-risk relationships
- Finding dormant relationships
- Getting organization summaries
- Calculating individual health scores
- Integration with email pipeline
- Dashboard queries

## Health Score Calculation

The health score is calculated based on multiple factors:

### Base Score: 50

### Adjustments:

1. **Communication Recency** (max +15, min -20)
   - ≤7 days: +15
   - ≤30 days: +5
   - ≤60 days: -10
   - >60 days: -20

2. **Response Time** (max +10, min -5)
   - <4 hours: +10
   - <24 hours: +5
   - >72 hours: -5

3. **Communication Trend** (max +10, min -10)
   - INCREASING: +10
   - DECREASING: -10

4. **Communication Frequency** (max +10, min -10)
   - DAILY: +10
   - WEEKLY: +5
   - SPORADIC: -5
   - DORMANT: -10

5. **Payment Behavior** (customers only, max +20, min -20)
   - EARLY: +20
   - ON_TIME: +10
   - LATE: -10
   - VERY_LATE: -20

### Final Score: Capped at 0-100

## Health Status Thresholds

- **EXCELLENT**: 80-100
- **GOOD**: 60-79
- **NEEDS_ATTENTION**: 40-59
- **AT_RISK**: 20-39
- **DORMANT**: 0-19 OR 90+ days no contact

## Alerts Generated

The service generates alerts for:

1. **DORMANT_RELATIONSHIP** (HIGH priority)
   - Triggered when no contact for 90+ days

2. **AT_RISK_RELATIONSHIP** (HIGH priority)
   - Triggered when health score falls below 40

3. **DECREASING_ENGAGEMENT** (MEDIUM priority)
   - Triggered when communication trend is decreasing

4. **LATE_PAYMENT_PATTERN** (HIGH priority)
   - Triggered for customers with consistent late payments

5. **NEEDS_ATTENTION** (MEDIUM priority)
   - Triggered when 30+ days no contact and health is declining

## Integration Points

### 1. Email Processing Pipeline

```typescript
async function processEmail(email: EmailMessage, orgId: string) {
  // 1. Classify email
  const classification = await emailClassifier.classifyEmail(email);

  // 2. Extract entities
  const entities = await entityExtractor.extractEntities(email);

  // 3. Auto-create/match customer/vendor
  const result = await customerAutoCreator.processEmail(
    email,
    classification,
    entities,
    orgId
  );

  // 4. Update relationship metrics
  if (result.customer) {
    const metrics = await relationshipTracker.updateRelationshipMetrics(
      result.customer.id,
      'CUSTOMER',
      email,
      orgId
    );

    // Handle alerts
    if (metrics.alerts.length > 0) {
      await handleAlerts(metrics.alerts);
    }
  }
}
```

### 2. Dashboard Widgets

```typescript
// Relationship health overview
const summary = await relationshipTracker.getRelationshipSummary(orgId);

// At-risk customers needing attention
const atRisk = await relationshipTracker.getAtRiskRelationships(orgId);

// Dormant relationships for re-engagement
const dormant = await relationshipTracker.getDormantRelationships(orgId);
```

### 3. Proactive Suggestions

```typescript
// Daily check for relationships needing attention
const needsAttention = await relationshipTracker.getAtRiskRelationships(orgId);

for (const relationship of needsAttention) {
  // Generate proactive suggestion for user
  await suggestionService.create({
    type: 'RELATIONSHIP_ATTENTION',
    entity: relationship.entityName,
    message: relationship.suggestedAction,
    priority: 'HIGH'
  });
}
```

## Database Migration

To apply the schema changes:

```bash
cd packages/database
npx prisma migrate dev --name add-relationship-metrics
npx prisma generate
```

See `MIGRATION-RELATIONSHIP-METRICS.md` for detailed migration instructions.

## Testing

To test the service:

```bash
cd apps/api
npm run test -- relationship-tracker
```

Or run the example file:

```bash
npx ts-node src/modules/ai/email-intelligence/relationship-tracker.example.ts
```

## Future Enhancements

Potential improvements:

1. **Financial Metrics Integration**
   - Currently returns placeholder data
   - TODO: Integrate with invoice/payment data when available

2. **Email History Storage**
   - Currently stores in entity metadata
   - TODO: Consider separate email tracking table for better performance

3. **Configurable Thresholds**
   - Make dormant threshold (90 days) configurable per organization
   - Allow custom scoring weights

4. **Machine Learning**
   - Use historical data to predict relationship churn
   - Personalize health score calculation based on industry/customer type

5. **Real-time Monitoring**
   - Implement WebSocket notifications for relationship alerts
   - Create background job for periodic health recalculation

6. **Advanced Analytics**
   - Cohort analysis (compare relationship health across segments)
   - Trend forecasting (predict future health based on patterns)
   - Benchmark against industry averages

## Dependencies

- `@nestjs/common` - NestJS framework
- `PrismaService` - Database access
- Email Intelligence services (classifier, extractor, auto-creator)

## Status

✅ **COMPLETE** - Ready for integration and testing

All files created, schema updated, TypeScript compilation successful.
