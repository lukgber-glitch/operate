# Japanese Fiscal Year Service

Complete Japanese fiscal year management system with support for Japanese era (年号) conversion and traditional calendar systems.

## Features

### 1. Japanese Fiscal Year (April - March)
- Standard fiscal year: April 1 - March 31
- Configurable start month for custom fiscal years
- Fiscal year naming with Japanese era (令和X年度)
- Quarter and month breakdown

### 2. Japanese Era Conversion
- Reiwa (令和, 2019-present)
- Heisei (平成, 1989-2019)
- Showa (昭和, 1926-1989)
- Taisho (大正, 1912-1926)
- Meiji (明治, 1868-1912)

### 3. Date Formatting
- Full format: 令和6年12月3日
- Short format: R6.12.3
- Year only: 令和6年

## Usage

### Basic Fiscal Year Operations

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();

// Get current fiscal year
const current = fiscalYear.getCurrentFiscalYear();
console.log(current.formatted); // "令和6年度"
console.log(current.fiscalYear); // 2024
console.log(current.startDate); // 2024-04-01
console.log(current.endDate); // 2025-03-31

// Get fiscal year for specific date
const jan2024 = new Date('2024-01-15');
const fy = fiscalYear.getFiscalYear(jan2024);
console.log(fy.fiscalYear); // 2023 (Jan 2024 is in FY2023)
```

### Fiscal Year Navigation

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();

// Get previous fiscal year
const previous = fiscalYear.getPreviousFiscalYear();

// Get next fiscal year
const next = fiscalYear.getNextFiscalYear();

// Get specific fiscal year
const fy2024 = fiscalYear.getFiscalYearByNumber(2024);
```

### Fiscal Quarters

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();
const quarters = fiscalYear.getFiscalQuarters(2024);

quarters.forEach((q, i) => {
  console.log(`Q${i + 1}: ${q.formatted}`);
  console.log(`  Start: ${q.startDate}`);
  console.log(`  End: ${q.endDate}`);
});

// Output:
// Q1: 令和6年度 Q1
//   Start: 2024-04-01
//   End: 2024-06-30
// Q2: 令和6年度 Q2
//   Start: 2024-07-01
//   End: 2024-09-30
// ...
```

### Fiscal Months

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();
const months = fiscalYear.getFiscalMonths(2024);

console.log(months[0].formatted); // "令和6年度 4月"
console.log(months[11].formatted); // "令和7年度 3月"
```

### Date Validation

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();

const may2024 = new Date('2024-05-15');
fiscalYear.isDateInFiscalYear(may2024, 2024); // true
fiscalYear.isDateInFiscalYear(may2024, 2023); // false
```

### Fiscal Year Metrics

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();

// Total days in fiscal year
const totalDays = fiscalYear.getFiscalYearDays(2024);
console.log(totalDays); // 366 (2024 is leap year)

// Business days (Mon-Fri)
const businessDays = fiscalYear.getFiscalYearBusinessDays(2024);
console.log(businessDays); // ~260

// Progress (0-1)
const progress = fiscalYear.getFiscalYearProgress();
console.log(progress); // e.g., 0.75 (75% through fiscal year)
```

### Format Fiscal Year Range

```typescript
import { createStandardJapaneseFiscalYear } from '@operate/shared';

const fiscalYear = createStandardJapaneseFiscalYear();

// Japanese format with era
const rangeJa = fiscalYear.formatFiscalYearRange(2024, 'ja-JP');
console.log(rangeJa);
// "令和6年4月1日 〜 令和7年3月31日"

// English format
const rangeEn = fiscalYear.formatFiscalYearRange(2024, 'en-US');
console.log(rangeEn);
// "April 1, 2024 - March 31, 2025"
```

## Japanese Era Conversion

### Convert Western to Japanese Year

```typescript
import { toJapaneseYear } from '@operate/shared';

// Basic conversion
const japYear = toJapaneseYear(2024);
console.log(japYear?.formatted); // "令和6年"
console.log(japYear?.eraName); // "Reiwa"
console.log(japYear?.eraNameJa); // "令和"
console.log(japYear?.eraYear); // 6
console.log(japYear?.westernYear); // 2024

// Precise conversion (for era transition dates)
const transition = toJapaneseYear(2019, 5, 1); // May 1, 2019
console.log(transition?.eraName); // "Reiwa"
console.log(transition?.eraYear); // 1
```

### Convert Japanese to Western Year

```typescript
import { toWesternYear } from '@operate/shared';

// Using romaji
toWesternYear('Reiwa', 6); // 2024
toWesternYear('Heisei', 31); // 2019

// Using kanji
toWesternYear('令和', 6); // 2024
toWesternYear('平成', 12); // 2000
```

### Format Japanese Dates

```typescript
import { formatJapaneseDate } from '@operate/shared';

const date = new Date('2024-12-03');

// Full format
formatJapaneseDate(date, 'full');
// "令和6年12月3日"

// Short format
formatJapaneseDate(date, 'short');
// "R6.12.3"

// Year only
formatJapaneseDate(date, 'year-only');
// "令和6年"
```

### Parse Japanese Dates

```typescript
import { parseJapaneseDate } from '@operate/shared';

// Full format
parseJapaneseDate('令和6年12月3日');
// Date object: 2024-12-03

// Short format
parseJapaneseDate('R6.12.3');
// Date object: 2024-12-03

// Heisei format
parseJapaneseDate('平成12年1月1日');
// Date object: 2000-01-01
```

### Era Validation

```typescript
import { isYearInEra, getCurrentJapaneseYear } from '@operate/shared';

// Check if year is in era
isYearInEra(2024, 'Reiwa'); // true
isYearInEra(2024, '令和'); // true
isYearInEra(2018, 'Reiwa'); // false

// Get current era
const current = getCurrentJapaneseYear();
console.log(current?.eraName); // "Reiwa"
console.log(current?.eraYear); // Current year in Reiwa era
```

## Custom Fiscal Year Configuration

### Calendar Year Fiscal Year (January - December)

```typescript
import { createCustomFiscalYear } from '@operate/shared';

const calendarYear = createCustomFiscalYear({
  startMonth: 1, // January
  useJapaneseEra: false,
  yearNamingConvention: 'start'
});

const fy = calendarYear.getCurrentFiscalYear();
console.log(fy.formatted); // "2024年度"
```

### July Fiscal Year (Common for Some Organizations)

```typescript
import { createCustomFiscalYear } from '@operate/shared';

const julyFiscalYear = createCustomFiscalYear({
  startMonth: 7, // July
  useJapaneseEra: true,
  yearNamingConvention: 'start'
});
```

### End Year Naming Convention

```typescript
import { createCustomFiscalYear } from '@operate/shared';

// Some organizations name fiscal year by ending year
const endYearNaming = createCustomFiscalYear({
  startMonth: 4,
  useJapaneseEra: true,
  yearNamingConvention: 'end' // FY ending in 2025
});

const may2024 = new Date('2024-05-15');
const fy = endYearNaming.getFiscalYear(may2024);
console.log(fy.fiscalYear); // 2025 (ends March 2025)
```

## Japanese Eras

| Era | Kanji | Romaji | Start | End | Western Years |
|-----|-------|--------|-------|-----|---------------|
| Reiwa | 令和 | Reiwa | 2019-05-01 | present | 2019- |
| Heisei | 平成 | Heisei | 1989-01-08 | 2019-04-30 | 1989-2019 |
| Showa | 昭和 | Showa | 1926-12-25 | 1989-01-07 | 1926-1989 |
| Taisho | 大正 | Taisho | 1912-07-30 | 1926-12-24 | 1912-1926 |
| Meiji | 明治 | Meiji | 1868-01-25 | 1912-07-29 | 1868-1912 |

## API Reference

### FiscalYearPeriod

```typescript
interface FiscalYearPeriod {
  fiscalYear: number;
  startDate: Date;
  endDate: Date;
  japaneseYear?: JapaneseYear;
  formatted: string;
}
```

### JapaneseYear

```typescript
interface JapaneseYear {
  eraName: string;
  eraNameJa: string;
  eraYear: number;
  westernYear: number;
  formatted: string;
  formattedRomaji: string;
}
```

### FiscalYearConfig

```typescript
interface FiscalYearConfig {
  startMonth?: number; // 1-12, default: 4 (April)
  useJapaneseEra?: boolean; // default: true
  yearNamingConvention?: 'start' | 'end'; // default: 'start'
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- src/fiscal-year/tests/jp-fiscal-year.spec.ts
```

## Examples

See [jp-fiscal-year.example.ts](./jp-fiscal-year.example.ts) for complete usage examples.

## See Also

- [JPY Currency Formatter](../currency/jpy/README.md)
- [Japanese Tax Utilities](../tax/jp/README.md)
