# JPY Currency Formatter

Complete Japanese Yen (JPY) currency formatting system with support for both international and traditional Japanese number formats.

## Features

### 1. Standard JPY Formatting
- International format: `¥1,234,567`
- No decimal places (JPY is a non-decimal currency)
- Proper thousand separators
- Symbol prefix (¥)

### 2. Traditional Japanese Format
- Large number kanji: 万 (man), 億 (oku), 兆 (cho)
- Example: `1億2,345万6,789円`
- Supports both ¥ and 円 symbols

### 3. Parsing Support
- Parse standard format: `¥1,234,567` → `1234567`
- Parse traditional format: `1万2,345円` → `12345`
- Handles both formats automatically

### 4. Validation
- Ensures whole numbers (no decimals)
- Validates finite values
- Type-safe error handling

## Usage

### Basic Formatting

```typescript
import { formatJPY } from '@operate/shared';

// Standard format
formatJPY(1234567); // "¥1,234,567"
formatJPY(1000); // "¥1,000"

// Without symbol
formatJPY(1234567, { includeSymbol: false }); // "1,234,567"

// Automatic rounding (JPY has no decimals)
formatJPY(1234.56); // "¥1,235"
```

### Traditional Japanese Format

```typescript
import { formatJPY } from '@operate/shared';

// With traditional notation
formatJPY(12345, {
  useTraditionalFormat: true,
  useKanjiYenSymbol: true
}); // "1万2,345円"

formatJPY(123456789, {
  useTraditionalFormat: true,
  useKanjiYenSymbol: true
}); // "1億2,345万6,789円"

// Large numbers
formatJPY(1234567890000, {
  useTraditionalFormat: true,
  useKanjiYenSymbol: true
}); // "1兆2,345億6,789万円"
```

### Parsing

```typescript
import { parseJPY } from '@operate/shared';

// Standard format
parseJPY('¥1,234,567'); // 1234567
parseJPY('1,000'); // 1000

// Traditional format
parseJPY('1万2,345円'); // 12345
parseJPY('1億円'); // 100000000
parseJPY('5億3万円'); // 500030000
```

### Compact Formatting

```typescript
import { formatJPYCompact } from '@operate/shared';

// Japanese locale - uses traditional format
formatJPYCompact(123456789, 'ja-JP'); // "1億2,345万6,789円"

// English locale - uses compact notation
formatJPYCompact(1234567, 'en-US'); // "¥1.2M"
```

### Validation

```typescript
import { validateJPYAmount } from '@operate/shared';

validateJPYAmount(1234567);
// { valid: true }

validateJPYAmount(1234.56);
// { valid: false, error: 'JPY amounts cannot have decimal places' }

validateJPYAmount(NaN);
// { valid: false, error: 'Amount must be a valid number' }
```

## Large Number Units

| Kanji | Romaji | Value | Example |
|-------|---------|-------|---------|
| 万 | man | 10,000 | 1万 = ¥10,000 |
| 億 | oku | 100,000,000 | 1億 = ¥100,000,000 |
| 兆 | cho | 1,000,000,000,000 | 1兆 = ¥1,000,000,000,000 |

## Constants

```typescript
import { JPY_CONSTANTS } from '@operate/shared';

JPY_CONSTANTS.code; // 'JPY'
JPY_CONSTANTS.symbol; // '¥'
JPY_CONSTANTS.decimalDigits; // 0
JPY_CONSTANTS.symbolPosition; // 'prefix'
JPY_CONSTANTS.thousandSeparator; // ','
JPY_CONSTANTS.largeNumbers.man; // 10000
JPY_CONSTANTS.largeNumbers.oku; // 100000000
JPY_CONSTANTS.largeNumbers.cho; // 1000000000000
JPY_CONSTANTS.kanji.man; // '万'
JPY_CONSTANTS.kanji.oku; // '億'
JPY_CONSTANTS.kanji.cho; // '兆'
JPY_CONSTANTS.kanji.yen; // '円'
```

## Exchange Rates

```typescript
import {
  JPY_RATE_PAIRS,
  convertCurrency,
  EXAMPLE_JPY_RATES
} from '@operate/shared';

// Get pair information
const usdJpy = JPY_RATE_PAIRS['USD/JPY'];
// { pair: 'USD/JPY', baseCurrency: 'USD', quoteCurrency: 'JPY', ... }

// Convert currencies
const jpy = convertCurrency(100, 149.85, 'USD', 'JPY');
// 14985 (rounded to whole number)

// Example rates (for testing/demo)
EXAMPLE_JPY_RATES['USD/JPY']; // 149.85
EXAMPLE_JPY_RATES['EUR/JPY']; // 162.45
```

## Supported Exchange Pairs

- USD/JPY - US Dollar to Japanese Yen
- EUR/JPY - Euro to Japanese Yen
- GBP/JPY - British Pound to Japanese Yen
- AUD/JPY - Australian Dollar to Japanese Yen
- CAD/JPY - Canadian Dollar to Japanese Yen
- CHF/JPY - Swiss Franc to Japanese Yen
- CNY/JPY - Chinese Yuan to Japanese Yen
- HKD/JPY - Hong Kong Dollar to Japanese Yen
- NZD/JPY - New Zealand Dollar to Japanese Yen
- SGD/JPY - Singapore Dollar to Japanese Yen

## API Reference

### `formatJPY(amount: number, options?: JPYFormattingOptions): string`

Format a number as JPY currency.

**Options:**
- `useTraditionalFormat?: boolean` - Use 万/億/兆 notation (default: false)
- `includeSymbol?: boolean` - Include currency symbol (default: true)
- `useKanjiYenSymbol?: boolean` - Use 円 instead of ¥ (default: false)
- `locale?: string` - Locale for formatting (default: 'ja-JP')

### `parseJPY(value: string): number`

Parse a JPY string to number. Supports both standard and traditional formats.

### `formatJPYCompact(amount: number, locale?: string): string`

Format in compact notation (1.2M for English, 123万円 for Japanese).

### `validateJPYAmount(amount: number): { valid: boolean; error?: string }`

Validate a JPY amount (must be whole number, finite, not NaN).

## Testing

Run the comprehensive test suite:

```bash
npm test -- src/currency/jpy/tests/jpy.formatter.spec.ts
```

## See Also

- [Japanese Fiscal Year Service](../../fiscal-year/README.md)
- [Japanese Era Conversion](../../fiscal-year/japanese-era.ts)
