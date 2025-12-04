# Context-Aware Suggestions Service

## Overview

The Suggestions Service provides intelligent, context-aware recommendations to users based on their current page, pending actions, and behavioral patterns. It analyzes the user's context in real-time and generates actionable suggestions to improve workflow efficiency.

## Architecture

### Files Created

1. **suggestions.dto.ts** - Data Transfer Objects for suggestions API
2. **suggestions.service.ts** - Core service managing suggestion lifecycle
3. **suggestions.controller.ts** - REST API endpoints
4. **context-analyzer.service.ts** - Context analysis and suggestion generation

### Integration

The service is integrated into the existing `chatbot.module.ts` and uses:
- **PrismaService** - Database operations
- **CacheService** - 5-minute caching of suggestions
- **Suggestion model** - From Prisma schema

## API Endpoints

### 1. GET /suggestions
Get suggestions for the current context.

**Query Parameters:**
- `context` (optional) - Context path (e.g., "finance.invoices")
- `limit` (optional) - Max suggestions (default: 5)
- `minPriority` (optional) - Minimum priority (LOW, MEDIUM, HIGH, URGENT)

**Response:** Array of `SuggestionDto`

### 2. GET /suggestions/:context
Get suggestions for a specific page context.

**Example:** `GET /suggestions/finance.invoices`

### 3. POST /suggestions/:id/apply
Execute a suggestion action.

**Body:** `ApplySuggestionDto` (optional params)

**Response:**
```json
{
  "success": true,
  "result": {
    "action": "navigate",
    "path": "/finance/invoices",
    "filter": "overdue"
  }
}
```

### 4. POST /suggestions/:id/dismiss
Dismiss a suggestion.

**Body:** `DismissSuggestionDto` (optional reason)

**Response:**
```json
{
  "success": true
}
```

### 5. POST /suggestions/:id/viewed
Mark a suggestion as viewed (for analytics).

## Context Types Handled

### 1. Finance - Invoices (`finance.invoices`)

**Example Suggestions:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "INVOICE_REMINDER",
    "priority": "HIGH",
    "title": "3 Overdue Invoices",
    "description": "You have 3 invoices past their due date. Send reminders to clients.",
    "actionLabel": "Send Reminders",
    "actionType": "navigate",
    "actionParams": {
      "path": "/finance/invoices",
      "filter": "overdue"
    },
    "entityType": "invoice",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.95
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "OPTIMIZATION",
    "priority": "MEDIUM",
    "title": "5 Draft Invoices",
    "description": "Complete and send 5 draft invoices to improve cash flow.",
    "actionLabel": "Review Drafts",
    "actionType": "navigate",
    "actionParams": {
      "path": "/finance/invoices",
      "filter": "draft"
    },
    "entityType": "invoice",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.88
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "type": "CASH_FLOW",
    "priority": "MEDIUM",
    "title": "Payment Terms Review",
    "description": "Consider updating payment terms for clients with frequent late payments.",
    "actionLabel": "Review Terms",
    "actionType": "open_chat",
    "actionParams": {
      "topic": "payment_terms_optimization"
    },
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.75
  }
]
```

### 2. Finance - Expenses (`finance.expenses`)

**Example Suggestions:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "type": "EXPENSE_ANOMALY",
    "priority": "MEDIUM",
    "title": "12 Uncategorized Expenses",
    "description": "Categorize 12 expenses for accurate tax reporting.",
    "actionLabel": "Categorize Now",
    "actionType": "navigate",
    "actionParams": {
      "path": "/finance/expenses",
      "filter": "uncategorized"
    },
    "entityType": "expense",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.92
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "type": "COMPLIANCE",
    "priority": "HIGH",
    "title": "4 Missing Receipts",
    "description": "Upload receipts for 4 expenses over €150 to remain compliant.",
    "actionLabel": "Upload Receipts",
    "actionType": "navigate",
    "actionParams": {
      "path": "/finance/expenses",
      "filter": "missing_receipts"
    },
    "entityType": "expense",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.98
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440012",
    "type": "OPTIMIZATION",
    "priority": "LOW",
    "title": "Export for Tax",
    "description": "Export categorized expenses for quarterly tax preparation.",
    "actionLabel": "Export Now",
    "actionType": "api_call",
    "actionParams": {
      "endpoint": "/finance/expenses/export",
      "format": "csv",
      "period": "Q4"
    },
    "entityType": "expense",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.82
  }
]
```

### 3. HR - Employees (`hr.employees`)

**Example Suggestions:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "type": "CLIENT_FOLLOWUP",
    "priority": "MEDIUM",
    "title": "2 Pending Leave Requests",
    "description": "Review and approve/reject 2 leave requests.",
    "actionLabel": "Review Requests",
    "actionType": "navigate",
    "actionParams": {
      "path": "/hr/leave-requests",
      "filter": "pending"
    },
    "entityType": "leave_request",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.96
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "type": "COMPLIANCE",
    "priority": "HIGH",
    "title": "Contract Renewal Due",
    "description": "3 employee contracts expire within 30 days. Review and renew.",
    "actionLabel": "View Contracts",
    "actionType": "navigate",
    "actionParams": {
      "path": "/hr/contracts",
      "filter": "expiring"
    },
    "entityType": "contract",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.94
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440022",
    "type": "INSIGHT",
    "priority": "LOW",
    "title": "Performance Reviews",
    "description": "Quarterly performance reviews are due for 5 employees.",
    "actionLabel": "Schedule Reviews",
    "actionType": "open_chat",
    "actionParams": {
      "topic": "schedule_performance_reviews"
    },
    "entityType": "employee",
    "createdAt": "2025-12-01T19:00:00Z",
    "confidence": 0.78
  }
]
```

## Features

### 1. Context Analysis
- Parses page paths (e.g., `/finance/invoices` → `finance.invoices`)
- Identifies pending actions based on database state
- Detects urgency and priority levels
- Tracks user patterns for personalization

### 2. Smart Caching
- 5-minute cache TTL for performance
- Automatic cache invalidation on actions
- Pattern-based cache key generation

### 3. Priority Ranking
Suggestions are ranked by priority:
- **URGENT** - Immediate action required (tax deadlines, compliance)
- **HIGH** - Important but not time-critical (missing receipts, overdue invoices)
- **MEDIUM** - Should be addressed soon (uncategorized expenses, draft invoices)
- **LOW** - Nice to have (notifications, insights)

### 4. Action Types
- **navigate** - Redirect to specific page with filters
- **api_call** - Execute backend action
- **open_chat** - Open chatbot with specific context

### 5. Learning & Analytics
- Tracks suggestion acceptance rates
- Records dismissal reasons for improvement
- Monitors view counts and engagement

## Database Schema

Uses the `Suggestion` model from Prisma:

```prisma
model Suggestion {
  id          String             @id @default(uuid())
  orgId       String
  userId      String?

  type        SuggestionType
  priority    SuggestionPriority @default(MEDIUM)
  title       String
  description String
  actionLabel String?

  entityType   String?
  entityId     String?
  data         Json?

  actionType   String?
  actionParams Json?

  status       SuggestionStatus @default(PENDING)
  viewedAt     DateTime?
  actedAt      DateTime?
  dismissedAt  DateTime?
  dismissReason String?

  showAfter  DateTime @default(now())
  expiresAt  DateTime?

  confidence Decimal? @db.Decimal(3, 2)
  model      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orgId])
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([priority])
}
```

## Usage Example

### Frontend Integration

```typescript
// Get suggestions for current page
const suggestions = await fetch('/api/suggestions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    page: '/finance/invoices',
    filters: { status: 'overdue' },
  }),
});

// Apply a suggestion
const result = await fetch(`/api/suggestions/${suggestionId}/apply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

if (result.result.action === 'navigate') {
  router.push(result.result.path);
}

// Dismiss a suggestion
await fetch(`/api/suggestions/${suggestionId}/dismiss`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reason: 'Already handled',
  }),
});
```

## Future Enhancements

1. **ML-Based Personalization**
   - Analyze user patterns from ChatMessage history
   - Learn from acceptance/dismissal rates
   - Predict most relevant suggestions

2. **Time-Based Suggestions**
   - Show different suggestions at different times (morning vs evening)
   - Recurring suggestions (weekly, monthly tasks)

3. **Cross-Context Suggestions**
   - Suggest related actions across modules
   - "While you're here" recommendations

4. **Batch Actions**
   - Apply multiple suggestions at once
   - Bulk dismiss similar suggestions

5. **Custom Suggestion Rules**
   - Allow admins to create org-specific suggestion rules
   - Template library for common workflows

## Testing

```bash
# Unit tests
pnpm test suggestions.service.spec.ts
pnpm test context-analyzer.service.spec.ts

# Integration tests
pnpm test:e2e suggestions.e2e-spec.ts
```

## Monitoring

Track key metrics:
- Suggestion acceptance rate
- Time to action
- Most valuable suggestion types
- Context coverage
- Cache hit rate
