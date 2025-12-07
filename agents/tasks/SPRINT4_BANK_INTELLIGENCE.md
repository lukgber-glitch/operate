# Sprint 4: Bank Intelligence

**Coordinator**: ATLAS (Project Manager)
**Sprint Goal**: Turn bank transactions into automated bookkeeping + tax optimization
**Duration**: Week 7-8
**Depends On**: Sprint 3 completion

---

## VISION

Transform bank sync from "import transactions" to "smart financial intelligence":

```
🏦 Every Transaction → Classified → Matched → Tax Optimized → Insights Generated
```

---

## DEPENDENCY ORDER (Critical Path)

```
[PARALLEL GROUP 1 - Foundation]
├── TASK-S4-01: Enhanced Transaction Classifier (ORACLE)
└── TASK-S4-02: Invoice Auto-Matcher (BRIDGE)

[PARALLEL GROUP 2 - Matching & Tax]
├── TASK-S4-03: Bill Auto-Matcher (BRIDGE)
└── TASK-S4-04: Tax Deduction Analyzer (ORACLE)

[PARALLEL GROUP 3 - Patterns & Predictions]
├── TASK-S4-05: Recurring Transaction Detector (ORACLE)
└── TASK-S4-06: Cash Flow Predictor (ORACLE)

[PARALLEL GROUP 4 - Tracking & UI]
├── TASK-S4-07: Tax Liability Tracker (FORGE)
└── TASK-S4-08: Bank Intelligence Dashboard (PRISM)
```

---

## TASK-S4-01: Enhanced Transaction Classifier

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: High
**Dependencies**: None

### Context
Current transaction categorization is basic. We need TAX-AWARE classification.

### Objective
Enhance transaction classification with tax categories and deduction rules.

### Classification Schema

```typescript
interface EnhancedTransactionClassification {
  // Basic Category
  category: ExpenseCategory;
  subcategory?: string;
  confidence: number;

  // Tax Classification
  tax: {
    deductible: boolean;
    deductionPercentage: number;  // 0-100
    deductibleAmount: number;
    vatReclaimable: boolean;
    vatAmount?: number;
    taxCategory: TaxCategory;  // Maps to tax form line
  };

  // Business Classification
  business: {
    isBusinessExpense: boolean;
    businessPercentage: number;  // For mixed use (car, phone)
    requiresDocumentation: boolean;
    documentationType?: 'RECEIPT' | 'INVOICE' | 'CONTRACT';
  };

  // Pattern Detection
  pattern: {
    isRecurring: boolean;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    expectedNextDate?: Date;
    vendor?: string;
  };

  // Matching
  matchedTo?: {
    type: 'INVOICE' | 'BILL' | 'NONE';
    id?: string;
    confidence: number;
  };
}

enum TaxCategory {
  // German tax categories (EÜR)
  WAREN_MATERIAL = 'WAREN_MATERIAL',           // Line 12
  FREMDLEISTUNGEN = 'FREMDLEISTUNGEN',         // Line 13
  PERSONAL = 'PERSONAL',                        // Line 14
  MIETE_PACHT = 'MIETE_PACHT',                 // Line 18
  SONSTIGE_KOSTEN = 'SONSTIGE_KOSTEN',         // Line 20
  ABSCHREIBUNGEN = 'ABSCHREIBUNGEN',           // Line 22
  KFZKOSTEN = 'KFZKOSTEN',                     // Line 24
  REISEKOSTEN = 'REISEKOSTEN',                 // Line 25
  BEWIRTUNG = 'BEWIRTUNG',                     // Line 26 (70% deductible)
  TELEFON_INTERNET = 'TELEFON_INTERNET',       // Line 27
  BUEROKOSTEN = 'BUEROKOSTEN',                 // Line 28
  VERSICHERUNGEN = 'VERSICHERUNGEN',           // Line 29

  // Income
  EINNAHMEN_7 = 'EINNAHMEN_7',                 // 7% VAT
  EINNAHMEN_19 = 'EINNAHMEN_19',               // 19% VAT
  EINNAHMEN_STEUERFREI = 'EINNAHMEN_STEUERFREI', // Tax-free

  // Other
  PRIVATE_ENTNAHME = 'PRIVATE_ENTNAHME',       // Private withdrawal
  KEINE_STEUERRELEVANZ = 'KEINE_STEUERRELEVANZ', // Not tax relevant
}
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/transaction-classifier.service.ts`
```typescript
@Injectable()
export class EnhancedTransactionClassifierService {
  async classifyTransaction(transaction: {
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    counterparty?: string;
    category?: string;
  }): Promise<EnhancedTransactionClassification>;

  async classifyBatch(transactions: Transaction[]): Promise<ClassificationResult[]>;

  async suggestTaxCategory(
    classification: EnhancedTransactionClassification
  ): Promise<TaxCategory>;
}
```

2. `apps/api/src/modules/ai/bank-intelligence/bank-intelligence.module.ts`
3. `apps/api/src/modules/ai/bank-intelligence/types/tax-categories.types.ts`

### Technical Requirements
- Use existing AI service for classification
- German tax rules hardcoded (EÜR format)
- Confidence threshold for auto-categorization: 0.85
- Learn from user corrections
- Handle common vendors (Amazon, AWS, Google, etc.)

### Acceptance Criteria
- [ ] All transactions tax-classified
- [ ] Deduction percentages correct (e.g., 70% for meals)
- [ ] VAT amounts extracted
- [ ] Tax category maps to EÜR lines
- [ ] High-confidence auto-approved

---

## TASK-S4-02: Invoice Auto-Matcher

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: S4-01

### Context
When money comes in, automatically match to open invoices.

### Objective
Auto-reconcile incoming payments with sent invoices.

### Matching Logic

```
Incoming Payment €1,000 from "Acme Corp"
  │
  ├─► Search: Open invoices for "Acme" or similar
  │     ├─► Invoice #123: €1,000 (EXACT MATCH ✓)
  │     ├─► Invoice #124: €500 (partial?)
  │     └─► Invoice #125: €1,500 (partial?)
  │
  ├─► Match Criteria:
  │     ├─► Amount: Exact or within 1%
  │     ├─► Customer: Name/domain match
  │     ├─► Reference: Invoice # in payment description
  │     └─► Date: Invoice not too old (< 180 days)
  │
  └─► Actions:
        ├─► EXACT_MATCH: Auto-reconcile, mark invoice PAID
        ├─► PROBABLE_MATCH: Suggest to user
        ├─► PARTIAL_PAYMENT: Record partial, invoice stays PARTIAL
        └─► NO_MATCH: Flag for review, maybe new customer?
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/invoice-matcher.service.ts`
```typescript
@Injectable()
export class InvoiceMatcherService {
  async matchPaymentToInvoice(
    transaction: BankTransaction,
    orgId: string
  ): Promise<{
    matched: boolean;
    matchType: 'EXACT' | 'PROBABLE' | 'PARTIAL' | 'NONE';
    invoice?: Invoice;
    confidence: number;
    suggestedAction: 'AUTO_RECONCILE' | 'REVIEW' | 'CREATE_CUSTOMER';
  }>;

  async autoReconcile(
    transactionId: string,
    invoiceId: string
  ): Promise<void>;

  async findPotentialMatches(
    transaction: BankTransaction,
    orgId: string
  ): Promise<InvoiceMatch[]>;
}
```

2. `apps/api/src/modules/ai/bank-intelligence/matchers/amount-matcher.ts`
3. `apps/api/src/modules/ai/bank-intelligence/matchers/customer-matcher.ts`

### Technical Requirements
- Fuzzy company name matching
- Reference number extraction from descriptions
- Handle overpayments and underpayments
- Support multiple invoices per payment
- Update invoice status automatically

### Acceptance Criteria
- [ ] Exact matches auto-reconciled
- [ ] Partial payments recorded correctly
- [ ] Customer name fuzzy matching works
- [ ] Reference numbers detected
- [ ] 80%+ of payments matched automatically

---

## TASK-S4-03: Bill Auto-Matcher

**Agent**: BRIDGE (Integrations Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: Medium
**Dependencies**: S4-01

### Context
When we pay a vendor, automatically match to open bills.

### Objective
Auto-reconcile outgoing payments with bills/invoices from vendors.

### Matching Logic

```
Outgoing Payment -€500 to "AWS"
  │
  ├─► Search: Open bills from "Amazon Web Services" / "AWS"
  │     ├─► Bill #B-001: €500 (EXACT MATCH ✓)
  │     └─► Bill #B-002: €299 (different amount)
  │
  ├─► Match Criteria:
  │     ├─► Amount: Exact or within 1%
  │     ├─► Vendor: Name match
  │     ├─► Date: Bill due around payment date
  │     └─► Reference: Bill # in payment description
  │
  └─► Actions:
        ├─► EXACT_MATCH: Auto-reconcile, mark bill PAID
        ├─► PROBABLE_MATCH: Suggest to user
        └─► NO_MATCH: Maybe create bill from payment?
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/bill-matcher.service.ts`
```typescript
@Injectable()
export class BillMatcherService {
  async matchPaymentToBill(
    transaction: BankTransaction,
    orgId: string
  ): Promise<{
    matched: boolean;
    matchType: 'EXACT' | 'PROBABLE' | 'NONE';
    bill?: Bill;
    confidence: number;
    suggestedAction: 'AUTO_RECONCILE' | 'REVIEW' | 'CREATE_BILL';
  }>;

  async autoReconcileBill(
    transactionId: string,
    billId: string
  ): Promise<void>;

  async createBillFromPayment(
    transaction: BankTransaction,
    vendorId: string
  ): Promise<Bill>;
}
```

### Technical Requirements
- Match by vendor name
- Create bill from payment if none exists
- Link transaction to bill
- Update bill payment status
- Handle recurring payments (subscriptions)

### Acceptance Criteria
- [ ] Bill payments matched to bills
- [ ] Create bill option for unmatched payments
- [ ] Vendor matching works
- [ ] Transaction linked to bill
- [ ] Recurring payments detected

---

## TASK-S4-04: Tax Deduction Analyzer

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P0 (Critical)
**Estimated Complexity**: High
**Dependencies**: S4-01

### Context
Calculate tax deductions correctly per German tax law.

### Objective
Analyze each expense and calculate the tax-deductible amount.

### Deduction Rules (German)

```typescript
const DEDUCTION_RULES = {
  // 100% Deductible
  OFFICE_SUPPLIES: { percentage: 100, documentation: 'RECEIPT' },
  SOFTWARE: { percentage: 100, documentation: 'INVOICE' },
  PROFESSIONAL_SERVICES: { percentage: 100, documentation: 'INVOICE' },
  CLOUD_SERVICES: { percentage: 100, documentation: 'INVOICE' },

  // Partial Deductions
  MEALS_BUSINESS: { percentage: 70, documentation: 'RECEIPT', notes: 'Bewirtungsbeleg required' },
  HOME_OFFICE: { percentage: 'CALCULATED', documentation: 'PROOF', notes: 'Based on sqm' },
  CAR: { percentage: 'FAHRTENBUCH_OR_1%', documentation: 'LOG', notes: 'Fahrtenbuch or 1% rule' },
  PHONE_INTERNET: { percentage: 50, documentation: 'INVOICE', notes: 'Business share' },

  // Special Cases
  GIFTS: { maxAmount: 35, documentation: 'RECEIPT', notes: 'Per person per year' },
  ADVERTISING: { percentage: 100, documentation: 'INVOICE' },

  // Not Deductible
  PRIVATE_EXPENSES: { percentage: 0 },
  FINES_PENALTIES: { percentage: 0 },
  PERSONAL_CLOTHING: { percentage: 0 },
};
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/tax-deduction-analyzer.service.ts`
```typescript
@Injectable()
export class TaxDeductionAnalyzerService {
  async analyzeDeduction(
    transaction: BankTransaction,
    classification: EnhancedTransactionClassification
  ): Promise<{
    deductible: boolean;
    grossAmount: number;
    deductibleAmount: number;
    deductionPercentage: number;
    vatReclaimable: number;
    netTaxBenefit: number;  // Actual tax savings
    taxCategory: TaxCategory;
    documentationRequired: string[];
    warnings: string[];
    eurLineNumber: number;  // German EÜR form line
  }>;

  async calculateQuarterlyDeductions(
    orgId: string,
    quarter: 1 | 2 | 3 | 4,
    year: number
  ): Promise<DeductionSummary>;

  async estimateAnnualTaxSavings(orgId: string): Promise<TaxSavingsEstimate>;
}
```

2. `apps/api/src/modules/ai/bank-intelligence/rules/german-tax-rules.ts`

### Technical Requirements
- German tax law compliant
- EÜR form mapping
- VAT calculation (7% and 19%)
- Track documentation requirements
- Estimate quarterly tax payments

### Acceptance Criteria
- [ ] Deduction percentages correct
- [ ] VAT reclaim calculated
- [ ] EÜR line numbers assigned
- [ ] Documentation warnings shown
- [ ] Quarterly summaries work

---

## TASK-S4-05: Recurring Transaction Detector

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-01

### Context
Detect subscriptions and recurring payments automatically.

### Objective
Identify and track recurring transactions (subscriptions, rent, insurance, etc.)

### Detection Logic

```typescript
interface RecurringPattern {
  // Pattern Info
  vendor: string;
  amount: number;
  amountVariance: number;  // How much it varies
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  // Timing
  typicalDay: number;  // Day of month (1-31)
  nextExpectedDate: Date;

  // History
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  totalSpent: number;

  // Classification
  type: 'SUBSCRIPTION' | 'UTILITY' | 'RENT' | 'INSURANCE' | 'LOAN' | 'OTHER';
  isEssential: boolean;
  cancellable: boolean;

  // Predictions
  yearlyTotal: number;
  nextYearEstimate: number;
}
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/recurring-detector.service.ts`
```typescript
@Injectable()
export class RecurringTransactionDetectorService {
  async detectRecurringPatterns(orgId: string): Promise<RecurringPattern[]>;

  async updatePattern(
    transactionId: string,
    patternId: string
  ): Promise<void>;

  async getSubscriptionSummary(orgId: string): Promise<{
    totalMonthly: number;
    totalYearly: number;
    subscriptions: RecurringPattern[];
    opportunities: Array<{
      pattern: RecurringPattern;
      suggestion: string;  // "Cancel unused Adobe subscription?"
    }>;
  }>;
}
```

2. Prisma model:
```prisma
model RecurringPattern {
  id              String   @id @default(cuid())
  organisationId  String
  vendor          String
  amount          Decimal
  frequency       String
  typicalDay      Int?
  nextExpected    DateTime?
  type            String
  totalSpent      Decimal
  occurrences     Int
  firstSeen       DateTime
  lastSeen        DateTime
  active          Boolean  @default(true)

  transactions    BankTransaction[]

  @@index([organisationId])
  @@index([vendor])
}
```

### Acceptance Criteria
- [ ] Subscriptions detected automatically
- [ ] Monthly/yearly totals calculated
- [ ] Next payment predicted
- [ ] Cancel opportunities suggested
- [ ] Pattern linked to transactions

---

## TASK-S4-06: Cash Flow Predictor

**Agent**: ORACLE (AI/ML Specialist)
**Priority**: P1
**Estimated Complexity**: High
**Dependencies**: S4-02, S4-03, S4-05

### Context
Predict future cash position based on patterns and outstanding invoices/bills.

### Objective
Create accurate cash flow predictions to avoid cash crunches.

### Prediction Model

```typescript
interface CashFlowPrediction {
  // Daily Predictions (next 30 days)
  dailyForecast: Array<{
    date: Date;
    predictedBalance: number;
    inflows: {
      expected: number;
      sources: Array<{ type: string; amount: number; confidence: number }>;
    };
    outflows: {
      expected: number;
      sources: Array<{ type: string; amount: number; confidence: number }>;
    };
    confidence: number;
  }>;

  // Key Metrics
  lowestPoint: {
    date: Date;
    amount: number;
    daysUntil: number;
  };

  runway: {
    days: number;
    assumingNoNewIncome: number;
    date: Date;  // When cash runs out
  };

  // Alerts
  alerts: Array<{
    type: 'LOW_CASH' | 'NEGATIVE_BALANCE' | 'LATE_RECEIVABLES';
    date: Date;
    severity: 'WARNING' | 'CRITICAL';
    message: string;
    suggestedAction: string;
  }>;

  // Recommendations
  recommendations: Array<{
    action: string;
    impact: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}
```

### Files to Create

1. `apps/api/src/modules/ai/bank-intelligence/cash-flow-predictor.service.ts`
```typescript
@Injectable()
export class CashFlowPredictorService {
  async predict(
    orgId: string,
    days: number = 30
  ): Promise<CashFlowPrediction>;

  async calculateRunway(orgId: string): Promise<{
    days: number;
    endDate: Date;
    assumptions: string[];
  }>;

  async getAlerts(orgId: string): Promise<CashFlowAlert[]>;
}
```

### Technical Requirements
- Use historical data for predictions
- Factor in recurring transactions
- Include outstanding invoices (expected inflows)
- Include upcoming bills (expected outflows)
- Seasonality detection (if enough data)

### Acceptance Criteria
- [ ] 30-day forecast generated
- [ ] Lowest cash point identified
- [ ] Runway calculated
- [ ] Alerts for low cash
- [ ] Recommendations actionable

---

## TASK-S4-07: Tax Liability Tracker

**Agent**: FORGE (Backend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-04

### Context
Track estimated tax liability in real-time.

### Objective
Show users their estimated tax bill and help them set aside money.

### Tracking Model

```typescript
interface TaxLiability {
  // Current Period
  period: {
    year: number;
    quarter: number;
    month: number;
  };

  // Income Summary
  income: {
    gross: number;
    vatCollected: number;
    net: number;
  };

  // Expense Summary
  expenses: {
    gross: number;
    deductible: number;
    vatPaid: number;
  };

  // Tax Estimates
  estimates: {
    incomeTax: number;     // Einkommensteuer estimate
    vatDue: number;        // VAT to pay (collected - paid)
    tradeTax?: number;     // Gewerbesteuer if applicable
    totalEstimated: number;
  };

  // Recommendations
  setAside: {
    monthly: number;
    quarterly: number;
    alreadySaved: number;
    shortfall: number;
  };

  // Deadlines
  deadlines: Array<{
    type: 'VAT_RETURN' | 'INCOME_TAX' | 'TRADE_TAX';
    date: Date;
    amount: number;
    filed: boolean;
  }>;
}
```

### Files to Create

1. `apps/api/src/modules/finance/tax/tax-liability-tracker.service.ts`
2. `apps/api/src/modules/finance/tax/tax-liability.controller.ts`
3. `apps/api/src/modules/finance/tax/tax.module.ts`

### Technical Requirements
- Real-time updates as transactions arrive
- German tax brackets for estimates
- VAT period tracking (monthly or quarterly)
- Deadline reminders
- "Set aside" recommendations

### Acceptance Criteria
- [ ] Real-time tax estimate
- [ ] VAT calculation correct
- [ ] Deadlines tracked
- [ ] Set aside amount calculated
- [ ] Deadline reminders work

---

## TASK-S4-08: Bank Intelligence Dashboard

**Agent**: PRISM (Frontend Specialist)
**Priority**: P1
**Estimated Complexity**: Medium
**Dependencies**: S4-05, S4-06, S4-07

### Context
Users need visibility into bank intelligence insights.

### Objective
Create a dashboard showing bank-derived insights.

### Dashboard Components

1. **Transaction Intelligence**
   - Recent transactions with classifications
   - Tax deductions identified
   - Matches found

2. **Cash Flow Forecast**
   - 30-day chart
   - Lowest point warning
   - Runway indicator

3. **Subscriptions Overview**
   - Monthly recurring total
   - List of subscriptions
   - Cancel opportunities

4. **Tax Tracker**
   - Estimated tax due
   - VAT balance
   - Set aside progress
   - Upcoming deadlines

5. **Unmatched Transactions**
   - Need review queue
   - Quick match buttons
   - Create invoice/bill actions

### Files to Create

1. `apps/web/src/app/(dashboard)/intelligence/banking/page.tsx`
2. `apps/web/src/components/intelligence/CashFlowChart.tsx`
3. `apps/web/src/components/intelligence/SubscriptionsCard.tsx`
4. `apps/web/src/components/intelligence/TaxTrackerCard.tsx`
5. `apps/web/src/components/intelligence/TransactionReviewQueue.tsx`
6. `apps/web/src/lib/api/bank-intelligence.ts`

### Acceptance Criteria
- [ ] Cash flow chart interactive
- [ ] Subscriptions manageable
- [ ] Tax estimates visible
- [ ] Unmatched transactions reviewable
- [ ] Mobile responsive

---

## AGENT LAUNCH SEQUENCE

### Phase 1 (Parallel)
1. **ORACLE Agent #1**: S4-01 (Enhanced Transaction Classifier)
2. **BRIDGE Agent #1**: S4-02 (Invoice Auto-Matcher)

### Phase 2 (After Phase 1)
3. **BRIDGE Agent #2**: S4-03 (Bill Auto-Matcher)
4. **ORACLE Agent #2**: S4-04 (Tax Deduction Analyzer)

### Phase 3 (After Phase 2)
5. **ORACLE Agent #3**: S4-05 (Recurring Transaction Detector)
6. **ORACLE Agent #4**: S4-06 (Cash Flow Predictor)

### Phase 4 (After Phase 3)
7. **FORGE Agent**: S4-07 (Tax Liability Tracker)
8. **PRISM Agent**: S4-08 (Bank Intelligence Dashboard)

---

## SUCCESS METRICS

When Sprint 4 is complete:

1. **Auto-Reconciliation**: 80%+ of payments matched automatically
2. **Tax Intelligence**: Every expense has tax deduction calculated
3. **Subscription Tracking**: All recurring payments identified
4. **Cash Prediction**: Accurate 30-day forecast
5. **Tax Tracking**: Real-time tax liability estimate

---

## INTEGRATION POINTS

- **Bank Sync**: `apps/api/src/modules/finance/bank-sync/`
- **Transaction Categorization**: `apps/api/src/modules/ai/transaction-categorization/`
- **Invoice Module**: `apps/api/src/modules/finance/invoices/`
- **Bills Module**: `apps/api/src/modules/finance/bills/`
- **Email Intelligence**: Sprint 3 services
