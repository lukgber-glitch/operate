# Multi-Language UI Implementation

## Overview

This document describes the implementation of multi-language support for the Operate/CoachOS web application using `next-intl` library.

## Supported Languages

- English (en) - Default
- German (de)
- French (fr)
- Italian (it)
- Dutch (nl)
- Swedish (sv)

## Files Created

### 1. Translation Files

Location: `apps/web/messages/`

- `en.json` - English translations (base)
- `de.json` - German translations
- `fr.json` - French translations
- `it.json` - Italian translations
- `nl.json` - Dutch translations
- `sv.json` - Swedish translations

Each file contains comprehensive translations for:
- Common UI elements (buttons, labels, status messages)
- Navigation items
- Authentication flows
- Dashboard content
- Invoices, Expenses, Customers modules
- HR management
- Tax management
- Reports and Settings
- Validation messages
- Error messages
- Date/time labels
- Offline mode messages

### 2. Configuration Files

#### `src/i18n.ts`
Core i18n configuration including:
- Supported locales array
- Default locale setting
- Locale display names and flags
- Date/time format patterns per locale
- Number format patterns per locale
- Message loader function

#### `src/middleware.ts`
Next.js middleware for locale routing:
- Automatic locale detection from browser
- Locale-based routing
- Locale prefix handling (as-needed strategy)
- Path matching configuration

### 3. Components

#### `src/components/language/LanguageSwitcher.tsx`
Dropdown component for language selection:
- Displays current language with flag
- Shows all available languages
- Handles locale switching
- Preserves current route when switching

#### `src/providers/locale-provider.tsx`
Client-side provider wrapper for next-intl:
- Wraps NextIntlClientProvider
- Provides messages to components
- Configures timezone

### 4. Layout Updates

#### `src/app/[locale]/layout.tsx`
New locale-aware root layout:
- Generates static params for all locales
- Validates locale parameter
- Loads messages for current locale
- Wraps app in NextIntlClientProvider

#### `src/app/[locale]/page.tsx`
Root page with locale-aware redirect to dashboard

### 5. Utility Functions

#### `src/lib/locale-utils.ts`
Helper functions for locale-specific formatting:
- `formatDate()` - Format dates
- `formatTime()` - Format times
- `formatDateTime()` - Format date and time
- `formatNumber()` - Format numbers
- `formatCurrency()` - Format currency amounts
- `formatPercent()` - Format percentages
- `formatFileSize()` - Format file sizes
- `parseFormattedNumber()` - Parse locale-formatted numbers
- `formatRelativeTime()` - Relative time (e.g., "2 hours ago")
- `getDateFormat()` - Get locale date format pattern
- `formatDateRange()` - Format date ranges
- `formatList()` - Format lists
- `getCurrencySymbol()` - Get currency symbol

### 6. Configuration Updates

#### `next.config.js`
Updated to include next-intl plugin:
- Added `withNextIntl` wrapper
- Configured i18n file path
- Maintains existing PWA configuration

## Usage

### Using Translations in Components

#### Server Components
```typescript
import { useTranslations } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('common')

  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  )
}
```

#### Client Components
```typescript
'use client'

import { useTranslations } from 'next-intl'

export default function MyClientComponent() {
  const t = useTranslations('dashboard')

  return <h1>{t('welcome')}</h1>
}
```

### Using the Language Switcher

Add to your layout or header:
```typescript
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

export function Header() {
  return (
    <header>
      {/* Other header content */}
      <LanguageSwitcher />
    </header>
  )
}
```

### Formatting Utilities

```typescript
import { formatCurrency, formatDate, formatNumber } from '@/lib/locale-utils'
import { useLocale } from 'next-intl'

export function PriceDisplay({ amount }: { amount: number }) {
  const locale = useLocale()

  return (
    <div>
      <p>Price: {formatCurrency(amount, locale, 'EUR')}</p>
      <p>Units: {formatNumber(1234.56, locale)}</p>
      <p>Date: {formatDate(new Date(), locale)}</p>
    </div>
  )
}
```

### Translation Keys Structure

All translations are organized by namespace:
- `common` - Common UI elements
- `nav` - Navigation items
- `auth` - Authentication
- `dashboard` - Dashboard content
- `invoices` - Invoice management
- `expenses` - Expense management
- `customers` - Customer management
- `hr` - HR management
- `tax` - Tax management
- `reports` - Reporting
- `settings` - Settings
- `validation` - Form validation messages
- `errors` - Error messages
- `dateTime` - Date/time labels
- `offline` - Offline mode messages

### Accessing Nested Translations

```typescript
const t = useTranslations('validation')

// Simple key
t('required') // "This field is required"

// With interpolation
t('minLength', { min: 8 }) // "Minimum length is 8 characters"
```

## Locale-Specific Formats

### Date Formats
- EN: MM/dd/yyyy
- DE: dd.MM.yyyy
- FR: dd/MM/yyyy
- IT: dd/MM/yyyy
- NL: dd-MM-yyyy
- SV: yyyy-MM-dd

### Number Formats
- EN: 1,234.56 (comma thousands, dot decimal)
- DE: 1.234,56 (dot thousands, comma decimal)
- FR: 1 234,56 (space thousands, comma decimal)
- IT: 1.234,56 (dot thousands, comma decimal)
- NL: 1.234,56 (dot thousands, comma decimal)
- SV: 1 234,56 (space thousands, comma decimal)

## URL Structure

With locale routing enabled:
- Default locale (EN): `/dashboard` (no prefix)
- Other locales: `/de/dashboard`, `/fr/dashboard`, etc.

The middleware automatically:
1. Detects browser language preference
2. Redirects to appropriate locale
3. Maintains locale across navigation

## Adding New Translations

1. Add the key to `messages/en.json` (base file)
2. Add translations to all other locale files
3. Use the translation in your component:
   ```typescript
   const t = useTranslations('yourNamespace')
   t('yourKey')
   ```

## Migration Notes

### Existing Routes
To migrate existing routes to the new locale structure:
1. Move route folders from `src/app/` to `src/app/[locale]/`
2. Update any hardcoded paths to include locale parameter
3. Use `useLocale()` hook to get current locale when constructing links

### Existing Components
1. Replace hardcoded strings with translation keys
2. Use `useTranslations()` hook to access translations
3. Use locale utilities for formatting dates, numbers, and currency

## Testing

To test different locales:
1. Change browser language preference
2. Use language switcher component
3. Directly navigate to locale-prefixed URLs (e.g., `/de/dashboard`)

## Performance Considerations

- Translation files are loaded on-demand per locale
- Static generation is used for all locale variants
- Messages are tree-shaken during build
- Only used translations are included in bundles

## Future Enhancements

1. Add more languages as needed (es, pt, pl, etc.)
2. Implement RTL support for Arabic/Hebrew
3. Add translation management system integration
4. Implement pluralization rules for complex cases
5. Add locale-specific content variants (images, videos, etc.)
