# Legal Notification Components

Comprehensive legal disclaimer and notification system for the Operate app, ensuring GDPR compliance and proper user consent.

## Components Overview

| Component | Purpose | Location | Status |
|-----------|---------|----------|--------|
| AIDisclaimerBanner | Chat page AI disclaimer | `chat/AIDisclaimerBanner.tsx` | ✅ Complete |
| FirstTimeConsent | First-time user consent modal | `legal/FirstTimeConsent.tsx` | ✅ Complete |
| TaxFilingWarning | Tax filing responsibility warning | `tax/TaxFilingWarning.tsx` | ✅ Complete |
| BankConnectionDisclaimer | Bank connection security info | `banking/BankConnectionDisclaimer.tsx` | ✅ Complete |
| Footer | Site footer with legal links | `layout/Footer.tsx` | ✅ Complete |
| CookieConsent | GDPR cookie consent banner | `legal/CookieConsent.tsx` | ✅ Complete |

---

## Quick Start

### 1. Import Components

```typescript
// All legal components in one import
import {
  AIDisclaimerBanner,
  BankConnectionDisclaimer,
  CookieConsent,
  FirstTimeConsent,
  TaxFilingWarning,
} from '@/components/legal';

// Or import individually
import { Footer } from '@/components/layout/Footer';
```

### 2. Add to Root Layout

```tsx
// app/layout.tsx
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

### 3. Add to Dashboard

```tsx
// app/(dashboard)/layout.tsx
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';
import { Footer } from '@/components/layout/Footer';

export default function DashboardLayout({ children }) {
  const [showConsent, setShowConsent] = useState(false);

  return (
    <>
      <FirstTimeConsent isOpen={showConsent} onConsent={() => setShowConsent(false)} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

---

## Component Details

### AIDisclaimerBanner

**Purpose**: Inform users that AI responses are not professional advice.

**Features**:
- Dismissible for 30 days
- localStorage persistence
- Auto-reappears after 30 days
- Subtle, non-intrusive design
- Fully accessible

**Props**: None (self-contained)

**Example**:
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

**Storage**:
- Key: `ai-disclaimer-dismissed`
- Value: Timestamp of dismissal
- Duration: 30 days

---

### FirstTimeConsent

**Purpose**: Require user consent to terms, privacy, and AI disclaimer on first login.

**Features**:
- Three required checkboxes
- Cannot be dismissed without consent
- Saves consent to user profile
- Links to legal pages
- Fully accessible

**Props**:
```typescript
interface FirstTimeConsentProps {
  isOpen: boolean;
  onConsent: () => void;
}
```

**Example**:
```tsx
const [showConsent, setShowConsent] = useState(false);

useEffect(() => {
  fetch('/api/v1/user/profile')
    .then(res => res.json())
    .then(data => {
      if (!data.consentedAt) {
        setShowConsent(true);
      }
    });
}, []);

<FirstTimeConsent
  isOpen={showConsent}
  onConsent={() => setShowConsent(false)}
/>
```

**API Integration**:
- POST `/api/v1/user/consent` - Save consent
- GET `/api/v1/user/profile` - Check consent status

---

### TaxFilingWarning

**Purpose**: Show legal disclaimer before tax filing actions.

**Features**:
- Required acknowledgment checkbox
- Clear responsibility warnings
- Cannot proceed without agreement
- Professional disclaimer language

**Props**:
```typescript
interface TaxFilingWarningProps {
  isOpen: boolean;
  onCancel: () => void;
  onProceed: () => void;
}
```

**Example**:
```tsx
const [showWarning, setShowWarning] = useState(false);

<Button onClick={() => setShowWarning(true)}>
  File Tax Return
</Button>

<TaxFilingWarning
  isOpen={showWarning}
  onCancel={() => setShowWarning(false)}
  onProceed={() => {
    // User acknowledged, proceed with filing
    navigateToTaxWizard();
  }}
/>
```

---

### BankConnectionDisclaimer

**Purpose**: Inform users about bank connection security.

**Features**:
- Provider-specific information (TrueLayer, Tink, Plaid)
- Security highlights
- Link to privacy policy
- Regulation information

**Props**:
```typescript
interface BankConnectionDisclaimerProps {
  provider: 'TrueLayer' | 'Tink' | 'Plaid';
  className?: string;
}
```

**Example**:
```tsx
<BankConnectionDisclaimer provider="TrueLayer" />

<Button>Continue to Bank Login</Button>
```

**Provider Info**:
- **TrueLayer**: FCA-regulated, EU/UK
- **Tink**: PSD2-compliant, European
- **Plaid**: Industry-leading, US

---

### Footer

**Purpose**: Site-wide footer with legal and navigation links.

**Features**:
- Legal links (Terms, Privacy, Cookies, AI Disclaimer, Impressum)
- Quick links (About, Contact, Help, Status)
- Brand information
- Responsive grid layout
- Accessible navigation

**Props**: None (self-contained)

**Example**:
```tsx
import { Footer } from '@/components/layout/Footer';

<main>{children}</main>
<Footer />
```

**Links Included**:
- Terms of Service
- Privacy Policy
- Cookie Policy
- AI Disclaimer
- Impressum
- About, Contact, Help Center, Status

---

### CookieConsent

**Purpose**: GDPR-compliant cookie consent management.

**Features**:
- Three-tier consent: Accept All, Reject, Customize
- Granular cookie preferences
- localStorage persistence
- Integrates with Google Analytics
- Modal customization interface

**Props**: None (self-contained)

**Example**:
```tsx
import { CookieConsent } from '@/components/legal/CookieConsent';

<body>
  {children}
  <CookieConsent />
</body>
```

**Cookie Categories**:
1. **Necessary** (required, always enabled)
   - Authentication, security, site functionality
2. **Functional** (optional)
   - Personalized settings, language preferences
3. **Analytics** (optional)
   - Usage tracking, performance monitoring
4. **Marketing** (optional)
   - Advertising, campaign tracking

**Storage**:
- Key: `cookie-consent`
- Value: JSON with preferences and timestamp
- Integrates with: `window.gtag` for Google Analytics

---

## Design System

### Colors

All components use the Operate brand colors:
- Primary: `#06BF9D` (teal green)
- Hover: `#05a889` (darker teal)
- Warnings: Amber variants
- Info: Blue variants
- Errors: Red variants (destructive)

### Accessibility

All components include:
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- Focus management
- Semantic HTML

### Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg
- Touch-friendly tap targets (min 44px)
- Flexible layouts

---

## API Requirements

### User Consent Endpoint

**POST** `/api/v1/user/consent`

```typescript
// Request
{
  consentedAt: string; // ISO 8601
  consents: {
    terms: boolean;
    privacy: boolean;
    aiDisclaimer: boolean;
  }
}

// Response
{
  success: boolean;
  consentedAt: string;
}
```

### User Profile Endpoint

**GET** `/api/v1/user/profile`

```typescript
// Response
{
  id: string;
  email: string;
  consentedAt?: string | null;
  // ... other fields
}
```

---

## Legal Pages Required

Create these pages for links to work:

1. **Terms of Service**: `/legal/terms`
2. **Privacy Policy**: `/legal/privacy` (with `#banking` anchor)
3. **Cookie Policy**: `/legal/cookies`
4. **AI Disclaimer**: `/legal/ai-disclaimer`
5. **Impressum**: `/legal/impressum` (GDPR requirement)

---

## Testing Checklist

### Functionality
- [ ] AIDisclaimerBanner dismisses and persists for 30 days
- [ ] AIDisclaimerBanner reappears after 30 days
- [ ] FirstTimeConsent blocks access until all checkboxes checked
- [ ] FirstTimeConsent saves consent to API
- [ ] TaxFilingWarning requires acknowledgment before proceeding
- [ ] BankConnectionDisclaimer shows correct provider info
- [ ] Footer links navigate correctly
- [ ] CookieConsent saves preferences to localStorage
- [ ] CookieConsent integrates with analytics

### Accessibility
- [ ] All components keyboard navigable
- [ ] Screen reader announces all important content
- [ ] Focus management works correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements have ARIA labels

### Responsive Design
- [ ] All components work on mobile (320px+)
- [ ] All components work on tablet (768px+)
- [ ] All components work on desktop (1024px+)
- [ ] Touch targets are min 44px
- [ ] Text is readable on all screen sizes

### GDPR Compliance
- [ ] Cookie consent appears on first visit
- [ ] Users can reject non-essential cookies
- [ ] Users can customize cookie preferences
- [ ] Consent is properly stored and retrievable
- [ ] Privacy policy link is accessible

---

## Implementation Guide

See `USAGE.md` for detailed integration examples and `*.example.tsx` files for complete page implementations.

---

## Support

For questions or issues:
1. Check the example files
2. Review the USAGE.md guide
3. Test with the provided checklist
4. Ensure all API endpoints are implemented

---

## License

Part of the Operate platform. All rights reserved.
