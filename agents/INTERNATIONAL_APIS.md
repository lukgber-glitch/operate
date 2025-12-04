# OPERATE - INTERNATIONAL API INTEGRATION PLAN

> **Objective:** Expand Operate to support US, UK, and global markets
> **Markets:** US, UK, EU (existing AT/DE/CH), Global

---

## MARKET-SPECIFIC API MATRIX

### BANKING & OPEN BANKING

| Market | Provider | Purpose | Pricing | Coverage |
|--------|----------|---------|---------|----------|
| **US** | Plaid | Bank linking, transactions | $0.30/connection | 12,000+ US institutions |
| **UK** | TrueLayer | Open Banking, AIS/PIS | Custom | 99% UK banks |
| **EU** | Tink | PSD2 Open Banking | Custom | 6,000+ EU banks |
| **Global** | MX | Account aggregation | Custom | US, Canada focus |
| **Global** | Yodlee | Data aggregation | Enterprise | 17,000+ institutions |

**Recommendation:**
- US: **Plaid** (market leader, best docs)
- UK: **TrueLayer** (UK specialist, Open Banking certified)
- EU: **Tink** (already planned, best EU coverage)

---

### TAX FILING & COMPLIANCE

| Market | Provider | Purpose | Pricing | Notes |
|--------|----------|---------|---------|-------|
| **US** | IRS MeF | E-file federal taxes | Free (certified) | Requires IRS certification |
| **US** | Avalara | Sales tax calculation | $50+/mo | Multi-state nexus |
| **UK** | HMRC MTD | Making Tax Digital VAT | Free | Gov API, certification required |
| **DE** | ELSTER/tigerVAT | VAT filing | €50/mo | Already planned |
| **AT** | FinanzOnline | VAT filing | Free | Already planned |
| **Global** | Avalara | VAT/GST calculation | Custom | 190+ countries |

**Recommendation:**
- US: **Avalara** for sales tax + direct **IRS MeF** for federal
- UK: Native **HMRC MTD API** integration
- Global: **Avalara AvaTax** for VAT/GST calculation

---

### ACCOUNTING SOFTWARE SYNC

| Provider | Markets | Purpose | API Quality | Best For |
|----------|---------|---------|-------------|----------|
| **QuickBooks Online** | US, UK, AU, CA | Full accounting sync | Excellent | US SMBs |
| **Xero** | UK, AU, NZ, Global | Full accounting sync | Excellent | UK/AU SMBs |
| **FreshBooks** | US, CA | Invoicing, expenses | Good | Freelancers |
| **Sage** | UK, EU | Enterprise accounting | Good | Enterprise |
| **DATEV** | DE, AT | Tax advisor export | CSV | Already planned |

**Recommendation:**
- US: **QuickBooks Online** (75% market share)
- UK: **Xero** (market leader in UK/AU)
- Both have excellent Node.js SDKs

---

### PAYROLL INTEGRATION

| Provider | Markets | Purpose | Pricing | API Quality |
|----------|---------|---------|---------|-------------|
| **Gusto** | US | Full payroll, benefits | $40+/mo | Excellent |
| **ADP** | US, Global | Enterprise payroll | Enterprise | Good |
| **Rippling** | US | HR + Payroll + IT | $8+/user | Excellent |
| **Deel** | Global | International payroll | $49+/mo | Excellent |
| **Remote** | Global | EOR, contractors | Custom | Good |

**Recommendation:**
- US SMB: **Gusto Embedded API** (best for integration)
- US Enterprise: **ADP Workforce Now**
- Global/Remote: **Deel API** for international contractors

---

### PAYMENTS & INVOICING

| Provider | Purpose | Markets | Pricing | Best For |
|----------|---------|---------|---------|----------|
| **Stripe** | Payments, invoicing | Global | 2.9% + $0.30 | SaaS, online |
| **GoCardless** | Direct debit, recurring | UK, EU | 1% + £0.20 | Subscriptions |
| **Wise** | Multi-currency transfers | Global | 0.5-2% | International |
| **Square** | POS, invoicing | US, UK | 2.6% + $0.10 | Retail |
| **PayPal** | Payments | Global | 2.9% + $0.30 | E-commerce |

**Recommendation:**
- Primary: **Stripe** (global, excellent API)
- UK/EU recurring: **GoCardless** (direct debit)
- Multi-currency: **Wise Business API**

---

### SUBSCRIPTION & BILLING

| Provider | Purpose | Pricing | Best For |
|----------|---------|---------|----------|
| **Stripe Billing** | Subscriptions | Included | Simple billing |
| **Chargebee** | Revenue recognition | $249+/mo | SaaS, compliance |
| **Recurly** | Subscription management | Custom | Enterprise |
| **Paddle** | MoR, tax handling | 5% + fees | Global SaaS |

**Recommendation:**
- Simple: **Stripe Billing** (already using Stripe)
- Complex: **Chargebee** (rev rec, dunning)

---

### EXPENSE & RECEIPT MANAGEMENT

| Provider | Purpose | Markets | Pricing | OCR Quality |
|----------|---------|---------|---------|-------------|
| **Mindee** | Receipt OCR | Global | $0.10/page | Excellent |
| **Expensify** | Expense reports | US, UK | $5+/user | Good |
| **Dext** | Receipt capture | UK, AU | £20+/mo | Excellent |
| **Ramp** | Corp cards + expenses | US | Free | N/A |

**Recommendation:**
- OCR: **Mindee** (already planned)
- Full expense: **Expensify API** for enterprise

---

## COMPREHENSIVE API INTEGRATION BY MARKET

### 🇺🇸 US MARKET STACK

```
BANKING
├── Plaid Link              → Bank account linking
├── Plaid Transactions      → Transaction sync
├── Plaid Auth              → ACH account verification
└── Plaid Identity          → KYC verification

TAX & COMPLIANCE
├── Avalara AvaTax          → Sales tax calculation
├── Avalara Returns         → Sales tax filing
├── IRS MeF (via provider)  → Federal tax e-file
└── State APIs (varies)     → State tax filing

ACCOUNTING
├── QuickBooks Online       → Full accounting sync
├── FreshBooks              → Invoice/expense sync
└── Wave (free tier)        → Basic accounting

PAYROLL
├── Gusto Embedded          → Full payroll
├── ADP Workforce           → Enterprise HR
└── Rippling                → All-in-one HR

PAYMENTS
├── Stripe                  → Card payments
├── Stripe ACH              → Bank transfers
├── Square                  → POS integration
└── PayPal                  → Alternative payments

INVOICING
├── Stripe Invoicing        → Professional invoices
├── Bill.com                → AP/AR automation
└── Melio                   → B2B payments
```

### 🇬🇧 UK MARKET STACK

```
BANKING
├── TrueLayer AIS           → Account aggregation
├── TrueLayer PIS           → Payment initiation
├── Open Banking UK         → Direct bank APIs
└── GoCardless              → Direct Debit (Bacs)

TAX & COMPLIANCE
├── HMRC MTD API            → VAT returns
├── HMRC Self Assessment    → Income tax (future)
├── Companies House         → Company data
└── Avalara (optional)      → VAT calculation

ACCOUNTING
├── Xero                    → Primary accounting
├── Sage                    → Enterprise option
├── FreeAgent               → Freelancer option
└── QuickBooks UK           → Alternative

PAYROLL
├── Gusto UK (limited)      → SMB payroll
├── Sage Payroll            → UK standard
├── BrightPay               → UK focused
└── Deel                    → Global contractors

PAYMENTS
├── Stripe UK               → Card payments
├── GoCardless              → Direct Debit (primary)
├── Wise                    → International
└── PayPal UK               → Alternative

INVOICING
├── Stripe Invoicing        → Standard invoices
├── GoCardless + Invoice    → DD collection
└── Xero Invoicing          → Via accounting sync
```

### 🌍 GLOBAL/MULTI-MARKET STACK

```
MULTI-CURRENCY
├── Wise Business API       → FX, transfers
├── Stripe Connect          → Global payments
├── PayPal Business         → 200+ markets
└── Airwallex               → Asia-Pacific

INTERNATIONAL TAX
├── Avalara Global          → VAT/GST 190 countries
├── Paddle                  → MoR (handles all tax)
├── Stripe Tax              → Tax calculation
└── TaxJar                  → US + international

GLOBAL PAYROLL
├── Deel                    → 150+ countries
├── Remote                  → EOR services
├── Papaya Global           → Enterprise
└── Oyster                  → Remote hiring

COMPLIANCE
├── Persona                 → KYC/identity global
├── Onfido                  → ID verification
├── ComplyAdvantage         → AML screening
└── Trulioo                 → Global verification
```

---

## NEW WAVES FOR INTERNATIONAL EXPANSION

### Wave 18: US Market Foundation
**Goal:** Core US banking, tax, and accounting integration

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W18-T1 | Integrate Plaid Link SDK | BRIDGE | P0 | 2d |
| W18-T2 | Create plaid-bank.service.ts | BRIDGE | P0 | 2d |
| W18-T3 | Integrate Avalara AvaTax API | BRIDGE | P0 | 3d |
| W18-T4 | Create us-sales-tax.service.ts | BRIDGE | P0 | 2d |
| W18-T5 | Integrate QuickBooks Online OAuth | BRIDGE | P0 | 2d |
| W18-T6 | Create quickbooks-sync.service.ts | BRIDGE | P0 | 3d |
| W18-T7 | Create US tax jurisdiction selector UI | PRISM | P1 | 1d |
| W18-T8 | Add multi-state nexus configuration | FORGE | P1 | 2d |

### Wave 19: UK Market Foundation
**Goal:** UK Open Banking, HMRC MTD, and Xero integration

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W19-T1 | Integrate TrueLayer SDK | BRIDGE | P0 | 2d |
| W19-T2 | Create truelayer-banking.service.ts | BRIDGE | P0 | 2d |
| W19-T3 | Integrate HMRC MTD OAuth | BRIDGE | P0 | 2d |
| W19-T4 | Create hmrc-vat.service.ts (MTD) | BRIDGE | P0 | 3d |
| W19-T5 | Integrate Xero OAuth2 | BRIDGE | P0 | 2d |
| W19-T6 | Create xero-sync.service.ts | BRIDGE | P0 | 3d |
| W19-T7 | Create UK VAT return wizard UI | PRISM | P0 | 2d |
| W19-T8 | Add UK company types config | VAULT | P1 | 1d |

### Wave 20: Global Payments & Multi-Currency
**Goal:** Support international transactions and currencies

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W20-T1 | Integrate Stripe Connect (global) | BRIDGE | P0 | 2d |
| W20-T2 | Integrate Wise Business API | BRIDGE | P0 | 2d |
| W20-T3 | Create multi-currency.service.ts | FORGE | P0 | 2d |
| W20-T4 | Create exchange-rate.service.ts | FORGE | P1 | 1d |
| W20-T5 | Add currency conversion to invoices | FORGE | P0 | 2d |
| W20-T6 | Create GoCardless Direct Debit | BRIDGE | P0 | 2d |
| W20-T7 | Create multi-currency UI components | PRISM | P0 | 2d |
| W20-T8 | Add currency selector to all money fields | PRISM | P1 | 2d |

### Wave 21: US Payroll Integration
**Goal:** Full US payroll via Gusto Embedded

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W21-T1 | Integrate Gusto Embedded API | BRIDGE | P0 | 3d |
| W21-T2 | Create gusto-payroll.service.ts | BRIDGE | P0 | 2d |
| W21-T3 | Create employee onboarding flow | PRISM | P0 | 2d |
| W21-T4 | Create pay run wizard UI | PRISM | P0 | 2d |
| W21-T5 | Create payroll reports | FORGE | P1 | 1d |
| W21-T6 | Add W-4, I-9 document handling | FORGE | P0 | 2d |
| W21-T7 | Create benefits enrollment UI | PRISM | P2 | 2d |

### Wave 22: Subscription & Billing Automation
**Goal:** Full subscription lifecycle management

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W22-T1 | Upgrade Stripe Billing integration | BRIDGE | P0 | 2d |
| W22-T2 | Create subscription-manager.service.ts | FORGE | P0 | 2d |
| W22-T3 | Integrate Chargebee (optional) | BRIDGE | P2 | 2d |
| W22-T4 | Create dunning automation | FORGE | P1 | 1d |
| W22-T5 | Create revenue recognition reports | FORGE | P1 | 2d |
| W22-T6 | Create subscription analytics UI | PRISM | P1 | 2d |
| W22-T7 | Add usage-based billing support | FORGE | P2 | 2d |

### Wave 23: International Compliance & KYC
**Goal:** Global compliance, identity verification

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W23-T1 | Integrate Persona for KYC | BRIDGE | P1 | 2d |
| W23-T2 | Create kyc-verification.service.ts | SENTINEL | P1 | 2d |
| W23-T3 | Add AML screening (ComplyAdvantage) | SENTINEL | P2 | 2d |
| W23-T4 | Create verification status UI | PRISM | P1 | 1d |
| W23-T5 | Add GDPR data handling | SENTINEL | P0 | 2d |
| W23-T6 | Create data export/deletion tools | FORGE | P0 | 1d |

---

## API CREDENTIALS CHECKLIST

### US Market
- [ ] Plaid: Create account at plaid.com/dashboard
- [ ] Avalara: Sign up at avalara.com (90-day trial)
- [ ] QuickBooks: Developer account at developer.intuit.com
- [ ] Gusto: Apply for Embedded access at gusto.com/embedded

### UK Market
- [ ] TrueLayer: Sign up at truelayer.com/signup
- [ ] HMRC MTD: Register at developer.service.hmrc.gov.uk
- [ ] Xero: Create app at developer.xero.com
- [ ] GoCardless: Sign up at gocardless.com/developers

### Global
- [ ] Stripe: Dashboard at dashboard.stripe.com
- [ ] Wise: Business API at wise.com/business/api
- [ ] Persona: Sign up at withpersona.com

---

## UPDATED AGENT WORKLOAD

| Agent | Original Tasks | New Tasks | Total |
|-------|---------------|-----------|-------|
| BRIDGE | 20 | 32 | 52 |
| PRISM | 22 | 14 | 36 |
| FORGE | 18 | 16 | 34 |
| SENTINEL | 4 | 6 | 10 |
| VAULT | 6 | 1 | 7 |
| ORACLE | 4 | 0 | 4 |

**New Total:** 74 + 49 = **123 tasks**

---

## IMPLEMENTATION TIMELINE

```
Phase 6 (Existing):     Waves 7-17   (16 weeks) - EU/DACH focus
Phase 7 (US/UK):        Waves 18-19  (6 weeks)  - US + UK foundation
Phase 8 (Global):       Waves 20-23  (8 weeks)  - Multi-currency, payroll

Total Estimated: 30 weeks for full international support
```

---

## SUCCESS METRICS (UPDATED)

| Metric | Current | Phase 6 | Phase 7 | Phase 8 |
|--------|---------|---------|---------|---------|
| Markets supported | AT/DE/CH | + compliant | + US/UK | + Global |
| Bank connections | 0 | 6,000 (EU) | +12,000 (US) +UK | 20,000+ |
| Tax jurisdictions | 0 | 3 (AT/DE/CH) | +50 US states +UK | 190+ |
| Accounting integrations | 0 | DATEV | +QBO +Xero | 5+ |
| Currencies | EUR | EUR | +USD +GBP | 30+ |
| Payroll markets | 0 | 0 | US via Gusto | Global via Deel |

---

## NOTES

- US sales tax is complex: 11,000+ jurisdictions, Avalara handles this
- HMRC MTD requires software vendor registration (takes 2-4 weeks)
- Plaid requires production access application for live data
- QuickBooks integration is essential for US market penetration
- Xero is #1 in UK/AU, QuickBooks is #1 in US - support both
- Consider Paddle as MoR to simplify global tax compliance
