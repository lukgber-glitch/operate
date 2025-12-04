# INR Currency Formatter

Comprehensive Indian Rupee (INR) formatting utilities with support for Indian numbering system (lakhs/crores).

## Features

- **Indian Numbering System**: Format numbers with 2,2,3 grouping (e.g., ₹1,00,00,000)
- **Lakh/Crore Support**: Native support for Indian number units
- **Number to Words**: Convert amounts to words in English and Hindi
- **Compact Formatting**: Display amounts as ₹1.5L, ₹2.5Cr
- **Devanagari Numerals**: Optional Hindi numeral formatting (०१२३४५६७८९)
- **Parsing**: Parse formatted INR strings back to numbers
- **Validation**: Validate INR amounts

## Indian Numbering System

India uses a unique numbering system with different groupings:

| Amount | Format | Name |
|--------|--------|------|
| 1,000 | 1,000 | One Thousand |
| 10,000 | 10,000 | Ten Thousand |
| 100,000 | 1,00,000 | One Lakh |
| 1,000,000 | 10,00,000 | Ten Lakhs |
| 10,000,000 | 1,00,00,000 | One Crore |
| 100,000,000 | 10,00,00,000 | Ten Crores |

Pattern: **3 digits, then groups of 2**

## Usage

### Basic Formatting

```typescript
import { formatINR } from './inr.formatter';

formatINR(1000);       // ₹1,000.00
formatINR(100000);     // ₹1,00,000.00 (1 lakh)
formatINR(10000000);   // ₹1,00,00,000.00 (1 crore)
```

### Formatting Options

```typescript
// Without symbol
formatINR(100000, { includeSymbol: false });
// 1,00,000.00

// Alternative symbol
formatINR(100000, { useAlternativeSymbol: true });
// Rs.1,00,000.00

// Custom decimals
formatINR(100000, { decimals: 0 });
// ₹1,00,000

// Devanagari numerals
formatINR(100000, { useDevanagariNumerals: true });
// ₹१,००,०००.००
```

### Compact Formatting

Perfect for dashboards and UI:

```typescript
import { formatINRCompact } from './inr.formatter';

formatINRCompact(1500);       // ₹1.5K
formatINRCompact(150000);     // ₹1.5L (1.5 lakhs)
formatINRCompact(15000000);   // ₹1.5Cr (1.5 crores)
```

### Number to Words (Invoice)

```typescript
import { formatINRInWords } from './inr.formatter';

// English
formatINRInWords(123456.78, 'en');
// One lakh twenty-three thousand four hundred fifty-six Indian Rupees
// and Seventy-eight Paise Only

// Hindi
formatINRInWords(123456.78, 'hi');
// एक लाख तेईस हज़ार चार सौ छप्पन रुपये और अठहत्तर पैसे मात्र
```

### Parsing

```typescript
import { parseINR } from './inr.formatter';

parseINR('₹1,00,000.00');     // 100000
parseINR('Rs. 5,00,000');     // 500000
parseINR('₹१,००,०००');        // 100000 (Devanagari)
```

### Unit Conversion

```typescript
import { getAmountInLakhs, getAmountInCrores, formatINRWithUnit } from './inr.formatter';

getAmountInLakhs(500000);      // 5
getAmountInCrores(50000000);   // 5

formatINRWithUnit(100000);     // ₹1.00 Lakh
formatINRWithUnit(10000000);   // ₹1.00 Crore
```

### Validation

```typescript
import { validateINRAmount } from './inr.formatter';

validateINRAmount(123.45);     // { valid: true }
validateINRAmount(123.456);    // { valid: false, error: 'Too many decimal places' }
```

## Examples

### Invoice Example

```typescript
const amount = 123456.78;

console.log('Amount:', formatINR(amount));
// Amount: ₹1,23,456.78

console.log('In Words:', formatINRInWords(amount, 'en'));
// In Words: One lakh twenty-three thousand four hundred fifty-six
// Indian Rupees and Seventy-eight Paise Only
```

### GST Invoice

```typescript
const subtotal = 100000;
const cgst = subtotal * 0.09;  // 9% CGST
const sgst = subtotal * 0.09;  // 9% SGST
const total = subtotal + cgst + sgst;

console.log('Subtotal:', formatINR(subtotal));    // ₹1,00,000.00
console.log('CGST @ 9%:', formatINR(cgst));       // ₹9,000.00
console.log('SGST @ 9%:', formatINR(sgst));       // ₹9,000.00
console.log('Total:', formatINR(total));          // ₹1,18,000.00
```

### Financial Report

```typescript
const revenue = 125000000;   // 12.5 crores
const expenses = 87500000;   // 8.75 crores

console.log('Revenue:', formatINRWithUnit(revenue));   // ₹12.50 Crores
console.log('Expenses:', formatINRWithUnit(expenses)); // ₹8.75 Crores

// Dashboard view (compact)
console.log('Revenue:', formatINRCompact(revenue));    // ₹12.5Cr
console.log('Expenses:', formatINRCompact(expenses));  // ₹8.8Cr
```

## Constants

```typescript
import { INR_CONSTANTS } from './inr.constants';

INR_CONSTANTS.code              // 'INR'
INR_CONSTANTS.symbol            // '₹'
INR_CONSTANTS.numericCode       // 356
INR_CONSTANTS.decimalDigits     // 2
INR_CONSTANTS.units.lakh.value  // 100000
INR_CONSTANTS.units.crore.value // 10000000
```

## Indian Fiscal Year

```typescript
import { getCurrentFinancialYear, getQuarters } from '../../fiscal/india';

const fy = getCurrentFinancialYear();
// {
//   financialYear: "2024-25",
//   assessmentYear: "2025-26",
//   startDate: Date(2024-04-01),
//   endDate: Date(2025-03-31)
// }

const quarters = getQuarters('2024-25');
// [
//   { quarter: 1, name: 'Q1', startDate: Apr 1, endDate: Jun 30 },
//   { quarter: 2, name: 'Q2', startDate: Jul 1, endDate: Sep 30 },
//   { quarter: 3, name: 'Q3', startDate: Oct 1, endDate: Dec 31 },
//   { quarter: 4, name: 'Q4', startDate: Jan 1, endDate: Mar 31 }
// ]
```

## Exchange Rates

```typescript
import { EXAMPLE_INR_RATES, convertCurrency } from '../exchange-rates/inr-pairs';

// Example rates (use real-time API in production)
EXAMPLE_INR_RATES['USD/INR']  // 83.25
EXAMPLE_INR_RATES['EUR/INR']  // 90.5
EXAMPLE_INR_RATES['AED/INR']  // 22.65

// Convert
convertCurrency(100, 83.25, 'USD', 'INR');  // 8325 INR
```

## Testing

Run tests with:

```bash
npm test inr.formatter.spec.ts
```

Test coverage includes:
- Indian numbering system formatting
- Lakh/Crore formatting
- Number to words (English and Hindi)
- Compact formatting
- Parsing with various formats
- Validation
- Edge cases and large numbers

## Related

- [AED Currency Formatter](../aed/README.md) - UAE Dirham
- [SAR Currency Formatter](../sar/README.md) - Saudi Riyal
- [JPY Currency Formatter](../jpy/README.md) - Japanese Yen
- [Indian Fiscal Year](../../fiscal/india.ts) - FY/AY calculations
