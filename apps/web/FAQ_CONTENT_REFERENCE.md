# FAQ Content Reference

## Quick Facts for Updating FAQ Answers

### Product Information

**Operate Overview**
- AI-powered business automation platform
- Uses Claude AI by Anthropic
- Features: invoicing, expenses, bank connections, tax filing, HR/payroll
- Target: Entrepreneurs, freelancers, small businesses

**Supported Languages**
- English
- German (Deutsch)

**Supported Countries (Tax Filing)**
- Germany (ELSTER integration)
- Austria
- UK (HMRC)
- More coming soon

### Pricing Plans

| Plan | Monthly | Annual | Features |
|------|---------|--------|----------|
| **Free** | €0 | €0 | 1 bank, 50 AI msgs, basic reports |
| **Starter** | €19 | €190 | 3 banks, 500 AI msgs, invoicing, email support |
| **Pro** | €39 | €390 | 10 banks, unlimited AI, tax filing, 3 team members |
| **Business** | €69 | €690 | Unlimited banks/AI, unlimited team, API access |

**Savings**: Annual billing = 17% discount (2 months free)

**Free Trial**: 14 days, no credit card required (paid plans only)

**Refund Policy**: 30-day money-back guarantee

### Banking Integration

**Providers**
- TrueLayer (EU/UK)
- Tink (Europe)
- Plaid (US - sandbox)

**Supported Banks**: 4,000+ across Europe, UK, US

**Major Banks Examples**
- Germany: Deutsche Bank, Commerzbank, Sparkasse, Volksbank
- UK: Barclays, HSBC, Lloyds
- US: Chase, Bank of America, Wells Fargo

**Sync Frequency**: Every 24 hours (manual sync available)

### AI Assistant

**Provider**: Anthropic Claude
- Model: Claude (latest version)
- Security: Enterprise-grade, data not used for training

**AI Capabilities**
- Create invoices and quotes
- Categorize expenses
- Reconcile bank transactions
- Answer financial questions
- Generate reports
- Search documents
- Natural language commands

**AI Limitations**
- NOT a financial advisor
- NOT a tax professional
- NOT a replacement for accountants
- Educational/informational purposes only

### Security & Compliance

**Encryption**
- At rest: AES-256
- In transit: TLS 1.3

**Certifications**
- SOC 2 Type II certified
- GDPR compliant

**Data Storage**
- EU: Frankfurt, Germany
- US: AWS US-East (Virginia)
- Custom residency: Available on Business plan

**Banking Credentials**: NEVER stored by Operate

**Data Access**
- User and authorized team members only
- Support access only with explicit permission
- AI provider (Anthropic) processes but doesn't store

**Data Deletion**: Within 30 days of account deletion

### Tax Filing

**Germany (ELSTER)**
- Full integration with official ELSTER system
- Electronic submission
- Requires ELSTER certificate
- VAT returns (Umsatzsteuervoranmeldung)
- Income tax assistance

**Austria**
- Tax preparation assistance
- Form generation
- No direct submission yet

**UK (HMRC)**
- Tax calculation support
- Document preparation
- Future: Direct submission

**Reports Available**
- P&L (Profit & Loss)
- Balance Sheet
- VAT Summary
- Expense Breakdown
- Mileage & Travel
- Custom date ranges

### Invoice & Document Features

**Invoice Creation**
- Via AI chat
- Manual form
- From templates
- Bulk import

**Invoice Sending**
- Email with PDF
- Payment link (Stripe)
- Open tracking
- Customizable templates

**Receipt Scanning (OCR)**
- Automatic data extraction
- Merchant name, date, amount, tax
- Review and correct
- Mobile-optimized

**File Formats**
- Import: CSV, Excel (XLSX)
- Upload: PDF, JPG, PNG, HEIC
- Export: CSV, Excel, PDF

**Integrations**
- DATEV (Germany accounting software)
- Gmail and Outlook (email)
- Stripe (payments)
- API (Business plan)

### Payment Processing

**Provider**: Stripe

**Payment Methods**
- Credit cards (Visa, Mastercard, Amex, Discover)
- Debit cards
- SEPA Direct Debit (EU)

**Failed Payment Policy**
- Email notification
- Retry over several days
- 7 days to resolve
- Downgrade to Free plan if unresolved

### Support

**Email**: support@operate.guru
**Sales**: sales@operate.guru

**Response Time**: Typically 24 hours

**Support Levels**
- Free: Community support
- Starter: Email support
- Pro: Priority email support
- Business: Priority support + onboarding

### Contact & Links

**Website**: https://operate.guru
**App**: https://operate.guru/app
**API**: https://operate.guru/api/v1

**Social Media** (if available)
- Twitter/X: @operateguru
- LinkedIn: /company/operate
- GitHub: /operate-guru

### Legal Disclaimers (Always Include)

**Financial Advice**
> "Operate and its AI assistant do NOT provide financial, investment, tax, or legal advice. Always consult qualified professionals for important decisions."

**Tax Advice**
> "Our tax filing features provide assistance, not professional tax advice. Consult a certified tax professional or Steuerberater for complex situations."

**Third-Party Services**
> "Bank connections use certified third-party providers (TrueLayer, Tink, Plaid). We implement strong security but cannot guarantee uninterrupted service."

**User Responsibility**
> "You are responsible for reviewing AI suggestions, maintaining account security, and complying with applicable laws."

---

## Updating FAQs

### File Location
`C:\Users\grube\op\operate-fresh\apps\web\src\app\(main)\faq\page.tsx`

### How to Add New FAQ

1. Find the appropriate category in `faqCategories` array
2. Add new FAQ object to the `faqs` array:

```typescript
{
  question: 'Your question here?',
  answer: 'Your detailed answer here.',
  disclaimer: true, // Optional: adds red warning box
}
```

### How to Add New Category

1. Import new icon from lucide-react
2. Add new category to `faqCategories`:

```typescript
{
  id: 'new-category',
  title: 'Category Name',
  icon: YourIcon,
  faqs: [
    {
      question: 'First question?',
      answer: 'First answer.',
    },
    // ... more FAQs
  ],
}
```

### Content Style Guide

**Questions**
- Start with question word (What, How, Can, Is, Do)
- End with question mark
- Keep under 100 characters
- User-focused (not "we" or "our")

**Answers**
- Start with direct answer (Yes/No if applicable)
- Provide details and context
- Include examples when helpful
- End with next steps or links
- 2-4 sentences typically
- Max 500 characters for readability

**Tone**
- Professional but friendly
- Clear and concise
- Honest and transparent
- Helpful and actionable
- No jargon unless explained

---

## Analytics to Track

**High Priority**
- Most viewed categories
- Most viewed questions
- Time on page
- Bounce rate
- Contact support clicks after FAQ

**Medium Priority**
- Questions that led to signup
- Questions that led to upgrades
- Mobile vs desktop usage
- Category expansion order

**Low Priority**
- Search queries (if search added)
- External referrers
- Browser/device breakdown

This helps identify:
- Missing content
- Confusing answers
- High-value questions
- Support deflection rate
