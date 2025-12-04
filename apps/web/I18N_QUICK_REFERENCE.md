# i18n Quick Reference Guide

## Quick Start

### Using Translations in Components

```typescript
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('common')

  return <button>{t('save')}</button>
}
```

### Using Formatters

```typescript
import { useLocaleFormatters } from '@/hooks/useLocaleFormatters'

export function InvoiceCard({ invoice }) {
  const { formatCurrency, formatDate } = useLocaleFormatters()

  return (
    <div>
      <p>Amount: {formatCurrency(invoice.amount, 'EUR')}</p>
      <p>Date: {formatDate(invoice.date)}</p>
    </div>
  )
}
```

### Adding Language Switcher

```typescript
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <nav>{/* navigation */}</nav>
      <LanguageSwitcher />
    </header>
  )
}
```

## Translation Namespaces

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `common` | Common UI | save, cancel, delete, submit |
| `nav` | Navigation | dashboard, invoices, settings |
| `auth` | Authentication | login, logout, register |
| `dashboard` | Dashboard | welcome, overview, statistics |
| `invoices` | Invoices | createInvoice, invoiceNumber |
| `expenses` | Expenses | addExpense, category, amount |
| `customers` | Customers | addCustomer, customerName |
| `hr` | HR | employees, addEmployee, salary |
| `tax` | Taxes | taxReturns, vatReturns |
| `reports` | Reports | profitLoss, balanceSheet |
| `settings` | Settings | general, company, language |
| `validation` | Validation | required, email, minLength |
| `errors` | Errors | networkError, serverError |
| `dateTime` | Date/Time | today, yesterday, monday |
| `offline` | Offline | title, message, retry |

## Common Patterns

### With Interpolation
```typescript
const t = useTranslations('validation')
t('minLength', { min: 8 }) // "Minimum length is 8 characters"
```

### Multiple Namespaces
```typescript
const tCommon = useTranslations('common')
const tDashboard = useTranslations('dashboard')

return (
  <div>
    <h1>{tDashboard('welcome')}</h1>
    <button>{tCommon('save')}</button>
  </div>
)
```

### Conditional Translations
```typescript
const t = useTranslations('invoices')
const status = invoice.isPaid ? t('paid') : t('unpaid')
```

## Formatter Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `formatDate()` | Format date | "12/03/2025" |
| `formatTime()` | Format time | "3:30 PM" |
| `formatDateTime()` | Format date+time | "12/03/2025 3:30 PM" |
| `formatNumber()` | Format number | "1,234.56" |
| `formatCurrency()` | Format currency | "$1,234.56" |
| `formatPercent()` | Format percentage | "75%" |
| `formatFileSize()` | Format bytes | "1.5 MB" |
| `formatRelativeTime()` | Relative time | "2 hours ago" |
| `formatDateRange()` | Date range | "Jan 1 - Jan 31" |
| `formatList()` | Format list | "apples, oranges, and bananas" |

## URL Structure

- English (default): `/dashboard`
- German: `/de/dashboard`
- French: `/fr/dashboard`
- Italian: `/it/dashboard`
- Dutch: `/nl/dashboard`
- Swedish: `/sv/dashboard`

## Getting Current Locale

```typescript
import { useLocale } from 'next-intl'

export function MyComponent() {
  const locale = useLocale() // 'en', 'de', 'fr', etc.

  return <p>Current language: {locale}</p>
}
```

## Creating Links with Locale

```typescript
import { useLocale } from 'next-intl'
import Link from 'next/link'

export function NavLink({ href, children }) {
  const locale = useLocale()

  return <Link href={`/${locale}${href}`}>{children}</Link>
}
```

## Adding New Translations

1. Add to `messages/en.json`:
```json
{
  "myNamespace": {
    "myKey": "My English text"
  }
}
```

2. Add to other locale files (de, fr, it, nl, sv)

3. Use in component:
```typescript
const t = useTranslations('myNamespace')
return <p>{t('myKey')}</p>
```

## Supported Locales

| Code | Language | Flag |
|------|----------|------|
| en | English | 🇬🇧 |
| de | Deutsch | 🇩🇪 |
| fr | Français | 🇫🇷 |
| it | Italiano | 🇮🇹 |
| nl | Nederlands | 🇳🇱 |
| sv | Svenska | 🇸🇪 |

## Common Tasks

### Show different content per locale
```typescript
import { useLocale } from 'next-intl'

export function LocaleSpecificContent() {
  const locale = useLocale()

  return (
    <div>
      {locale === 'de' && <GermanOnlyContent />}
      {locale === 'fr' && <FrenchOnlyContent />}
      <CommonContent />
    </div>
  )
}
```

### Format currency with specific locale
```typescript
const { formatCurrency } = useLocaleFormatters()

// Uses current locale
formatCurrency(1234.56, 'EUR') // "€1,234.56" or "1.234,56 €"

// Force specific locale
import { formatCurrency } from '@/lib/locale-utils'
formatCurrency(1234.56, 'de', 'EUR') // "1.234,56 €"
```

### Parse user input
```typescript
const { parseFormattedNumber } = useLocaleFormatters()

// German user enters: "1.234,56"
const value = parseFormattedNumber("1.234,56") // 1234.56

// English user enters: "1,234.56"
const value = parseFormattedNumber("1,234.56") // 1234.56
```

## Best Practices

1. **Always use translation keys** - Never hardcode user-facing text
2. **Use proper namespaces** - Organize translations logically
3. **Use formatters** - Don't manually format dates/numbers
4. **Test all locales** - Verify translations and formatting
5. **Keep keys descriptive** - Use clear, semantic key names
6. **Provide context** - Add comments for ambiguous translations
7. **Use interpolation** - For dynamic content in translations

## File Locations

- Translation files: `apps/web/messages/*.json`
- i18n config: `apps/web/src/i18n.ts`
- Middleware: `apps/web/src/middleware.ts`
- Formatters: `apps/web/src/lib/locale-utils.ts`
- Hook: `apps/web/src/hooks/useLocaleFormatters.ts`
- Language switcher: `apps/web/src/components/language/LanguageSwitcher.tsx`
- Root layout: `apps/web/src/app/[locale]/layout.tsx`

## Troubleshooting

### Translations not showing
- Check namespace and key exist in JSON file
- Verify locale is valid
- Check for typos in translation keys

### Wrong formatting
- Verify correct locale is active
- Check locale-specific format configuration in `i18n.ts`
- Ensure using formatters from `useLocaleFormatters` hook

### Language switcher not working
- Verify middleware is configured correctly
- Check `[locale]` folder structure
- Ensure locale parameter is passed to layout

### Build errors
- Run `pnpm install` to ensure next-intl is installed
- Verify all JSON files have valid syntax
- Check next.config.js has withNextIntl wrapper
