# i18n - Internationalization

This package provides locale-specific formatters for internationalization support across the Operate platform.

## Supported Locales

### Hindi (hi) - India

Complete Hindi language support with Indian-specific formatting:

- **Locale Code**: `hi`
- **Native Name**: हिन्दी
- **Country**: India (IN)
- **Direction**: LTR (Left-to-Right)

#### Features

1. **Date Formatting**
   - Format: DD/MM/YYYY (Indian standard)
   - Support for Hindi month names (जनवरी, फरवरी, etc.)
   - Support for Hindi day names (सोमवार, मंगलवार, etc.)
   - Optional Devanagari numerals (०१२३४५६७८९)

2. **Number Formatting**
   - Indian numbering system (lakhs/crores)
   - Format: 1,00,000 (1 lakh), 1,00,00,000 (1 crore)
   - Optional Devanagari numerals
   - Decimal separator: . (period)
   - Thousand separator: , (comma in Indian grouping)

3. **Currency Formatting**
   - Currency: INR (Indian Rupee)
   - Symbol: ₹
   - Format: ₹1,00,000.00
   - Uses Indian numbering system
   - Optional Devanagari numerals

4. **Fiscal Year Support**
   - Indian fiscal year: April 1 - March 31
   - Format: FY 2024-25
   - Hindi format: वित्तीय वर्ष 2024-25
   - Fiscal quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)

## Usage

### Date Formatting

```typescript
import { formatHindiDate } from '@operate/shared';

const date = new Date('2024-12-03');

// Medium format (default)
formatHindiDate(date); // "03/12/2024"

// Long format with Hindi month names
formatHindiDate(date, { format: 'long' }); // "3 दिसंबर 2024"

// Full format with day name
formatHindiDate(date, { format: 'full' }); // "मंगलवार, 3 दिसंबर 2024"

// With Devanagari numerals
formatHindiDate(date, { format: 'long', useDevanagari: true }); // "३ दिसंबर २०२४"
```

### Number Formatting

```typescript
import { formatHindiNumber } from '@operate/shared';

// Indian numbering system
formatHindiNumber(100000); // "1,00,000.00"
formatHindiNumber(10000000); // "1,00,00,000.00"

// With Devanagari numerals
formatHindiNumber(100000, { useDevanagari: true }); // "१,००,०००.००"

// Custom decimals
formatHindiNumber(1234.5, { decimals: 1 }); // "1,234.5"
```

### Currency Formatting

```typescript
import { formatHindiCurrency } from '@operate/shared';

// Standard INR formatting
formatHindiCurrency(100000); // "₹1,00,000.00"

// With Devanagari numerals
formatHindiCurrency(100000, { useDevanagari: true }); // "₹१,००,०००.००"

// Without symbol
formatHindiCurrency(100000, { includeSymbol: false }); // "1,00,000.00"
```

### Fiscal Year

```typescript
import {
  getIndianFiscalYear,
  getHindiFiscalYear,
  getIndianFiscalQuarter,
  getFiscalYearDates,
} from '@operate/shared';

const date = new Date('2024-06-15');

// Get fiscal year
getIndianFiscalYear(date); // "FY 2024-25"
getHindiFiscalYear(date); // "वित्तीय वर्ष 2024-25"

// Get fiscal quarter
const quarter = getIndianFiscalQuarter(date);
// {
//   quarter: 1,
//   label: 'Q1 (Apr-Jun)',
//   labelHindi: 'तिमाही 1 (अप्रैल-जून)',
//   startMonth: 4,
//   endMonth: 6
// }

// Get fiscal year date range
const dates = getFiscalYearDates('FY 2024-25');
// {
//   start: Date(2024-04-01),
//   end: Date(2025-03-31)
// }
```

### Parsing

```typescript
import { parseHindiNumber, parseHindiCurrency } from '@operate/shared';

// Parse Indian formatted numbers
parseHindiNumber('1,00,000'); // 100000

// Parse Devanagari numerals
parseHindiNumber('१,००,०००'); // 100000

// Parse currency
parseHindiCurrency('₹1,00,000.00'); // 100000
parseHindiCurrency('₹१,००,०००.००'); // 100000
```

## Indian Numbering System

The Hindi formatter uses the Indian numbering system, which groups digits differently from the Western system:

- **Western**: 1,000,000 (groups of 3)
- **Indian**: 10,00,000 (first group of 3, then groups of 2)

### Common Indian Number Units

- **Thousand** (हज़ार): 1,000
- **Lakh** (लाख): 1,00,000 (100 thousand)
- **Crore** (करोड़): 1,00,00,000 (100 lakh = 10 million)

## Indian Fiscal Year

India follows an April-March fiscal year:

- **Start**: April 1
- **End**: March 31

### Quarters

- **Q1**: April - June (तिमाही 1: अप्रैल-जून)
- **Q2**: July - September (तिमाही 2: जुलाई-सितंबर)
- **Q3**: October - December (तिमाही 3: अक्टूबर-दिसंबर)
- **Q4**: January - March (तिमाही 4: जनवरी-मार्च)

## GST-Specific Terminology

The Hindi translations include comprehensive GST (Goods and Services Tax) terminology:

- **GST** - जीएसटी
- **GSTIN** - जीएसटी पहचान संख्या (GST Identification Number)
- **CGST** - केंद्रीय जीएसटी (Central GST)
- **SGST** - राज्य जीएसटी (State GST)
- **IGST** - एकीकृत जीएसटी (Integrated GST)
- **UTGST** - केंद्र शासित प्रदेश जीएसटी (Union Territory GST)

## Testing

Comprehensive unit tests are provided in `hi.spec.ts`:

```bash
# Run tests
npm test packages/shared/src/i18n/formatters/hi.spec.ts
```

Test coverage includes:
- Date formatting (all formats)
- Time formatting
- Number formatting (Indian system)
- Currency formatting
- Devanagari numeral conversion
- Fiscal year calculations
- Quarter calculations
- Parsing functions
- Error handling
- Integration tests

## Indian States and Union Territories

The Hindi translations include all 28 states and 8 union territories of India in both English and Hindi.

## File Structure

```
packages/shared/src/i18n/
├── README.md                    # This file
├── index.ts                     # Main export
└── formatters/
    ├── index.ts                 # Formatters export
    ├── hi.ts                    # Hindi formatter (499 lines)
    └── hi.spec.ts               # Unit tests (402 lines)

apps/web/
├── messages/
│   └── hi.json                  # Hindi translations (447 lines, 427 keys)
└── src/
    └── i18n.ts                  # Updated with Hindi support
```

## Translation Keys

The Hindi translation file (`apps/web/messages/hi.json`) includes 427+ translation keys covering:

- Common UI elements (buttons, actions, labels)
- Navigation
- Authentication
- Dashboard
- Invoices (चालान)
- Expenses (व्यय)
- Customers (ग्राहक)
- HR (मानव संसाधन)
- Tax terminology (including GST-specific terms)
- Reports
- Settings
- Validation messages
- Error messages
- Date/time labels
- Offline mode messages
- Indian states and union territories

## Adding New Locales

To add support for a new locale:

1. Create translation file: `apps/web/messages/{locale}.json`
2. Create formatter: `packages/shared/src/i18n/formatters/{locale}.ts`
3. Create tests: `packages/shared/src/i18n/formatters/{locale}.spec.ts`
4. Update `apps/web/src/i18n.ts`:
   - Add locale to `locales` array
   - Add entry in `localeNames`
   - Add entry in `localeFlags`
   - Add entries in format objects
5. Export from `packages/shared/src/i18n/formatters/index.ts`

## License

Part of the Operate/CoachOS platform.
