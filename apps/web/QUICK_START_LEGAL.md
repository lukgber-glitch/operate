# Quick Start: Legal Components

Get the legal notification components up and running in 5 minutes.

## 🎯 Goal

Add legal disclaimers and GDPR-compliant cookie consent to the Operate app.

## 📋 What Was Created

**6 Components** ready to use:
1. AI Disclaimer Banner (chat page)
2. First-Time User Consent (dashboard)
3. Tax Filing Warning (tax actions)
4. Bank Connection Disclaimer (bank connections)
5. Cookie Consent Banner (GDPR)
6. Site Footer (legal links)

## 🚀 5-Minute Setup

### Step 1: View the Demo (1 min)

Start the dev server and visit the demo:

```bash
cd C:\Users\grube\op\operate-fresh\apps\web
npm run dev
```

Visit: http://localhost:3000/dashboard/demo/legal-components

### Step 2: Add Cookie Consent (1 min)

Edit `src/app/layout.tsx`:

```tsx
import { CookieConsent } from '@/components/legal/CookieConsent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsent />  {/* Add this line */}
      </body>
    </html>
  );
}
```

### Step 3: Add Footer (1 min)

Edit `src/app/(dashboard)/layout.tsx`:

```tsx
import { Footer } from '@/components/layout/Footer';

export default function DashboardLayout({ children }) {
  return (
    <>
      <main>{children}</main>
      <Footer />  {/* Add this line */}
    </>
  );
}
```

### Step 4: Add AI Disclaimer to Chat (1 min)

Edit your chat page:

```tsx
import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';

export default function ChatPage() {
  return (
    <div>
      <AIDisclaimerBanner />  {/* Add this line */}
      {/* Your existing chat interface */}
    </div>
  );
}
```

### Step 5: Test (1 min)

1. Refresh your app
2. You should see:
   - Cookie consent banner at the bottom
   - Footer on dashboard pages
   - AI disclaimer on chat page

✅ **Done!** Basic legal components are live.

## 📚 Next Steps

### Required (before production):

1. **Create Legal Pages**
   - `/legal/terms` - Terms of Service
   - `/legal/privacy` - Privacy Policy
   - `/legal/cookies` - Cookie Policy
   - `/legal/ai-disclaimer` - AI Disclaimer
   - `/legal/impressum` - Impressum

2. **Add API Endpoints**
   - `POST /api/v1/user/consent` - Save consent
   - `GET /api/v1/user/profile` - Check consent

3. **Add First-Time Consent**
   - Check the example: `src/app/(dashboard)/layout.example.tsx`
   - Requires API endpoints above

### Optional (enhance UX):

1. **Add Tax Filing Warning**
   - Example: `src/app/(dashboard)/tax/page.example.tsx`

2. **Add Bank Connection Disclaimer**
   - Example: `src/app/(dashboard)/connections/page.example.tsx`

## 📖 Documentation

- **Full Docs**: `src/components/legal/README.md`
- **Usage Guide**: `src/components/legal/USAGE.md`
- **Integration Checklist**: `INTEGRATION_CHECKLIST.md`
- **Summary**: `LEGAL_COMPONENTS_SUMMARY.md`

## 🎨 Component Props

### CookieConsent
```tsx
<CookieConsent />  // No props needed
```

### AIDisclaimerBanner
```tsx
<AIDisclaimerBanner />  // No props needed
```

### Footer
```tsx
<Footer />  // No props needed
```

### FirstTimeConsent
```tsx
<FirstTimeConsent
  isOpen={boolean}
  onConsent={() => void}
/>
```

### TaxFilingWarning
```tsx
<TaxFilingWarning
  isOpen={boolean}
  onCancel={() => void}
  onProceed={() => void}
/>
```

### BankConnectionDisclaimer
```tsx
<BankConnectionDisclaimer
  provider="TrueLayer" | "Tink" | "Plaid"
  className="optional-classes"
/>
```

## 🎯 Key Features

### Brand Consistent
- Uses `#06BF9D` (teal green)
- Matches app design system
- Dark mode support

### Accessible
- ARIA labels
- Keyboard navigation
- Screen reader support

### Responsive
- Mobile-first
- Works on all devices
- Touch-friendly

### GDPR Compliant
- Cookie consent
- Granular preferences
- User control

## 🔍 Testing

### Quick Test
```bash
# Clear all localStorage
localStorage.clear()

# Refresh page
# You should see:
# 1. Cookie consent banner
# 2. AI disclaimer (on chat page)
# 3. Footer links work
```

### Full Test
See `INTEGRATION_CHECKLIST.md` for comprehensive testing.

## 🐛 Troubleshooting

### Cookie banner not showing
- Clear localStorage and refresh
- Check that component is in root layout
- Check browser console for errors

### Footer not showing
- Check that component is in dashboard layout
- Verify import path
- Check that layout is being used

### AI disclaimer not dismissing
- Check localStorage permissions
- Verify localStorage key: `ai-disclaimer-dismissed`
- Check browser console for errors

### Styles not matching
- Verify Tailwind CSS is working
- Check brand color: `#06BF9D`
- Inspect element for class names

## 📞 Need Help?

1. Check the demo page: `/dashboard/demo/legal-components`
2. Review example files: `*.example.tsx`
3. Read the docs: `src/components/legal/README.md`
4. Check integration checklist: `INTEGRATION_CHECKLIST.md`

## ✅ Pre-Production Checklist

Before going live:

- [ ] Cookie consent appears on first visit
- [ ] All legal pages created (/legal/*)
- [ ] API endpoints implemented
- [ ] First-time consent working
- [ ] Legal team approved all text
- [ ] GDPR compliance verified
- [ ] Accessibility tested
- [ ] Cross-browser tested

## 🎉 You're Done!

All legal components are ready to use. Start with the 5-minute setup above, then gradually add the advanced features.

**Time Investment:**
- Quick setup: 5 minutes
- Full integration: 8-15 hours
- Legal review: Variable

**Files Created:** 18 total
- 6 components
- 5 examples
- 4 supporting files
- 3 docs

---

**Last Updated:** 2025-12-07

**Version:** 1.0.0
