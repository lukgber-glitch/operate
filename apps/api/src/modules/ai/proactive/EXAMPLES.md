# Proactive Suggestions - Usage Examples

This document provides practical examples of how the proactive suggestion system works.

## Table of Contents

1. [Generator Output Examples](#generator-output-examples)
2. [API Usage Examples](#api-usage-examples)
3. [Integration Examples](#integration-examples)
4. [Testing Examples](#testing-examples)

---

## Generator Output Examples

### 1. Bills Due Soon Suggestion

```typescript
{
  id: "sug_bill_due_soon_org-123_1733658000",
  type: "deadline",
  priority: "high",
  title: "3 bills due within 7 days",
  description: "3 unpaid bills (total: €2,450.00) will be due within the next week.",
  action: {
    type: "navigate",
    label: "Review Bills",
    params: { path: "/bills?status=pending&due_soon=true" }
  },
  dismissible: true,
  metadata: {
    entityType: "bill",
    count: 3,
    totalAmount: 2450.00,
    billIds: ["bill-1", "bill-2", "bill-3"]
  }
}
```

### 2. Overdue Bills Warning

```typescript
{
  id: "sug_bill_overdue_org-123_1733658000",
  type: "warning",
  priority: "high",
  title: "5 overdue bills",
  description: "Bills from Acme Corp, Tech Solutions, Office Supplies are overdue by 12 days. Total: €5,890.50",
  action: {
    type: "pay_bills",
    label: "Pay Bills",
    params: { billIds: ["bill-4", "bill-5", "bill-6", "bill-7", "bill-8"] },
    confirmation: true
  },
  dismissible: false, // High priority, can't dismiss
  metadata: {
    entityType: "bill",
    count: 5,
    totalAmount: 5890.50,
    billIds: ["bill-4", "bill-5", "bill-6", "bill-7", "bill-8"],
    daysOverdue: 12
  }
}
```

### 3. Unreconciled Transactions

```typescript
{
  id: "sug_bank_unreconciled_org-123_1733658000",
  type: "warning",
  priority: "medium",
  title: "43 unreconciled transactions",
  description: "You have 43 unreconciled bank transactions from the last 30 days totaling €12,345.67. Keep your books accurate by reconciling them.",
  action: {
    type: "navigate",
    label: "Reconcile Now",
    params: { path: "/banking?view=unreconciled" }
  },
  dismissible: true,
  metadata: {
    entityType: "bank_transaction",
    count: 43,
    totalAmount: 12345.67
  }
}
```

### 4. Bank Connection Health Insight

```typescript
{
  id: "sug_insight_healthy_connections_org-123_1733658000",
  title: "Bank Connections Healthy",
  description: "All 3 bank accounts are connected and syncing properly.",
  icon: "check",
  trend: "up",
  metadata: {
    connectionCount: 2,
    accountCount: 3
  }
}
```

### 5. Duplicate Bills Detected

```typescript
{
  id: "sug_bill_duplicate_bill-10_bill-11_1733658000",
  type: "anomaly",
  priority: "medium",
  title: "Potential duplicate bills detected",
  description: "Bills INV-2024-001 and INV-2024-002 from Acme Corp have the same amount (€599.00) and similar due dates. Please review.",
  action: {
    type: "navigate",
    label: "Review Bills",
    params: { path: "/bills/bill-10" }
  },
  dismissible: true,
  metadata: {
    entityType: "bill",
    billIds: ["bill-10", "bill-11"],
    vendor: "Acme Corp",
    amount: 599.00
  }
}
```

---

## API Usage Examples

### 1. Get Suggestions for Current Context

**Request:**
```http
GET /api/chat/suggestions?page=dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sug_bill_overdue_org-123_1733658000",
        "type": "warning",
        "priority": "high",
        "title": "5 overdue bills",
        "description": "Bills from Acme Corp, Tech Solutions, Office Supplies are overdue by 12 days. Total: €5,890.50",
        "action": {
          "type": "pay_bills",
          "label": "Pay Bills",
          "params": { "billIds": ["bill-4", "bill-5", "bill-6", "bill-7", "bill-8"] },
          "confirmation": true
        },
        "dismissible": false,
        "metadata": {
          "entityType": "bill",
          "count": 5,
          "totalAmount": 5890.50,
          "daysOverdue": 12
        },
        "createdAt": "2025-12-08T08:00:00Z"
      },
      {
        "id": "sug_bill_due_soon_org-123_1733658000",
        "type": "deadline",
        "priority": "high",
        "title": "3 bills due within 7 days",
        "description": "3 unpaid bills (total: €2,450.00) will be due within the next week.",
        "action": {
          "type": "navigate",
          "label": "Review Bills",
          "params": { "path": "/bills?status=pending&due_soon=true" }
        },
        "dismissible": true,
        "createdAt": "2025-12-08T08:00:00Z"
      },
      {
        "id": "sug_bank_unreconciled_org-123_1733658000",
        "type": "warning",
        "priority": "medium",
        "title": "43 unreconciled transactions",
        "description": "You have 43 unreconciled bank transactions from the last 30 days totaling €12,345.67",
        "action": {
          "type": "navigate",
          "label": "Reconcile Now",
          "params": { "path": "/banking?view=unreconciled" }
        },
        "dismissible": true,
        "createdAt": "2025-12-08T08:00:00Z"
      }
    ],
    "count": 3
  }
}
```

### 2. Get Business Insights

**Request:**
```http
GET /api/chat/suggestions/insights
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "sug_insight_healthy_connections_org-123_1733658000",
        "title": "Bank Connections Healthy",
        "description": "All 3 bank accounts are connected and syncing properly.",
        "icon": "check",
        "trend": "up",
        "metadata": {
          "connectionCount": 2,
          "accountCount": 3
        }
      },
      {
        "id": "sug_insight_revenue_org-123_1733658000",
        "title": "Monthly Revenue",
        "description": "Current month revenue: €45,678.90",
        "trend": "up",
        "value": 45678.90,
        "comparison": "12.3% vs last month (€40,650.20)",
        "icon": "trending-up",
        "period": "month"
      }
    ]
  }
}
```

### 3. Get Deadline Reminders

**Request:**
```http
GET /api/chat/suggestions/reminders
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "sug_reminder_bill_bill-20_1733658000",
        "title": "Bill INV-2024-034 due in 2 days",
        "description": "Payment to Acme Corp (€1,299.00) is due on 10.12.2025",
        "dueDate": "2025-12-10T00:00:00Z",
        "daysRemaining": 2,
        "type": "invoice_due",
        "severity": "high",
        "action": {
          "type": "pay_bill",
          "label": "Pay Now",
          "params": { "billId": "bill-20" },
          "confirmation": true
        }
      },
      {
        "id": "sug_reminder_tax_vat-q4_1733658000",
        "title": "USt-Voranmeldung Q4 2025 ist in 5 Tagen fällig",
        "description": "Die Umsatzsteuer-Voranmeldung für Q4 2025 ist am 10.01.2026 fällig.",
        "dueDate": "2026-01-10T00:00:00Z",
        "daysRemaining": 5,
        "type": "tax_filing",
        "severity": "medium"
      }
    ]
  }
}
```

### 4. Manual Trigger (Testing)

**Request:**
```http
POST /api/chat/suggestions/trigger
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Proactive suggestions generation completed",
  "data": {
    "organizationsProcessed": 25,
    "suggestionsCreated": 142,
    "notificationsSent": 38,
    "durationMs": 4523
  }
}
```

---

## Integration Examples

### 1. Chat UI Integration

```typescript
// components/chat/GreetingHeader.tsx
import { useProactiveSuggestions } from '@/hooks/useProactiveSuggestions';

export function GreetingHeader() {
  const { suggestions, isLoading } = useProactiveSuggestions();

  if (isLoading) return <LoadingSkeleton />;

  // Show top 3 high-priority suggestions
  const topSuggestions = suggestions
    .filter(s => s.priority === 'high')
    .slice(0, 3);

  return (
    <div className="greeting-header">
      <h2>Good morning, Sarah!</h2>

      {topSuggestions.length > 0 && (
        <div className="suggestions-grid">
          {topSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={handleSuggestionAction}
              onDismiss={handleSuggestionDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Dashboard Widget

```typescript
// components/dashboard/ActionableItems.tsx
import { useProactiveSuggestions } from '@/hooks/useProactiveSuggestions';

export function ActionableItemsWidget() {
  const { suggestions } = useProactiveSuggestions({
    page: 'dashboard'
  });

  const urgentItems = suggestions.filter(
    s => s.priority === 'high' && !s.dismissible
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Action Required
          {urgentItems.length > 0 && (
            <Badge variant="destructive">{urgentItems.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {urgentItems.map(item => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.action && (
                <Button
                  size="sm"
                  onClick={() => handleAction(item.action)}
                >
                  {item.action.label}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

### 3. Notification Service Integration

```typescript
// services/notification.service.ts
import { ProactiveSuggestionsService } from '@/modules/chatbot/suggestions';

export class NotificationService {
  async sendDailySummary(userId: string, orgId: string) {
    // Get high-priority suggestions
    const suggestions = await this.proactiveSuggestions.getPageSuggestions(
      'dashboard',
      undefined,
      orgId,
      userId
    );

    const highPriority = suggestions.filter(s => s.priority === 'high');

    if (highPriority.length === 0) {
      return; // No notifications needed
    }

    // Send email with summary
    await this.emailService.send({
      to: userId,
      template: 'daily-summary',
      data: {
        suggestions: highPriority,
        actionUrl: `https://operate.guru/dashboard`
      }
    });

    // Send push notification for urgent items
    const urgent = highPriority.filter(s => !s.dismissible);

    for (const suggestion of urgent) {
      await this.pushService.send({
        userId,
        title: suggestion.title,
        body: suggestion.description,
        data: {
          suggestionId: suggestion.id,
          actionType: suggestion.action?.type
        }
      });
    }
  }
}
```

---

## Testing Examples

### 1. Unit Test for Bills Generator

```typescript
// generators/bills-suggestions.generator.spec.ts
import { Test } from '@nestjs/testing';
import { BillsSuggestionsGenerator } from './bills-suggestions.generator';
import { PrismaService } from '../../../database/prisma.service';

describe('BillsSuggestionsGenerator', () => {
  let generator: BillsSuggestionsGenerator;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BillsSuggestionsGenerator,
        {
          provide: PrismaService,
          useValue: {
            bill: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    generator = module.get(BillsSuggestionsGenerator);
    prisma = module.get(PrismaService);
  });

  describe('checkOverdueBills', () => {
    it('should return suggestion when bills are overdue', async () => {
      // Arrange
      const mockBills = [
        {
          id: 'bill-1',
          billNumber: 'INV-001',
          vendorName: 'Acme Corp',
          totalAmount: 1000,
          currency: 'EUR',
          dueDate: new Date('2025-12-01'),
        },
      ];

      jest.spyOn(prisma.bill, 'findMany').mockResolvedValue(mockBills);

      // Act
      const result = await generator.generate({
        orgId: 'org-123',
      });

      // Assert
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].type).toBe('warning');
      expect(result.suggestions[0].priority).toBe('high');
      expect(result.suggestions[0].title).toContain('overdue');
    });

    it('should return empty when no overdue bills', async () => {
      jest.spyOn(prisma.bill, 'findMany').mockResolvedValue([]);

      const result = await generator.generate({
        orgId: 'org-123',
      });

      expect(result.suggestions).toHaveLength(0);
    });
  });
});
```

### 2. Integration Test

```typescript
// proactive-suggestions.integration.spec.ts
import { Test } from '@nestjs/testing';
import { ProactiveSuggestionsService } from './proactive-suggestions.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { ContextService } from '../context/context.service';
import { BillsSuggestionsGenerator } from './generators/bills-suggestions.generator';

describe('ProactiveSuggestionsService Integration', () => {
  let service: ProactiveSuggestionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProactiveSuggestionsService,
        BillsSuggestionsGenerator,
        // ... other generators
        PrismaService,
        RedisService,
        ContextService,
      ],
    }).compile();

    service = module.get(ProactiveSuggestionsService);
    prisma = module.get(PrismaService);
  });

  it('should generate suggestions from all generators', async () => {
    // Arrange - Set up test data in database
    const orgId = 'test-org-123';
    await createTestBills(prisma, orgId);
    await createTestInvoices(prisma, orgId);

    // Act
    const result = await service.getPageSuggestions(
      'dashboard',
      undefined,
      orgId
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    // Should have suggestions from multiple generators
    const suggestionTypes = new Set(result.map(s => s.type));
    expect(suggestionTypes.size).toBeGreaterThan(1);
  });
});
```

### 3. End-to-End Test

```typescript
// proactive-scheduler.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { ProactiveScheduler } from './proactive.scheduler';
import { PrismaService } from '../../database/prisma.service';

describe('Proactive Scheduler E2E', () => {
  let scheduler: ProactiveScheduler;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // Import full ChatbotModule
      imports: [ChatbotModule],
    }).compile();

    scheduler = module.get(ProactiveScheduler);
    prisma = module.get(PrismaService);
  });

  it('should generate suggestions for all organizations', async () => {
    // Arrange - Create test organizations with data
    const org1 = await createTestOrg(prisma, 'Test Org 1');
    const org2 = await createTestOrg(prisma, 'Test Org 2');

    await createTestBills(prisma, org1.id);
    await createTestInvoices(prisma, org2.id);

    // Act - Run scheduler manually
    await scheduler.generateDailySuggestions();

    // Assert - Check suggestions were created
    const org1Suggestions = await prisma.suggestion.findMany({
      where: { orgId: org1.id },
    });

    const org2Suggestions = await prisma.suggestion.findMany({
      where: { orgId: org2.id },
    });

    expect(org1Suggestions.length).toBeGreaterThan(0);
    expect(org2Suggestions.length).toBeGreaterThan(0);
  });

  it('should not create duplicate suggestions', async () => {
    const orgId = 'test-org-123';

    // Run twice
    await scheduler.generateDailySuggestions();
    await scheduler.generateDailySuggestions();

    // Check for duplicates
    const suggestions = await prisma.suggestion.findMany({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Group by title
    const titleCounts = suggestions.reduce((acc, s) => {
      acc[s.title] = (acc[s.title] || 0) + 1;
      return acc;
    }, {});

    // No title should appear more than once
    Object.values(titleCounts).forEach(count => {
      expect(count).toBe(1);
    });
  });
});
```

---

## Mock Data Examples

### 1. Test Bills

```typescript
const testBills = [
  {
    id: 'bill-1',
    organisationId: 'org-123',
    vendorName: 'Acme Corp',
    billNumber: 'INV-2024-001',
    totalAmount: 1299.00,
    currency: 'EUR',
    status: 'APPROVED',
    dueDate: new Date('2025-12-10'),
    issueDate: new Date('2025-11-25'),
  },
  {
    id: 'bill-2',
    organisationId: 'org-123',
    vendorName: 'Tech Solutions GmbH',
    billNumber: 'B-54321',
    totalAmount: 5499.00,
    currency: 'EUR',
    status: 'PENDING',
    dueDate: new Date('2025-12-01'), // Overdue!
    issueDate: new Date('2025-11-01'),
  },
];
```

### 2. Test Bank Transactions

```typescript
const testTransactions = [
  {
    id: 'tx-1',
    bankAccountId: 'acc-1',
    transactionId: 'ext-tx-12345',
    amount: -1299.00,
    currency: 'EUR',
    description: 'Payment to Acme Corp',
    bookingDate: new Date('2025-12-08'),
    valueDate: new Date('2025-12-08'),
    transactionType: 'DEBIT',
    status: 'BOOKED',
    reconciliationStatus: 'UNMATCHED', // Needs reconciliation!
    category: null, // Uncategorized!
  },
];
```

---

## Performance Testing

### Load Test Example

```typescript
// Test scheduler with many organizations
async function loadTest() {
  const orgCount = 100;
  const billsPerOrg = 50;

  console.time('Scheduler execution');

  await scheduler.generateDailySuggestions();

  console.timeEnd('Scheduler execution');

  // Expected: < 60 seconds for 100 orgs
}
```

### Cache Performance

```typescript
// Test cache effectiveness
async function cacheTest() {
  const orgId = 'org-123';

  // First call (no cache)
  console.time('First call');
  const result1 = await service.getPageSuggestions('dashboard', undefined, orgId);
  console.timeEnd('First call'); // ~200ms

  // Second call (cached)
  console.time('Second call');
  const result2 = await service.getPageSuggestions('dashboard', undefined, orgId);
  console.timeEnd('Second call'); // ~5ms

  expect(result1).toEqual(result2);
}
```

---

This examples document provides practical, real-world usage scenarios for the proactive suggestion system.
