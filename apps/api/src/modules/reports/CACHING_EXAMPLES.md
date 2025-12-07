# Performance Optimization - Caching Examples

This document shows how to apply caching to expensive endpoints using the `@Cached` decorator.

## Basic Usage

### Example 1: Cash Flow Report with Caching

```typescript
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { Cached, CacheInvalidate } from '../../cache';

@Controller('reports/cashflow')
export class CashFlowReportController {
  constructor(private readonly cashFlowService: CashFlowReportService) {}

  /**
   * Cash flow statement - cached for 5 minutes
   * Cache key includes orgId and query parameters automatically
   */
  @Get(':orgId')
  @Cached('cashflow:statement', 300) // 5 minutes
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async generateCashFlowStatement(
    @Param('orgId') orgId: string,
    @Query() dto: GenerateCashFlowStatementDto,
  ) {
    return this.cashFlowService.generateCashFlowStatement(orgId, dto);
  }

  /**
   * Burn rate analysis - cached for 10 minutes
   * Less frequently changing data can have longer TTL
   */
  @Get(':orgId/runway')
  @Cached('cashflow:runway', 600) // 10 minutes
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async analyzeBurnRate(
    @Param('orgId') orgId: string,
    @Query() dto: BurnRateAnalysisDto,
  ) {
    return this.cashFlowService.analyzeCashBurnRate(orgId, dto);
  }

  /**
   * Cash flow ratios - cached for 15 minutes
   * Heavy computation, rarely changes
   */
  @Get(':orgId/ratios')
  @Cached('cashflow:ratios', 900) // 15 minutes
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async calculateRatios(
    @Param('orgId') orgId: string,
    @Query() dto: CashFlowRatiosDto,
  ) {
    return this.cashFlowService.calculateCashFlowRatios(orgId, dto);
  }
}
```

### Example 2: Dashboard Endpoints with Caching

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Cached } from '../../cache';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Dashboard overview - cached for 2 minutes
   * Frequently accessed, needs fresh data
   */
  @Get(':orgId/overview')
  @Cached('dashboard:overview', 120) // 2 minutes
  async getOverview(@Param('orgId') orgId: string) {
    return this.dashboardService.getOverview(orgId);
  }

  /**
   * Revenue metrics - cached for 5 minutes
   */
  @Get(':orgId/revenue')
  @Cached('dashboard:revenue', 300) // 5 minutes
  async getRevenue(@Param('orgId') orgId: string) {
    return this.dashboardService.getRevenueMetrics(orgId);
  }

  /**
   * Expenses breakdown - cached for 5 minutes
   */
  @Get(':orgId/expenses')
  @Cached('dashboard:expenses', 300) // 5 minutes
  async getExpenses(@Param('orgId') orgId: string) {
    return this.dashboardService.getExpensesBreakdown(orgId);
  }
}
```

### Example 3: Cache Invalidation

```typescript
import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CacheInvalidate } from '../../cache';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Create transaction - invalidates related caches
   */
  @Post()
  @CacheInvalidate([
    'dashboard:*',           // All dashboard data
    'cashflow:*',            // All cashflow data
    'reports:transactions:*' // Transaction reports
  ])
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  /**
   * Update transaction - invalidates specific caches
   */
  @Put(':id')
  @CacheInvalidate([
    'dashboard:overview',
    'dashboard:expenses',
    'cashflow:statement',
  ])
  async updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, dto);
  }

  /**
   * Delete transaction - invalidates all financial data caches
   */
  @Delete(':id')
  @CacheInvalidate([
    'dashboard:*',
    'cashflow:*',
    'reports:*',
  ])
  async deleteTransaction(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }
}
```

### Example 4: Advanced Cache Configuration

```typescript
import { Cached } from '../../cache';

@Controller('analytics')
export class AnalyticsController {
  /**
   * Complex analytics - long cache, custom prefix
   */
  @Get('trends')
  @Cached(
    {
      key: 'trends:monthly',
      ttl: 1800,        // 30 minutes
      prefix: 'analytics',
    }
  )
  async getMonthlyTrends() {
    return this.analyticsService.getMonthlyTrends();
  }

  /**
   * User-specific analytics - cache per user
   */
  @Get('user/:userId')
  @Cached('user:analytics', 600) // 10 minutes
  async getUserAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }
}
```

## Cache Key Structure

The cache interceptor automatically builds cache keys with context:

```
{prefix}:{baseKey}:org:{orgId}:q:{queryHash}
```

Example:
```
cache:cashflow:statement:org:uuid-here:q:abc123
```

## Best Practices

### 1. Choose Appropriate TTL

| Data Type | Recommended TTL | Example |
|-----------|----------------|---------|
| Real-time data | 30-120 seconds | Live prices, notifications |
| Dashboard metrics | 2-5 minutes | Overview, KPIs |
| Reports | 5-15 minutes | Financial reports, analytics |
| Heavy computation | 15-30 minutes | Complex calculations, forecasts |
| Static/reference data | 1-24 hours | Settings, configurations |

### 2. Cache What's Expensive

Cache endpoints that:
- Have complex database queries
- Perform heavy computations
- Aggregate large datasets
- Call external APIs
- Generate reports

### 3. Invalidate Strategically

Invalidate caches when:
- Data is created, updated, or deleted
- Settings change
- External integrations sync
- User preferences update

Use wildcards (`*`) for related data:
```typescript
@CacheInvalidate(['dashboard:*', 'reports:*'])
```

### 4. Monitor Cache Performance

Check cache metrics at:
```
GET /api/admin/performance/cache
```

Response:
```json
{
  "status": "healthy",
  "stats": {
    "hits": 1524,
    "misses": 186,
    "total": 1710,
    "hitRate": "89.12%"
  }
}
```

## Database Query Optimization

### Use Select to Limit Fields

```typescript
// BAD: Fetches all fields
const invoices = await prisma.invoice.findMany({
  where: { orgId },
});

// GOOD: Only fetch needed fields
const invoices = await prisma.invoice.findMany({
  where: { orgId },
  select: {
    id: true,
    number: true,
    totalAmount: true,
    status: true,
  },
});
```

### Use Include Instead of Separate Queries (N+1)

```typescript
// BAD: N+1 query problem
const invoices = await prisma.invoice.findMany({ where: { orgId } });
for (const invoice of invoices) {
  const customer = await prisma.customer.findUnique({
    where: { id: invoice.customerId }
  });
}

// GOOD: Single query with join
const invoices = await prisma.invoice.findMany({
  where: { orgId },
  include: {
    customer: {
      select: { name: true, email: true },
    },
  },
});
```

### Use Pagination

```typescript
// Always paginate large datasets
const pageSize = 20;
const page = 1;

const [data, total] = await Promise.all([
  prisma.invoice.findMany({
    where: { orgId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.invoice.count({ where: { orgId } }),
]);

return {
  data,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  },
};
```

### Use Indexes

The schema already includes key indexes:
- `@@index([orgId, status])` for filtered org queries
- `@@index([date])` for time-based queries
- `@@index([customerId])` for customer lookups

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | < 200ms | > 500ms |
| API Response Time (p99) | < 500ms | > 1000ms |
| Database Query Time (p95) | < 100ms | > 300ms |
| Cache Hit Rate | > 80% | < 60% |
| Memory Usage | < 70% | > 85% |

## Monitoring

### Performance Endpoints

```bash
# Overall metrics
GET /api/admin/performance/metrics

# Cache statistics
GET /api/admin/performance/cache

# Database statistics
GET /api/admin/performance/database

# System resources
GET /api/admin/performance/system

# Health check
GET /api/admin/performance/health
```

### Slow Query Logging

Slow queries (> 100ms by default) are automatically logged:

```
[Prisma] WARN Slow query detected (245ms, threshold: 100ms)
[Prisma] WARN Query: SELECT * FROM "Transaction" WHERE "orgId" = $1
```

Configure threshold in environment:
```env
DATABASE_SLOW_QUERY_THRESHOLD=100
```

## Need to Install

To use compression in production, install the package:

```bash
cd apps/api
pnpm add compression
pnpm add -D @types/compression
```

Compression is configured in `main.ts`:
- Threshold: 1KB (only compress responses > 1KB)
- Level: 6 (balanced compression)
- Formats: gzip, deflate

## Frontend Optimization

### React Query Configuration

```typescript
// Configure in apps/web
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      cacheTime: 30 * 60 * 1000,     // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Prefetch Critical Data

```typescript
// Prefetch dashboard data on navigation
async function prefetchDashboard(orgId: string) {
  await Promise.all([
    queryClient.prefetchQuery(
      ['dashboard', 'overview', orgId],
      () => fetchOverview(orgId)
    ),
    queryClient.prefetchQuery(
      ['dashboard', 'revenue', orgId],
      () => fetchRevenue(orgId)
    ),
  ]);
}
```

## Summary

1. **Use `@Cached` decorator** on expensive endpoints
2. **Choose appropriate TTL** based on data freshness needs
3. **Invalidate caches** when data changes
4. **Optimize database queries** with select, include, and indexes
5. **Monitor performance** using admin endpoints
6. **Set up compression** for API responses
7. **Configure frontend caching** with React Query
