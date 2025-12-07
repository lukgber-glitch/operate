# Legal Pages - Reference Guide

## Created Pages

All pages are located in `src/app/(marketing)/` and follow a consistent design pattern.

### 1. Cookie Policy
**URL:** `/cookies`
**File:** `src/app/(marketing)/cookies/page.tsx`

**Sections:**
- What are cookies (session vs persistent)
- Types we use (essential, analytics, preferences)
- Third-party cookies (Stripe, Google Analytics, auth providers)
- How to manage cookies (browser-specific instructions)
- Detailed cookie table with names, purposes, types, and durations
- Warning about disabling essential cookies

**Key Features:**
- Comprehensive cookie table
- Browser-specific settings instructions
- Clear categorization of cookie types

---

### 2. Acceptable Use Policy
**URL:** `/acceptable-use`
**File:** `src/app/(marketing)/acceptable-use/page.tsx`

**Sections:**
- Permitted uses (financial management, banking, tax compliance)
- Prohibited activities:
  - Fraud and money laundering
  - Illegal business activities
  - System abuse (hacking, malware)
  - Misrepresentation
- Account sharing rules
- Data accuracy requirements
- Consequences of violations (warning, suspension, termination, legal action)
- Reporting violations

**Key Features:**
- Clear visual distinction between permitted (✓) and prohibited (error styling)
- Detailed prohibited activities list
- Escalating consequences explained
- Abuse reporting contact

---

### 3. AI Disclaimer ⚠️
**URL:** `/ai-disclaimer`
**File:** `src/app/(marketing)/ai-disclaimer/page.tsx`

**THIS IS THE MOST CRITICAL PAGE - Comprehensive liability protection**

**Sections:**
- Prominent warning banner
- NOT financial advice
- NOT tax advice
- NOT legal advice
- NOT accounting advice
- What AI CAN do (information organization, data entry assistance)
- AI limitations and errors
- User responsibility checklist
- **Strong liability disclaimer in prominent styling**
- When to seek professional advice (grid with categories)
- User acknowledgment section

**Key Features:**
- Multiple warning banners (error and warning styling)
- Extensive "NOT professional services" disclaimers
- Clear statement: "AI CAN MAKE MISTAKES"
- Explicit user responsibility list
- Maximum liability protection language
- Professional consultation guidance

**Legal Protection:**
- Disclaims ALL liability for AI outputs
- Users acknowledge they assume ALL risk
- Clear warnings that AI is not a licensed professional
- Emphasis on verification requirements

---

### 4. Impressum (German Legal Requirement)
**URL:** `/impressum`
**File:** `src/app/(marketing)/impressum/page.tsx`

**Sections:**
- Company information (operator, address)
- Contact information (email, phone, website)
- Responsible person (§ 55 Abs. 2 RStV)
- Business registration (VAT ID, trade register)
- Professional information (if applicable)
- Disclaimers:
  - Liability for content (§ 7 TMG)
  - Liability for links
  - Copyright information
- Data protection officer
- EU dispute resolution link
- Consumer dispute resolution statement
- Supervisory authority (if applicable)
- Links to other legal pages

**Key Features:**
- Complies with German TMG requirements
- Placeholder text marked with [brackets] for customization
- Links to EU dispute resolution platform
- Warning note to replace placeholders
- References to other legal pages

---

### 5. Data Processing Agreement (DPA)
**URL:** `/dpa`
**File:** `src/app/(marketing)/dpa/page.tsx`

**For business customers - GDPR Article 28 compliance**

**Sections:**
1. Definitions (Controller, Processor, Personal Data, etc.)
2. Scope and Application
3. Nature and Purpose of Processing:
   - Subject matter, duration, nature
   - Purpose of processing
   - Types of personal data
   - Categories of data subjects
4. Processor Obligations:
   - Processing instructions
   - Confidentiality
   - Assistance obligations
5. Security Measures:
   - Technical measures (encryption, access controls, backups)
   - Organizational measures (training, incident response)
6. Sub-processors:
   - Current list (Anthropic, Stripe, AWS, TrueLayer/Tink)
   - Change notification (30 days advance notice)
7. Data Subject Rights (all GDPR rights listed)
8. Audit Rights
9. Data Breach Notification
10. Data Return and Deletion (30-day export window)

**Key Features:**
- Full GDPR Article 28 compliance
- Detailed processing information
- Sub-processor table with locations
- Security measures grid
- Clear data subject rights list
- Table of contents with anchor links
- Professional B2B styling

---

## Design Consistency

All pages share:
- Consistent header with title and "Last updated" date
- CSS variables for theming (`--color-background`, `--color-surface`, etc.)
- Responsive layout (max-w-4xl container)
- Professional typography with clear hierarchy
- Color-coded sections:
  - Error/warning sections: red/orange background with border
  - Important info: blue primary color background
  - General content: surface color background
- "Back to Home" button at bottom
- Proper metadata for SEO

## Routes

All pages are accessible at:
- `https://operate.guru/cookies`
- `https://operate.guru/acceptable-use`
- `https://operate.guru/ai-disclaimer`
- `https://operate.guru/impressum`
- `https://operate.guru/dpa`

## Next Steps

1. **Update Impressum placeholders** with actual company information
2. **Add footer links** to main layout pointing to these pages
3. **Review with legal counsel** to ensure full compliance
4. **Add to sitemap** for SEO
5. **Link from signup/onboarding** flows where appropriate
6. **Consider cookie consent banner** that links to cookie policy

## Important Notes

- **AI Disclaimer** should be prominently linked before users can access AI features
- **DPA** should be available for business plan customers
- **Impressum** is legally required for German companies/operators
- All pages use placeholder text marked with [brackets] - replace before going live
- Consider adding "Last reviewed by legal" date for compliance tracking
