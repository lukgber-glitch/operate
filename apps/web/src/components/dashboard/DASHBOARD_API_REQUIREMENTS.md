# Dashboard API Requirements

This document outlines the API endpoints required by the Financial Dashboard frontend components.

## Overview

The dashboard (`/dashboard`) displays financial KPIs, charts, and actionable items. All endpoints should be scoped to the organization context (`/api/v1/organisations/:orgId`).

## Required Endpoints

### 1. Cash Flow Forecast
**Endpoint:** `GET /dashboard/cash-flow`

**Query Parameters:**
- `days` (number, default: 7) - Number of days to forecast

**Response:**
```typescript
{
  currentBalance: number;
  previousWeekBalance: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  forecast: Array<{
    date: string;  // ISO date
    balance: number;
  }>;
}
```

### 2. Revenue Data
**Endpoint:** `GET /dashboard/revenue`

**Query Parameters:**
- `months` (number, default: 12) - Number of months to return

**Response:**
```typescript
Array<{
  month: string;  // e.g., "Jan 2024"
  revenue: number;
}>
```

### 3. Expense Categories
**Endpoint:** `GET /dashboard/expense-categories`

**Response:**
```typescript
Array<{
  category: string;
  amount: number;
  percentage: number;  // 0-100
}>
```

### 4. AR/AP Summary - Receivables
**Endpoint:** `GET /dashboard/receivables`

**Response:**
```typescript
{
  total: number;          // Total outstanding receivables
  overdue: number;        // Amount overdue (optional)
  count: number;          // Number of invoices
  change: number;         // Change from previous period
  changePercent: number;  // Percentage change
}
```

### 5. AR/AP Summary - Payables
**Endpoint:** `GET /dashboard/payables`

**Response:**
```typescript
{
  total: number;          // Total outstanding payables
  overdue: number;        // Amount overdue (optional)
  count: number;          // Number of bills
  change: number;         // Change from previous period
  changePercent: number;  // Percentage change
}
```

### 6. Runway Data
**Endpoint:** `GET /dashboard/runway`

**Response:**
```typescript
{
  months: number;                          // Number of months of runway
  status: 'healthy' | 'warning' | 'critical';
  burnRate: number;                        // Monthly burn rate
  currentCash: number;                     // Current cash balance
}
```

**Status Logic:**
- `healthy`: > 6 months
- `warning`: 3-6 months
- `critical`: < 3 months

### 7. Overdue Invoices
**Endpoint:** `GET /invoices/overdue`

**Query Parameters:**
- `limit` (number, default: 5) - Maximum number of items to return

**Response:**
```typescript
{
  items: Array<{
    id: string;
    name: string;          // Customer name
    amount: number;
    daysOverdue: number;
    dueDate: string;       // ISO date
  }>;
  total: number;           // Total count of overdue invoices
}
```

### 8. Upcoming Bills
**Endpoint:** `GET /bills/upcoming`

**Query Parameters:**
- `limit` (number, default: 5) - Maximum number of items to return

**Response:**
```typescript
{
  items: Array<{
    id: string;
    name: string;          // Vendor name
    amount: number;
    dueDate: string;       // ISO date
    daysUntilDue: number;
  }>;
  total: number;           // Total count of upcoming bills
}
```

## Implementation Notes

### Data Sources
1. **Cash Flow Forecast:** Calculate from bank account balances + scheduled payments/receipts
2. **Revenue Data:** Aggregate from paid invoices grouped by month
3. **Expense Categories:** Aggregate from expenses grouped by category
4. **AR/AP Summary:** Calculate from invoices and bills with status filters
5. **Runway:** `currentCash / (totalExpenses / numberOfMonths)`
6. **Overdue Invoices:** Filter invoices where `status = 'OVERDUE'` or `dueDate < NOW()`
7. **Upcoming Bills:** Filter bills where `status = 'PENDING'` and `dueDate BETWEEN NOW() AND NOW() + 30 DAYS`

### Caching Strategy
All dashboard endpoints should be cached for:
- Cash Flow: 5 minutes
- Revenue/Expenses: 10 minutes
- AR/AP Summary: 5 minutes
- Runway: 30 minutes
- Overdue/Upcoming: 2 minutes

### Error Handling
Return empty/default values rather than errors when data is unavailable:
- Empty arrays for lists
- Zero for numbers
- Default status values

This ensures the dashboard always renders, even with incomplete data.

### Organization Scoping
All endpoints must filter data by organization ID from the authenticated user's context.

## Testing Endpoints

Example requests:

```bash
# Cash Flow Forecast
GET /api/v1/organisations/{orgId}/dashboard/cash-flow?days=7

# Revenue Data
GET /api/v1/organisations/{orgId}/dashboard/revenue?months=12

# Expense Categories
GET /api/v1/organisations/{orgId}/dashboard/expense-categories

# Receivables
GET /api/v1/organisations/{orgId}/dashboard/receivables

# Payables
GET /api/v1/organisations/{orgId}/dashboard/payables

# Runway
GET /api/v1/organisations/{orgId}/dashboard/runway

# Overdue Invoices
GET /api/v1/organisations/{orgId}/invoices/overdue?limit=5

# Upcoming Bills
GET /api/v1/organisations/{orgId}/bills/upcoming?limit=5
```

## Frontend Integration

The frontend uses React Query hooks from `@/hooks/useDashboard.ts`:
- `useCashFlowForecast(days)`
- `useRevenueData(months)`
- `useExpenseCategories()`
- `useArApSummary(type)`
- `useRunwayData()`
- `useOverdueInvoices(limit)`
- `useUpcomingBills(limit)`

All hooks implement automatic refetching and caching based on the stale times noted above.
