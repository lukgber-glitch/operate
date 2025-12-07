# Relationship Metrics Migration Instructions

## Overview
This migration adds the `RelationshipMetrics` model to track customer and vendor relationship health based on email communication patterns.

## Files Created/Modified

### New Files
1. `apps/api/src/modules/ai/email-intelligence/types/relationship-metrics.types.ts` - Type definitions
2. `apps/api/src/modules/ai/email-intelligence/relationship-tracker.service.ts` - Main service

### Modified Files
1. `packages/database/prisma/schema.prisma` - Added RelationshipMetrics model
2. `apps/api/src/modules/ai/email-intelligence/email-intelligence.module.ts` - Added service provider/export
3. `apps/api/src/modules/ai/email-intelligence/index.ts` - Added exports

## Database Migration Steps

### 1. Generate Prisma Migration

```bash
cd packages/database
npx prisma migrate dev --name add-relationship-metrics
```

This will create a new migration file with the following SQL:

```sql
-- CreateTable
CREATE TABLE "RelationshipMetrics" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipMetrics_organisationId_idx" ON "RelationshipMetrics"("organisationId");

-- CreateIndex
CREATE INDEX "RelationshipMetrics_healthScore_idx" ON "RelationshipMetrics"("healthScore");

-- CreateIndex
CREATE INDEX "RelationshipMetrics_healthStatus_idx" ON "RelationshipMetrics"("healthStatus");

-- CreateIndex
CREATE INDEX "RelationshipMetrics_lastUpdated_idx" ON "RelationshipMetrics"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipMetrics_entityId_entityType_organisationId_key" ON "RelationshipMetrics"("entityId", "entityType", "organisationId");

-- AddForeignKey
ALTER TABLE "RelationshipMetrics" ADD CONSTRAINT "RelationshipMetrics_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 2. Generate Prisma Client

```bash
cd packages/database
npx prisma generate
```

### 3. Run Tests

```bash
cd apps/api
npm run test -- relationship-tracker
```

## Schema Details

### RelationshipMetrics Model

- **id**: Unique identifier
- **entityId**: ID of Customer or Vendor
- **entityType**: "CUSTOMER" or "VENDOR"
- **organisationId**: Foreign key to Organisation
- **metrics**: JSON blob containing all relationship metrics
- **healthScore**: Integer 0-100 (indexed for fast queries)
- **healthStatus**: String enum (EXCELLENT/GOOD/NEEDS_ATTENTION/AT_RISK/DORMANT)
- **createdAt**: Timestamp when first created
- **lastUpdated**: Timestamp when last calculated

### Indexes

- `organisationId` - For querying all relationships in an org
- `healthScore` - For finding best/worst relationships
- `healthStatus` - For filtering by status
- `lastUpdated` - For finding stale metrics

### Unique Constraint

- `(entityId, entityType, organisationId)` - One metrics record per entity per org

## Usage Example

```typescript
import { RelationshipTrackerService } from '@modules/ai/email-intelligence';

// Update metrics after processing an email
const metrics = await relationshipTracker.updateRelationshipMetrics(
  customerId,
  'CUSTOMER',
  email,
  orgId
);

// Get at-risk relationships
const atRisk = await relationshipTracker.getAtRiskRelationships(orgId);

// Get dormant relationships
const dormant = await relationshipTracker.getDormantRelationships(orgId, 90);

// Get summary
const summary = await relationshipTracker.getRelationshipSummary(orgId);
```

## Rollback

If you need to rollback this migration:

```bash
cd packages/database
npx prisma migrate resolve --rolled-back add-relationship-metrics
```

Then manually remove the table:

```sql
DROP TABLE "RelationshipMetrics";
```
