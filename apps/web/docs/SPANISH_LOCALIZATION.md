# Spanish Localization (es) - Spain Market

## Overview

Complete Spanish language support for the Operate/CoachOS platform, including Spain-specific business terminology, tax forms, and formatting conventions.

## Features

### 1. Translation Coverage
- **348 translation keys** across 15 categories
- Professional business Spanish using formal "usted" form
- Spain-specific terminology for tax and accounting

### 2. Locale Configuration

**Language Code:** `es` (Spanish)
**Country:** Spain (ES)
**Date Format:** DD/MM/YYYY
**Time Format:** 24-hour (HH:mm)
**Number Format:** 1.234,56 (dot for thousands, comma for decimals)
**Currency:** EUR (€)
**Currency Format:** 1.234,56 €

### 3. Translation Categories

| Category | Keys | Description |
|----------|------|-------------|
| common | 44 | Common UI elements, buttons, labels |
| nav | 25 | Navigation menu items |
| auth | 20 | Authentication flows |
| dashboard | 26 | Dashboard metrics and widgets |
| invoices | 32 | Invoice management |
| expenses | 23 | Expense tracking |
| customers | 20 | Customer management |
| hr | 34 | Human resources, employees, leave |
| tax | 20 | Tax returns and payments |
| reports | 14 | Financial reports |
| settings | 32 | Application settings |
| validation | 13 | Form validation messages |
| errors | 11 | Error messages |
| dateTime | 22 | Date and time labels |
| offline | 5 | Offline mode messages |

## Spanish Tax Terminology

### Tax IDs
- **NIF** - Número de Identificación Fiscal (Individual tax ID)
- **CIF** - Código de Identificación Fiscal (Company tax ID)
- **NIE** - Número de Identidad de Extranjero (Foreigner tax ID)

### VAT/IVA
- **IVA** - Impuesto sobre el Valor Añadido (VAT)
- **Base Imponible** - Taxable amount
- **Tipo Impositivo** - Tax rate

### IVA Rates
- **General:** 21% (most goods and services)
- **Reducido:** 10% (reduced rate)
- **Superreducido:** 4% (super-reduced rate)
- **Exento:** 0% (exempt)

### Tax Forms (Modelos)
- **Modelo 303** - Quarterly VAT return
- **Modelo 390** - Annual VAT summary
- **Modelo 111** - Withholding tax on income
- **Modelo 115** - Withholding tax on rent
- **Modelo 130** - Quarterly income tax (self-employed)
- **Modelo 131** - Quarterly income tax (simplified)
- **Modelo 190** - Annual withholding tax summary
- **Modelo 347** - Annual operations declaration
- **SII** - Suministro Inmediato de Información (Immediate Supply of Information)

### Other Terms
- **Factura** - Invoice
- **IRPF** - Impuesto sobre la Renta de las Personas Físicas (Income tax)
- **Impuesto de Sociedades** - Corporate tax
- **Retención a Cuenta** - Withholding tax
- **Autónomo** - Self-employed worker
- **Nómina** - Payroll

## Business Entity Types

- **Autónomo** - Self-employed individual
- **S.L.** - Sociedad Limitada (Limited company)
- **S.A.** - Sociedad Anónima (Public limited company)
- **S.L.U.** - Sociedad Limitada Unipersonal (Single-member limited company)
- **C.B.** - Comunidad de Bienes (Partnership)
- **S.C.** - Sociedad Civil (Civil partnership)
- **Cooperativa** - Cooperative

## Usage

### Basic Translation
```tsx
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('invoices')

  return <h1>{t('title')}</h1> // "Facturas"
}
```

### Spanish Formatting Utilities
```tsx
import {
  formatEuros,
  formatIVA,
  formatSpanishDate,
  formatNIF,
  formatInvoiceNumber,
  formatTaxPeriod,
  getIVARateLabel
} from '@/lib/format-es'

// Currency: 1.234,56 €
formatEuros(1234.56)

// IVA rate: 21% IVA
formatIVA(21)

// Date: 15/03/2024
formatSpanishDate(new Date('2024-03-15'))

// Tax ID: 12345678A
formatNIF('12345678a')

// Invoice: 2024/001
formatInvoiceNumber(2024, 1)

// Tax period: Primer Trimestre (Enero-Marzo) 2024
formatTaxPeriod(1, 2024)

// IVA label: IVA General (21%)
getIVARateLabel(21)
```

### Date/Time Formatting
```tsx
import { formatDate, formatNumber, formatCurrency } from '@/lib/locale-utils'

const locale = 'es'

// Date: 15/03/2024
formatDate(new Date(), locale)

// Number: 1.234,56
formatNumber(1234.56, locale)

// Currency: 1.234,56 €
formatCurrency(1234.56, locale, 'EUR')
```

## File Structure

```
apps/web/
├── messages/
│   └── es.json                    # Spanish translations (348 keys)
├── src/
│   ├── i18n.ts                    # Locale configuration (updated)
│   ├── middleware.ts               # Locale detection (auto-updated)
│   ├── lib/
│   │   ├── format-es.ts           # Spanish-specific utilities
│   │   ├── locale-utils.ts        # Generic locale utilities
│   │   └── __tests__/
│   │       └── format-es.test.ts  # Spanish format tests
│   └── components/
│       └── language/
│           └── LanguageSwitcher.tsx # Auto-updated
└── docs/
    └── SPANISH_LOCALIZATION.md    # This file
```

## Testing

Run Spanish formatting tests:
```bash
pnpm test format-es.test.ts
```

## Locale Switching

The language switcher automatically includes Spanish:
- **Display Name:** Español
- **Flag:** 🇪🇸
- **URL Format:** `/es/...` (e.g., `/es/dashboard`, `/es/invoices`)

## Validation

All 348 translation keys match the English source:
```bash
✓ English keys: 348
✓ Spanish keys: 348
✓ Match: Yes
```

## Browser Locale Detection

The middleware automatically detects Spanish-speaking users based on:
- Browser `Accept-Language` header
- User's explicit locale selection
- URL locale prefix

## Date/Time Examples

| Format | Example |
|--------|---------|
| Short Date | 15/03/2024 |
| Long Date | 15 de marzo de 2024 |
| Short Time | 14:30 |
| Date + Time | 15/03/2024, 14:30 |

## Number Examples

| Type | Example |
|------|---------|
| Integer | 1.234 |
| Decimal | 1.234,56 |
| Currency | 1.234,56 € |
| Percentage | 21% |

## Integration with Spain Tax System

The Spanish localization is designed to integrate with:
- AEAT (Agencia Estatal de Administración Tributaria)
- SII (Suministro Inmediato de Información)
- Spanish accounting standards (Plan General Contable)
- Spanish labor law (Estatuto de los Trabajadores)

## Future Enhancements

Potential additions for deeper Spain market support:
- Regional variations (Catalan, Basque, Galician)
- Integration with Spanish e-invoicing standards
- SEPA payment formatting
- Spanish holiday calendar
- Regional tax variations (País Vasco, Navarra)

## Support

For questions or issues with Spanish localization:
1. Check translation files: `apps/web/messages/es.json`
2. Review formatting utilities: `apps/web/src/lib/format-es.ts`
3. Consult locale configuration: `apps/web/src/i18n.ts`

## Related Documentation

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Spanish Tax Agency (AEAT)](https://www.agenciatributaria.es/)
- [Spanish Labor Ministry](https://www.mites.gob.es/)
