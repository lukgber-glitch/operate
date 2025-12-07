# FinanzOnline Tax Wizard - Austrian UVA Filing

This directory contains the complete implementation of the Austrian tax filing wizard for FinanzOnline (Umsatzsteuervoranmeldung - UVA).

## Overview

The wizard guides users through submitting their Austrian VAT returns (UVA) to FinanzOnline with the following features:

- **Automated Data Collection**: Automatically calculates VAT from invoices and expenses
- **Step-by-Step Guidance**: 5-step wizard with clear progress indicators
- **UID Verification**: Real-time validation of Austrian UID numbers
- **Preview & Confirmation**: Review all data before submission
- **Error Handling**: Comprehensive error messages with Austrian tax code mapping
- **Real-time Status**: Live submission status tracking

## Components

### FinanzOnlineWizard.tsx
Main wizard component that orchestrates the entire filing process.

**Usage:**
```tsx
import { FinanzOnlineWizard } from '@/components/tax/finanz-online';

<FinanzOnlineWizard />
```

### PeriodSelector.tsx
Allows users to select the tax period (monthly or quarterly).

**Features:**
- Year selection (current + 4 previous years)
- Monthly or quarterly filing periods
- Austrian German month names (Jänner, Februar, etc.)

### DataReview.tsx
Displays calculated VAT data for review.

**Features:**
- Shows all Austrian VAT rates (20%, 13%, 10%)
- Displays Kennzahlen (tax form field numbers)
- Automatic calculation of Zahllast/Guthaben
- Currency formatting in Austrian locale (EUR)

### UidVerification.tsx
Verifies Austrian UID numbers with FinanzOnline.

**Features:**
- Auto-formatting (ATU prefix)
- Real-time format validation
- Company name/address lookup
- Clear error messages

### ConfirmSubmission.tsx
Final confirmation before submission.

**Features:**
- Complete summary of submission
- Legal warnings and confirmations
- Due date display
- Checkbox confirmation required

### SubmissionComplete.tsx
Displays submission result and next steps.

**Features:**
- Reference number display
- Download receipt option
- Error details with codes
- Next steps guidance

### StepsProgress.tsx
Visual progress indicator for wizard steps.

**Features:**
- 5-step progress bar
- Active/complete/pending states
- Responsive design

## API Integration

### austrian-tax.ts
API client for FinanzOnline endpoints.

**Endpoints:**
```typescript
// Get UVA preview with auto-calculated data
finanzOnlineApi.getUvaPreview(orgId, period)

// Verify UID number
finanzOnlineApi.verifyUid(uid)

// Submit UVA
finanzOnlineApi.submitUva(submission)

// Get submission status
finanzOnlineApi.getUvaStatus(orgId, submissionId)
```

### useFinanzOnline.ts
React Query hooks for data fetching and mutations.

**Hooks:**
```typescript
// Main hook with all functionality
const { preview, submissionResult, isLoading, fetchPreview, verifyUid, submitUva } = useFinanzOnlineUva();

// Individual hooks
const { data: preview } = useUvaPreview(orgId, period);
const submitMutation = useSubmitUva();
const verifyMutation = useVerifyUid();
```

## Austrian Tax Form Fields (Kennzahlen)

The wizard handles the following UVA form fields:

| Kennzahl | Description | Rate |
|----------|-------------|------|
| KZ 000 | Gesamtbetrag der Bemessungsgrundlagen | Total |
| KZ 022 | Inländische Umsätze (Normalsteuersatz) | 20% |
| KZ 006 | Inländische Umsätze (ermäßigter Steuersatz 1) | 13% |
| KZ 029 | Inländische Umsätze (ermäßigter Steuersatz 2) | 10% |
| KZ 072 | Abziehbare Vorsteuer | Input VAT |
| KZ 083 | Zahllast/Überschuss | Net payable |

## Error Handling

FinanzOnline error codes are mapped to user-friendly German messages:

- **AUTH-***: Authentication/certificate errors
- **VAL-***: Validation errors
- **SERV-***: Service errors

## Backend Requirements

The frontend expects the following backend endpoints:

### GET `/tax/finanz-online/preview`
Returns auto-calculated UVA data for a period.

**Query params:**
- `organizationId`: string
- `period`: string (format: "2025-01" or "2025-Q1")

**Response:**
```typescript
{
  period: string;
  periodLabel: string;
  kennzahlen: {
    kz000: number;
    kz022: number;
    kz029: number;
    kz006: number;
    kz072: number;
    kz083: number;
  };
  details: {
    outputVat20: { invoices: any[]; total: number };
    outputVat13: { invoices: any[]; total: number };
    outputVat10: { invoices: any[]; total: number };
    inputVat: { expenses: any[]; total: number };
  };
  netVat: number;
  dueDate: string;
}
```

### GET `/tax/finanz-online/verify-uid`
Verifies an Austrian UID number.

**Query params:**
- `uid`: string (format: ATU12345678)

**Response:**
```typescript
{
  valid: boolean;
  uid: string;
  name?: string;
  address?: string;
  verifiedAt: string;
}
```

### POST `/tax/finanz-online/submit`
Submits UVA to FinanzOnline.

**Request body:**
```typescript
{
  organizationId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  uva: {
    kz000: number;
    kz022: number;
    kz029: number;
    kz006: number;
    kz072: number;
    kz083: number;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  referenceNumber?: string;
  timestamp: string;
  errors?: { code: string; message: string }[];
}
```

### GET `/tax/finanz-online/{submissionId}/status`
Gets submission status.

**Query params:**
- `organizationId`: string

**Response:**
```typescript
{
  submissionId: string;
  status: 'pending' | 'accepted' | 'rejected';
  referenceNumber?: string;
  submittedAt: string;
}
```

## Language

All UI text is in Austrian German (de-AT):
- Month names use Austrian variants (Jänner instead of Januar)
- Currency formatted as EUR with Austrian locale
- Tax terminology follows Austrian convention

## Testing

The wizard should be tested with:
- ✅ Valid UID numbers
- ✅ Invalid UID formats
- ✅ Different tax periods (monthly/quarterly)
- ✅ Various VAT scenarios (Zahllast/Guthaben)
- ✅ Error responses from backend
- ✅ Network failures

## Future Enhancements

- [ ] Support for annual UVA (yearly filing)
- [ ] Integration with FinanzOnline certificate authentication
- [ ] Offline draft saving
- [ ] PDF receipt generation
- [ ] Historical submissions list
- [ ] Automatic filing reminders
- [ ] Multi-language support (English)
