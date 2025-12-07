# FinanzOnline Wizard - Architecture

## Component Hierarchy

```
FinanzOnlineWizard (Main Container)
│
├── StepsProgress
│   └── Shows current step in wizard flow
│
├── Step 1: PeriodSelector
│   ├── Year dropdown
│   ├── Period type (monthly/quarterly)
│   └── Month/Quarter selection
│
├── Step 2: DataReview
│   ├── Austrian VAT rates display (20%, 13%, 10%)
│   ├── Kennzahlen (KZ 000, 022, 006, 029, 072, 083)
│   ├── Invoice/expense breakdown
│   └── Zahllast/Guthaben calculation
│
├── Step 3: UidVerification
│   ├── UID input (ATU + 8 digits)
│   ├── Format validation
│   ├── Real-time verification
│   └── Company details display
│
├── Step 4: ConfirmSubmission
│   ├── Complete summary
│   ├── All Kennzahlen review
│   ├── Legal warnings
│   ├── Confirmation checkbox
│   └── Submit button
│
└── Step 5: SubmissionComplete
    ├── Success/error status
    ├── Reference number
    ├── Error details
    ├── Next steps
    └── Download receipt
```

## Data Flow

```
User Input → React Query Hooks → API Client → Backend API
                     ↓
               State Management
                     ↓
            UI Components Update
                     ↓
            User sees results
```

## API Layer Architecture

```
Component (UI)
    ↓
useFinanzOnline Hook (React Query)
    ↓
austrian-tax.ts (API Client)
    ↓
client.ts (Base HTTP Client)
    ↓
Backend API (/tax/finanz-online/*)
    ↓
FinanzOnline Service
```

## State Management

```typescript
FinanzOnlineWizard manages:
- currentStep: WizardStep
- selectedPeriod: string
- selectedPeriodType: 'monthly' | 'quarterly'
- uid: string
- isUidVerified: boolean

useFinanzOnlineUva provides:
- preview: UvaPreview | undefined
- submissionResult: FinanzOnlineResult | null
- isLoading: boolean
- fetchPreview()
- verifyUid()
- submitUva()
```

## API Endpoints

```
GET  /tax/finanz-online/preview
     ↓
     Returns: UvaPreview with auto-calculated Kennzahlen

GET  /tax/finanz-online/verify-uid?uid=ATU12345678
     ↓
     Returns: UidVerificationResult

POST /tax/finanz-online/submit
     Body: FinanzOnlineSubmission
     ↓
     Returns: FinanzOnlineResult

GET  /tax/finanz-online/{submissionId}/status
     ↓
     Returns: UvaStatus
```

## Error Handling Flow

```
Backend Error
    ↓
API Client catches error
    ↓
React Query onError handler
    ↓
Toast notification displayed
    ↓
Error state in component
    ↓
User sees friendly error message
```

## Type Safety Chain

```typescript
// Backend response
interface UvaPreview { ... }

// API Client
finanzOnlineApi.getUvaPreview(): Promise<UvaPreview>

// React Query Hook
useUvaPreview(): UseQueryResult<UvaPreview>

// Component
<DataReview preview={UvaPreview} />
```

## Wizard Step Flow

```
[Period Selection]
       ↓
   fetchPreview()
       ↓
[Data Review] ← Auto-calculated from invoices
       ↓
   User reviews
       ↓
[UID Verification]
       ↓
   verifyUid()
       ↓
[Confirm Submission] ← Shows all data
       ↓
   User confirms
       ↓
   submitUva()
       ↓
[Submission Complete] ← Success/Error result
       ↓
   Close wizard
```

## Austrian Tax Kennzahlen Mapping

```
User Invoices (20% VAT) → KZ 022
User Invoices (13% VAT) → KZ 006
User Invoices (10% VAT) → KZ 029
All Invoices Total     → KZ 000
User Expenses (VAT)    → KZ 072
KZ 022*0.2 + KZ 006*0.13 + KZ 029*0.1 - KZ 072 → KZ 083
```

## Component Responsibilities

### FinanzOnlineWizard
- Orchestrate wizard flow
- Manage global state
- Handle step transitions
- Coordinate API calls

### PeriodSelector
- Collect period information
- Validate user input
- Trigger preview fetch

### DataReview
- Display calculated data
- Format currency (EUR)
- Show Kennzahlen
- Allow continuation

### UidVerification
- Validate UID format
- Call verification API
- Display company info
- Enable next step

### ConfirmSubmission
- Show complete summary
- Require confirmation
- Submit to backend
- Handle submission

### SubmissionComplete
- Display result
- Show reference number
- Provide next steps
- Allow wizard reset

### StepsProgress
- Visual feedback
- Current position
- Completed steps
- Step descriptions

## Technology Stack

- **React**: Component framework
- **TypeScript**: Type safety
- **React Query**: Data fetching & caching
- **shadcn/ui**: UI components
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Future Enhancements

### Phase 2
- Offline draft saving (IndexedDB)
- Historical submissions list
- Automatic filing reminders
- PDF receipt generation

### Phase 3
- Certificate authentication
- Multi-year comparison
- Export to Excel/PDF
- Email notifications

### Phase 4
- AI-powered error detection
- Smart categorization
- Predictive analytics
- Multi-language support
