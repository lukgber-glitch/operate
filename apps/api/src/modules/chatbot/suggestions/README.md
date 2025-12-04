# Proactive Suggestions Module

## Overview

The Proactive Suggestions Module provides intelligent, context-aware suggestions to users based on their business data, current activity, and system state. It uses a modular architecture with specialized generators for different business domains.

## Architecture

```
suggestions/
├── suggestion.types.ts                 # Type definitions
├── proactive-suggestions.service.ts    # Main service
├── ai-insights.service.ts              # AI-powered insights
├── suggestions.controller.ts           # REST API
└── generators/
    ├── base.generator.ts               # Abstract base class
    ├── invoice-suggestions.generator.ts
    ├── expense-suggestions.generator.ts
    ├── tax-suggestions.generator.ts
    └── hr-suggestions.generator.ts
```

## Components

### 1. Suggestion Types

The module defines several types of suggestions:

- **QUICK_ACTION**: Actionable suggestions (e.g., "Send reminder")
- **INSIGHT**: Business insights (e.g., "Revenue up 20%")
- **WARNING**: Important alerts (e.g., "3 invoices overdue")
- **TIP**: Helpful tips (e.g., "Did you know...")
- **DEADLINE**: Time-sensitive reminders (e.g., "VAT due in 5 days")
- **OPTIMIZATION**: Efficiency suggestions (e.g., "Could save €200")
- **ANOMALY**: Unusual patterns detected
- **OPPORTUNITY**: New opportunities identified

### 2. Generators

Each generator focuses on a specific business domain:

#### Invoice Suggestions Generator
- Overdue invoices
- Draft invoices pending
- Invoices due soon
- Revenue insights
- Top customers

#### Expense Suggestions Generator
- Pending approvals
- Uncategorized expenses
- Missing receipts
- Expense trends
- Tax-deductible expenses
- Duplicate detection

#### Tax Suggestions Generator
- VAT return deadlines
- Estimated tax liability
- Missing tax documents
- Quarterly reminders

#### HR Suggestions Generator
- Pending leave requests
- Contract expirations
- Probation periods ending

### 3. Main Service

`ProactiveSuggestionsService` orchestrates all generators:

```typescript
// Get suggestions for current context
const suggestions = await suggestionsService.getSuggestions(context);

// Get insights
const insights = await suggestionsService.getInsights(orgId);

// Get deadline reminders
const reminders = await suggestionsService.getDeadlineReminders(orgId);

// Get optimizations
const optimizations = await suggestionsService.getOptimizations(orgId);
```

### 4. AI Insights Service

`AIInsightsService` uses Claude AI for advanced analysis:

```typescript
// Generate AI-powered insights
const insights = await aiInsightsService.generateInsights(orgId);

// Detect anomalies
const anomalies = await aiInsightsService.detectAnomalies(orgId);

// Get personalized recommendations
const recommendations = await aiInsightsService.getPersonalizedRecommendations(
  orgId,
  userId,
);
```

## API Endpoints

### GET /suggestions
Get suggestions for current context

**Query Parameters:**
- `page` (optional): Current page (e.g., "/dashboard", "/invoices")
- `entityId` (optional): Selected entity ID
- `limit` (optional): Max suggestions to return (default: 10)

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sug_001",
      "type": "warning",
      "title": "3 overdue invoices",
      "description": "Invoices INV-001, INV-002, INV-003 are overdue. Total: €4,500",
      "action": {
        "type": "send_reminders",
        "label": "Send Reminders",
        "params": { "invoiceIds": ["..."] }
      },
      "priority": "high",
      "dismissible": true
    }
  ],
  "count": 1
}
```

### GET /suggestions/insights
Get AI-generated business insights

**Response:**
```json
{
  "insights": [
    {
      "id": "insight_001",
      "title": "Monthly Revenue",
      "description": "Current month revenue: €12,500",
      "trend": "up",
      "value": 12500,
      "comparison": "18.0% vs last month (€10,600)"
    }
  ]
}
```

### GET /suggestions/deadlines
Get deadline reminders

**Response:**
```json
{
  "reminders": [
    {
      "id": "reminder_001",
      "title": "Q4 VAT return due soon",
      "description": "Q4 VAT return due Jan 10, 2024 (in 5 days)",
      "dueDate": "2024-01-10T00:00:00Z",
      "daysRemaining": 5,
      "type": "vat_return",
      "severity": "high"
    }
  ]
}
```

### GET /suggestions/optimizations
Get optimization suggestions

**Response:**
```json
{
  "optimizations": [
    {
      "id": "opt_001",
      "title": "Tax-deductible expenses identified",
      "description": "You have €5,200 in tax-deductible expenses this year",
      "potentialSaving": 1560,
      "effort": "low",
      "category": "tax-optimization"
    }
  ]
}
```

### POST /suggestions/:id/dismiss
Dismiss a suggestion

**Body:**
```json
{
  "reason": "Not relevant"
}
```

### POST /suggestions/refresh
Force refresh suggestions (invalidate cache)

## Caching Strategy

- Suggestions are cached for **5 minutes**
- Insights are cached for **10 minutes**
- Reminders are cached for **1 hour**
- Optimizations are cached for **30 minutes**

Cache is automatically invalidated when:
- User performs an action
- User dismisses a suggestion
- Explicit refresh is requested

## Adding New Generators

To add a new suggestion generator:

1. Create a new generator class extending `BaseSuggestionGenerator`:

```typescript
@Injectable()
export class MySuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    const suggestions: Suggestion[] = [];

    // Your logic here

    return {
      suggestions,
      insights: [],
      reminders: [],
      optimizations: [],
    };
  }
}
```

2. Register the generator in `ProactiveSuggestionsService`:

```typescript
constructor(
  // ... other dependencies
  private readonly myGenerator: MySuggestionsGenerator,
) {
  this.generators = [
    // ... existing generators
    this.myGenerator,
  ];
}
```

3. Add the generator to the module providers in `chatbot.module.ts`

## Example Suggestions

### Warning: Overdue Invoices
```typescript
{
  id: 'sug_001',
  type: 'warning',
  title: '3 overdue invoices',
  description: 'Invoices INV-001, INV-002, INV-003 are overdue. Total: €4,500',
  action: {
    type: 'send_reminders',
    label: 'Send Reminders',
    params: { invoiceIds: ['inv1', 'inv2', 'inv3'] }
  },
  priority: 'high',
  dismissible: true
}
```

### Insight: Revenue Growth
```typescript
{
  id: 'insight_001',
  type: 'insight',
  title: 'Revenue increased',
  description: 'Revenue up 18% compared to last month (€12,500 vs €10,600)',
  priority: 'medium',
  dismissible: true
}
```

### Deadline: VAT Return
```typescript
{
  id: 'deadline_001',
  type: 'deadline',
  title: 'VAT return due soon',
  description: 'Q4 VAT return due in 5 days (Jan 10, 2024)',
  action: {
    type: 'prepare_vat',
    label: 'Prepare VAT Return',
    params: { quarter: 'Q4' }
  },
  priority: 'high',
  dismissible: false
}
```

### Quick Action: Pending Approvals
```typescript
{
  id: 'action_001',
  type: 'quick_action',
  title: '5 expenses pending approval',
  description: 'You have 5 expenses waiting for approval (total: €2,340)',
  action: {
    type: 'review_expenses',
    label: 'Review Now',
    params: { path: '/expenses?status=pending' }
  },
  priority: 'medium',
  dismissible: true
}
```

## Performance Considerations

1. **Batch Queries**: All generators use batch queries to minimize database round-trips
2. **Parallel Execution**: Generators run in parallel for faster response times
3. **Caching**: Aggressive caching reduces repeated calculations
4. **Error Isolation**: Each generator is wrapped in error handling to prevent cascade failures
5. **Lazy Loading**: AI insights are only generated when explicitly requested

## Future Enhancements

- [ ] Machine learning for suggestion prioritization
- [ ] User feedback loop for suggestion quality
- [ ] A/B testing for suggestion effectiveness
- [ ] Webhooks for real-time suggestion delivery
- [ ] Email/SMS notifications for critical suggestions
- [ ] Custom suggestion rules per organization
- [ ] Integration with external data sources
- [ ] Predictive analytics (forecast future issues)

## Dependencies

- `@nestjs/common` - NestJS framework
- `@prisma/client` - Database ORM
- `claude.service.ts` - AI integration
- `context.service.ts` - Context awareness
- `redis.service.ts` - Caching layer

## Testing

```bash
# Unit tests
npm run test suggestions

# Integration tests
npm run test:e2e suggestions

# Test specific generator
npm run test invoice-suggestions.generator
```

## License

Copyright © 2024 Operate/CoachOS. All rights reserved.
