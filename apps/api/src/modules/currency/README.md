# Currency Module

Comprehensive multi-currency support for the Operate/CoachOS platform.

## Features

- **30+ Supported Currencies**: USD, EUR, GBP, CHF, JPY, CAD, AUD, and more
- **Currency Metadata**: Symbols, decimal places, formatting rules, country mapping
- **Amount Conversion**: Convert between any supported currencies
- **Locale-Aware Formatting**: Format amounts according to regional preferences
- **Amount Parsing**: Parse currency strings back to numeric values
- **Smart Rounding**: Currency-specific rounding rules (e.g., CHF cash rounding)
- **Country Mapping**: Get currency by ISO country code

## Supported Currencies

### Major Currencies
- USD (US Dollar) - 🇺🇸
- EUR (Euro) - 🇪🇺
- GBP (British Pound) - 🇬🇧
- JPY (Japanese Yen) - 🇯🇵
- CHF (Swiss Franc) - 🇨🇭

### Regional Coverage
- **North America**: USD, CAD, MXN
- **Europe**: EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, RUB, TRY
- **Asia**: JPY, CNY, INR, KRW, HKD, SGD, THB, MYR, IDR, PHP, VND
- **Oceania**: AUD, NZD
- **Middle East**: AED, SAR, ILS
- **South America**: BRL
- **Africa**: ZAR, NGN

## API Usage

### Get All Currencies
```typescript
GET /currency

Response: CurrencyDto[]
```

### Get Currency by Code
```typescript
GET /currency/:code

Example: GET /currency/USD
Response: CurrencyDto
```

### Get Currency by Country
```typescript
GET /currency/country/:countryCode

Example: GET /currency/country/DE
Response: CurrencyDto (EUR)
```

### Convert Currency
```typescript
POST /currency/convert
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "rate": 0.92  // Optional, defaults to 1:1
}

Response: ConvertCurrencyResponseDto
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "convertedAmount": 92,
  "rate": 0.92,
  "timestamp": "2024-12-02T10:30:00Z"
}
```

### Format Amount
```typescript
POST /currency/format
{
  "amount": 1234.56,
  "currency": "USD",
  "locale": "en-US",  // Optional
  "showSymbol": true, // Optional, default true
  "showCode": false   // Optional, default false
}

Response: FormatAmountResponseDto
{
  "formatted": "$1,234.56",
  "currency": "USD",
  "locale": "en-US"
}
```

### Parse Amount
```typescript
POST /currency/parse
{
  "input": "$1,234.56",
  "currency": "USD",
  "locale": "en-US"  // Optional
}

Response: ParseAmountResponseDto
{
  "amount": 1234.56,
  "currency": "USD",
  "input": "$1,234.56"
}
```

## Service Usage (Internal)

```typescript
import { MultiCurrencyService } from '@/modules/currency';

@Injectable()
export class InvoiceService {
  constructor(private currencyService: MultiCurrencyService) {}

  async createInvoice(dto: CreateInvoiceDto) {
    // Validate currency
    this.currencyService.validateCurrencyCode(dto.currency);

    // Format amount for display
    const formatted = this.currencyService.formatAmount(
      dto.amount,
      dto.currency
    );

    // Convert to organization's default currency
    const converted = this.currencyService.convert(
      dto.amount,
      dto.currency,
      organisation.currency,
      exchangeRate
    );

    // Round to currency decimals
    const rounded = this.currencyService.roundToDecimals(
      dto.amount,
      dto.currency
    );
  }
}
```

## Currency Configuration

Each currency includes:
- **code**: ISO 4217 code (e.g., "USD")
- **symbol**: Currency symbol (e.g., "$")
- **name**: Full name (e.g., "US Dollar")
- **decimals**: Number of decimal places (2 for most, 0 for JPY)
- **countries**: Array of ISO country codes
- **flag**: Emoji flag of primary country
- **format**: Symbol position ("before" or "after")
- **locale**: Default locale for formatting
- **rounding**: Rounding method ("standard" or "cash")

## Special Cases

### Zero Decimal Currencies
Some currencies don't use decimal places:
- JPY (Japanese Yen)
- KRW (South Korean Won)
- IDR (Indonesian Rupiah)
- VND (Vietnamese Dong)
- HUF (Hungarian Forint)

Example: ¥1,234 (not ¥1,234.00)

### Cash Rounding
CHF (Swiss Franc) uses 0.05 rounding for cash transactions:
- 1234.56 → 1234.55
- 1234.57 → 1234.55
- 1234.58 → 1234.60

### Symbol Position
Different currencies place symbols differently:
- **Before**: USD ($1,234.56), GBP (£1,234.56)
- **After**: EUR (1.234,56 €), CHF (1234.56 CHF)

### Decimal Separators
- **Period (.)**: US, UK, Japan - 1,234.56
- **Comma (,)**: Europe - 1.234,56
- **Space**: Switzerland - 1 234.56

## Integration Points

### Exchange Rate Service (W20-T4)
The `convert()` method will integrate with the Exchange Rate Service for live rates:
```typescript
const rate = await exchangeRateService.getRate('USD', 'EUR');
const converted = currencyService.convert(100, 'USD', 'EUR', rate);
```

### Database Models
Multi-currency fields in Prisma schema:
```prisma
model Invoice {
  totalAmount Decimal @db.Decimal(12, 2)
  currency    String  @default("EUR")

  // For conversions
  exchangeRate     Decimal? @db.Decimal(10, 6)
  originalAmount   Decimal? @db.Decimal(12, 2)
  originalCurrency String?
}
```

### Frontend Components (W20-T7)
The service provides formatted amounts for UI display:
```typescript
// API returns formatted amounts
{
  amount: 1234.56,
  currency: "USD",
  formatted: "$1,234.56"
}
```

## Testing

Run tests:
```bash
npm test -- multi-currency.service.spec.ts
```

Test coverage includes:
- Currency metadata retrieval
- Currency validation
- Amount conversion
- Amount formatting (multiple locales)
- Amount parsing (multiple formats)
- Rounding rules
- Country to currency mapping
- Edge cases (zero decimals, cash rounding)

## Future Enhancements

1. **Historical Exchange Rates**: Track rate changes over time
2. **Cryptocurrency Support**: BTC, ETH, USDT
3. **Custom Currency Symbols**: Organization-specific symbols
4. **Currency Conversion Cache**: Cache recent conversions
5. **Multi-Currency Reports**: Aggregate reporting across currencies
6. **Currency Alerts**: Notify on significant rate changes

## Notes

- Exchange rates default to 1:1 until Exchange Rate Service (W20-T4) is integrated
- All amounts are stored as Decimal in database for precision
- Currency codes are case-insensitive in API
- Locale detection can use Accept-Language header
- Rounding always rounds half up (0.5 → 1)
