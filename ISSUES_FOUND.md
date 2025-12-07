# Issues Found During Live Testing (2025-12-06)

## Critical Issues

### 1. Password Login Not Working
- **Location**: Login page (`/login`)
- **Issue**: Email/password login fails with "Invalid email or [REDACTED]"
- **Credentials tested**: luk.gber@gmail.com / schlagzeug
- **Workaround**: Google OAuth works fine

### 2. Email Validation Bug
- **Location**: Onboarding Step 2 - Company Info
- **Issue**: Valid email addresses like `test@example.com` show "Invalid email format"
- **File**: `apps/web/src/components/onboarding/OnboardingWizard.tsx` (Zod schema)
- **Impact**: Blocks onboarding completion

### 3. React Hook Form State Sync Issues
- **Location**: Onboarding Step 2 - Company Info
- **Issue**: Fields filled via JavaScript don't register with react-hook-form
- **Symptoms**:
  - Shows "required" errors even when fields have values
  - Values set programmatically don't trigger validation
- **Impact**: Form validation unreliable

## UI/UX Issues

### 4. Duplicate Header
- **Location**: Onboarding wizard (Steps 2-7)
- **Issue**: "Welcome to Operate" header appears twice
  - Once at page level
  - Once inside the wizard component
- **File**: `apps/web/src/app/(auth)/onboarding/page.tsx` and `OnboardingWizard.tsx`
- **Fix**: Remove one of the headers

### 5. Progress Indicator Cut Off
- **Location**: Onboarding wizard
- **Issue**: Step 8 "Complete" is partially cut off on the right side
- **Fix**: Add horizontal scroll or reduce step label widths

## Working Features

- Google OAuth login
- Microsoft OAuth button (not tested)
- Country dropdown (Germany, Austria, Switzerland, France, etc.)
- Legal Form dropdown (GmbH, AG, UG, etc.)
- Industry dropdown
- Currency dropdown (EUR, USD, GBP, CHF)
- Fiscal Year dropdown
- VAT registered checkbox
- Progress indicator shows correct step
- Time remaining estimate ("About 12 minutes remaining")
- Back/Next/Skip navigation buttons

## Not Yet Tested

- Banking step (Step 3) - blocked by Step 2 validation
- Email integration step (Step 4)
- Tax Software step (Step 5)
- Accounting step (Step 6)
- Preferences step (Step 7)
- Completion step (Step 8)
- Chat interface
- Dashboard
- Any post-onboarding features

## Recommended Priority

1. **HIGH**: Fix email validation (blocks onboarding)
2. **HIGH**: Fix password login
3. **MEDIUM**: Fix duplicate header
4. **MEDIUM**: Fix form state sync
5. **LOW**: Fix progress indicator overflow

## Test Environment

- URL: https://operate.guru
- Browser: Chrome 142.0.7444.176
- Test Account: luk.gber@gmail.com (Google OAuth)
