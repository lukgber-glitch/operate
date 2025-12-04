# Search Integration Guide

Quick reference for integrating the search indexer into Operate/CoachOS services.

## Quick Start

### 1. Add Module to App
```typescript
// apps/api/src/app.module.ts
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    // ... existing modules
    SearchModule,
  ],
})
export class AppModule {}
```

### 2. Register Job Processor
```typescript
// apps/api/src/jobs/jobs.module.ts (or create if not exists)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SearchModule } from '../modules/search/search.module';
import { SearchReindexProcessor } from './search-reindex.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'search-reindex' }),
    SearchModule,
  ],
  providers: [SearchReindexProcessor],
})
export class JobsModule {}
```

## Integration Patterns

### Pattern 1: Invoice Service Integration

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchIndexHooks } from '../search/hooks/search-index.hooks';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHooks: SearchIndexHooks,
  ) {}

  async create(orgId: string, data: CreateInvoiceDto) {
    const invoice = await this.prisma.invoice.create({
      data: { ...data, orgId },
    });

    // Auto-index
    await this.searchHooks.onInvoiceChange(invoice);

    return invoice;
  }

  async update(id: string, orgId: string, data: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.update({
      where: { id, orgId },
      data,
    });

    // Update index
    await this.searchHooks.onInvoiceChange(invoice);

    return invoice;
  }

  async delete(id: string, orgId: string) {
    await this.prisma.invoice.delete({
      where: { id, orgId },
    });

    // Remove from index
    await this.searchHooks.onInvoiceDelete(id);
  }
}
```

### Pattern 2: Client Service Integration

```typescript
@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHooks: SearchIndexHooks,
  ) {}

  async create(orgId: string, data: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: { ...data, orgId },
    });

    await this.searchHooks.onClientChange(client);
    return client;
  }

  async update(id: string, orgId: string, data: UpdateClientDto) {
    const client = await this.prisma.client.update({
      where: { id, orgId },
      data,
    });

    await this.searchHooks.onClientChange(client);
    return client;
  }

  async delete(id: string, orgId: string) {
    await this.prisma.client.delete({ where: { id, orgId } });
    await this.searchHooks.onClientDelete(id);
  }
}
```

### Pattern 3: Transaction/Expense Service

```typescript
@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHooks: SearchIndexHooks,
  ) {}

  async create(orgId: string, data: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: { ...data, orgId },
    });

    // Only index expenses
    if (transaction.type === 'EXPENSE') {
      await this.searchHooks.onExpenseChange(transaction);
    }

    return transaction;
  }

  async update(id: string, orgId: string, data: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.update({
      where: { id, orgId },
      data,
    });

    if (transaction.type === 'EXPENSE') {
      await this.searchHooks.onExpenseChange(transaction);
    }

    return transaction;
  }

  async delete(id: string, orgId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id, orgId },
    });

    await this.prisma.transaction.delete({ where: { id, orgId } });

    if (transaction?.type === 'EXPENSE') {
      await this.searchHooks.onExpenseDelete(id);
    }
  }
}
```

### Pattern 4: Employee Service

```typescript
@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHooks: SearchIndexHooks,
  ) {}

  async create(orgId: string, data: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({
      data: { ...data, orgId },
    });

    await this.searchHooks.onEmployeeChange(employee);
    return employee;
  }

  async update(id: string, orgId: string, data: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.update({
      where: { id, orgId },
      data,
    });

    await this.searchHooks.onEmployeeChange(employee);
    return employee;
  }

  async delete(id: string, orgId: string) {
    await this.prisma.employee.delete({ where: { id, orgId } });
    await this.searchHooks.onEmployeeDelete(id);
  }
}
```

## Module Integration

### Add SearchIndexHooks to Service Module

```typescript
import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [
    DatabaseModule,
    SearchModule,  // Import SearchModule
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
```

## API Usage Examples

### Frontend Search Component

```typescript
// React/Next.js example
import { useState } from 'react';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && search()}
        placeholder="Search invoices, expenses, clients..."
      />
      {loading && <div>Searching...</div>}
      {results.map((result) => (
        <SearchResult key={result.entityId} result={result} />
      ))}
    </div>
  );
}

function SearchResult({ result }) {
  return (
    <a href={result.url} className="search-result">
      <div className="result-type">{result.entityType}</div>
      <div className="result-title">{result.title}</div>
      <div className="result-subtitle">{result.subtitle}</div>
      {result.description && (
        <div className="result-description">{result.description}</div>
      )}
    </a>
  );
}
```

### Admin Reindex Trigger

```typescript
async function triggerReindex() {
  try {
    const response = await fetch('/api/search/reindex', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(`Reindex job started: ${data.jobId}`);
    console.log(`Estimated time: ${data.estimatedTime} seconds`);
  } catch (error) {
    console.error('Reindex failed:', error);
  }
}
```

### Search with Filters

```typescript
async function searchInvoices(query: string) {
  const params = new URLSearchParams({
    q: query,
    types: 'invoice',
    limit: '20',
    offset: '0',
  });

  const response = await fetch(`/api/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}

async function searchMultipleTypes(query: string) {
  const params = new URLSearchParams({
    q: query,
    types: 'invoice,expense,client',
    limit: '50',
  });

  const response = await fetch(`/api/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}
```

## Error Handling

### Handle Rate Limiting

```typescript
async function searchWithRetry(query: string, retries = 3) {
  try {
    const response = await fetch(`/api/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      // Rate limited
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return searchWithRetry(query, retries - 1);
      }
      throw new Error('Rate limit exceeded');
    }

    return response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
```

### Handle Empty Results

```typescript
async function searchWithFallback(query: string) {
  const response = await fetch(`/api/search?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (data.total === 0) {
    // Try broader search
    const words = query.split(' ');
    if (words.length > 1) {
      return searchWithFallback(words[0]);
    }
  }

  return data;
}
```

## Testing

### Test Search Endpoint

```bash
# Basic search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=invoice&limit=5"

# Search specific types
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=john&types=client,employee"

# Pagination
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=expense&limit=10&offset=10"
```

### Test Reindex

```bash
# Trigger reindex (requires admin role)
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/search/reindex"
```

### Test Statistics

```bash
# Get index stats
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/stats"

# Get popular queries
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/analytics/popular?limit=10"
```

## Common Issues

### Issue: Search returns no results after entity creation

**Solution**: Ensure hooks are called after entity creation:
```typescript
const invoice = await this.prisma.invoice.create({ data });
await this.searchHooks.onInvoiceChange(invoice); // Don't forget this!
```

### Issue: Stale data in search results

**Solution**: Ensure hooks are called on updates:
```typescript
const invoice = await this.prisma.invoice.update({ where, data });
await this.searchHooks.onInvoiceChange(invoice); // Update index
```

### Issue: Deleted entities still in search

**Solution**: Call delete hooks:
```typescript
await this.prisma.invoice.delete({ where });
await this.searchHooks.onInvoiceDelete(id); // Remove from index
```

### Issue: Rate limit errors

**Solution**: Implement client-side debouncing:
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
  await searchAPI(query);
}, 300);
```

## Monitoring

### Check Search Health

```typescript
async function checkSearchHealth() {
  const response = await fetch('/api/search/health');
  const health = await response.json();

  if (health.status !== 'ok') {
    console.error('Search service unhealthy:', health);
    // Alert ops team
  }

  return health;
}
```

### Monitor Search Performance

```typescript
async function monitorSearchPerformance() {
  const start = Date.now();
  const results = await searchAPI('test query');
  const duration = Date.now() - start;

  // Log slow searches
  if (duration > 100) {
    console.warn(`Slow search: ${duration}ms`);
  }

  return { results, duration };
}
```

## Best Practices

1. **Always call hooks**: Don't forget to index after CRUD operations
2. **Handle errors gracefully**: Index failures shouldn't break main flow
3. **Debounce search inputs**: Prevent rate limiting on frontend
4. **Use pagination**: Don't request too many results at once
5. **Monitor performance**: Track search latency and index size
6. **Periodic reindex**: Schedule weekly full reindex for data consistency
7. **Test thoroughly**: Verify indexing in integration tests

## Deployment Checklist

- [ ] SearchModule added to app.module.ts
- [ ] SearchReindexProcessor registered in jobs module
- [ ] Hooks integrated in all entity services
- [ ] Redis connection tested
- [ ] BullMQ worker running
- [ ] Initial reindex completed
- [ ] Search endpoint tested
- [ ] Rate limiting verified
- [ ] Monitoring set up
- [ ] Documentation updated

---

For more details, see:
- `apps/api/src/modules/search/README.md`
- `TASK_W35-T3_SEARCH_INDEXER_COMPLETION_REPORT.md`
