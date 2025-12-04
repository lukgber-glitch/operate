# Search Module

Global search functionality for Operate/CoachOS platform.

## Features

- Fast Redis-based search indexing
- Full-text search with prefix matching
- Multi-entity support (Invoices, Expenses, Clients, Reports, Employees)
- Automatic indexing on entity create/update/delete
- Background batch reindexing via BullMQ
- Rate limiting (100 searches/min per user)
- Search analytics and popular queries tracking

## Architecture

### Components

1. **SearchIndexerService** - Core indexing engine
   - Redis sorted sets for entity storage
   - Hash storage for searchable text and metadata
   - Prefix and full-text search capabilities

2. **SearchService** - High-level search API
   - Converts indexed entities to search results
   - Entity-specific result formatting
   - Batch reindexing orchestration

3. **SearchController** - REST API endpoints
   - `GET /api/search` - Execute search
   - `POST /api/search/reindex` - Trigger reindex (admin only)
   - `GET /api/search/stats` - Get index statistics
   - `GET /api/search/analytics/popular` - Popular queries

4. **SearchReindexProcessor** - Background job processor
   - Handles batch reindexing jobs
   - Progress tracking
   - Error handling and retries

5. **SearchIndexHooks** - Entity lifecycle hooks
   - Auto-indexing on entity changes
   - Automatic index cleanup on delete

## API Endpoints

### Search
```http
GET /api/search?q=invoice&types=invoice,expense&limit=10&offset=0
```

**Query Parameters:**
- `q` (required): Search query (max 400 chars)
- `types` (optional): Entity types to search (comma-separated)
- `limit` (optional): Max results (1-100, default 10)
- `offset` (optional): Pagination offset (default 0)

**Response:**
```json
{
  "results": [
    {
      "entityType": "invoice",
      "entityId": "uuid",
      "title": "INV-2024-001",
      "subtitle": "Acme Corp - $1,250.00",
      "description": "PAID - Due: Jan 15, 2024",
      "url": "/invoices/uuid",
      "relevanceScore": 0.95,
      "metadata": { ... }
    }
  ],
  "total": 42,
  "query": "invoice",
  "executionTime": 23
}
```

### Reindex (Admin Only)
```http
POST /api/search/reindex
```

**Response:**
```json
{
  "jobId": "123",
  "message": "Reindex job started successfully",
  "estimatedTime": 120
}
```

### Statistics
```http
GET /api/search/stats
```

### Popular Queries
```http
GET /api/search/analytics/popular?limit=10
```

## Indexed Entities

### Invoice
- Number (INV-2024-001)
- Customer name
- Amount
- Status
- Issue/due dates

### Expense
- Vendor
- Description
- Category
- Amount
- Date

### Client
- Name
- Email
- Company
- Tax ID

### Report
- Type
- Name
- Description
- Date

### Employee
- First/Last name
- Email
- Department

## Usage Examples

### Manual Indexing
```typescript
import { SearchIndexHooks } from './hooks/search-index.hooks';

// After creating an invoice
await searchIndexHooks.onInvoiceChange(invoice);

// After deleting an invoice
await searchIndexHooks.onInvoiceDelete(invoiceId);
```

### Integration in Service
```typescript
// In your invoice service
async createInvoice(data: CreateInvoiceDto) {
  const invoice = await this.prisma.invoice.create({ data });

  // Auto-index
  await this.searchIndexHooks.onInvoiceChange(invoice);

  return invoice;
}
```

## Redis Data Structure

### Index Keys
- `search:index:invoice` - Sorted set of invoice IDs
- `search:index:expense` - Sorted set of expense IDs
- `search:index:client` - Sorted set of client IDs
- `search:index:report` - Sorted set of report IDs
- `search:index:employee` - Sorted set of employee IDs

### Entity Keys
- `search:index:invoice:{id}` - Hash with searchableText and metadata
- `search:index:expense:{id}` - Hash with searchableText and metadata
- etc.

### Analytics Keys
- `search:stats` - Hash with entity counts and last update
- `search:analytics:queries` - Sorted set of recent queries

## Performance

- **Search Speed**: ~10-50ms for typical queries
- **Index Size**: ~1KB per entity
- **Rate Limit**: 100 searches/min per user
- **Reindex Time**: ~2 minutes for 10,000 entities

## Configuration

No additional configuration required. Uses existing:
- Redis connection from `@nestjs-modules/ioredis`
- BullMQ from `@nestjs/bull`
- Database from `DatabaseModule`

## Testing

```bash
# Test search endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=invoice&limit=5"

# Trigger reindex
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/reindex"

# Get stats
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/stats"
```

## Monitoring

Check logs for:
- Search queries and performance
- Indexing operations
- Reindex job progress
- Rate limit hits

## Future Enhancements

- [ ] Fuzzy matching support
- [ ] Weighted field search (boost title over description)
- [ ] Search filters (date ranges, status, etc.)
- [ ] Search suggestions/autocomplete
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
