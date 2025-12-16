# Onboarding Wizard Component

A multi-step onboarding wizard for Operate that guides new users through account setup.

## Components

### Main Components

- **OnboardingWizard**: Main wizard orchestrator with form handling and navigation
- **OnboardingProgress**: Visual progress indicator (responsive stepper/progress bar)

### Step Components

1. **CompanyInfoStep**: Company details, legal form, tax ID, and address
2. **BankingStep**: Bank account connection (GoCardless, Plaid, Nordigen)
3. **EmailStep**: Email integration (Gmail, Outlook, IMAP)
4. **TaxStep**: Tax software connection (ELSTER, FinanzOnline, etc.)
5. **AccountingStep**: Accounting software integration (lexoffice, sevDesk, etc.)
6. **PreferencesStep**: Language, timezone, currency, and notification settings

## Usage

### Basic Usage

```tsx
import { OnboardingWizard } from '@/components/onboarding'

export default function OnboardingPage() {
  const handleComplete = (data) => {
    console.log('Onboarding completed:', data)
    // Navigate to dashboard or next step
  }

  return <OnboardingWizard onComplete={handleComplete} />
}
```

### With Initial Data

```tsx
import { OnboardingWizard } from '@/components/onboarding'

export default function OnboardingPage() {
  const initialData = {
    companyInfo: {
      name: 'Pre-filled Company',
      country: 'DE',
    },
  }

  return (
    <OnboardingWizard
      initialData={initialData}
      onComplete={(data) => console.log(data)}
    />
  )
}
```

## Features

### Form Validation
- Uses React Hook Form with Zod schema validation
- Real-time field validation
- Required field indicators
- Error messages

### Progress Tracking
- Visual step indicator
- Completed steps tracking
- Progress percentage (mobile)
- Step-by-step navigation

### Responsive Design
- Mobile-friendly layout
- Compact progress bar on mobile
- Full stepper on desktop
- Adaptive card layouts

### Optional Steps
- Banking, Email, Tax, and Accounting steps are optional
- Can be skipped without breaking flow
- Skip buttons provided
- Clear "optional" indicators

### Data Persistence
- Form data submitted to `/api/connection-hub/onboarding` on completion
- Toast notifications for success/error states
- Loading states during submission

## Data Structure

```typescript
{
  companyInfo: {
    name: string
    country: string
    legalForm: string
    taxId: string
    address: {
      street: string
      streetNumber: string
      postalCode: string
      city: string
    }
  },
  banking: {
    provider?: string | null
    connected?: boolean
    bankName?: string | null
    skipped?: boolean
  },
  email: {
    provider?: string | null
    connected?: boolean
    address?: string | null
    skipped?: boolean
  },
  tax: {
    provider?: string | null
    connected?: boolean
    skipped?: boolean
  },
  accounting: {
    provider?: string | null
    connected?: boolean
    skipped?: boolean
  },
  preferences: {
    language: string
    timezone: string
    currency: string
    dateFormat: string
    notifications: {
      email: boolean
      invoiceReminders: boolean
      taxDeadlines: boolean
      bankTransactions: boolean
      weeklyReports: boolean
    }
  }
}
```

## Integration Points

### API Endpoint
- **POST** `/api/connection-hub/onboarding`
- Accepts the complete onboarding data structure
- Returns success/error response

### OAuth Flows (To Be Implemented)
- Banking providers: OAuth 2.0 flow
- Email providers: OAuth 2.0 flow (Google/Microsoft)
- Tax software: Provider-specific authentication
- Accounting software: OAuth 2.0 flow

## Customization

### Adding New Steps

1. Create step component in `steps/` directory
2. Add step definition to `STEPS` array in `OnboardingWizard.tsx`
3. Add case to `renderStep()` switch statement
4. Update Zod schema for validation
5. Export from `index.ts`

### Styling
- All components use shadcn/ui primitives
- Tailwind CSS for styling
- Consistent with existing design system
- Dark mode compatible via theme-provider

## Dependencies

- React Hook Form
- Zod (validation)
- @hookform/resolvers
- shadcn/ui components
- lucide-react (icons)

## Notes

- All provider connections are currently simulated (demo mode)
- OAuth flows need backend implementation
- Country-specific providers are filtered based on company country
- Mobile-first responsive design
- Accessibility features included (ARIA labels, keyboard navigation)
