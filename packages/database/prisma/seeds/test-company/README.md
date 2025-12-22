# Comprehensive Test Company Seed

This seed creates a fully-featured test company with realistic data across **ALL** modules of the Operate application.

## Quick Start

```bash
# From the database package directory
cd packages/database

# Run the test company seed
npm run db:seed:test-company
```

Or from the root:

```bash
pnpm --filter @operate/database db:seed:test-company
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Owner** | owner@testcorp.de | TestOwner123! |
| **Admin** | admin@testcorp.de | TestAdmin123! |
| **Accountant** | accountant@testcorp.de | TestAccountant123! |
| **E2E Tester** | test@operate.guru | TestPassword123! |

## Data Created

### Organisation
- **Name**: TestCorp GmbH
- **Slug**: test-company
- **Country**: Germany (DE)
- **Currency**: EUR
- **Timezone**: Europe/Berlin

### HR Data
- 3 Employees (Max, Anna, Thomas)
- 3 Employment Contracts
- Leave Entitlements & Requests
- 1 Payroll Period with Payslips
- Time Entries
- Social Security Registrations

### CRM Data
- 5 Clients with varying statuses:
  - TechCorp Solutions (VIP, Enterprise)
  - Design Studio Berlin (SME)
  - Hans Schneider (Freelancer)
  - Future Industries (Prospect - Switzerland)
  - Alpine Solutions (Austria)
- 6 Contacts
- 6 Addresses

### Vendors (Accounts Payable)
- 10 vendors across categories:
  - Cloudways (Hosting)
  - WeWork (Office Rent)
  - DME Agency (Marketing)
  - TechEquip (IT Equipment)
  - Müller Law (Legal)
  - AWS (Cloud)
  - Allianz (Insurance)
  - Schmidt Tax (Accounting)
  - Amazon Business (Supplies)
  - Telekom (Utilities)

### Finance Data

#### Invoices (5)
| Status | Customer | Amount |
|--------|----------|--------|
| PAID | TechCorp | €17,850 |
| SENT | Design Studio | €5,355 |
| OVERDUE | Hans Schneider | €2,856 |
| DRAFT | Alpine Solutions | €10,412.50 |
| PARTIAL | TechCorp | €14,280 (50% paid) |

#### Expenses (12)
Various categories: Office Supplies, Software (GitHub, Figma, AWS), Travel, Meals, Marketing, Legal, Utilities, Insurance, Rent

#### Bills (4)
| Status | Vendor | Amount |
|--------|--------|--------|
| PAID | Cloudways | €355.81 |
| PENDING | WeWork | €1,785 |
| OVERDUE | DME Agency | €2,975 |
| DRAFT | TechEquip | €5,355 |

#### Quotes (3)
- 1 Accepted (converted to invoice)
- 1 Sent (awaiting response)
- 1 Draft

#### Mileage Entries (5)
Various business trips for tax deduction testing

### Banking Data

#### Bank Accounts (3)
- Deutsche Bank Business (€47,235.67)
- Business Savings (€25,000)
- PayPal Business (€3,420.15)

#### Transactions (18+)
- Income (invoice payments)
- Expenses (software, rent, payroll, taxes)
- Transfers (internal)
- **3 Uncategorized** (for AI classification testing)
- **Pending transactions** (for reconciliation testing)

### AI/Chat Data

#### Conversations (4)
- Invoice Status Check
- Expense Categorization Help
- Monthly Cash Flow Review
- Q3 Tax Planning (archived)

#### Suggestions (7)
- Payment reminder (HIGH priority)
- Overdue bill payment (HIGH priority)
- Recurring expense setup (MEDIUM)
- Tax deadline reminder (MEDIUM)
- Transaction categorization (LOW)
- Accepted suggestion (history)
- Dismissed suggestion (history)

#### Documents (8)
Various types: Invoices, Receipts, Contracts, Bank Statements, Tax Returns, HR Policies

### Email Intelligence Data

#### Forwarding Inbox
- bills-{orgId}@in.operate.guru - For receiving vendor invoices

#### Synced Emails (20)

**Vendor Bills (to pay):**
| From | Subject | Amount | Status |
|------|---------|--------|--------|
| AWS | AWS Invoice December 2024 | €287.34 | Processed |
| Cloudways | Monthly Hosting Invoice | €355.81 | Processed |
| Allianz | Insurance Q1 2025 | €425.00 | Processed |
| Telekom | Internet Bill December | €49.99 | Processed |
| WeWork | Office Rent January 2025 | €1,785.00 | Processed |
| Schmidt Tax | Accounting Fee December | €595.00 | Processed |
| Müller Law | Legal Advisory November | €892.50 | Processed |
| GitHub | Subscription December | €44.00 | Processed |
| DME Agency | Marketing Q4 (DUE TODAY) | €2,975.00 | Processed |
| Unknown Vendor | Rechnung Nr. 2024-5678 | €1,234.56 | **Pending Review** |

**Customer Emails:**
| From | Subject | Action |
|------|---------|--------|
| TechCorp | Payment Received INV-2024-0001 | Mark Paid |
| Design Studio | Project Update - Invoice Request | Create Invoice |
| New Customer | E-Commerce Platform Inquiry | Create Lead |
| Alpine Solutions | Payment Confirmation INV-2024-0002 | Mark Paid |
| Future Industries | Enterprise Platform Quote Request | Create Quote |

**Other Emails:**
| Type | From | Subject |
|------|------|---------|
| RECEIPT | Amazon | Order Delivered (€89.50) |
| EXPENSE | Max Müller | Reimbursement Request |
| NEWSLETTER | Tech Weekly | December Newsletter (skipped) |
| BANK_STATEMENT | Deutsche Bank | November Statement |
| TAX | ELSTER | VAT Filing Confirmation |

#### Extracted Invoices (9)
**Verified (8):**
- AWS: €287.34
- Cloudways: €355.81
- Allianz Insurance: €425.00
- Telekom: €49.99
- WeWork Rent: €1,785.00
- Schmidt Tax Advisory: €595.00
- Müller Law: €892.50
- DME Marketing: €2,975.00

**Pending Review (1):**
- Unknown Vendor: €1,234.56 (65% confidence)

#### Email Suggestions (16)

**Bills to Pay (10):**
- AWS cloud services
- Insurance premium (Allianz)
- Internet bill (Telekom)
- Office rent (WeWork) - High Priority
- Tax advisory fee (Schmidt)
- Legal services (Müller Law)
- Marketing invoice (DME) - **Due Today!**
- Cloudways hosting (completed)
- Unknown vendor (needs review)
- GitHub subscription

**Customer Actions (4):**
- Mark TechCorp invoice as paid
- Create invoice for Design Studio
- Create lead for new E-Commerce inquiry
- Mark Alpine Solutions invoice as paid

**Other (2):**
- Add unknown vendor to system
- Create expense from Amazon receipt

## Test Scenarios This Data Enables

### Accounts Receivable
- View paid/pending/overdue invoices
- Send payment reminders
- Track partial payments
- Convert quotes to invoices

### Accounts Payable
- Pay pending bills
- Handle overdue bills
- Schedule payments
- Manage vendors

### Banking & Reconciliation
- Reconcile transactions with invoices/expenses
- AI auto-categorization of transactions
- Multi-account management
- Transfer tracking

### AI/Chat Features
- Continue existing conversations
- Execute suggestions
- Cash flow analysis
- Expense categorization

### Reporting & Analytics
- Profit & Loss
- Cash Flow
- Accounts Aging
- Tax Reports

### Tax & Compliance
- VAT calculations
- Tax deduction tracking
- Filing deadline reminders
- Document management

### Email Intelligence
- Review synced emails from various sources
- Process invoice attachments automatically
- Handle low-confidence extractions requiring review
- Execute email-based suggestions (create bill, mark paid, etc.)
- Test email classification (invoice, receipt, newsletter, etc.)
- Filter out marketing/promotional emails

### HR & Payroll
- Employee management
- Time tracking approval
- Leave management
- Payroll processing

## Re-running the Seed

The seed is **idempotent** - running it again will:
1. Delete existing test company data
2. Recreate all data fresh

This is useful for:
- Resetting to a known state between tests
- Starting fresh after manual testing
- CI/CD pipeline resets

## File Structure

```
seeds/test-company/
├── index.ts              # Main orchestrator
├── finance.seed.ts       # Invoices, expenses, bills, quotes
├── banking.seed.ts       # Bank accounts & transactions
├── vendors.seed.ts       # AP vendors
├── conversations.seed.ts # Chat & AI data
├── emails.seed.ts        # Email intelligence data
└── README.md             # This file
```

## Extending the Seed

To add more test data:

1. Create a new seed file in `seeds/test-company/`
2. Export a function that accepts `SeedContext`
3. Import and call it from `index.ts`
4. Update the cleanup function in `index.ts`

Example:
```typescript
// seeds/test-company/contracts.seed.ts
export async function seedContracts(context: SeedContext) {
  const { orgId, clientIds, vendorIds } = context;
  // Create contracts...
}
```
