# RTL (Right-to-Left) Implementation Guide

## Overview

This document describes the complete RTL implementation for Arabic language support in the Operate/CoachOS application.

## Features Implemented

### 1. Arabic Language Support
- **Complete Translation**: ~350+ translation keys covering all modules (Finance, Tax, HR, Settings, Auth)
- **Formal Arabic (فصحى)**: Professional business terminology
- **Location**: `/apps/web/messages/ar.json`

### 2. RTL Layout System

#### RTL Provider
**Location**: `/apps/web/src/components/providers/RTLProvider.tsx`

The RTL Provider automatically detects and applies RTL direction based on the current locale:

```tsx
import { RTLProvider } from '@/components/providers/RTLProvider';

function App() {
  return (
    <RTLProvider>
      {/* Your app content */}
    </RTLProvider>
  );
}
```

**Hooks Available:**
- `useIsRTL()` - Returns boolean indicating if current locale is RTL
- `useDirection()` - Returns direction utilities and values
- `ForceLTR` - Component to force LTR direction for specific content
- `ForceRTL` - Component to force RTL direction for specific content

#### RTL Stylesheet
**Location**: `/apps/web/src/styles/rtl.css`

Comprehensive RTL utilities including:
- Direction flipping for margins, paddings
- Flexbox direction management
- Border radius flipping
- Icon mirroring for directional icons
- Table, form, and layout adjustments

### 3. Tailwind CSS RTL Support

**Location**: `/apps/web/tailwind.config.js`

Enhanced with RTL variants and logical properties:

```jsx
// RTL variant usage
<div className="rtl:mr-4 ltr:ml-4">Content</div>

// Logical properties (auto-flip in RTL)
<div className="ms-4 me-8">Content</div>  // margin-inline-start/end
<div className="ps-4 pe-8">Content</div>   // padding-inline-start/end
<div className="start-0">Content</div>      // inset-inline-start
```

**Available Logical Property Classes:**
- Margin: `ms-{size}`, `me-{size}`
- Padding: `ps-{size}`, `pe-{size}`
- Border: `border-s`, `border-e`
- Position: `start-{value}`, `end-{value}`
- Text alignment: `text-start`, `text-end`
- Float: `float-start`, `float-end`

### 4. Arabic Typography

**Location**: `/apps/web/src/styles/arabic-fonts.css`

Optimized fonts and typography for Arabic:
- **Primary Font**: Noto Sans Arabic
- **Headings**: Cairo
- **Alternative**: Tajawal
- Increased line heights for Arabic diacritics
- Adjusted font sizes for better readability
- Responsive typography for mobile/desktop

### 5. Arabic Formatters

**Location**: `/apps/web/src/lib/formatters/ar.ts`

Comprehensive formatting utilities:

```typescript
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatAddress,
  formatPhone,
  formatFileSize,
  toArabicIndic
} from '@/lib/formatters/ar';

// Number formatting
formatNumber(1234567.89, { decimals: 2 });
// "1,234,567.89"

formatNumber(1234567.89, { useArabicIndic: true });
// "١٬٢٣٤٬٥٦٧٫٨٩"

// Currency formatting (SAR, AED, etc.)
formatCurrency(1000, 'SAR');
// "1,000.00 ر.س"

formatCurrency(500, 'AED', { useArabicIndic: true });
// "٥٠٠٫٠٠ د.إ"

// Date formatting
formatDate(new Date(), { dateStyle: 'long' });
// "١٥ مارس ٢٠٢٤"

// Relative time
formatRelativeTime(pastDate);
// "منذ 5 دقائق"

// Phone formatting
formatPhone('0501234567', 'SA');
// "050 123 4567"

// Address formatting (Middle East style)
formatAddress({
  building: 'Building 123',
  street: 'King Fahd Road',
  city: 'Riyadh',
  country: 'Saudi Arabia'
});
// "Building 123، King Fahd Road، Riyadh، Saudi Arabia"
```

**Supported Currencies:**
- SAR (Saudi Riyal) - ر.س
- AED (UAE Dirham) - د.إ
- KWD (Kuwaiti Dinar) - د.ك
- BHD (Bahraini Dinar) - د.ب
- OMR (Omani Rial) - ر.ع
- QAR (Qatari Riyal) - ر.ق
- EGP (Egyptian Pound) - ج.م
- JOD (Jordanian Dinar) - د.أ

### 6. Hijri Calendar Support

**Location**: `/apps/web/src/lib/calendar/hijri.ts`

Full Hijri (Islamic) calendar support:

```typescript
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  getCurrentHijriDate,
  formatDualCalendar
} from '@/lib/calendar/hijri';

// Convert Gregorian to Hijri
const hijriDate = gregorianToHijri(new Date('2024-03-15'));
// { year: 1445, month: 9, day: 5 }

// Format Hijri date in Arabic
formatHijriDate(hijriDate, { locale: 'ar', format: 'long' });
// "٥ رمضان ١٤٤٥ هـ"

// Show both calendars
formatDualCalendar(new Date());
// "١٥ مارس ٢٠٢٤ (٥ رمضان ١٤٤٥)"

// Get current Hijri date
const today = getCurrentHijriDate();
```

**Features:**
- Gregorian ↔ Hijri conversion
- Arabic and English month names
- Hijri date arithmetic (add days/months)
- Leap year detection
- Dual calendar display

### 7. Language Switcher

**Location**: Updated in `/apps/web/src/i18n.ts`

Arabic added to supported locales:

```typescript
export const locales = ['en', 'de', 'es', 'fr', 'it', 'nl', 'sv', 'ja', 'ar'];

export const localeNames: Record<Locale, string> = {
  // ...
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  // ...
  ar: '🇸🇦',  // Saudi Arabia flag
};
```

## Usage Guidelines

### Component Development

#### Using RTL Hooks

```tsx
'use client';

import { useDirection } from '@/components/providers/RTLProvider';

export function MyComponent() {
  const { isRTL, dir, start, end, getDirValue } = useDirection();

  return (
    <div dir={dir}>
      {/* Use logical properties */}
      <div className="ms-4 text-start">
        Content automatically flips in RTL
      </div>

      {/* Get directional values */}
      <div style={{ marginLeft: getDirValue(0, 'auto') }}>
        Conditional styling
      </div>
    </div>
  );
}
```

#### Forcing Direction

```tsx
import { ForceLTR, ForceRTL } from '@/components/providers/RTLProvider';

// Keep emails, URLs, code LTR
<ForceLTR>
  <a href="mailto:user@example.com">user@example.com</a>
</ForceLTR>

// Force RTL for Arabic text in LTR context
<ForceRTL>
  <span>مرحباً بك</span>
</ForceRTL>
```

### Styling Best Practices

#### Use Logical Properties

```jsx
// ✅ Good - Auto-flips in RTL
<div className="ms-4 ps-6 text-start">Content</div>

// ❌ Avoid - Doesn't flip
<div className="ml-4 pl-6 text-left">Content</div>
```

#### Use RTL Variants When Needed

```jsx
// For special cases requiring different RTL styling
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  Special RTL handling
</div>
```

#### Keep Numbers LTR

```tsx
// Numbers should remain in Western format even in RTL
<span className="number-ltr">{1234567}</span>

// Or use the formatter
<span>{formatNumber(1234567)}</span>
```

### Forms in RTL

```tsx
// Input fields auto-flip text alignment
<input
  type="text"
  className="w-full ps-4"  // Use logical padding
  placeholder={t('common.search')}
/>

// Keep email/URL inputs LTR
<input
  type="email"
  className="force-ltr"  // Force LTR direction
  placeholder="user@example.com"
/>
```

### Tables in RTL

```tsx
// Tables automatically align right in RTL
<table>
  <thead>
    <tr>
      <th className="text-start">{t('common.name')}</th>
      <th className="text-end">{t('common.amount')}</th>
    </tr>
  </thead>
  <tbody>
    {/* Content auto-flips */}
  </tbody>
</table>
```

## Testing

### Unit Tests

Location: `/apps/web/src/__tests__/rtl/`

**Test Files:**
1. `RTLProvider.test.tsx` - RTL provider and hooks
2. `arabic-formatters.test.ts` - Number, currency, date formatting
3. `hijri-calendar.test.ts` - Hijri calendar conversions

**Run Tests:**
```bash
npm run test:rtl
```

### Manual Testing Checklist

- [ ] Switch to Arabic language from language selector
- [ ] Verify entire layout flips to RTL
- [ ] Check sidebar moves to right side
- [ ] Verify navigation menu alignment
- [ ] Test form inputs align right
- [ ] Confirm dropdowns open correctly
- [ ] Check modals and dialogs position
- [ ] Verify tables align correctly
- [ ] Test number formatting (currency, dates)
- [ ] Check Hijri calendar displays properly
- [ ] Verify icons that should flip (arrows, etc.)
- [ ] Test on mobile devices
- [ ] Print preview in RTL

## Browser Support

RTL implementation uses modern CSS features:
- CSS Logical Properties (margin-inline-start, etc.)
- CSS `dir` attribute
- Unicode Bidi Algorithm

**Supported Browsers:**
- Chrome/Edge 89+
- Firefox 68+
- Safari 15+

## Performance Considerations

1. **Font Loading**: Arabic fonts are loaded via Google Fonts CDN with `display=swap`
2. **CSS**: RTL styles are in separate stylesheet, loaded only when needed
3. **Translations**: Locale messages are code-split and loaded on demand
4. **Direction Detection**: Happens once on locale change, minimal overhead

## Accessibility

- Proper `dir` and `lang` attributes on `<html>`
- Screen readers respect RTL direction
- Keyboard navigation works correctly in RTL
- Focus indicators follow RTL flow
- High contrast mode supported

## Known Issues & Limitations

1. **Charts/Graphs**: Kept LTR for data consistency (recharts wrapper)
2. **Code Blocks**: Always displayed LTR
3. **Mixed Content**: Use `MixedContent` component for user-generated content
4. **Third-party Components**: May need manual RTL adjustments

## Migration Guide

### For Existing Components

1. **Replace directional classes with logical properties:**
   ```jsx
   // Before
   <div className="ml-4 pl-6 text-left">

   // After
   <div className="ms-4 ps-6 text-start">
   ```

2. **Use RTL Provider:**
   ```tsx
   import { useDirection } from '@/components/providers/RTLProvider';

   const { isRTL } = useDirection();
   ```

3. **Force LTR for emails/URLs:**
   ```tsx
   import { ForceLTR } from '@/components/providers/RTLProvider';

   <ForceLTR>{email}</ForceLTR>
   ```

4. **Use Arabic formatters:**
   ```tsx
   import { formatCurrency } from '@/lib/formatters/ar';

   {formatCurrency(amount, 'SAR')}
   ```

## Resources

- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [RTL Styling Best Practices](https://rtlstyling.com/)
- [Arabic Typography Guidelines](https://www.w3.org/International/articles/typography/arabic)
- [Hijri Calendar Info](https://en.wikipedia.org/wiki/Islamic_calendar)

## Support

For issues or questions about RTL implementation, contact the frontend team or refer to:
- Component documentation in Storybook
- Unit tests for usage examples
- This guide for comprehensive reference
