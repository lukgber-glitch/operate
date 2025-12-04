# Cost Tracking Module (OP-060)

## Overview

The Cost Tracking Module provides comprehensive cost monitoring and reporting for automation operations, AI services, and other platform features. It enables organizations to track, analyze, and control operational costs in real-time.

## Features

- **Cost Entry Recording**: Track individual cost transactions with detailed metadata
- **Category Breakdown**: Organize costs by type (AI Classification, API Calls, Storage, etc.)
- **Automation Tracking**: Monitor costs per automation workflow
- **Historical Analysis**: Query costs over custom date ranges
- **Real-time Aggregation**: Get instant cost summaries and breakdowns
- **Flexible Filtering**: Filter by category, automation, date range

## Architecture

```
costs/
├── costs.module.ts           # NestJS module definition
├── costs.controller.ts       # REST API endpoints
├── costs.service.ts          # Business logic
├── costs.repository.ts       # Database access layer
├── dto/                      # Data transfer objects
│   ├── create-cost-entry.dto.ts
│   ├── cost-entry-response.dto.ts
│   ├── cost-query.dto.ts
│   └── cost-summary.dto.ts
└── index.ts                  # Module exports
```

## Database Schema

### CostEntry Model

```prisma
model CostEntry {
  id           String       @id @default(uuid())
  orgId        String       @map("org_id")
  category     CostCategory
  amount       Decimal      @db.Decimal(10, 4)
  currency     String       @default("EUR")
  description  String?
  automationId String?      @map("automation_id")
  metadata     Json?
  createdAt    DateTime     @default(now()) @map("created_at")

  organisation Organisation @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("cost_entries")
  @@index([orgId, createdAt])
  @@index([category])
  @@index([automationId])
}
```

### Cost Categories

- `AI_CLASSIFICATION` - AI-powered transaction classification
- `AI_SUGGESTION` - AI-generated suggestions and insights
- `API_CALL` - External API calls (ELSTER, VIES, etc.)
- `STORAGE` - Document and data storage costs
- `EXPORT` - Report generation and exports
- `OTHER` - Miscellaneous costs

## API Endpoints

### POST /api/v1/organisations/:orgId/costs
Record a new cost entry.

**Request Body:**
```json
{
  "category": "AI_CLASSIFICATION",
  "amount": 0.0025,
  "currency": "EUR",
  "description": "AI classification of invoice #INV-2024-001",
  "automationId": "auto-001",
  "metadata": {
    "model": "gpt-4",
    "tokens": 1500,
    "duration_ms": 250
  }
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "orgId": "org-123",
  "category": "AI_CLASSIFICATION",
  "amount": 0.0025,
  "currency": "EUR",
  "description": "AI classification of invoice #INV-2024-001",
  "automationId": "auto-001",
  "metadata": { ... },
  "createdAt": "2024-11-29T10:30:00Z"
}
```

### GET /api/v1/organisations/:orgId/costs
List cost entries with pagination and filtering.

**Query Parameters:**
- `category` - Filter by cost category
- `automationId` - Filter by automation ID
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 50)

**Response:**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 350,
    "page": 1,
    "pageSize": 50,
    "totalPages": 7
  }
}
```

### GET /api/v1/organisations/:orgId/costs/summary
Get aggregated cost summary.

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)

**Response:**
```json
{
  "totalAmount": 125.50,
  "totalEntries": 350,
  "currency": "EUR",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "byCategory": [
    {
      "category": "AI_CLASSIFICATION",
      "totalAmount": 45.25,
      "count": 150,
      "percentage": 36.05
    }
  ],
  "byAutomation": [
    {
      "automationId": "auto-001",
      "totalAmount": 30.50,
      "count": 100
    }
  ],
  "averageCostPerEntry": 0.36
}
```

### GET /api/v1/organisations/:orgId/costs/by-category
Get cost breakdown by category.

### GET /api/v1/organisations/:orgId/costs/by-automation
Get cost breakdown by automation.

## Usage Examples

### Recording a Cost Entry

```typescript
import { CostsService } from '@/modules/costs';

// Inject the service
constructor(private costsService: CostsService) {}

// Record an AI classification cost
await this.costsService.create(orgId, {
  category: CostCategory.AI_CLASSIFICATION,
  amount: 0.0025,
  description: 'AI classification of transaction',
  automationId: 'auto-classification-001',
  metadata: {
    model: 'claude-3-sonnet',
    tokens: 1500,
    confidence: 0.95
  }
});
```

### Querying Cost Data

```typescript
// Get costs for the current month
const summary = await this.costsService.getSummary(
  orgId,
  '2024-11-01',
  '2024-11-30'
);

console.log(`Total costs: ${summary.totalAmount} ${summary.currency}`);
console.log(`Average per entry: ${summary.averageCostPerEntry}`);

// Get category breakdown
const byCategory = await this.costsService.getCostsByCategory(
  orgId,
  '2024-11-01',
  '2024-11-30'
);

byCategory.forEach(cat => {
  console.log(`${cat.category}: ${cat.totalAmount} (${cat.percentage}%)`);
});
```

## Permissions

The module uses RBAC permissions:

- `COSTS_READ` - View cost tracking data and reports
- `COSTS_CREATE` - Record cost entries

These permissions are typically granted to:
- **OWNER**: Full access (read + create)
- **ADMIN**: Full access (read + create)
- **MANAGER**: Read-only access

## Integration Points

### AI Module
Record costs for AI operations:
```typescript
await this.costsService.create(orgId, {
  category: CostCategory.AI_CLASSIFICATION,
  amount: calculateAICost(tokens, model),
  metadata: { model, tokens, latency }
});
```

### Compliance Module
Track export generation costs:
```typescript
await this.costsService.create(orgId, {
  category: CostCategory.EXPORT,
  amount: 0.05,
  description: 'GoBD export generation'
});
```

### Integration Hub
Monitor external API call costs:
```typescript
await this.costsService.create(orgId, {
  category: CostCategory.API_CALL,
  amount: 0.01,
  description: 'VIES VAT validation',
  metadata: { provider: 'VIES', responseTime: 250 }
});
```

## Performance Considerations

1. **Indexing**: The module uses composite indexes on `(orgId, createdAt)` for efficient querying
2. **Aggregation**: Uses native Prisma `groupBy` for high-performance aggregations
3. **Pagination**: All list endpoints support pagination to handle large datasets
4. **Caching**: Consider adding Redis caching for frequently accessed summaries

## Migration

To apply the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add-cost-tracking

# Apply to production
npx prisma migrate deploy
```

## Testing

```bash
# Unit tests
npm test costs

# E2E tests
npm test:e2e costs

# Test coverage
npm test:cov costs
```

## Future Enhancements

- Budget alerts and thresholds (OP-061)
- Cost forecasting and predictions
- Cost allocation across departments
- Integration with billing systems
- Real-time cost dashboards
- Anomaly detection for unusual spending

## Related Tasks

- OP-059: Budget Management (extends this module with budget controls)
- OP-040: AI Classification (primary consumer of cost tracking)
- OP-052: Compliance API (tracks export costs)
