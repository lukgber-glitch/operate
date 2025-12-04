# AED (UAE Dirham) Currency Module

Complete implementation of UAE Dirham currency support with Arabic language features.

## Features

- **Standard Formatting:** `1,234.56 د.إ`
- **Arabic Numerals:** `١٬٢٣٤٫٥٦ د.إ`
- **Compact Format:** `1.2M د.إ`
- **Amount-to-Words:** Arabic and English invoice formatting
- **Pegged Exchange Rate:** Fixed at 3.6725 AED per USD
- **Full Parsing:** Supports both Western and Arabic numerals

## Quick Start

```typescript
import { formatAED, parseAED, formatAEDInWords } from '@operate/shared/currency';

// Basic formatting
formatAED(1234.56);  // "1,234.56 د.إ"

// Arabic numerals
formatAED(1234.56, { useArabicNumerals: true });  // "١٬٢٣٤٫٥٦ د.إ"

// Compact format
formatAEDCompact(1234567);  // "1.2M د.إ"

// Amount in words (for invoices)
formatAEDInWords(1234.56, 'ar');
// "ألف ومائتان وأربعة وثلاثون درهماً إماراتياً وستة وخمسون فلساً"

// Parsing
parseAED('1,234.56 د.إ');  // 1234.56
parseAED('١٬٢٣٤٫٥٦ د.إ');  // 1234.56 (Arabic numerals)
```

## Currency Details

- **ISO Code:** AED
- **ISO Numeric:** 784
- **Symbol:** د.إ (or AED)
- **Decimal Places:** 2
- **Minor Unit:** Fils (100 fils = 1 AED)
- **Pegged To:** USD at 3.6725 (fixed since 1997)

## UAE Business Context

- **VAT Rate:** 5%
- **VAT Registration Threshold:** AED 375,000
- **VAT Voluntary Threshold:** AED 187,500

## API Reference

### formatAED(amount, options?)

Format an amount as AED currency.

**Parameters:**
- `amount: number` - The amount to format
- `options?: AEDFormattingOptions`
  - `useArabicNumerals?: boolean` - Use Arabic numerals (default: false)
  - `includeSymbol?: boolean` - Include currency symbol (default: true)
  - `useAlternativeSymbol?: boolean` - Use "AED" instead of د.إ (default: false)
  - `locale?: string` - Locale for formatting (default: 'en-AE')
  - `decimals?: number` - Number of decimal places (default: 2)

**Returns:** `string`

### parseAED(value)

Parse an AED formatted string to number.

**Parameters:**
- `value: string` - The formatted string to parse

**Returns:** `number`

### formatAEDCompact(amount, locale?, useArabicNumerals?)

Format AED in compact notation.

**Parameters:**
- `amount: number` - The amount to format
- `locale?: string` - Locale (default: 'en-AE')
- `useArabicNumerals?: boolean` - Use Arabic numerals (default: false)

**Returns:** `string`

### formatAEDInWords(amount, language?)

Convert amount to words for invoices.

**Parameters:**
- `amount: number` - The amount to convert
- `language?: 'ar' | 'en'` - Language (default: 'ar')

**Returns:** `string`

### validateAEDAmount(amount)

Validate an AED amount.

**Parameters:**
- `amount: number` - The amount to validate

**Returns:** `{ valid: boolean; error?: string }`

## Examples

See `aed.example.ts` for comprehensive usage examples.

## Tests

Run tests with:
```bash
npm test -- aed.formatter.spec
```

## Related

- [SAR (Saudi Riyal)](../sar/README.md)
- [JPY (Japanese Yen)](../jpy/README.md)
- [Exchange Rate Pairs](../exchange-rates/aed-pairs.ts)
