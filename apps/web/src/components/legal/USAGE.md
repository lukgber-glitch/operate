# Legal Components Usage Guide

This guide shows how to integrate the legal notification components into the Operate app.

## Components Overview

### 1. AIDisclaimerBanner
**Location**: `src/components/chat/AIDisclaimerBanner.tsx`

Shows a dismissible disclaimer above the chat interface.

**Usage in Chat Page**:
```tsx
import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';

export default function ChatPage() {
  return (
    <div className="container">
      <AIDisclaimerBanner />
      <ChatInterface />
    </div>
  );
}
```

**Features**:
- Auto-dismisses for 30 days
- Stores dismissal in localStorage
- Accessible with ARIA labels
- Subtle, non-intrusive design

---

### 2. FirstTimeConsent
**Location**: `src/components/legal/FirstTimeConsent.tsx`

Modal shown on first login requiring consent to terms.

**Usage in Auth Flow**:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';

export default function DashboardLayout({ children }) {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has consented
    fetch('/api/v1/user/profile')
      .then(res => res.json())
      .then(data => {
        if (!data.consentedAt) {
          setShowConsent(true);
        }
      });
  }, []);

  const handleConsent = () => {
    setShowConsent(false);
    // Consent is automatically saved in the component
  };

  return (
    <>
      <FirstTimeConsent isOpen={showConsent} onConsent={handleConsent} />
      {children}
    </>
  );
}
```

**Features**:
- Three required checkboxes
- Cannot close without consent
- Saves consent timestamp to user profile
- Links to legal pages

---

### 3. TaxFilingWarning
**Location**: `src/components/tax/TaxFilingWarning.tsx`

Warning dialog shown before tax filing actions.

**Usage in Tax Filing Flow**:
```tsx
'use client';

import { useState } from 'react';
import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';
import { Button } from '@/components/ui/button';

export function TaxFilingButton() {
  const [showWarning, setShowWarning] = useState(false);

  const handleFileTax = () => {
    setShowWarning(true);
  };

  const proceedWithFiling = () => {
    // User acknowledged, proceed with tax filing
    console.log('Proceeding with tax filing...');
    // Navigate to tax filing wizard or submit data
  };

  return (
    <>
      <Button onClick={handleFileTax}>
        File Tax Return
      </Button>

      <TaxFilingWarning
        isOpen={showWarning}
        onCancel={() => setShowWarning(false)}
        onProceed={proceedWithFiling}
      />
    </>
  );
}
```

**Features**:
- Required acknowledgment checkbox
- Cannot proceed without checking
- Clear warnings about responsibility
- Professional disclaimer language

---

### 4. BankConnectionDisclaimer
**Location**: `src/components/banking/BankConnectionDisclaimer.tsx`

Information panel shown before connecting bank accounts.

**Usage in Bank Connection Flow**:
```tsx
import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';

export function ConnectBankDialog() {
  return (
    <div className="space-y-4">
      <h2>Connect Your Bank</h2>

      <BankConnectionDisclaimer provider="TrueLayer" />

      <Button>Continue to Bank Login</Button>
    </div>
  );
}
```

**Props**:
- `provider`: 'TrueLayer' | 'Tink' | 'Plaid'
- `className`: Optional additional classes

**Features**:
- Provider-specific information
- Security highlights
- Link to privacy policy
- Accessible design

---

### 5. Footer
**Location**: `src/components/layout/Footer.tsx`

Site-wide footer with legal links.

**Usage in Root Layout**:
```tsx
import { Footer } from '@/components/layout/Footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Features**:
- All legal links (Terms, Privacy, Cookies, etc.)
- Quick links
- Brand information
- Responsive grid layout
- Accessible navigation

---

### 6. CookieConsent
**Location**: `src/components/legal/CookieConsent.tsx`

GDPR-compliant cookie consent banner.

**Usage in Root Layout**:
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

**Features**:
- Accept All / Reject Non-Essential / Customize
- Granular cookie preferences
- GDPR compliant
- Stores preferences in localStorage
- Integrates with analytics (gtag)

**Cookie Categories**:
- Necessary (required, always enabled)
- Functional (optional)
- Analytics (optional)
- Marketing (optional)

---

## API Endpoints Required

### User Consent Endpoint
**POST** `/api/v1/user/consent`

```typescript
// Request body
{
  consentedAt: string; // ISO date
  consents: {
    terms: boolean;
    privacy: boolean;
    aiDisclaimer: boolean;
  }
}

// Response
{
  success: boolean;
}
```

### User Profile Endpoint
**GET** `/api/v1/user/profile`

```typescript
// Response should include
{
  id: string;
  email: string;
  consentedAt?: string; // ISO date or null
  // ... other fields
}
```

---

## Styling Notes

All components use:
- Brand color: `#06BF9D`
- Tailwind CSS utilities
- Dark mode support
- Accessible ARIA labels
- Responsive design

---

## Integration Checklist

- [ ] Add `AIDisclaimerBanner` to chat page
- [ ] Add `FirstTimeConsent` to dashboard layout
- [ ] Add `TaxFilingWarning` before tax actions
- [ ] Add `BankConnectionDisclaimer` to bank connection flow
- [ ] Add `Footer` to root layout
- [ ] Add `CookieConsent` to root layout
- [ ] Create user consent API endpoint
- [ ] Update user profile endpoint
- [ ] Create legal pages (/legal/terms, /legal/privacy, etc.)
- [ ] Test GDPR compliance
- [ ] Test accessibility with screen readers
