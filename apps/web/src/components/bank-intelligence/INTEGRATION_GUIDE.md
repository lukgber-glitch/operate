# Bank Intelligence Dashboard - Integration Guide

## Quick Start

### 1. Create a New Page Route

Create a new page in your Next.js app to display the dashboard:

```tsx
// app/bank-intelligence/page.tsx
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';

export const metadata = {
  title: 'Bank Intelligence | Operate',
  description: 'AI-powered insights for your business finances',
};

export default function BankIntelligencePage() {
  return (
    <div className="container mx-auto p-6">
      <BankIntelligenceDashboard />
    </div>
  );
}
```

### 2. Add to Navigation

Add the dashboard to your sidebar navigation:

```tsx
// In your sidebar component
import { Sparkles } from 'lucide-react';

const navItems = [
  // ... other items
  {
    title: 'Bank Intelligence',
    href: '/bank-intelligence',
    icon: Sparkles,
  },
];
```

### 3. Backend Integration

The dashboard requires these API endpoints. Here's example response structures:

#### GET /bank-intelligence/summary

```json
{
  "currentBalance": 25432.00,
  "currency": "EUR",
  "balanceChange": 2150.00,
  "balanceChangePercent": 9.2,
  "lowCashDate": "2025-12-21",
  "lowCashAmount": 850.00,
  "totalRecurringMonthly": 1234.00,
  "unmatchedCount": 3,
  "alertsCount": {
    "critical": 1,
    "warning": 2,
    "info": 3
  }
}
```

#### GET /bank-intelligence/cash-flow?days=30

```json
[
  {
    "date": "2025-12-07",
    "balance": 25432.00,
    "inflows": 5000.00,
    "outflows": 1200.00,
    "items": ["Client Payment - Invoice #123", "AWS Subscription", "Office Supplies"]
  },
  {
    "date": "2025-12-08",
    "balance": 24500.00,
    "inflows": 0.00,
    "outflows": 932.00,
    "items": ["Rent Payment"]
  }
  // ... more days
]
```

#### GET /bank-intelligence/recurring

```json
[
  {
    "id": "rec_1",
    "vendorName": "AWS",
    "amount": 299.00,
    "currency": "EUR",
    "frequency": "monthly",
    "nextDue": "2025-12-15",
    "category": "subscriptions",
    "confidence": 0.95
  },
  {
    "id": "rec_2",
    "vendorName": "GitHub Enterprise",
    "amount": 45.00,
    "currency": "EUR",
    "frequency": "monthly",
    "nextDue": "2025-12-10",
    "category": "subscriptions",
    "confidence": 0.92
  }
]
```

#### GET /bank-intelligence/tax-liability?year=2025

```json
{
  "year": 2025,
  "incomeTax": 14532.00,
  "vat": 2850.00,
  "solidaritySurcharge": 800.00,
  "totalOwed": 18182.00,
  "totalPaid": 10909.00,
  "nextPaymentDue": "2026-01-10",
  "nextPaymentAmount": 2850.00
}
```

#### GET /bank-intelligence/transactions?limit=20

```json
[
  {
    "id": "txn_1",
    "date": "2025-12-05",
    "description": "AWS Services",
    "amount": -299.00,
    "currency": "EUR",
    "category": "Cloud Services",
    "taxCategory": "Operating Expenses",
    "confidence": 0.95,
    "matchedTo": null
  },
  {
    "id": "txn_2",
    "date": "2025-12-04",
    "description": "Client ABC Corp",
    "amount": 5000.00,
    "currency": "EUR",
    "category": "Revenue",
    "taxCategory": "Income",
    "confidence": 0.98,
    "matchedTo": {
      "type": "invoice",
      "id": "inv_123",
      "reference": "INV-2025-123"
    }
  }
]
```

#### GET /bank-intelligence/unmatched

```json
{
  "incoming": [
    {
      "id": "unm_1",
      "transactionId": "txn_100",
      "date": "2025-12-03",
      "description": "Payment from XYZ Ltd",
      "amount": 1500.00,
      "currency": "EUR",
      "type": "incoming",
      "suggestedMatches": [
        {
          "id": "inv_456",
          "type": "invoice",
          "reference": "INV-2025-456",
          "amount": 1500.00,
          "date": "2025-11-28",
          "confidence": 0.89,
          "clientOrVendor": "XYZ Ltd"
        }
      ]
    }
  ],
  "outgoing": [
    {
      "id": "unm_2",
      "transactionId": "txn_101",
      "date": "2025-12-02",
      "description": "Office Depot",
      "amount": -150.00,
      "currency": "EUR",
      "type": "outgoing",
      "suggestedMatches": [
        {
          "id": "bill_789",
          "type": "bill",
          "reference": "BILL-2025-789",
          "amount": 150.00,
          "date": "2025-12-01",
          "confidence": 0.92,
          "clientOrVendor": "Office Depot"
        }
      ]
    }
  ]
}
```

#### GET /bank-intelligence/alerts

```json
[
  {
    "id": "alert_1",
    "type": "low_balance",
    "severity": "critical",
    "title": "Low Cash Warning",
    "message": "Your balance will drop below €1,000 in 14 days. Consider reviewing upcoming expenses.",
    "date": "2025-12-21",
    "action": {
      "label": "View Cash Flow",
      "href": "/bank-intelligence"
    },
    "dismissible": false
  },
  {
    "id": "alert_2",
    "type": "tax_deadline",
    "severity": "warning",
    "title": "VAT Payment Due",
    "message": "VAT payment of €2,850 is due on January 10, 2026",
    "date": "2026-01-10",
    "action": {
      "label": "View Tax Status",
      "href": "/tax"
    },
    "dismissible": true
  },
  {
    "id": "alert_3",
    "type": "unmatched",
    "severity": "info",
    "title": "Unmatched Transactions",
    "message": "You have 2 unmatched incoming payments totaling €3,450",
    "date": "2025-12-07",
    "action": {
      "label": "Match Payments",
      "href": "/reconciliation"
    },
    "dismissible": true
  }
]
```

### 4. Backend Implementation Example (NestJS)

Here's a basic controller structure for the API:

```typescript
// apps/api/src/bank-intelligence/bank-intelligence.controller.ts
import { Controller, Get, Post, Patch, Delete, Query, Body, Param } from '@nestjs/common';
import { BankIntelligenceService } from './bank-intelligence.service';

@Controller('bank-intelligence')
export class BankIntelligenceController {
  constructor(private readonly service: BankIntelligenceService) {}

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }

  @Get('cash-flow')
  async getCashFlow(@Query('days') days: number = 30) {
    return this.service.getCashFlowForecast(days);
  }

  @Get('recurring')
  async getRecurringExpenses() {
    return this.service.getRecurringExpenses();
  }

  @Get('tax-liability')
  async getTaxLiability(@Query('year') year?: number) {
    return this.service.getTaxLiability(year);
  }

  @Get('transactions')
  async getTransactions(@Query('limit') limit: number = 20) {
    return this.service.getClassifiedTransactions(limit);
  }

  @Get('unmatched')
  async getUnmatched() {
    return this.service.getUnmatchedPayments();
  }

  @Get('alerts')
  async getAlerts() {
    return this.service.getAlerts();
  }

  @Post('confirm-match')
  async confirmMatch(@Body() data: { transactionId: string; invoiceId?: string; billId?: string }) {
    return this.service.confirmMatch(data);
  }

  @Patch('transactions/:id/classify')
  async reclassify(@Param('id') id: string, @Body() data: { category: string; taxCategory?: string }) {
    return this.service.reclassifyTransaction(id, data);
  }

  @Delete('alerts/:id')
  async dismissAlert(@Param('id') id: string) {
    return this.service.dismissAlert(id);
  }
}
```

### 5. Testing

You can test the dashboard with mock data:

```tsx
// Create a mock provider for development
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // Return mock data based on queryKey
        if (queryKey.includes('summary')) {
          return mockSummaryData;
        }
        // ... etc
      },
    },
  },
});

export default function TestPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BankIntelligenceDashboard />
    </QueryClientProvider>
  );
}
```

### 6. Permissions & Authentication

Ensure the dashboard is protected:

```tsx
// app/bank-intelligence/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';

export default async function BankIntelligencePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  // Optional: Check if user has bank intelligence feature enabled
  if (!session.user.features?.includes('bank-intelligence')) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto p-6">
      <BankIntelligenceDashboard />
    </div>
  );
}
```

### 7. Environment Variables

Add these to your `.env` file if needed:

```bash
# API Base URL (if different from default)
NEXT_PUBLIC_API_URL=https://operate.guru/api/v1

# Feature flags
NEXT_PUBLIC_BANK_INTELLIGENCE_ENABLED=true
```

### 8. Mobile Optimization

The dashboard is fully responsive, but you can customize for mobile:

```tsx
// app/bank-intelligence/page.tsx
'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';
import { MobileBankIntelligence } from '@/components/bank-intelligence/mobile';

export default function BankIntelligencePage() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <MobileBankIntelligence />;
  }

  return <BankIntelligenceDashboard />;
}
```

## Troubleshooting

### Components not rendering?
- Check that all dependencies are installed
- Verify the API base URL is correct
- Check browser console for API errors

### Styles look broken?
- Ensure Tailwind CSS is configured
- Verify shadcn/ui components are installed
- Check that dark mode is set up correctly

### Data not loading?
- Verify API endpoints are returning correct data structure
- Check React Query DevTools for query status
- Look for CORS issues in network tab

### TypeScript errors?
- Run `npm run typecheck` to see all errors
- Ensure all types are imported correctly
- Check that API response types match expected types

## Next Steps

1. Implement the backend API endpoints
2. Connect to your banking data source
3. Set up AI classification service
4. Add real-time updates via WebSocket
5. Implement export/reporting features
6. Add more customization options
