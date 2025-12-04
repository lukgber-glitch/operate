# SAR (Saudi Riyal) Currency Module

Complete implementation of Saudi Riyal currency support with Arabic language features.

## Features

- **Standard Formatting:** `1,234.56 ر.س`
- **Arabic Numerals:** `١٬٢٣٤٫٥٦ ر.س`
- **Compact Format:** `1.2M ر.س`
- **Amount-to-Words:** Arabic and English invoice formatting
- **Pegged Exchange Rate:** Fixed at 3.75 SAR per USD
- **Full Parsing:** Supports both Western and Arabic numerals

## Quick Start

```typescript
import { formatSAR, parseSAR, formatSARInWords } from '@operate/shared/currency';

// Basic formatting
formatSAR(1234.56);  // "1,234.56 ر.س"

// Arabic numerals
formatSAR(1234.56, { useArabicNumerals: true });  // "١٬٢٣٤٫٥٦ ر.س"

// Compact format
formatSARCompact(1234567);  // "1.2M ر.س"

// Amount in words (for invoices)
formatSARInWords(1234.56, 'ar');
// "ألف ومائتان وأربعة وثلاثون ريالاً سعودياً وستة وخمسون هللة"

// Parsing
parseSAR('1,234.56 ر.س');  // 1234.56
parseSAR('١٬٢٣٤٫٥٦ ر.س');  // 1234.56 (Arabic numerals)
```

## Currency Details

- **ISO Code:** SAR
- **ISO Numeric:** 682
- **Symbol:** ر.س (or SAR)
- **Decimal Places:** 2
- **Minor Unit:** Halala (100 halala = 1 SAR)
- **Pegged To:** USD at 3.75 (fixed since 1986)

## Saudi Arabia Business Context

- **VAT Rate:** 15%
- **VAT Registration Threshold:** SAR 375,000
- **VAT Voluntary Threshold:** SAR 187,500
- **Zakat Threshold:** SAR 85,000 (Nisab for gold)

## API Reference

### formatSAR(amount, options?)

Format an amount as SAR currency.

**Parameters:**
- `amount: number` - The amount to format
- `options?: SARFormattingOptions`
  - `useArabicNumerals?: boolean` - Use Arabic numerals (default: false)
  - `includeSymbol?: boolean` - Include currency symbol (default: true)
  - `useAlternativeSymbol?: boolean` - Use "SAR" instead of ر.س (default: false)
  - `locale?: string` - Locale for formatting (default: 'ar-SA')
  - `decimals?: number` - Number of decimal places (default: 2)

**Returns:** `string`

### parseSAR(value)

Parse a SAR formatted string to number.

**Parameters:**
- `value: string` - The formatted string to parse

**Returns:** `number`

### formatSARCompact(amount, locale?, useArabicNumerals?)

Format SAR in compact notation.

**Parameters:**
- `amount: number` - The amount to format
- `locale?: string` - Locale (default: 'ar-SA')
- `useArabicNumerals?: boolean` - Use Arabic numerals (default: false)

**Returns:** `string`

### formatSARInWords(amount, language?)

Convert amount to words for invoices.

**Parameters:**
- `amount: number` - The amount to convert
- `language?: 'ar' | 'en'` - Language (default: 'ar')

**Returns:** `string`

### validateSARAmount(amount)

Validate a SAR amount.

**Parameters:**
- `amount: number` - The amount to validate

**Returns:** `{ valid: boolean; error?: string }`

## Examples

See `sar.example.ts` for comprehensive usage examples.

## Tests

Run tests with:
```bash
npm test -- sar.formatter.spec
```

## Related

- [AED (UAE Dirham)](../aed/README.md)
- [JPY (Japanese Yen)](../jpy/README.md)
- [Exchange Rate Pairs](../exchange-rates/sar-pairs.ts)
