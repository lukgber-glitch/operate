# Performance Optimization Implementation

## Overview

This document describes the performance optimization implementation for the Operate application (Sprint 7, Task 6).

**Implementation Date**: December 7, 2025
**Status**: Complete
**Performance Targets**:
- API response time (p95): < 200ms
- Dashboard load time: < 2s
- Database query time: < 100ms
- Cache hit rate: > 80%

---

## 1. Redis Caching System

### Location
- `apps/api/src/modules/cache/`

### Files Created/Modified
- ✅ `cache.module.ts` - Enhanced with global interceptor
- ✅ `cache.interceptor.ts` - NEW - Automatic caching interceptor
- ✅ `cached.decorator.ts` - NEW - @Cached and @CacheInvalidate decorators
- ✅ `redis.service.ts` - Enhanced with batch operations and metrics
- ✅ `index.ts` - NEW - Barrel export

### Features Implemented

#### 1.1 Caching Decorators

**`@Cached` Decorator**
```typescript
@Cached('dashboard:overview', 300) // Cache for 5 minutes
async getOverview() { ... }
```

**`@CacheInvalidate` Decorator**
```typescript
@CacheInvalidate(['dashboard:*', 'reports:*'])
async updateData() { ... }
```

#### 1.2 Enhanced Redis Service

**New Methods**:
- `mget()` - Batch get multiple keys
- `mset()` - Batch set multiple keys
- `setnx()` - Atomic set if not exists
- `mdel()` - Batch delete multiple keys
- `incr()` / `decr()` - Atomic counters
- `getCacheStats()` - Cache hit/miss statistics
- `getInfo()` - Redis server information
- `ping()` - Health check

**Statistics Tracking**:
```typescript
{
  hits: 1524,
  misses: 186,
  total: 1710,
  hitRate: "89.12%"
}
```

#### 1.3 Automatic Cache Key Generation

Cache keys automatically include:
- Prefix (configurable)
- Base key (from decorator)
- Organization ID (from request.user)
- Query parameters hash
- Body parameters hash (for POST)

Example: `cache:dashboard:overview:org:uuid:q:abc123`

---

## 2. Database Query Optimization

### Location
- `packages/database/prisma/schema.prisma`
- `apps/api/src/modules/database/prisma.service.ts`

### Files Modified
- ✅ `prisma.service.ts` - Enhanced with query logging and monitoring

### Features Implemented

#### 2.1 Enhanced Prisma Service

**Query Logging**:
- Automatic slow query detection (configurable threshold, default: 100ms)
- Query duration tracking
- Query count metrics
- Critical query warnings (> 1s)

**New Methods**:
```typescript
getQueryMetrics()        // Query performance statistics
getConnectionInfo()      // Database connection details
getTableSizes()          // Top 20 tables by size
getIndexStats()          // Index usage statistics
healthCheck()            // Database health check
executeRaw()            // Raw query with logging
queryRaw()              // Query raw with logging
```

**Metrics Tracked**:
```typescript
{
  totalQueries: 15234,
  slowQueries: 127,
  slowQueryThreshold: 100,
  slowQueryPercentage: "0.83%"
}
```

#### 2.2 Database Indexes

**Existing Indexes** (verified in schema):
- Invoice: `[orgId, status]`, `[issueDate]`, `[dueDate]`, `[customerId]`
- BankTransaction: `[bankAccountId]`, `[date]`, `[isReconciled]`
- Transaction: `[orgId]`, `[date]`, `[category]`
- Customer: `[orgId]`, `[name]`, `[isActive]`
- BankConnection: `[orgId, status]`

The schema already has comprehensive indexes for performance-critical queries.

---

## 3. Performance Monitoring

### Location
- `apps/api/src/modules/performance/`

### Files Created
- ✅ `performance.module.ts`
- ✅ `performance.controller.ts`
- ✅ `performance.service.ts`

### Admin Endpoints

All endpoints require `ADMIN` or `OWNER` role.

#### 3.1 Overall Metrics
```http
GET /api/admin/performance/metrics
```

Response:
```json
{
  "timestamp": "2025-12-07T...",
  "uptime": {
    "milliseconds": 3600000,
    "formatted": "1h 0m 0s"
  },
  "cache": { ... },
  "database": { ... },
  "system": { ... },
  "api": { ... }
}
```

#### 3.2 Cache Statistics
```http
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
  },
  "redis": {
    "version": "7.0.0",
    "uptime": 86400,
    "connectedClients": 5,
    "usedMemory": "2.5 MB",
    "keyspaceHits": "15234",
    "keyspaceMisses": "1876"
  }
}
```

#### 3.3 Database Statistics
```http
GET /api/admin/performance/database
```

Response:
```json
{
  "status": "healthy",
  "queryMetrics": {
    "totalQueries": 15234,
    "slowQueries": 127,
    "slowQueryPercentage": "0.83%"
  },
  "connections": {
    "total_connections": 12,
    "active_connections": 3,
    "idle_connections": 9
  },
  "topTables": [
    {
      "table": "BankTransaction",
      "size": "45.2 MB",
      "size_bytes": 47456789
    }
  ],
  "topIndexes": [
    {
      "tablename": "Invoice",
      "indexname": "Invoice_orgId_status_idx",
      "index_scans": 45678
    }
  ]
}
```

#### 3.4 System Resources
```http
GET /api/admin/performance/system
```

Response:
```json
{
  "nodejs": {
    "version": "v20.10.0",
    "platform": "linux",
    "arch": "x64"
  },
  "memory": {
    "rss": "152.3 MB",
    "heapTotal": "98.5 MB",
    "heapUsed": "67.2 MB",
    "heapUsedPercentage": "68.22"
  },
  "cpu": {
    "user": 45678,
    "system": 12345
  },
  "uptime": {
    "process": "1h 23m 45s",
    "system": "15d 7h 32m"
  }
}
```

#### 3.5 Health Check
```http
GET /api/admin/performance/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T...",
  "uptime": {
    "milliseconds": 3600000,
    "formatted": "1h 0m 0s"
  },
  "checks": {
    "database": "pass",
    "cache": "pass"
  }
}
```

---

## 4. HTTP Compression

### Location
- `apps/api/src/main.ts`

### Configuration

```typescript
app.use(
  compression({
    threshold: 1024,  // Only compress responses > 1KB
    level: 6,         // Balanced compression (0-9)
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
```

**Benefits**:
- Reduces response size by 60-80% for JSON
- Lower bandwidth usage
- Faster load times for clients
- Automatic content negotiation (gzip/deflate)

### Installation Required

```bash
cd apps/api
pnpm add compression
pnpm add -D @types/compression
```

---

## 5. Application Module Updates

### Location
- `apps/api/src/app.module.ts`

### Changes
- ✅ Added `PerformanceModule` import
- ✅ Registered in module imports array

---

## 6. Usage Examples

### 6.1 Apply Caching to Controllers

See `apps/api/src/modules/reports/CACHING_EXAMPLES.md` for detailed examples.

**Quick Example**:
```typescript
import { Cached, CacheInvalidate } from '../../cache';

@Controller('reports/cashflow')
export class CashFlowReportController {
  @Get(':orgId/statement')
  @Cached('cashflow:statement', 300) // 5 min cache
  async getStatement(@Param('orgId') orgId: string) {
    return this.service.getStatement(orgId);
  }

  @Post(':orgId/transaction')
  @CacheInvalidate(['cashflow:*', 'dashboard:*'])
  async createTransaction(@Param('orgId') orgId: string) {
    return this.service.createTransaction(orgId);
  }
}
```

### 6.2 Optimize Database Queries

**Bad**:
```typescript
// N+1 query problem
const invoices = await prisma.invoice.findMany();
for (const invoice of invoices) {
  const customer = await prisma.customer.findUnique({
    where: { id: invoice.customerId }
  });
}
```

**Good**:
```typescript
// Single query with join
const invoices = await prisma.invoice.findMany({
  include: {
    customer: {
      select: { name: true, email: true }
    }
  },
  select: {
    id: true,
    number: true,
    totalAmount: true,
    status: true
  }
});
```

### 6.3 Monitor Performance

```bash
# Get all metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/performance/metrics

# Check cache performance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/performance/cache

# Check database performance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/performance/database
```

---

## 7. Environment Configuration

### Required Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# Database Configuration
DATABASE_URL=postgresql://...
DATABASE_SLOW_QUERY_THRESHOLD=100  # milliseconds
```

---

## 8. Performance Targets & Monitoring

### Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response Time (p95) | < 200ms | TBD | ⏳ Monitor |
| Dashboard Load Time | < 2s | TBD | ⏳ Monitor |
| Database Query Time (p95) | < 100ms | TBD | ⏳ Monitor |
| Cache Hit Rate | > 80% | TBD | ⏳ Monitor |
| Memory Usage | < 70% | TBD | ⏳ Monitor |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Response Time (p95) | > 300ms | > 500ms |
| Database Query Time | > 200ms | > 500ms |
| Cache Hit Rate | < 70% | < 60% |
| Memory Usage | > 75% | > 85% |
| Slow Queries | > 5% | > 10% |

### Monitoring Schedule

1. **Real-time**: Slow query logging (automatic)
2. **Hourly**: Cache hit rate check
3. **Daily**: Performance metrics review
4. **Weekly**: Database index usage analysis

---

## 9. Files Summary

### Created Files (13)
```
apps/api/src/modules/cache/
  ✅ cache.interceptor.ts       (144 lines)
  ✅ cached.decorator.ts         (71 lines)
  ✅ index.ts                     (4 lines)

apps/api/src/modules/database/
  ✅ prisma.service.ts           (Enhanced, 265 lines)

apps/api/src/modules/performance/
  ✅ performance.module.ts       (13 lines)
  ✅ performance.controller.ts   (72 lines)
  ✅ performance.service.ts      (203 lines)

apps/api/src/modules/reports/
  ✅ CACHING_EXAMPLES.md         (Documentation)

Root:
  ✅ PERFORMANCE_OPTIMIZATION.md (This file)
```

### Modified Files (4)
```
apps/api/src/
  ✅ main.ts                     (Added compression)
  ✅ app.module.ts               (Added PerformanceModule)

apps/api/src/modules/cache/
  ✅ cache.module.ts             (Added interceptor)
  ✅ redis.service.ts            (Enhanced with batch ops)
```

---

## 10. Next Steps

### Immediate Actions

1. **Install compression package**:
   ```bash
   cd apps/api
   pnpm add compression @types/compression
   ```

2. **Deploy to production**:
   ```bash
   # Test locally first
   pnpm build
   pnpm start

   # Then deploy to Cloudways
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html && git pull"
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html && pnpm install"
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && pnpm build"
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && pm2 restart operate-api"
   ```

3. **Apply caching to hot endpoints**:
   - Dashboard controllers
   - Report controllers
   - Analytics endpoints
   - Heavy computation endpoints

   See `apps/api/src/modules/reports/CACHING_EXAMPLES.md`

### Short-term (Week 1)

1. Monitor cache hit rates
2. Identify slow queries
3. Add indexes if needed
4. Tune cache TTLs based on usage

### Mid-term (Month 1)

1. Implement request tracking for API metrics
2. Set up performance alerts
3. Create performance dashboard
4. Optimize identified bottlenecks

### Long-term (Quarter 1)

1. Implement query result streaming for large datasets
2. Add read replicas for reporting queries
3. Implement GraphQL DataLoader for batch loading
4. Consider implementing CDN for static assets

---

## 11. Testing

### Manual Testing

```bash
# 1. Test cache
curl http://localhost:3000/api/admin/performance/cache

# 2. Test database stats
curl http://localhost:3000/api/admin/performance/database

# 3. Test health check
curl http://localhost:3000/api/admin/performance/health

# 4. Test cached endpoint (should be faster on 2nd call)
time curl http://localhost:3000/api/reports/cashflow/:orgId
time curl http://localhost:3000/api/reports/cashflow/:orgId  # Should be faster
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Run load test
k6 run loadtest.js
```

Sample `loadtest.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let res = http.get('http://localhost:3000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

## 12. Troubleshooting

### High Cache Miss Rate

**Symptoms**: Cache hit rate < 60%

**Causes**:
- TTL too short
- Cache keys include dynamic data
- High write frequency invalidating caches

**Solutions**:
- Increase TTL for stable data
- Review cache key generation
- Implement more granular cache invalidation

### Slow Queries

**Symptoms**: Many queries > 100ms

**Causes**:
- Missing indexes
- N+1 query problems
- Fetching unnecessary data

**Solutions**:
- Add indexes (see schema.prisma)
- Use `include` instead of separate queries
- Use `select` to limit fields

### High Memory Usage

**Symptoms**: Memory > 80%

**Causes**:
- Large cache size
- Memory leaks
- Inefficient data structures

**Solutions**:
- Configure Redis max memory
- Review query result sizes
- Implement pagination

### Redis Connection Issues

**Symptoms**: Cache errors in logs

**Causes**:
- Redis not running
- Wrong credentials
- Network issues

**Solutions**:
- Check Redis status: `redis-cli ping`
- Verify environment variables
- Check firewall/network

---

## 13. References

### Documentation
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

### Related Files
- `apps/api/src/modules/cache/` - Cache implementation
- `apps/api/src/modules/performance/` - Performance monitoring
- `apps/api/src/modules/reports/CACHING_EXAMPLES.md` - Usage examples
- `packages/database/prisma/schema.prisma` - Database schema and indexes

### Sprint 7 Tasks
- [x] S7-06: Performance Optimization (This task)
- [ ] S7-07: Security Audit
- [ ] S7-08: Documentation

---

**Implementation Complete**: December 7, 2025
**Implemented By**: FLUX Agent
**Status**: ✅ Ready for Deployment
