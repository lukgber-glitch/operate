# Exchange Rate Service

Provides live and historical exchange rates for currency conversions across the Operate platform.

## Features

- **Live Exchange Rates**: Fetch current rates from Open Exchange Rates API
- **Historical Rates**: Access rates for specific dates
- **Redis Caching**: 1-hour TTL for performance optimization
- **Database Storage**: PostgreSQL storage for historical rate tracking
- **Automatic Refresh**: Hourly BullMQ job to update rates
- **Batch Operations**: Fetch multiple currency pairs efficiently
- **Fallback Strategy**: Cache → API → Database
- **Rate Validation**: Sanity checks for rate values
- **Multi-Base Support**: Support for USD, EUR, GBP base currencies

## API Endpoints

### Get Exchange Rate
```
GET /currency/rates/:from/:to
```
Get current exchange rate for a currency pair.

**Example:**
```bash
GET /currency/rates/USD/EUR
```

**Response:**
```json
{
  "rate": 0.85,
  "source": "live",
  "timestamp": "2024-12-02T21:30:00Z",
  "baseCurrency": "USD",
  "targetCurrency": "EUR"
}
```

### Get All Rates for Base Currency
```
GET /currency/rates/:base?targets=EUR,GBP,CHF
```
Get all exchange rates for a base currency.

**Example:**
```bash
GET /currency/rates/USD?targets=EUR,GBP,CHF
```

**Response:**
```json
{
  "base": "USD",
  "rates": {
    "EUR": 0.85,
    "GBP": 0.73,
    "CHF": 0.88
  },
  "source": "live",
  "timestamp": "2024-12-02T21:30:00Z"
}
```

### Get Historical Rate
```
GET /currency/rates/historical/:from/:to/:date
```
Get exchange rate for a specific date.

**Example:**
```bash
GET /currency/rates/historical/USD/EUR/2024-01-15
```

**Response:**
```json
{
  "rate": 0.92,
  "date": "2024-01-15",
  "baseCurrency": "USD",
  "targetCurrency": "EUR",
  "source": "database"
}
```

### Force Refresh Rates
```
POST /currency/rates/refresh?baseCurrency=USD
```
Manually trigger rate refresh (admin only).

**Response:**
```json
{
  "jobId": "123",
  "message": "Exchange rate refresh scheduled",
  "baseCurrency": "USD"
}
```

## Configuration

### Environment Variables

```bash
# Open Exchange Rates API
OPEN_EXCHANGE_RATES_API_KEY=your_api_key_here
OPEN_EXCHANGE_RATES_API_URL=https://openexchangerates.org/api

# Cache Configuration
EXCHANGE_RATE_CACHE_TTL=3600  # 1 hour in seconds

# Scheduler Configuration
EXCHANGE_RATE_REFRESH_ENABLED=true
EXCHANGE_RATE_BASE_CURRENCIES=USD,EUR,GBP
EXCHANGE_RATE_STAGGER_DELAY_MS=10000  # 10 seconds between jobs
```

### API Key Setup

1. **Free Tier (Open Exchange Rates)**:
   - Sign up at https://openexchangerates.org/signup/free
   - 1,000 requests/month
   - USD base currency only
   - Hourly updates

2. **Alternative: exchangerate-api.com**:
   - Sign up at https://www.exchangerate-api.com/
   - Free tier available
   - Multiple base currencies

## Architecture

### Data Flow

```
┌─────────────────┐
│  REST API       │
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ ExchangeRate    │────▶│ Redis Cache  │
│ Service         │     │ (1hr TTL)    │
└────────┬────────┘     └──────────────┘
         │
         ├───────────────┐
         │               │
         ▼               ▼
┌─────────────────┐  ┌──────────────┐
│ Open Exchange   │  │ PostgreSQL   │
│ Rates API       │  │ (Historical) │
└─────────────────┘  └──────────────┘
```

### Scheduled Jobs

**Exchange Rate Refresh Job**:
- **Schedule**: Every hour (`0 * * * *`)
- **Queue**: `exchange-rate-refresh`
- **Processor**: `ExchangeRateRefreshProcessor`
- **Retry**: 3 attempts with exponential backoff

## Usage Examples

### Service Integration

```typescript
import { ExchangeRateService } from '@modules/currency/exchange-rate.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  async convertInvoiceAmount(amount: number, from: string, to: string) {
    const rateData = await this.exchangeRateService.getRate(from, to);
    const convertedAmount = amount * rateData.rate;

    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount,
      targetCurrency: to,
      rate: rateData.rate,
      source: rateData.source,
    };
  }
}
```

### Multi-Currency Service Integration

```typescript
import { MultiCurrencyService } from '@modules/currency/multi-currency.service';

@Injectable()
export class ExpenseService {
  constructor(private readonly currencyService: MultiCurrencyService) {}

  async createExpense(amount: number, currency: string) {
    // Convert to organization's base currency using live rates
    const result = await this.currencyService.convertWithLiveRate(
      amount,
      currency,
      'EUR',
    );

    return {
      amount,
      currency,
      baseAmount: result.convertedAmount,
      baseCurrency: 'EUR',
      exchangeRate: result.rate,
      rateSource: result.source,
      rateTimestamp: result.timestamp,
    };
  }
}
```

## Database Schema

```prisma
model ExchangeRate {
  id             String   @id @default(cuid())
  baseCurrency   String   @db.VarChar(3)
  targetCurrency String   @db.VarChar(3)
  rate           Decimal  @db.Decimal(18, 8)
  source         String   @db.VarChar(50)
  date           DateTime @db.Date
  fetchedAt      DateTime @default(now())

  @@unique([baseCurrency, targetCurrency, date])
  @@index([baseCurrency, targetCurrency])
  @@index([date])
  @@map("exchange_rates")
}
```

## Caching Strategy

### Redis Cache Keys

- Single rate: `exchange:rate:{FROM}:{TO}`
- Batch rates: `exchange:rates:{BASE}`
- TTL: 3600 seconds (1 hour)

### Cache Hierarchy

1. **Redis Cache** (fastest): Check for cached rate
2. **Live API** (medium): Fetch from external API
3. **Database** (fallback): Use most recent historical rate

## Rate Validation

The service performs sanity checks on all rates:

- **Minimum Rate**: 0.000001
- **Maximum Rate**: 1,000,000
- **NaN Check**: Ensures rate is a valid number
- **Positive Check**: Rate must be > 0

## Error Handling

```typescript
try {
  const rate = await exchangeRateService.getRate('USD', 'EUR');
} catch (error) {
  if (error instanceof BadRequestException) {
    // Invalid currency codes or no rate available
  }
}
```

## Monitoring

### Queue Health Check

```typescript
const health = await exchangeRateScheduler.getQueueHealth();

console.log(health);
// {
//   isHealthy: true,
//   isPaused: false,
//   stats: { waiting: 0, active: 1, completed: 523, failed: 2 },
//   warnings: []
// }
```

### Job Status Tracking

```typescript
const jobId = await exchangeRateScheduler.scheduleImmediateRefresh('USD');
const status = await exchangeRateScheduler.getJobStatus(jobId);

console.log(status);
// {
//   id: '123',
//   state: 'completed',
//   progress: { stage: 'completed', percent: 100 },
//   result: { success: true, ratesRefreshed: 156 }
// }
```

## Testing

### Unit Tests

```typescript
describe('ExchangeRateService', () => {
  it('should fetch live rate from API', async () => {
    const rate = await service.getRate('USD', 'EUR');
    expect(rate.rate).toBeGreaterThan(0);
    expect(rate.source).toBe('live');
  });

  it('should use cached rate when available', async () => {
    await service.getRate('USD', 'EUR'); // Prime cache
    const rate = await service.getRate('USD', 'EUR');
    expect(rate.source).toBe('cache');
  });

  it('should handle same currency conversion', async () => {
    const rate = await service.getRate('USD', 'USD');
    expect(rate.rate).toBe(1);
  });
});
```

## Performance

- **Cache Hit**: ~1-2ms (Redis lookup)
- **API Call**: ~200-500ms (external API)
- **Database Fallback**: ~10-50ms (PostgreSQL query)

## API Rate Limits

**Open Exchange Rates (Free Tier)**:
- 1,000 requests/month
- Hourly updates recommended
- ~33 requests/day
- With 3 base currencies (USD, EUR, GBP): ~11 refreshes/day
- Schedule: Every 2 hours = 12 refreshes/day ✓

## Troubleshooting

### No Exchange Rate API Key

If API key is not configured, service will:
1. Log warning on startup
2. Use cached rates if available
3. Fall back to database historical rates
4. Throw error if no rate found

### Rate Not Found

Possible causes:
- Currency pair not supported by API
- API request failed
- No historical data in database
- Invalid currency codes

### High Failed Jobs

Check:
- API key validity
- Network connectivity
- API rate limits
- Queue health status

## Migration from W20-T3

The exchange rate service integrates seamlessly with the existing `MultiCurrencyService`:

```typescript
// Old way (static rate)
const converted = currencyService.convert(100, 'USD', 'EUR', 0.85);

// New way (live rate)
const result = await currencyService.convertWithLiveRate(100, 'USD', 'EUR');
console.log(result.convertedAmount, result.rate, result.source);
```

## Future Enhancements

- [ ] Support for cryptocurrency exchange rates
- [ ] Webhook notifications for significant rate changes
- [ ] Rate alerts and notifications
- [ ] Advanced caching with stale-while-revalidate
- [ ] GraphQL subscription for real-time rate updates
- [ ] Support for alternative rate providers (ECB, Yahoo Finance)
- [ ] Rate history charts and analytics
