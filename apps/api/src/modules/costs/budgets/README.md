# Budget Management System

## Overview

The Budget Management System provides comprehensive cost control with threshold alerts, circuit breakers, and automatic pausing capabilities. It integrates with the Cost Tracking system (OP-060) to monitor and enforce budget limits across all cost categories.

## Features

- **Budget Creation**: Set spending limits for specific cost categories or organization-wide
- **Threshold Alerts**: Warning (default 80%) and Critical (default 95%) threshold notifications
- **Automatic Pausing**: Circuit breaker pattern to halt operations when budget is exceeded
- **Real-time Monitoring**: Track current spend against budget limits
- **Alert Management**: Acknowledge and track budget alerts
- **Period-based**: Support for DAILY, WEEKLY, MONTHLY, and YEARLY budget periods

## API Endpoints

### Budget Management

```
POST   /api/v1/budgets              # Create a new budget
GET    /api/v1/budgets              # List all budgets
GET    /api/v1/budgets/:id          # Get budget details
PATCH  /api/v1/budgets/:id          # Update a budget
DELETE /api/v1/budgets/:id          # Delete a budget
POST   /api/v1/budgets/:id/pause    # Pause a budget
POST   /api/v1/budgets/:id/resume   # Resume a paused budget
```

### Alert Management

```
GET  /api/v1/budgets/:id/alerts                     # Get budget alerts
POST /api/v1/budgets/:id/alerts/:alertId/acknowledge # Acknowledge an alert
```

## Usage Examples

### 1. Create a Monthly AI Budget

```typescript
const budget = await budgetsService.create(orgId, {
  name: 'AI Operations Monthly Budget',
  category: CostCategory.AI_CLASSIFICATION,
  limitAmount: 1000.0,
  currency: 'EUR',
  period: BudgetPeriod.MONTHLY,
  warningThreshold: 0.8,  // Alert at 80%
  criticalThreshold: 0.95, // Critical alert at 95%
  autoPause: true,         // Auto-pause when exceeded
  periodStart: '2024-12-01T00:00:00Z',
  periodEnd: '2024-12-31T23:59:59Z',
});
```

### 2. Check Budget Before Incurring Cost

```typescript
const result = await budgetsService.canIncurCost(
  orgId,
  CostCategory.AI_CLASSIFICATION,
  0.05 // Cost amount
);

if (!result.allowed) {
  throw new Error(result.reason);
}
```

### 3. Record a Cost and Update Budget

```typescript
// This automatically checks thresholds and creates alerts
await budgetsService.recordCost(
  orgId,
  CostCategory.AI_CLASSIFICATION,
  0.05
);
```

### 4. Use Budget Check Guard on Endpoints

```typescript
import { CheckBudget } from '../costs/guards';
import { CostCategory } from '@prisma/client';

@Controller('ai')
export class AIController {
  @Post('classify')
  @CheckBudget(CostCategory.AI_CLASSIFICATION, 'estimatedCost')
  async classifyDocument(@Body() dto: ClassifyDto) {
    // This endpoint will be blocked if budget is exceeded
    // 'estimatedCost' is the field in dto that contains the cost amount
  }
}
```

## Integration with Cost Tracking

The Budget Management System integrates seamlessly with the Cost Tracking module:

```typescript
// In your service that creates costs:
import { BudgetsService } from '../costs/budgets';

export class MyService {
  constructor(private budgetsService: BudgetsService) {}

  async performAIOperation(orgId: string) {
    const estimatedCost = 0.05;

    // 1. Check if operation is allowed
    const check = await this.budgetsService.canIncurCost(
      orgId,
      CostCategory.AI_CLASSIFICATION,
      estimatedCost
    );

    if (!check.allowed) {
      throw new Error(`Operation blocked: ${check.reason}`);
    }

    // 2. Perform the operation
    const result = await this.aiService.classify(...);

    // 3. Record the actual cost
    await this.budgetsService.recordCost(
      orgId,
      CostCategory.AI_CLASSIFICATION,
      result.actualCost
    );

    return result;
  }
}
```

## Budget Lifecycle

### Status Flow

```
OK → WARNING → CRITICAL → EXCEEDED → PAUSED (if autoPause enabled)
```

- **OK**: Current spend < warning threshold
- **WARNING**: Current spend >= warning threshold (default 80%)
- **CRITICAL**: Current spend >= critical threshold (default 95%)
- **EXCEEDED**: Current spend >= 100% of limit
- **PAUSED**: Budget exceeded and auto-pause enabled

### Alert Types

1. **WARNING**: Triggered when warning threshold is reached
   - Default: 80% of budget
   - Creates warning alert (one per hour to avoid spam)

2. **CRITICAL**: Triggered when critical threshold is reached
   - Default: 95% of budget
   - Creates critical alert (one per hour to avoid spam)

3. **PAUSED**: Triggered when auto-pause is activated
   - Budget limit exceeded
   - Operations are blocked until budget is manually resumed

## Cost Categories

The system supports the following cost categories:

- `AI_CLASSIFICATION`: AI-powered classification operations
- `AI_SUGGESTION`: AI-generated suggestions
- `API_CALL`: External API calls
- `STORAGE`: Storage costs
- `EXPORT`: Data export operations
- `OTHER`: Miscellaneous costs

You can create budgets for specific categories or leave `category` as `null` for organization-wide budgets.

## Budget Periods

- `DAILY`: Budget resets daily
- `WEEKLY`: Budget resets weekly
- `MONTHLY`: Budget resets monthly
- `YEARLY`: Budget resets yearly

**Note**: Budget reset is managed by specifying `periodStart` and `periodEnd` dates. You need to create new budgets for new periods or update existing ones.

## Thresholds

Thresholds are expressed as decimals between 0 and 1:

- `0.80` = 80% of budget limit
- `0.95` = 95% of budget limit
- `1.00` = 100% of budget limit

## Circuit Breaker Pattern

When `autoPause` is enabled:

1. Budget is monitored in real-time
2. When spend >= limit, budget is automatically paused
3. All operations requiring this budget are blocked
4. A PAUSED alert is created
5. Budget must be manually resumed via API

This prevents runaway costs and ensures operations stop when limits are exceeded.

## Best Practices

1. **Set Realistic Limits**: Base limits on historical usage patterns
2. **Configure Thresholds**: Adjust warning/critical thresholds based on risk tolerance
3. **Enable Auto-Pause**: For critical systems, enable auto-pause to prevent overruns
4. **Monitor Alerts**: Set up notification systems to alert on WARNING/CRITICAL states
5. **Regular Reviews**: Review budget usage weekly/monthly and adjust as needed
6. **Multiple Budgets**: Create category-specific budgets for fine-grained control
7. **Test Budget Checks**: Use the guard in development to ensure proper integration

## Database Schema

### Budget Table

```prisma
model Budget {
  id                String         @id @default(uuid())
  orgId             String
  name              String
  category          CostCategory?  // null = all categories
  limitAmount       Decimal
  currency          String
  period            BudgetPeriod
  warningThreshold  Decimal        @default(0.80)
  criticalThreshold Decimal        @default(0.95)
  autoPause         Boolean        @default(false)
  isPaused          Boolean        @default(false)
  currentSpend      Decimal        @default(0)
  periodStart       DateTime
  periodEnd         DateTime
  createdAt         DateTime
  updatedAt         DateTime
}
```

### BudgetAlert Table

```prisma
model BudgetAlert {
  id           String    @id @default(uuid())
  budgetId     String
  type         AlertType // WARNING, CRITICAL, PAUSED
  threshold    Decimal
  currentSpend Decimal
  message      String
  acknowledged Boolean   @default(false)
  createdAt    DateTime
}
```

## Testing

```bash
# Run Prisma migration
cd packages/database
npx prisma migrate dev --name add-budget-management

# Run tests (when implemented)
npm test -- budgets
```

## Troubleshooting

### Budget not enforcing limits
- Check if budget period is active (periodStart <= now <= periodEnd)
- Verify budget is not paused
- Ensure category matches the cost being tracked

### Alerts not being created
- Alerts are rate-limited to one per hour per type
- Check threshold values are correct (0.0-1.0 range)
- Verify currentSpend is being updated correctly

### Auto-pause not working
- Ensure `autoPause` is set to `true`
- Check that budget limit has actually been exceeded
- Verify budget is not already paused

## Related Modules

- **Cost Tracking** (OP-060): Records costs that budgets monitor
- **Notifications** (OP-066): Can integrate with alerts for real-time notifications
- **Reports** (OP-068): Budget reports and analytics
