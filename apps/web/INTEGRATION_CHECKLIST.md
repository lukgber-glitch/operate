# Legal Components Integration Checklist

Use this checklist to integrate all legal notification components into the Operate app.

## Phase 1: Component Review (30 minutes)

- [ ] Visit demo page at `/dashboard/demo/legal-components`
- [ ] Test each component interactively
- [ ] Review design and brand consistency
- [ ] Test on mobile device or responsive mode
- [ ] Test with keyboard navigation
- [ ] Test with screen reader (if available)

## Phase 2: API Endpoints (1-2 hours)

### User Consent Endpoint
- [ ] Create POST `/api/v1/user/consent` endpoint
- [ ] Accept `consentedAt` timestamp
- [ ] Accept `consents` object (terms, privacy, aiDisclaimer)
- [ ] Save to user profile in database
- [ ] Return success response
- [ ] Add error handling

### User Profile Endpoint
- [ ] Update GET `/api/v1/user/profile` endpoint
- [ ] Include `consentedAt` field in response
- [ ] Ensure field is nullable (null for users who haven't consented)

### Database Schema
- [ ] Add `consentedAt` column to users table (nullable timestamp)
- [ ] Run migration
- [ ] Test with existing users

## Phase 3: Legal Pages (2-4 hours)

Create these pages with actual legal content:

- [ ] `/legal/terms` - Terms of Service
  - [ ] Write or copy company terms
  - [ ] Include user responsibilities
  - [ ] Include service limitations
  - [ ] Add last updated date

- [ ] `/legal/privacy` - Privacy Policy
  - [ ] GDPR compliance section
  - [ ] Data collection details
  - [ ] Data storage and security
  - [ ] User rights section
  - [ ] **Banking section** (anchor: `#banking`)
  - [ ] Add last updated date

- [ ] `/legal/cookies` - Cookie Policy
  - [ ] List all cookies used
  - [ ] Explain each cookie category
  - [ ] User control options
  - [ ] Add last updated date

- [ ] `/legal/ai-disclaimer` - AI Disclaimer
  - [ ] AI limitations
  - [ ] Not professional advice warning
  - [ ] User responsibility
  - [ ] Add last updated date

- [ ] `/legal/impressum` - Impressum (GDPR requirement)
  - [ ] Company information
  - [ ] Contact details
  - [ ] Registration details
  - [ ] Responsible person

## Phase 4: Root Layout Integration (15 minutes)

- [ ] Open `src/app/layout.tsx`
- [ ] Import `CookieConsent` component
- [ ] Add `<CookieConsent />` before closing `</body>` tag
- [ ] Test that cookie banner appears on first visit
- [ ] Test dismissal and localStorage persistence

```tsx
import { CookieConsent } from '@/components/legal/CookieConsent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
```

## Phase 5: Dashboard Layout Integration (30 minutes)

- [ ] Open `src/app/(dashboard)/layout.tsx`
- [ ] Import `FirstTimeConsent` and `Footer` components
- [ ] Add state for consent modal
- [ ] Add useEffect to check consent status on mount
- [ ] Add `<FirstTimeConsent />` modal
- [ ] Add `<Footer />` at bottom of layout
- [ ] Test consent flow with new user
- [ ] Test that footer appears on all dashboard pages

```tsx
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';
import { Footer } from '@/components/layout/Footer';

export default function DashboardLayout({ children }) {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    fetch('/api/v1/user/profile')
      .then(res => res.json())
      .then(data => {
        if (!data.consentedAt) setShowConsent(true);
      });
  }, []);

  return (
    <>
      <FirstTimeConsent isOpen={showConsent} onConsent={() => setShowConsent(false)} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

## Phase 6: Chat Page Integration (15 minutes)

- [ ] Open chat page (e.g., `src/app/(dashboard)/chat/page.tsx`)
- [ ] Import `AIDisclaimerBanner` component
- [ ] Add `<AIDisclaimerBanner />` above chat interface
- [ ] Test dismissal functionality
- [ ] Test localStorage persistence
- [ ] Test that it reappears after 30 days (manually delete localStorage key)

```tsx
import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';

export default function ChatPage() {
  return (
    <div>
      <AIDisclaimerBanner />
      <ChatInterface />
    </div>
  );
}
```

## Phase 7: Tax Page Integration (20 minutes)

- [ ] Open tax filing page
- [ ] Import `TaxFilingWarning` component
- [ ] Add state for warning modal
- [ ] Add handler to show warning before filing
- [ ] Add handler to proceed after acknowledgment
- [ ] Test that warning blocks filing without acknowledgment
- [ ] Test that filing proceeds after acknowledgment

```tsx
import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';

const [showWarning, setShowWarning] = useState(false);

<Button onClick={() => setShowWarning(true)}>File Tax Return</Button>

<TaxFilingWarning
  isOpen={showWarning}
  onCancel={() => setShowWarning(false)}
  onProceed={() => {
    // Proceed with tax filing
  }}
/>
```

## Phase 8: Bank Connections Integration (20 minutes)

- [ ] Open bank connections page
- [ ] Import `BankConnectionDisclaimer` component
- [ ] Add disclaimer before bank login
- [ ] Pass correct provider prop (TrueLayer, Tink, or Plaid)
- [ ] Test that disclaimer appears correctly
- [ ] Test that privacy policy link works

```tsx
import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';

<BankConnectionDisclaimer provider="TrueLayer" />
<Button>Continue to Bank Login</Button>
```

## Phase 9: Testing (1-2 hours)

### Functionality Tests
- [ ] Clear all localStorage and test fresh user experience
- [ ] Test cookie consent (Accept All)
- [ ] Test cookie consent (Reject Non-Essential)
- [ ] Test cookie consent (Customize)
- [ ] Test first-time consent modal
- [ ] Test AI disclaimer dismissal
- [ ] Test tax filing warning
- [ ] Test bank connection disclaimer for each provider

### Accessibility Tests
- [ ] Navigate entire flow using only keyboard (Tab, Enter, Esc)
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify all interactive elements have labels
- [ ] Verify focus is visible on all elements
- [ ] Test color contrast with accessibility tool

### Responsive Tests
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1024px+ width)
- [ ] Test landscape and portrait orientations
- [ ] Verify all text is readable on small screens
- [ ] Verify all buttons are tappable (44px minimum)

### Cross-Browser Tests
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile browsers (Safari iOS, Chrome Android)

## Phase 10: Legal Review (variable)

- [ ] Have legal team review all disclaimer text
- [ ] Have legal team review Terms of Service
- [ ] Have legal team review Privacy Policy
- [ ] Have legal team review Cookie Policy
- [ ] Have legal team review AI Disclaimer
- [ ] Have legal team review Impressum
- [ ] Make any required changes
- [ ] Get final legal approval

## Phase 11: GDPR Compliance Verification (1 hour)

- [ ] Verify users can reject non-essential cookies
- [ ] Verify users can customize cookie preferences
- [ ] Verify cookie consent is stored properly
- [ ] Verify users can revoke consent
- [ ] Verify privacy policy is accessible
- [ ] Verify data subject rights are documented
- [ ] Verify contact information is available
- [ ] Verify Impressum is present and correct

## Phase 12: Production Deployment (30 minutes)

- [ ] Merge legal components to main branch
- [ ] Deploy to staging environment
- [ ] Test all flows on staging
- [ ] Monitor for errors
- [ ] Deploy to production
- [ ] Test all flows on production
- [ ] Monitor analytics for cookie consent rates

## Post-Deployment Monitoring

### First Week
- [ ] Monitor cookie consent acceptance rates
- [ ] Monitor first-time consent completion rates
- [ ] Check for any console errors
- [ ] Review user feedback
- [ ] Check accessibility reports

### First Month
- [ ] Review analytics for component interactions
- [ ] Check that AI disclaimer is being dismissed appropriately
- [ ] Review tax filing warning acknowledgments
- [ ] Monitor for any legal concerns
- [ ] Update components based on feedback

## Maintenance Schedule

### Monthly
- [ ] Review cookie consent rates
- [ ] Check for legal text updates needed
- [ ] Review accessibility compliance

### Quarterly
- [ ] Update legal pages if needed
- [ ] Review GDPR compliance
- [ ] Audit cookie usage

### Annually
- [ ] Full legal review
- [ ] Update "Last Updated" dates
- [ ] Review compliance with new regulations

---

## Quick Reference

### Component Imports
```tsx
import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';
import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';
import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';
import { Footer } from '@/components/layout/Footer';
```

### Files Created
- 6 main components
- 5 example pages
- 1 demo page
- 3 documentation files
- 1 type definition
- 1 index file

### Documentation
- `src/components/legal/README.md` - Full documentation
- `src/components/legal/USAGE.md` - Usage examples
- `LEGAL_COMPONENTS_SUMMARY.md` - Implementation summary
- `INTEGRATION_CHECKLIST.md` - This file

### Demo Page
Visit: `/dashboard/demo/legal-components`

---

## Estimated Time

- **Total Integration Time**: 6-10 hours
- **Legal Review Time**: Variable (depends on legal team)
- **Testing Time**: 2-3 hours
- **Total**: ~8-15 hours

---

## Support

If you encounter any issues:

1. Check the example files (*.example.tsx)
2. Review the README.md in src/components/legal/
3. Check the demo page for interactive examples
4. Review component props and interfaces
5. Test in the demo environment first

---

## Completion

When all items are checked:

- [ ] All components integrated
- [ ] All pages tested
- [ ] Legal approval received
- [ ] GDPR compliance verified
- [ ] Deployed to production
- [ ] Monitoring in place

**Date Completed**: _______________

**Completed By**: _______________

**Legal Approval By**: _______________
