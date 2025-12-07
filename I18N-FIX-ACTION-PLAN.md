# i18n Fix Action Plan

## Objective
Make internationalization (i18n) fully functional on https://operate.guru for all supported languages with proper RTL support.

---

## Current Status: ❌ BROKEN
- Locale switching: NOT WORKING
- RTL (Arabic): NOT WORKING
- Translation coverage: 8/10 languages INCOMPLETE
- Missing languages: 6 REQUESTED LANGUAGES NOT IMPLEMENTED

---

## Phase 1: Emergency Fixes (Priority 1) - 2 Hours

### Fix #1: Enable Locale Switching (CRITICAL)

**File:** `apps/web/src/middleware.ts`

**Current Problem (lines 17-41):**
```typescript
const nonLocalePaths = [
  '/',
  '/login',        // ← Excludes login from i18n! ❌
  '/register',     // ← Excludes register from i18n! ❌
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/mfa-setup',
  '/mfa-verify',
  '/onboarding',
  '/dashboard',
  // ... all routes excluded! ❌
]
```

**Option A: Remove Auth Routes from Exclusion (RECOMMENDED)**

```typescript
// BEFORE
const nonLocalePaths = [
  '/',
  '/login',        // ← REMOVE THESE
  '/register',     // ← REMOVE THESE
  '/forgot-password',
  '/reset-password',
  // ... etc
]

// AFTER
const nonLocalePaths = [
  '/api',
  '/_next',
  '/static',
  '/manifest.json',
  '/favicon.ico',
  // Only exclude API routes, assets, and Next.js internals
]
```

**Option B: Implement Cookie-Based Locale Detection**

Keep current routes but make middleware respect NEXT_LOCALE cookie:

```typescript
// In middleware, line 178, REPLACE:
if (!isNonLocalePath) {
  return intlMiddleware(request)
}

// WITH:
// Check for locale cookie
const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
if (localeCookie && locales.includes(localeCookie as Locale)) {
  // Set locale for next-intl
  request.headers.set('X-NEXT-INTL-LOCALE', localeCookie)
}

// Process with i18n even for non-locale paths
const response = NextResponse.next()
if (localeCookie) {
  response.headers.set('X-NEXT-INTL-LOCALE', localeCookie)
}
return response
```

**Option C: Migrate to [locale] Routes (LONG-TERM)**

Move pages from `app/(auth)/` to `app/[locale]/`:
```
app/(auth)/login/page.tsx → app/[locale]/login/page.tsx
app/(auth)/register/page.tsx → app/[locale]/register/page.tsx
```

**RECOMMENDED IMMEDIATE ACTION: Option A**
- Fastest to implement (5 minutes)
- Enables URL-based locales: `/de/login`, `/ar/login`
- Works with existing code

**Testing:**
```bash
# After fix, test these URLs:
https://operate.guru/de/login  # Should show German
https://operate.guru/ar/login  # Should show Arabic (RTL)
https://operate.guru/es/login  # Should show Spanish
```

**Expected Result:**
✅ Locale switching works
✅ URL path reflects language
✅ RTL activates for Arabic

**Estimated Time:** 15 minutes (edit + test)

---

### Fix #2: Verify RTL Activation (Will Auto-Fix After Fix #1)

**File:** `apps/web/src/app/(auth)/layout.tsx`

**Check line 54:**
```typescript
const rtl = isRTL(locale)
```

**Check line 60:**
```typescript
<div dir={rtl ? 'rtl' : 'ltr'}>
```

**Verify:** This code is already correct! Should work once locale switching is fixed.

**File:** `apps/web/src/components/providers/RTLProvider.tsx`

This component is perfectly implemented. Will activate automatically when locale switches to 'ar'.

**Testing:**
```bash
# After locale switching is fixed:
1. Go to /ar/login
2. Open browser DevTools
3. Check: document.documentElement.dir === "rtl"
4. Check: document.documentElement.lang === "ar"
5. Check: document.body.classList.contains('rtl') === true
```

**Expected Result:**
✅ HTML dir="rtl"
✅ HTML lang="ar"
✅ Body has .rtl class
✅ Layout flips right-to-left

**Estimated Time:** 15 minutes (testing only, no code changes)

---

### Fix #3: Complete Missing Translations (45 Keys × 8 Languages)

**Files to Edit:**
```
apps/web/messages/es.json
apps/web/messages/fr.json
apps/web/messages/it.json
apps/web/messages/nl.json
apps/web/messages/sv.json
apps/web/messages/ja.json
apps/web/messages/ar.json
apps/web/messages/hi.json
```

**Missing Keys (Add after line 93 in each file):**

```json
{
  "auth": {
    "login": "...",
    "logout": "...",
    // ... existing keys ...
    "invalidCredentials": "...",

    // ADD THESE 45 KEYS: ↓↓↓
    "welcomeTitle": "Welcome to Operate",
    "signInDescription": "Sign in to your CoachOS account",
    "invalidEmail": "Please enter a valid email address",
    "passwordTooShort": "Password must be at least 8 characters",
    "orContinueWith": "OR CONTINUE WITH",
    "firstName": "First Name",
    "lastName": "Last Name",
    "firstNamePlaceholder": "John",
    "lastNamePlaceholder": "Doe",
    "createAccount": "Create Account",
    "agreeToTerms": "I agree to the Terms of Service and Privacy Policy",
    "registerTitle": "Create an account",
    "registerDescription": "Enter your details to get started",
    "forgotPasswordTitle": "Forgot Password",
    "forgotPasswordDescription": "Enter your email and we'll send you a reset link",
    "sendResetLink": "Send reset link",
    "backToLogin": "Back to login",
    "firstNameTooShort": "First name must be at least 2 characters",
    "lastNameTooShort": "Last name must be at least 2 characters",
    "passwordUppercase": "Password must contain at least one uppercase letter",
    "passwordLowercase": "Password must contain at least one lowercase letter",
    "passwordNumber": "Password must contain at least one number",
    "passwordsDoNotMatch": "Passwords do not match",
    "mustAcceptTerms": "You must accept the terms and conditions",
    "passwordHint": "Must be at least 8 characters with uppercase, lowercase, and number",
    "createPasswordPlaceholder": "Create a strong password",
    "reenterPasswordPlaceholder": "Re-enter your password",
    "creatingAccount": "Creating account...",
    "termsOfService": "Terms of Service",
    "privacyPolicy": "Privacy Policy",
    "iAgreeToThe": "I agree to the",
    "and": "and",
    "emailAddress": "Email address",
    "sendingResetLink": "Sending reset link...",
    "checkYourEmail": "Check your email",
    "resetLinkSent": "We've sent a password reset link to your email address. Please check your inbox and follow the instructions.",
    "returnToLogin": "Return to login",
    "rememberPassword": "Remember your password?",
    "newPassword": "New password",
    "confirmNewPassword": "Confirm new password",
    "resettingPassword": "Resetting password...",
    "passwordResetSuccess": "Password reset successful!",
    "passwordResetSuccessMessage": "Your password has been updated. Redirecting to login...",
    "failedToSendResetEmail": "Failed to send reset email. Please try again.",
    "failedToResetPassword": "Failed to reset password. The link may have expired."
  }
}
```

**Translation Strategy:**

1. **Use German (de.json) as reference** (it's complete)
2. **Use DeepL.com for professional translations**
3. **Maintain consistent terminology**

**Quick Command to Generate Missing Section:**

```bash
# Extract missing keys from English
node -e "
const en = require('./apps/web/messages/en.json');
const es = require('./apps/web/messages/es.json');

const enAuth = en.auth;
const esAuth = es.auth;

const missing = {};
for (let key in enAuth) {
  if (!esAuth[key]) {
    missing[key] = enAuth[key];
  }
}

console.log(JSON.stringify(missing, null, 2));
" > missing-auth-keys.json

# Then translate this JSON file for each language
```

**Estimated Time Per Language:** 30 minutes × 8 = 4 hours
- Spanish: 30 min (use DeepL)
- French: 30 min (use DeepL)
- Italian: 30 min (use DeepL)
- Dutch: 30 min (use DeepL)
- Swedish: 30 min (use DeepL)
- Japanese: 30 min (use DeepL)
- Arabic: 30 min (use DeepL)
- Hindi: 30 min (use DeepL + review existing extras)

**Testing:**
```bash
# After adding translations, verify no keys visible:
1. Go to /es/login
2. Check page shows "Bienvenido a Operate" not "auth.welcomeTitle"
3. Repeat for all 8 languages
```

**Expected Result:**
✅ All 8 languages show translated text
✅ No "auth.keyName" visible
✅ Professional appearance

---

## Phase 2: Add Missing Languages (Priority 2) - 8 Hours

### Languages to Add:
1. Portuguese (pt) - Brazil/Portugal market
2. Russian (ru) - Large user base
3. Chinese (zh) - Huge market
4. Korean (ko) - Important market
5. Polish (pl) - EU market
6. Turkish (tr) - Growing market

### Steps for Each Language:

#### Step 1: Create Translation File

```bash
# Copy English as template
cp apps/web/messages/en.json apps/web/messages/pt.json
cp apps/web/messages/en.json apps/web/messages/ru.json
cp apps/web/messages/en.json apps/web/messages/zh.json
cp apps/web/messages/en.json apps/web/messages/ko.json
cp apps/web/messages/en.json apps/web/messages/pl.json
cp apps/web/messages/en.json apps/web/messages/tr.json
```

#### Step 2: Translate All 408 Keys

Use DeepL Pro or hire professional translators for quality.

**Estimated cost:** ~$0.01 per word × 2000 words × 6 languages = ~$120

**Or use DeepL API (free tier):**
```bash
# Example automation script
npm install deepl-node
node translate-files.js pt ru zh ko pl tr
```

#### Step 3: Add to i18n Configuration

**File:** `apps/web/src/i18n.ts`

```typescript
// Line 5: Add new locales
export const locales = [
  'en', 'de', 'es', 'fr', 'it', 'nl', 'sv', 'ja', 'ar', 'hi',
  'pt', 'ru', 'zh', 'ko', 'pl', 'tr'  // ← ADD THESE
] as const

// Line 12: Add display names
export const localeNames: Record<Locale, string> = {
  // ... existing ...
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ko: '한국어',
  pl: 'Polski',
  tr: 'Türkçe',
}

// Line 26: Add flags
export const localeFlags: Record<Locale, string> = {
  // ... existing ...
  pt: '🇵🇹',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ko: '🇰🇷',
  pl: '🇵🇱',
  tr: '🇹🇷',
}

// Add date formats (line 40)
export const localeDateFormats: Record<Locale, string> = {
  // ... existing ...
  pt: 'dd/MM/yyyy',
  ru: 'dd.MM.yyyy',
  zh: 'yyyy年MM月dd日',
  ko: 'yyyy. MM. dd.',
  pl: 'dd.MM.yyyy',
  tr: 'dd.MM.yyyy',
}

// Add time formats (line 54)
export const localeTimeFormats: Record<Locale, string> = {
  // ... existing ...
  pt: 'HH:mm',
  ru: 'HH:mm',
  zh: 'HH:mm',
  ko: 'HH:mm',
  pl: 'HH:mm',
  tr: 'HH:mm',
}

// Add number formats (line 68)
export const localeNumberFormats: Record<Locale, { decimal: string; thousands: string }> = {
  // ... existing ...
  pt: { decimal: ',', thousands: '.' },
  ru: { decimal: ',', thousands: ' ' },
  zh: { decimal: '.', thousands: ',' },
  ko: { decimal: '.', thousands: ',' },
  pl: { decimal: ',', thousands: ' ' },
  tr: { decimal: ',', thousands: '.' },
}
```

#### Step 4: Add RTL Support for Additional Languages (If Needed)

**File:** `apps/web/src/components/providers/RTLProvider.tsx`

```typescript
// Line 14: Add Hebrew, Persian, Urdu if implementing later
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']; // Already includes these
```

**Estimated Time:**
- Translation: 6 hours (automated with review)
- Configuration: 30 minutes
- Testing: 1.5 hours
**Total: 8 hours**

---

## Phase 3: Font Support (Priority 2) - 2 Hours

### Fonts Needed:

1. **Arabic:** Noto Sans Arabic
2. **Japanese:** Noto Sans JP
3. **Hindi:** Noto Sans Devanagari
4. **Chinese:** Noto Sans SC (Simplified)
5. **Korean:** Noto Sans KR
6. **Russian:** Already covered by Inter (Cyrillic subset)

### Implementation:

**File:** `apps/web/src/app/layout.tsx`

```typescript
import { Inter } from 'next/font/google'
import {
  Noto_Sans_Arabic,
  Noto_Sans_JP,
  Noto_Sans_Devanagari,
  Noto_Sans_SC,
  Noto_Sans_KR
} from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],  // ← Add Cyrillic for Russian
  variable: '--font-sans'
})

const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
})

const japanese = Noto_Sans_JP({
  subsets: ['latin', 'japanese'],
  variable: '--font-japanese',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
})

const chinese = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-chinese',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const korean = Noto_Sans_KR({
  subsets: ['latin', 'korean'],
  variable: '--font-korean',
  display: 'swap',
  weight: ['400', '500', '700'],
})

// In layout component:
export default function RootLayout({ children, params: { locale } }) {
  const fontClass = [
    inter.variable,
    arabic.variable,
    japanese.variable,
    devanagari.variable,
    chinese.variable,
    korean.variable,
  ].join(' ')

  return (
    <html lang={locale}>
      <body className={fontClass}>
        {children}
      </body>
    </html>
  )
}
```

**File:** `apps/web/src/app/globals.css`

```css
/* Add font family rules based on locale */
:root {
  --font-sans: Inter, sans-serif;
}

html[lang="ar"] {
  font-family: var(--font-arabic), var(--font-sans);
}

html[lang="ja"] {
  font-family: var(--font-japanese), var(--font-sans);
}

html[lang="hi"] {
  font-family: var(--font-devanagari), var(--font-sans);
}

html[lang="zh"] {
  font-family: var(--font-chinese), var(--font-sans);
}

html[lang="ko"] {
  font-family: var(--font-korean), var(--font-sans);
}
```

**Performance Note:**
- Use `display: 'swap'` to prevent FOIT (Flash of Invisible Text)
- Google Fonts automatically subsetts and optimizes
- ~100KB additional per CJK font (acceptable)

**Estimated Time:** 2 hours (setup + testing)

---

## Phase 4: Testing & Validation (Priority 3) - 2 Hours

### Automated Tests

**Create:** `apps/web/src/__tests__/i18n/locale-switching.test.ts`

```typescript
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import LoginPage from '@/app/(auth)/login/page'

describe('Locale Switching', () => {
  it('renders English by default', () => {
    const messages = require('@/messages/en.json')
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Welcome to Operate')).toBeInTheDocument()
  })

  it('renders German when locale is de', () => {
    const messages = require('@/messages/de.json')
    render(
      <NextIntlClientProvider locale="de" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Willkommen bei Operate')).toBeInTheDocument()
  })

  it('renders Arabic with RTL', () => {
    const messages = require('@/messages/ar.json')
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    )
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument()
  })

  it('does not show translation keys', () => {
    const messages = require('@/messages/es.json')
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    )
    expect(screen.queryByText(/auth\./)).not.toBeInTheDocument()
  })
})
```

**Create:** `apps/web/src/__tests__/i18n/translation-completeness.test.ts`

```typescript
import { locales } from '@/i18n'

describe('Translation Completeness', () => {
  const enMessages = require('@/messages/en.json')
  const enKeys = getAllKeys(enMessages)

  locales.forEach(locale => {
    it(`${locale} has all required keys`, () => {
      const messages = require(`@/messages/${locale}.json`)
      const localeKeys = getAllKeys(messages)

      expect(localeKeys.length).toBe(enKeys.length)

      enKeys.forEach(key => {
        expect(localeKeys).toContain(key)
      })
    })
  })
})

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = []
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object') {
      keys = keys.concat(getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}
```

### Manual Testing Checklist

**For Each Language:**

- [ ] Login page loads without errors
- [ ] All text is translated (no keys visible)
- [ ] Language selector shows correct current language
- [ ] Can switch to another language
- [ ] Forms submit successfully
- [ ] Error messages are translated
- [ ] Date/time formats are correct
- [ ] Number formats are correct

**RTL-Specific (Arabic):**

- [ ] Layout flips right-to-left
- [ ] Text aligned right
- [ ] Buttons on left side
- [ ] Form inputs RTL
- [ ] Checkboxes on right
- [ ] Icons flipped appropriately
- [ ] Scrollbars on left (browser-dependent)

**E2E Tests with Playwright:**

```typescript
// tests/e2e/i18n.spec.ts
import { test, expect } from '@playwright/test'

test.describe('i18n Functionality', () => {
  test('switches language via URL', async ({ page }) => {
    await page.goto('https://operate.guru/de/login')
    await expect(page.getByText('Willkommen bei Operate')).toBeVisible()
  })

  test('switches language via selector', async ({ page }) => {
    await page.goto('https://operate.guru/login')
    await page.click('[data-testid="language-selector"]')
    await page.click('text=Deutsch')
    await expect(page).toHaveURL(/\/de\/login/)
    await expect(page.getByText('Willkommen bei Operate')).toBeVisible()
  })

  test('Arabic shows RTL layout', async ({ page }) => {
    await page.goto('https://operate.guru/ar/login')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'rtl')
    await expect(html).toHaveAttribute('lang', 'ar')
  })
})
```

**Estimated Time:** 2 hours

---

## Phase 5: Deployment & Monitoring (Priority 3) - 1 Hour

### Pre-Deployment Checklist

- [ ] All phases 1-4 complete
- [ ] Tests passing
- [ ] No console errors
- [ ] Translations verified
- [ ] RTL tested
- [ ] Performance acceptable (Lighthouse > 90)

### Deployment Steps

```bash
# 1. Build production
cd apps/web
pnpm build

# 2. Check bundle size
# Ensure i18n additions don't exceed 500KB

# 3. Test production build locally
pnpm start

# 4. Deploy to staging
# (your deployment process)

# 5. Test on staging
# Run E2E tests

# 6. Deploy to production
# (your deployment process)

# 7. Monitor
# Check error rates
# Check performance metrics
```

### Post-Deployment Monitoring

**Add to monitoring dashboard:**

```typescript
// Track locale usage
analytics.track('locale_selected', {
  locale: selectedLocale,
  previous: previousLocale,
  timestamp: new Date(),
})

// Track translation errors
window.addEventListener('error', (event) => {
  if (event.message.includes('Missing translation')) {
    analytics.track('translation_missing', {
      key: event.message,
      locale: currentLocale,
    })
  }
})
```

**Metrics to Monitor:**

- Locale distribution (which languages users prefer)
- Translation error rate
- Page load time by locale
- RTL rendering performance
- Font loading time

**Estimated Time:** 1 hour

---

## Total Time Estimate

| Phase | Description | Time |
|-------|-------------|------|
| Phase 1 | Emergency Fixes | 2 hours |
| Phase 2 | Add Missing Languages | 8 hours |
| Phase 3 | Font Support | 2 hours |
| Phase 4 | Testing | 2 hours |
| Phase 5 | Deployment | 1 hour |
| **TOTAL** | **Complete i18n Implementation** | **15 hours** |

---

## Quick Wins (Can Do Today)

### 1-Hour Quick Fix:
- ✅ Fix locale switching (middleware edit)
- ✅ Test German locale works
- ✅ Test Arabic RTL activates

### 2-Hour Quick Fix:
- ✅ Above + Complete Spanish translations
- ✅ Test on production

### 4-Hour Quick Fix:
- ✅ Above + Complete all 8 incomplete languages
- ✅ Full testing

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Users can switch language via selector
- ✅ URL reflects language (/de/login works)
- ✅ Arabic shows RTL layout
- ✅ No translation keys visible in any language
- ✅ All 10 current languages 100% complete

### Phase 2 Complete When:
- ✅ 6 new languages added
- ✅ All 16 languages in selector
- ✅ All translations professional quality
- ✅ Tests passing

### Phase 3 Complete When:
- ✅ Fonts load for all scripts
- ✅ No rendering issues
- ✅ Performance still good

### Final Success:
- ✅ **16 languages fully supported**
- ✅ **RTL working perfectly**
- ✅ **Professional appearance in all languages**
- ✅ **Users can seamlessly switch languages**
- ✅ **No technical debt**

---

## Rollback Plan

If issues occur after deployment:

```bash
# 1. Immediate rollback
git revert <commit-hash>
pnpm build && deploy

# 2. Or disable i18n temporarily
# In middleware.ts:
const i18nEnabled = process.env.I18N_ENABLED === 'true'
if (!i18nEnabled) {
  return NextResponse.next()
}
```

---

## Resources Needed

### Tools:
- DeepL Pro API ($) or free tier
- Google Fonts (free)
- Playwright for E2E tests

### Optional:
- Professional translators (for critical languages)
- Translation management system (Crowdin, Lokalise)

### Budget:
- Translation: $0-500 (depending on approach)
- Tools: $0 (can use free tier)
- Time: 15 dev hours

---

## Next Steps

**Immediate (Today):**
1. Review this plan with team
2. Get approval for approach (Option A recommended)
3. Start Phase 1: Fix locale switching

**This Week:**
1. Complete Phase 1 (emergency fixes)
2. Deploy to production
3. Monitor for issues

**Next Week:**
1. Complete Phases 2-3 (new languages + fonts)
2. Thorough testing
3. Deploy to production

**Following Week:**
1. Monitor usage
2. Gather user feedback
3. Fine-tune translations

---

## Questions & Decisions Needed

### Decision 1: Locale Switching Approach
**Options:** A (remove exclusions), B (cookie-based), C (migrate to [locale])
**Recommendation:** Option A
**Who decides:** Tech lead

### Decision 2: Translation Method
**Options:** Manual, DeepL API, Professional translators
**Recommendation:** DeepL + Review
**Who decides:** Product manager

### Decision 3: Language Priority
**Question:** Which of the 6 new languages to add first?
**Recommendation:** Portuguese, Russian, Chinese (largest markets)
**Who decides:** Business team

---

## Support & Documentation

**After implementation, create:**

1. User documentation: "How to change language"
2. Developer documentation: "Adding new languages"
3. Translation guide: "How to update translations"
4. Runbook: "Troubleshooting i18n issues"

---

**Plan created:** 2025-12-07
**Plan owner:** PRISM Agent
**Status:** Ready for review
**Next action:** Get team approval and start Phase 1
