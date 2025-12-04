# OPERATE - GAP COMPLETION BIG PLAN (v4.0)

> **Created:** 2025-12-01
> **Updated:** 2025-12-01 (Global Expansion)
> **Objective:** Fill all gaps + expand to recommended global markets
> **Target:** Production-ready SME accounting platform for 20+ countries
> **Security:** High standards enforced - OAuth2, encrypted keys, audit logging, GDPR

---

## EXCLUDED MARKETS (Security/Compliance Risk)

| Market | Reason |
|--------|--------|
| **China (CN)** | Requires local entity, Golden Tax hardware, data localization, Great Firewall |
| **Brazil (BR)** | 26 separate state tax systems, extreme compliance complexity |
| **Indonesia (ID)** | New Coretax system launching 2025, too volatile |

---

## RESEARCH SUMMARY

### Best Practices Gathered

| Feature | Best Practice | Recommended Solution |
|---------|--------------|---------------------|
| **Bank Sync** | Plaid (US), Tink (EU), FinAPI (DE) | Tink for EU coverage (6000+ banks) |
| **OCR** | Mindee (best accuracy), AWS Textract | Mindee Receipt API ($0.10/page) |
| **ELSTER** | tigerVAT REST API or ERiC SDK | tigerVAT (simpler) or native ERiC |
| **FinanzOnline** | BMF Session-Webservice | Native SOAP integration |
| **E-Rechnung** | iText/PDFLib for ZUGFeRD | factur-x npm package |
| **Workflow** | @jescrich/nestjs-workflow, BullMQ | NestJS workflow with BullMQ |
| **GoBD** | Immutable audit log, 8yr retention | Append-only audit + hash chain |
| **DATEV** | ASCII CSV format, standard codes | CSV export with SKR03/04 mapping |
| **SAF-T** | OECD XML v2.0 schema | XML builder with validation |

---

## PHASE 6: GAP COMPLETION (NEW)

### Wave 7: Frontend Data Wiring (Priority: CRITICAL)
**Goal:** Replace all mock data with real API calls

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W7-T1 | Wire Finance dashboard to real APIs | PRISM | P0 | 2d | - |
| W7-T2 | Wire Tax pages to real APIs | PRISM | P0 | 2d | - |
| W7-T3 | Wire HR pages to real APIs | PRISM | P0 | 2d | - |
| W7-T4 | Wire Reports pages to real APIs | PRISM | P1 | 1d | - |
| W7-T5 | Create API error handling + loading states | PRISM | P0 | 1d | W7-T1-T4 |
| W7-T6 | Add real-time WebSocket updates | FORGE | P1 | 2d | - |

### Wave 8: Automation Foundation
**Goal:** Enable hands-off operation with auto-approve modes

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W8-T1 | Create AutomationSettings Prisma schema | VAULT | P0 | 0.5d | - |
| W8-T2 | Create AutomationMode enum (FULL/SEMI/MANUAL) | VAULT | P0 | 0.5d | - |
| W8-T3 | Create automation-settings.service.ts | FORGE | P0 | 1d | W8-T1 |
| W8-T4 | Create auto-approve workflow engine | FORGE | P0 | 2d | W8-T3 |
| W8-T5 | Create confidence threshold config UI | PRISM | P1 | 1d | W8-T3 |
| W8-T6 | Integrate auto-approve with AI classification | ORACLE | P0 | 1d | W8-T4 |
| W8-T7 | Create automation audit log | SENTINEL | P0 | 1d | W8-T4 |

### Wave 9: Recurring Invoices & Reminders
**Goal:** Automate repetitive billing tasks

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W9-T1 | Add RecurringInvoice Prisma schema | VAULT | P0 | 0.5d | - |
| W9-T2 | Create recurring-invoice.service.ts | FORGE | P0 | 1d | W9-T1 |
| W9-T3 | Create BullMQ recurring invoice job | FORGE | P0 | 1d | W9-T2 |
| W9-T4 | Create PaymentReminder schema | VAULT | P0 | 0.5d | - |
| W9-T5 | Create payment-reminder.service.ts | FORGE | P0 | 1d | W9-T4 |
| W9-T6 | Create reminder escalation workflow | FORGE | P1 | 1d | W9-T5 |
| W9-T7 | Create recurring invoice UI | PRISM | P1 | 1d | W9-T2 |

### Wave 10: OCR Receipt Scanning
**Goal:** Automatic expense entry from photos

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W10-T1 | Integrate Mindee Receipt OCR API | BRIDGE | P0 | 2d | - |
| W10-T2 | Create receipt-scanner.service.ts | ORACLE | P0 | 1d | W10-T1 |
| W10-T3 | Create receipt upload endpoint | FORGE | P0 | 0.5d | W10-T2 |
| W10-T4 | Create mobile-friendly upload UI | PRISM | P0 | 1d | W10-T3 |
| W10-T5 | Create OCR result review/confirm UI | PRISM | P1 | 1d | W10-T4 |
| W10-T6 | Add learning from corrections | ORACLE | P1 | 1d | W10-T5 |

### Wave 11: Bank Sync Integration
**Goal:** Automatic transaction import from banks

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W11-T1 | Integrate Tink Open Banking API | BRIDGE | P0 | 3d | - |
| W11-T2 | Create BankConnection Prisma schema | VAULT | P0 | 0.5d | - |
| W11-T3 | Create bank-sync.service.ts | BRIDGE | P0 | 2d | W11-T1, W11-T2 |
| W11-T4 | Create transaction import job | FORGE | P0 | 1d | W11-T3 |
| W11-T5 | Create bank account linking UI | PRISM | P0 | 2d | W11-T3 |
| W11-T6 | Create transaction reconciliation engine | FORGE | P0 | 2d | W11-T4 |
| W11-T7 | Create reconciliation review UI | PRISM | P1 | 1d | W11-T6 |
| W11-T8 | Add auto-categorization for bank txns | ORACLE | P0 | 1d | W11-T4 |

### Wave 12: E-Rechnung (ZUGFeRD/XRechnung)
**Goal:** Compliant electronic invoicing for B2B/B2G

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W12-T1 | Install factur-x and zugferd-xml packages | FORGE | P0 | 0.5d | - |
| W12-T2 | Create zugferd.service.ts (PDF/A-3 + XML) | BRIDGE | P0 | 2d | W12-T1 |
| W12-T3 | Create xrechnung.service.ts (pure XML) | BRIDGE | P0 | 2d | W12-T1 |
| W12-T4 | Update invoice PDF generation | FORGE | P0 | 1d | W12-T2 |
| W12-T5 | Add E-Rechnung toggle to invoice UI | PRISM | P1 | 0.5d | W12-T4 |
| W12-T6 | Create E-Rechnung validation service | BRIDGE | P1 | 1d | W12-T2, W12-T3 |

### Wave 13: ELSTER Tax Filing (Germany)
**Goal:** Direct VAT return submission to German tax authority

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W13-T1 | Research: tigerVAT vs ERiC SDK decision | BRIDGE | P0 | 1d | - |
| W13-T2 | Create ELSTER certificate management | SENTINEL | P0 | 2d | - |
| W13-T3 | Create elster-vat.service.ts (UStVA) | BRIDGE | P0 | 3d | W13-T1 |
| W13-T4 | Create elster-esl.service.ts (ZM) | BRIDGE | P1 | 2d | W13-T3 |
| W13-T5 | Create tax filing wizard UI | PRISM | P0 | 2d | W13-T3 |
| W13-T6 | Create filing status tracking | FORGE | P1 | 1d | W13-T3 |
| W13-T7 | Create ELSTER response parser | BRIDGE | P0 | 1d | W13-T3 |

### Wave 14: FinanzOnline (Austria)
**Goal:** Direct tax submission to Austrian tax authority

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W14-T1 | Create FinanzOnline SOAP client | BRIDGE | P0 | 2d | - |
| W14-T2 | Create finanzonline-session.service.ts | BRIDGE | P0 | 1d | W14-T1 |
| W14-T3 | Create finanzonline-uva.service.ts | BRIDGE | P0 | 2d | W14-T2 |
| W14-T4 | Create Austrian tax filing UI | PRISM | P0 | 2d | W14-T3 |
| W14-T5 | Create Registrierkasse integration | BRIDGE | P1 | 2d | W14-T2 |

### Wave 15: GoBD Compliance
**Goal:** Audit-proof archiving for German tax law

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W15-T1 | Create AuditLog schema (immutable) | VAULT | P0 | 1d | - |
| W15-T2 | Create hash-chain.service.ts | SENTINEL | P0 | 1d | W15-T1 |
| W15-T3 | Create document-archive.service.ts | FORGE | P0 | 2d | W15-T2 |
| W15-T4 | Create 8-year retention policy engine | FORGE | P1 | 1d | W15-T3 |
| W15-T5 | Create GoBD compliance report | FORGE | P1 | 1d | W15-T3 |
| W15-T6 | Create process documentation generator | FORGE | P2 | 2d | W15-T5 |

### Wave 16: Export Formats (DATEV, SAF-T)
**Goal:** Accountant-ready data exports

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W16-T1 | Create datev-export.service.ts (ASCII CSV) | BRIDGE | P0 | 2d | - |
| W16-T2 | Create SKR03/SKR04 account mapping | BRIDGE | P0 | 1d | W16-T1 |
| W16-T3 | Create saft-export.service.ts (XML) | BRIDGE | P0 | 2d | - |
| W16-T4 | Create BMD export (Austria) | BRIDGE | P1 | 1d | - |
| W16-T5 | Create export wizard UI | PRISM | P1 | 1d | W16-T1-T4 |
| W16-T6 | Create scheduled export jobs | FORGE | P2 | 1d | W16-T5 |

### Wave 17: Mobile PWA
**Goal:** Mobile-friendly access with offline support

| ID | Task | Agent | Priority | Effort | Dependencies |
|----|------|-------|----------|--------|--------------|
| W17-T1 | Create PWA manifest.json | PRISM | P1 | 0.5d | - |
| W17-T2 | Create service worker | PRISM | P1 | 1d | W17-T1 |
| W17-T3 | Create offline-first data layer | PRISM | P1 | 2d | W17-T2 |
| W17-T4 | Create mobile-optimized layouts | PRISM | P1 | 2d | - |
| W17-T5 | Create push notification UI | PRISM | P2 | 1d | W17-T2 |

---

## PHASE 7: US/UK EXPANSION (Waves 18-23)

*See `INTERNATIONAL_APIS.md` for full wave details*

| Wave | Name | Markets | Tasks |
|------|------|---------|-------|
| 18 | US Market Foundation | US | Plaid, Avalara, QuickBooks |
| 19 | UK Market Foundation | UK | TrueLayer, HMRC MTD, Xero |
| 20 | Global Payments | Global | Stripe, Wise, GoCardless |
| 21 | US Payroll | US | Gusto Embedded |
| 22 | Subscription Billing | Global | Stripe Billing, Chargebee |
| 23 | Compliance & KYC | Global | Persona, GDPR tools |

---

## PHASE 8: GLOBAL EXPANSION (Waves 24-29)

### Wave 24: EU Peppol Markets
**Goal:** France, Italy, Netherlands, Belgium, Sweden, Ireland
**Security:** TLS 1.3, certificate pinning for all Peppol communications

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W24-T1 | Integrate Peppol Access Point (secure) | BRIDGE | P0 | 3d |
| W24-T2 | Create France Factur-X service | BRIDGE | P0 | 2d |
| W24-T3 | Create Italy SDI connector | BRIDGE | P0 | 3d |
| W24-T4 | Create Chorus Pro integration (France B2G) | BRIDGE | P1 | 2d |
| W24-T5 | Add EU country tax configurations | VAULT | P0 | 2d |
| W24-T6 | Create multi-language UI (fr, it, nl, sv) | PRISM | P0 | 3d |
| W24-T7 | Add EU VAT validation (VIES) | BRIDGE | P0 | 1d |

### Wave 25: Spain & Spanish Markets
**Goal:** Spain SII system, gateway to LATAM
**Security:** Spanish digital certificates for real-time reporting

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W25-T1 | Create Spain SII connector | BRIDGE | P0 | 3d |
| W25-T2 | Create Spanish tax configuration (IVA) | VAULT | P0 | 1d |
| W25-T3 | Add Spanish language (es) | PRISM | P0 | 2d |
| W25-T4 | Create Spain-specific reports (Modelo 303) | FORGE | P1 | 2d |
| W25-T5 | Add SII certificate management | SENTINEL | P0 | 1d |

### Wave 26: Commonwealth (CA, AU, SG)
**Goal:** English-speaking markets with Peppol
**Security:** Government auth (CRA, ATO, myGovID)

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W26-T1 | Create CRA e-file integration (Canada) | BRIDGE | P0 | 2d |
| W26-T2 | Create ATO integration (Australia) | BRIDGE | P0 | 2d |
| W26-T3 | Create InvoiceNow integration (Singapore) | BRIDGE | P1 | 1d |
| W26-T4 | Add Canadian/Australian tax rules | VAULT | P0 | 2d |
| W26-T5 | Add CAD/AUD/SGD currencies | FORGE | P0 | 1d |

### Wave 27: Japan Market
**Goal:** Japan via Peppol Japan + freee accounting
**Security:** OAuth2 PKCE for all integrations

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W27-T1 | Create Peppol Japan connector | BRIDGE | P0 | 2d |
| W27-T2 | Create freee accounting integration | BRIDGE | P0 | 3d |
| W27-T3 | Add Japanese language (ja) | PRISM | P0 | 3d |
| W27-T4 | Create Japanese tax configuration | VAULT | P0 | 2d |
| W27-T5 | Add JPY formatting/fiscal year | FORGE | P0 | 1d |
| W27-T6 | Add Japanese invoice number format | FORGE | P1 | 0.5d |

### Wave 28: Middle East (UAE, Saudi Arabia)
**Goal:** Gulf market with ZATCA compliance
**Security:** HSM required for cryptographic stamp

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W28-T1 | Create ZATCA FATOORAH connector (Saudi) | BRIDGE | P0 | 3d |
| W28-T2 | Create UAE e-invoice service | BRIDGE | P0 | 2d |
| W28-T3 | Add Arabic language (ar) with RTL | PRISM | P0 | 3d |
| W28-T4 | Add Middle East tax rules | VAULT | P0 | 2d |
| W28-T5 | Add AED/SAR currencies | FORGE | P0 | 1d |
| W28-T6 | Add ZATCA certificate management | SENTINEL | P0 | 2d |

### Wave 29: India Market
**Goal:** India via GST IRP Portal
**Security:** GSP certification, digital signatures

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W29-T1 | Create GST IRP Portal connector | BRIDGE | P0 | 3d |
| W29-T2 | Create Tally integration (optional) | BRIDGE | P2 | 2d |
| W29-T3 | Add Hindi language (hi) | PRISM | P1 | 2d |
| W29-T4 | Create India GST configuration | VAULT | P0 | 2d |
| W29-T5 | Add INR currency/number format | FORGE | P0 | 1d |
| W29-T6 | Add GSTIN validation | FORGE | P0 | 0.5d |

---

## PHASE 9: COMPETITOR PARITY (Waves 30-35)

**Goal:** Match sevDesk/FreeFinance feature set to make them redundant

### Wave 30: AI Chatbot
**Goal:** Natural language assistant with proactive suggestions
**Key Differentiator:** Context-aware, action-capable chat

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W30-T1 | Create chat interface UI component | PRISM | P0 | 2d |
| W30-T2 | Create chat message store (Prisma) | VAULT | P0 | 0.5d |
| W30-T3 | Create chat.service.ts with Claude | ORACLE | P0 | 2d |
| W30-T4 | Create context-awareness engine | ORACLE | P0 | 2d |
| W30-T5 | Create proactive-suggestions.service.ts | ORACLE | P0 | 2d |
| W30-T6 | Create chat action executor | FORGE | P0 | 2d |
| W30-T7 | Create multi-turn conversation memory | ORACLE | P1 | 1d |
| W30-T8 | Create chat suggestions UI | PRISM | P1 | 1d |

### Wave 31: Onboarding Wizard
**Goal:** First-time setup flow for new users

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W31-T1 | Create onboarding wizard UI (multi-step) | PRISM | P0 | 2d |
| W31-T2 | Create company profile setup step | PRISM | P0 | 1d |
| W31-T3 | Create banking connection step | PRISM | P0 | 1d |
| W31-T4 | Create email connection step | PRISM | P0 | 1d |
| W31-T5 | Create tax software connection step | PRISM | P1 | 1d |
| W31-T6 | Create preferences step | PRISM | P1 | 0.5d |
| W31-T7 | Create first AI analysis trigger | ORACLE | P1 | 1d |
| W31-T8 | Create onboarding progress tracker | FORGE | P0 | 0.5d |

### Wave 32: Email Integration
**Goal:** Extract invoices/receipts from email automatically
**Security:** OAuth2 only, no password storage

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W32-T1 | Create Gmail OAuth2 integration | BRIDGE | P0 | 2d |
| W32-T2 | Create Microsoft Graph (Outlook) integration | BRIDGE | P0 | 2d |
| W32-T3 | Create email-sync.service.ts | BRIDGE | P0 | 1d |
| W32-T4 | Create invoice-extractor.service.ts (AI) | ORACLE | P0 | 2d |
| W32-T5 | Create receipt-extractor.service.ts (AI) | ORACLE | P0 | 1d |
| W32-T6 | Create email attachment processor | FORGE | P0 | 1d |
| W32-T7 | Create email connection UI | PRISM | P0 | 1d |
| W32-T8 | Create extracted invoices review UI | PRISM | P1 | 1d |

### Wave 33: CRM Module
**Goal:** Client management with insights

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W33-T1 | Create Client Prisma schema | VAULT | P0 | 1d |
| W33-T2 | Create client.service.ts | FORGE | P0 | 1d |
| W33-T3 | Create client list page | PRISM | P0 | 1.5d |
| W33-T4 | Create client profile page | PRISM | P0 | 1.5d |
| W33-T5 | Create client invoice history | PRISM | P1 | 1d |
| W33-T6 | Create client payment history | PRISM | P1 | 1d |
| W33-T7 | Create client insights | FORGE | P1 | 1d |
| W33-T8 | Create client quick actions | PRISM | P1 | 1d |

### Wave 34: Reports & Analytics
**Goal:** Financial reports with export

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W34-T1 | Create report-generator.service.ts | FORGE | P0 | 1d |
| W34-T2 | Create P&L statement report | FORGE | P0 | 1.5d |
| W34-T3 | Create cash flow statement report | FORGE | P1 | 1.5d |
| W34-T4 | Create tax summary report | FORGE | P0 | 1d |
| W34-T5 | Create AI report generation from chat | ORACLE | P1 | 1d |
| W34-T6 | Create PDF/Excel export service | FORGE | P0 | 1d |
| W34-T7 | Create reports page UI | PRISM | P0 | 1.5d |
| W34-T8 | Create scheduled reports | FORGE | P2 | 1d |

### Wave 35: Dashboard Enhancement
**Goal:** Smart dashboard with AI insights

| ID | Task | Agent | Priority | Effort |
|----|------|-------|----------|--------|
| W35-T1 | Create AI Insights Card component | PRISM | P0 | 1.5d |
| W35-T2 | Create global search (Cmd+K) | PRISM | P0 | 1.5d |
| W35-T3 | Create search indexer service | FORGE | P0 | 1d |
| W35-T4 | Create notification center dropdown | PRISM | P0 | 1d |
| W35-T5 | Create tax deadline reminders service | FORGE | P0 | 1d |
| W35-T6 | Create quick actions grid | PRISM | P1 | 1d |
| W35-T7 | Create user profile dropdown | PRISM | P1 | 0.5d |
| W35-T8 | Create cash flow chart widget | PRISM | P2 | 1d |

---

## AGENT ASSIGNMENTS SUMMARY (UPDATED)

| Agent | Waves | Total Tasks | Focus Areas |
|-------|-------|-------------|-------------|
| **PRISM** | 7-35 | 66 | Frontend, UI, PWA, i18n, Chat UI |
| **FORGE** | 7-35 | 56 | Backend services, workflows, reports |
| **BRIDGE** | 10-32 | 72 | External integrations (Tink, Plaid, Gmail, etc.) |
| **VAULT** | 8-33 | 17 | Database schemas, tax configs |
| **ORACLE** | 8-34 | 17 | AI chatbot, NLP, extraction, classification |
| **SENTINEL** | 8-28 | 15 | Security, certificates, HSM, audit |

---

## IMPLEMENTATION ORDER

```
PHASE 6 - GAP COMPLETION (Weeks 1-16):
Wave 7  → Frontend wiring (unlock real testing)
Wave 8  → Automation foundation (unlock hands-off)
Wave 9  → Recurring invoices (high user value)
Wave 10 → OCR scanning (high user value)
Wave 11 → Bank sync (competitive parity)
Wave 12 → E-Rechnung (legal compliance 2025)
Wave 13 → ELSTER (German market)
Wave 14 → FinanzOnline (Austrian market)
Wave 15 → GoBD compliance
Wave 16 → Export formats
Wave 17 → Mobile PWA

PHASE 7 - US/UK EXPANSION (Weeks 17-22):
Wave 18 → US banking + tax (Plaid, Avalara, QuickBooks)
Wave 19 → UK banking + tax (TrueLayer, HMRC MTD, Xero)
Wave 20 → Global payments (Stripe, Wise, multi-currency)
Wave 21 → US payroll (Gusto Embedded)
Wave 22 → Subscription billing automation
Wave 23 → KYC/GDPR compliance

PHASE 8 - GLOBAL EXPANSION (Weeks 23-34):
Wave 24 → EU Peppol (FR, IT, NL, BE, SE, IE)
Wave 25 → Spain (SII system)
Wave 26 → Commonwealth (CA, AU, SG)
Wave 27 → Japan (Peppol Japan, freee)
Wave 28 → Middle East (ZATCA, UAE)
Wave 29 → India (GST IRP Portal)

PHASE 9 - COMPETITOR PARITY (Weeks 35-42):
Wave 30 → AI Chatbot (Claude-powered assistant)
Wave 31 → Onboarding Wizard (first-time setup)
Wave 32 → Email Integration (Gmail/Outlook extraction)
Wave 33 → CRM Module (client management)
Wave 34 → Reports & Analytics (P&L, Cash Flow)
Wave 35 → Dashboard Enhancement (AI insights, search)
```

---

## SUCCESS METRICS

| Metric | Current | Phase 6 | Phase 7 | Phase 8 |
|--------|---------|---------|---------|---------|
| Frontend with real data | 15% | 100% | 100% | 100% |
| Automation rate | 0% | 70% | 80% | 85% |
| Bank connections | 0 | 6,000 (EU) | 18,000+ | 25,000+ |
| Markets supported | DACH | DACH | +US/UK | +20 countries |
| Languages | de, en | de, en | de, en | +fr, it, es, ja, ar, hi |
| Tax filing systems | 0 | 2 | 4 | 12+ |
| Compliance exports | 0 | 3 | 5 | 10+ |
| Currencies | EUR | EUR | +USD, GBP | +15 currencies |

---

## SECURITY STANDARDS

All integrations MUST comply with:

| Requirement | Description |
|-------------|-------------|
| **OAuth2 PKCE** | All third-party API authentication |
| **Encrypted Keys** | API keys in vault, never in env vars |
| **Audit Logging** | Full trail for all external API calls |
| **TLS 1.3** | Minimum for all government/tax APIs |
| **Certificate Pinning** | Required for Peppol, ELSTER, FinanzOnline |
| **HSM Storage** | Required for ZATCA, SII certificates |
| **Rate Limiting** | All endpoints protected |
| **GDPR Compliance** | Data export/deletion for EU users |

---

## COMMANDS

```bash
/continue          # Resume from current wave
/wave <number>     # Jump to specific wave
/agent <name>      # View agent's pending tasks
/status            # Show overall progress
```

---

## NOTES

- **Excluded Markets:** China (CN), Brazil (BR), Indonesia (ID) due to security/compliance complexity
- All estimates assume single agent working on task
- Parallel execution possible within waves (no dependencies)
- External API integration requires API keys setup first
- ELSTER requires registered software certificate
- ZATCA (Saudi) requires HSM for production
- GoBD compliance should be reviewed by German tax advisor
- France B2B e-invoice mandate starts 2026 - Wave 24 critical
