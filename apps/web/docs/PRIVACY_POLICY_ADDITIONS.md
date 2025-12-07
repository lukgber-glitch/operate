# Privacy Policy Additions - Operate App

## Overview

This document contains comprehensive privacy policy sections that should be added to the public-facing privacy policy at `https://operate.guru/privacy`.

These additions cover all data collection, processing, sharing, and user rights required by:
- GDPR (EU)
- CCPA (California)
- App Store requirements
- Google Play requirements
- German tax/financial regulations

**Last Updated**: 2025-12-07

---

## 1. AI Processing Disclosure

### Artificial Intelligence and Machine Learning

Operate uses artificial intelligence to provide automated bookkeeping assistance, document processing, and natural language chat functionality.

#### 1.1 Claude AI (Anthropic)

**Service Provider**: Anthropic PBC
**Purpose**: Natural language processing, document analysis, invoice extraction, chat assistance
**Privacy Policy**: https://www.anthropic.com/privacy

**Data Shared with Anthropic**:
- Chat messages you send to the AI assistant
- Uploaded documents (invoices, receipts, contracts) for OCR and data extraction
- Financial document content for automated categorization

**How Your Data is Used**:
- To generate responses to your questions
- To extract data from invoices and receipts
- To categorize transactions automatically
- To provide proactive financial insights

**Data Retention by Anthropic**:
According to Anthropic's privacy policy, they do NOT retain user data sent via their API. Your messages and documents are:
- Processed in real-time
- Not stored on Anthropic's servers
- Not used to train AI models
- Not shared with other users

**Your Control**:
- You must explicitly consent before using AI features
- You can disable AI processing at any time in Settings
- Locally stored chat history is deleted when you clear conversation history
- Disabling AI does not delete historical data already processed

**Security**:
- All data transmitted to Anthropic is encrypted using TLS 1.2+
- API calls use authenticated endpoints
- No data is cached in transit

---

## 2. Banking Data Handling

### Open Banking and Financial Integrations

Operate connects to your bank accounts to automatically import transactions, categorize expenses, and maintain accurate financial records.

#### 2.1 Tink (EU/UK Banking)

**Service Provider**: Tink AB
**Jurisdictions**: European Union, United Kingdom
**Purpose**: Open banking connection, transaction import
**Privacy Policy**: https://tink.com/privacy-policy/

**Data Shared with Tink**:
- Bank login credentials (encrypted, not stored by us)
- Account selection
- Authorization tokens

**Data Received from Tink**:
- Account balances
- Transaction history
- Account metadata (account numbers, names)

**Legal Basis**: PSD2 (Payment Services Directive 2) compliance for EU/UK

#### 2.2 TrueLayer (EU/UK Banking)

**Service Provider**: TrueLayer Limited
**Jurisdictions**: European Union, United Kingdom
**Purpose**: Open banking connection, transaction import
**Privacy Policy**: https://truelayer.com/privacy/

**Data Shared with TrueLayer**:
- Bank login credentials (encrypted, not stored by us)
- Account selection
- Authorization tokens

**Data Received from TrueLayer**:
- Account balances
- Transaction history
- Account metadata

**Legal Basis**: PSD2 compliance for EU/UK

#### 2.3 Plaid (US Banking)

**Service Provider**: Plaid Inc.
**Jurisdictions**: United States
**Purpose**: Banking connection (sandbox environment only)
**Privacy Policy**: https://plaid.com/legal/

**Current Status**: Sandbox/testing mode only, not production banking

**Data Shared with Plaid**:
- Bank login credentials (encrypted)
- Account selection
- Authorization tokens

**Data Received from Plaid**:
- Account balances
- Transaction history
- Account metadata

**Note**: Production Plaid integration requires additional compliance steps before activation.

#### 2.4 Your Banking Data Rights

**Data Storage**:
- Banking credentials are NEVER stored on our servers
- Only access tokens are stored (encrypted at rest)
- Transaction data is stored encrypted in our database

**Data Usage**:
- Banking data is used ONLY for bookkeeping within the app
- Never shared with advertisers or data brokers
- Never used for marketing purposes
- Never sold to third parties

**Data Retention**:
- Transaction data: Retained for 10 years (German tax law requirement)
- Bank connection tokens: Retained until you disconnect or delete account
- Deleted connections: Data deleted within 30 days

**Your Control**:
- You can disconnect bank accounts at any time
- You can delete individual transactions
- You can request data export (see Data Access section)
- You can request full deletion (see Data Deletion section)

**Security Measures**:
- End-to-end encryption for banking connections
- AES-256 encryption for stored data
- SSL certificate pinning prevents man-in-the-middle attacks
- Regular security audits
- PCI DSS Level 1 compliant (via Stripe)

---

## 3. Payment Processing

### Stripe Payment Integration

Operate uses Stripe for subscription payments and premium feature purchases.

**Service Provider**: Stripe, Inc.
**Purpose**: Payment processing, subscription management
**Privacy Policy**: https://stripe.com/privacy

**Data Shared with Stripe**:
- Credit card information (never touches our servers)
- Billing address (if provided)
- Email address
- Name

**Data Received from Stripe**:
- Payment confirmation
- Subscription status
- Invoice history

**How Stripe Handles Your Data**:
- Credit card details are stored and processed by Stripe (PCI DSS Level 1)
- We never see or store your full card number
- We receive only the last 4 digits and card brand for display purposes

**Payment Security**:
- Stripe uses industry-standard encryption
- 3D Secure authentication for supported cards
- Fraud detection algorithms
- Automatic security updates

**Your Rights**:
- You can update payment methods at any time
- You can cancel subscriptions at any time
- You can request refunds (see Refund Policy)
- You can delete payment methods

**Data Retention**:
- Stripe retains payment data per their privacy policy
- We retain subscription history for accounting (7 years, legal requirement)
- Deleted payment methods are removed from our records within 30 days

---

## 4. Biometric Data

### Face ID, Touch ID, and Fingerprint Authentication

Operate supports biometric authentication (Face ID, Touch ID, fingerprint unlock) for convenient and secure login.

**What Biometric Data We Collect**: NONE

**How It Works**:
- Your biometric data (face, fingerprint) NEVER leaves your device
- Your device's operating system handles biometric authentication
- We only receive a "success" or "fail" response from the OS
- No biometric templates are transmitted to our servers
- No biometric data is stored in our database

**Your Control**:
- Biometric authentication is OPTIONAL
- You can enable/disable it at any time in Settings
- You can always use password login instead
- Disabling biometric auth does not delete your account

**Security**:
- Biometric data is protected by iOS Secure Enclave or Android Keystore
- We use platform-standard biometric APIs
- No third-party biometric libraries

**Legal Basis**: Consent (you explicitly enable this feature)

**Compliance**:
- GDPR compliant (biometric data is processed locally only)
- CCPA compliant (no biometric data collected by us)
- BIPA compliant (Illinois Biometric Information Privacy Act)

---

## 5. Data Retention Periods

### How Long We Keep Your Data

We retain your data for different periods based on legal requirements, business needs, and your preferences.

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Account Information | Until account deletion | Contract performance |
| Transaction Data | 10 years | German tax law (§147 AO) |
| Invoices/Receipts | 10 years | German tax law (§147 AO) |
| Tax Documents | 10 years | German tax law (§147 AO) |
| Payment Records | 7 years | Accounting law (§257 HGB) |
| Chat History | Until you delete or account closure | User preference |
| Usage Analytics | 90 days | Legitimate interest |
| Crash Logs | 90 days | Legitimate interest |
| Email Integration Data | Until you disconnect or account closure | Consent |
| Bank Connection Tokens | Until you disconnect or account closure | Consent |
| Subscription History | 7 years (after cancellation) | Accounting law |
| Support Tickets | 3 years | Legitimate interest |

**Exceptions**:
- Data required for legal disputes is retained until resolved
- Data required for ongoing audits is retained until audit completion
- Anonymized analytics may be retained indefinitely (no personal data)

**Automated Deletion**:
- Non-essential data is automatically deleted after retention period expires
- You will receive notifications before tax documents are deleted (after 10 years)
- Deleted data is purged from backups within 90 days

---

## 6. User Rights

### Your Rights Under GDPR, CCPA, and Other Privacy Laws

You have comprehensive rights regarding your personal data:

#### 6.1 Right to Access

**What**: You can request a copy of all data we hold about you
**How**: Settings → Privacy → Download My Data
**Timeline**: Delivered within 30 days (usually within 48 hours)
**Format**: JSON export with all your data

**Included in Export**:
- Account information
- Transaction data
- Uploaded documents
- Chat history
- Usage analytics (anonymized)
- Subscription history

#### 6.2 Right to Rectification

**What**: You can correct inaccurate data
**How**: Edit directly in-app or email support@operate.guru
**Timeline**: Corrected immediately (in-app) or within 7 days (via support)

**Examples**:
- Update email address
- Correct transaction categories
- Fix invoice details
- Update personal information

#### 6.3 Right to Erasure ("Right to be Forgotten")

**What**: You can request deletion of your personal data
**How**: Settings → Account → Delete Account OR email privacy@operate.guru
**Timeline**: Deleted within 30 days

**What Gets Deleted**:
- Account credentials
- Personal information (name, email)
- Banking connection data
- Chat history
- Uploaded documents (except tax records - see below)
- Usage analytics

**What Cannot Be Deleted** (legal requirements):
- Tax documents (invoices, receipts): Retained 10 years
- Payment records: Retained 7 years
- Anonymized analytics: Already anonymous, not personal data

**After Deletion**:
- You cannot log back into the account
- Data is purged from all servers
- Backups are purged within 90 days
- Email notifications stopped

#### 6.4 Right to Data Portability

**What**: You can receive your data in a structured, machine-readable format
**How**: Settings → Privacy → Download My Data
**Format**: JSON (easily importable to other systems)
**Timeline**: Generated within 24 hours

**Portable Data Includes**:
- All transactions in CSV/JSON format
- All uploaded documents (PDFs/images)
- Account settings
- Custom categories and tags

#### 6.5 Right to Restrict Processing

**What**: You can ask us to stop processing certain data
**How**: Email privacy@operate.guru with specific request
**Timeline**: Implemented within 7 days

**Examples**:
- Stop sending marketing emails (unsubscribe)
- Disable AI processing
- Disconnect bank accounts
- Disable analytics

#### 6.6 Right to Object

**What**: You can object to certain data processing
**How**: Email privacy@operate.guru
**Timeline**: Addressed within 7 days

**You Can Object To**:
- Analytics collection
- Marketing communications
- Profiling (we don't do this)
- Automated decision-making

#### 6.7 Right to Withdraw Consent

**What**: You can withdraw consent for data processing
**How**: Toggle settings in-app or email privacy@operate.guru
**Timeline**: Immediate (in-app) or within 7 days

**Consent-Based Processing**:
- AI chat (can be disabled)
- Email integration (can be disconnected)
- Bank connections (can be disconnected)
- Biometric authentication (can be disabled)
- Push notifications (can be disabled)

**Note**: Withdrawing consent may limit app functionality

#### 6.8 Right to Lodge a Complaint

**What**: You can complain to a data protection authority
**How**: Contact your local DPA (Data Protection Authority)

**EU/EEA Residents**:
- File with your national DPA
- Germany: https://www.bfdi.bund.de

**UK Residents**:
- ICO (Information Commissioner's Office): https://ico.org.uk

**California Residents**:
- California Attorney General: https://oag.ca.gov

**We Encourage**:
- Contact us first: privacy@operate.guru
- We will try to resolve issues within 7 days

---

## 7. Third-Party Data Processors

### Complete List of Service Providers

We share data with the following third-party processors:

| Service | Purpose | Data Shared | Location | Privacy Policy |
|---------|---------|-------------|----------|----------------|
| **Anthropic** | AI Processing | Chat messages, documents | USA | https://www.anthropic.com/privacy |
| **Stripe** | Payments | Payment info, email | USA | https://stripe.com/privacy |
| **Tink** | EU Banking | Bank credentials, transactions | Sweden (EU) | https://tink.com/privacy-policy/ |
| **TrueLayer** | UK Banking | Bank credentials, transactions | UK | https://truelayer.com/privacy/ |
| **Plaid** | US Banking | Bank credentials, transactions | USA | https://plaid.com/legal/ |
| **Google OAuth** | Authentication | Email, name | USA | https://policies.google.com/privacy |
| **Sentry** (optional) | Error Tracking | Crash logs (anonymized) | USA | https://sentry.io/privacy/ |
| **Vercel** (hosting) | Infrastructure | App usage (anonymized) | USA | https://vercel.com/legal/privacy-policy |
| **Cloudways** (hosting) | Infrastructure | Server logs (anonymized) | EU | https://www.cloudways.com/en/privacy.php |

**Data Processing Agreements**:
- All processors have signed DPAs (Data Processing Agreements)
- All are GDPR compliant
- All use standard contractual clauses for non-EU transfers

**Your Control**:
- Most integrations can be disabled
- Some are required for core app functionality (hosting, authentication)

---

## 8. International Data Transfers

### Data Transfer Mechanisms

**Primary Data Location**: European Union (Germany)
**Backup Location**: European Union

**Transfers to USA**:
Some third-party services are based in the USA:
- Anthropic (Claude AI)
- Stripe (payments)
- Plaid (US banking)
- Google (OAuth)

**Legal Basis for Transfers**:
1. **Standard Contractual Clauses (SCCs)**: EU Commission approved contracts
2. **Adequacy Decisions**: EU Commission approved countries (where applicable)
3. **Necessary for Contract Performance**: Banking/payment processing

**Your Rights for International Transfers**:
- Right to object to transfers outside EU
- Right to request data localization (may limit features)
- Right to information about safeguards in place

**Safeguards in Place**:
- All data encrypted in transit (TLS 1.2+)
- All data encrypted at rest (AES-256)
- Processors certified under Privacy Shield (where applicable)
- Regular audits of data processors

---

## 9. Children's Privacy

### Age Restrictions

**Minimum Age**: 18 years old

**Why**: Operate is a financial services app requiring:
- Legal capacity to enter contracts
- Bank account ownership
- Tax obligations

**Verification**:
- We do not knowingly collect data from children under 18
- Users must confirm they are 18+ during registration
- We do not verify age beyond self-declaration

**If We Discover Underage Users**:
- Account will be immediately suspended
- Parents/guardians will be notified
- Data will be deleted within 30 days
- No charges will be processed

**COPPA Compliance**: Not applicable (app not intended for children)

**Parental Rights**:
If you believe a child under 18 has created an account:
- Email: privacy@operate.guru
- We will investigate within 24 hours
- Account will be deleted if confirmed

---

## 10. Contact Information

### Data Protection Officer

**Email**: privacy@operate.guru
**Response Time**: Within 7 business days

### General Support

**Email**: support@operate.guru
**Website**: https://operate.guru/support
**Response Time**: Within 48 hours

### EU Representative

**Name**: [To be appointed if required]
**Address**: [To be provided]
**Email**: eu-rep@operate.guru

### UK Representative

**Name**: [To be appointed if required]
**Address**: [To be provided]
**Email**: uk-rep@operate.guru

**Note**: Representatives required only if we have no EU/UK establishment and process significant EU/UK data.

---

## 11. Changes to Privacy Policy

### How We Update This Policy

**Notification Methods**:
1. Email to registered users (for significant changes)
2. In-app notification
3. Update date at top of privacy policy
4. Changelog section on privacy policy page

**Significant Changes Defined**:
- New data collection types
- New third-party processors
- Changes to data retention
- Changes to user rights
- Changes to legal basis

**Your Rights on Changes**:
- Right to object to changes
- Right to delete account if you disagree
- 30-day notice period for significant changes

**Version History**:
All privacy policy versions archived at: https://operate.guru/privacy/history

---

## 12. Security Measures

### How We Protect Your Data

#### 12.1 Encryption

**In Transit**:
- TLS 1.2+ for all connections
- SSL certificate pinning on mobile apps
- Perfect forward secrecy
- No downgrade to HTTP

**At Rest**:
- AES-256 encryption for sensitive data
- Encrypted database fields for financial data
- Encrypted file storage for documents
- Platform keychain/keystore for credentials

#### 12.2 Access Controls

**Authentication**:
- OAuth 2.0 (Google)
- Optional biometric authentication
- Multi-factor authentication available
- Session timeout after inactivity

**Authorization**:
- Role-based access control
- Least privilege principle
- Regular access audits

#### 12.3 Infrastructure Security

**Hosting**:
- ISO 27001 certified data centers
- GDPR-compliant hosting (Cloudways, Vercel)
- DDoS protection
- Regular penetration testing

**Monitoring**:
- 24/7 security monitoring
- Automated threat detection
- Incident response plan
- Regular security audits

#### 12.4 Application Security

**Development Practices**:
- Secure code reviews
- Dependency vulnerability scanning
- Regular security updates
- OWASP Top 10 compliance

**Testing**:
- Automated security testing
- Manual penetration testing (annually)
- Third-party security audits

#### 12.5 Incident Response

**In Case of Data Breach**:
1. Incident detected and contained (within 24 hours)
2. Affected users notified (within 72 hours)
3. Authorities notified (if required by law)
4. Root cause analysis and remediation
5. Transparency report published

**Your Rights After Breach**:
- Detailed information about the breach
- Steps we're taking to prevent recurrence
- Free credit monitoring (if financial data exposed)
- Right to delete account

---

## 13. Cookies and Tracking

### How We Use Cookies

**Web App Only**: Mobile apps do not use cookies

**Essential Cookies** (cannot be disabled):
- Session authentication: `session_token`
- CSRF protection: `csrf_token`
- Language preference: `locale`

**Retention**: Session cookies (deleted on logout), preference cookies (1 year)

**Analytics Cookies** (optional):
- First-party usage analytics
- Anonymized, no cross-site tracking
- Can be disabled in Settings

**No Third-Party Cookies**:
- No advertising cookies
- No social media tracking pixels
- No cross-site tracking

**Your Control**:
- Browser settings to block cookies
- In-app toggle for analytics cookies
- Does not affect mobile app functionality

---

## 14. California Privacy Rights (CCPA)

### Additional Rights for California Residents

If you are a California resident, you have additional rights:

#### Right to Know
- Categories of personal information collected
- Specific pieces of personal information collected
- Sources of personal information
- Business/commercial purpose for collection
- Categories of third parties we share with

**How to Exercise**: Email privacy@operate.guru with "California Right to Know"

#### Right to Delete
- Request deletion of personal information
- Exceptions: Legal requirements, contract performance

**How to Exercise**: Settings → Delete Account or email privacy@operate.guru

#### Right to Opt-Out of Sale
**Note**: We do NOT sell personal information. This right is not applicable.

#### Right to Non-Discrimination
- We will not discriminate for exercising CCPA rights
- Same prices, services, and quality for all users

#### Authorized Agent
- You can designate an authorized agent to make requests
- Agent must provide proof of authorization

#### Response Timeline
- We will respond within 45 days
- Extension to 90 days if complex (with notification)

**Contact for CCPA Requests**: privacy@operate.guru (Subject: "CCPA Request")

---

## 15. German-Specific Privacy Information

### Additional Information for German Users

#### Datenschutzbeauftragter (Data Protection Officer)
**Email**: datenschutz@operate.guru

#### Rechtsgrundlagen (Legal Bases)
- **Art. 6(1)(a) DSGVO**: Einwilligung (Consent) - AI processing, email integration
- **Art. 6(1)(b) DSGVO**: Vertragserfüllung (Contract) - Account management, core features
- **Art. 6(1)(c) DSGVO**: Rechtliche Verpflichtung (Legal obligation) - Tax document retention
- **Art. 6(1)(f) DSGVO**: Berechtigtes Interesse (Legitimate interest) - Analytics, security

#### Speicherdauer (Retention Periods)
- Geschäftsunterlagen: 10 Jahre (§147 AO)
- Buchungsbelege: 10 Jahre (§147 AO)
- Handelsrechtliche Unterlagen: 6 Jahre (§257 HGB)

#### Ihre Rechte nach DSGVO
- Auskunftsrecht (Art. 15 DSGVO)
- Berichtigungsrecht (Art. 16 DSGVO)
- Löschungsrecht (Art. 17 DSGVO)
- Einschränkungsrecht (Art. 18 DSGVO)
- Datenübertragbarkeit (Art. 20 DSGVO)
- Widerspruchsrecht (Art. 21 DSGVO)

#### Aufsichtsbehörde
**Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)**
- Website: https://www.bfdi.bund.de
- Email: poststelle@bfdi.bund.de

---

## Integration Instructions

### How to Add These Sections to Your Privacy Policy

1. **Review existing privacy policy** at https://operate.guru/privacy
2. **Merge these sections** with existing content
3. **Ensure consistency** across all sections
4. **Add effective date** at the top
5. **Publish updated policy**
6. **Notify users** of significant changes
7. **Update App Store/Google Play** privacy declarations

### Recommended Privacy Policy Structure

```
1. Introduction
2. Data Controller Information
3. Data Collection (use Section 1-4 above)
4. How We Use Your Data
5. AI Processing Disclosure (Section 1)
6. Banking Data Handling (Section 2)
7. Payment Processing (Section 3)
8. Biometric Data (Section 4)
9. Data Sharing (Section 7)
10. International Transfers (Section 8)
11. Data Retention (Section 5)
12. Your Rights (Section 6)
13. Security (Section 12)
14. Cookies (Section 13)
15. Children's Privacy (Section 9)
16. California Privacy Rights (Section 14)
17. German Privacy Information (Section 15)
18. Changes to Policy (Section 11)
19. Contact Information (Section 10)
```

---

## Compliance Checklist

Before publishing:

- [ ] All sections above integrated into public privacy policy
- [ ] Effective date added
- [ ] Privacy policy URL live: https://operate.guru/privacy
- [ ] Privacy policy URL added to App Store Connect
- [ ] Privacy policy URL added to Google Play Console
- [ ] All third-party privacy policy links verified
- [ ] Contact emails functional (privacy@, support@, datenschutz@)
- [ ] Data deletion mechanism tested
- [ ] Data export mechanism tested
- [ ] Legal review completed (recommended)
- [ ] German translation prepared (if targeting German users)

---

**Status**: Complete and ready for publication
**Last Updated**: 2025-12-07
**Agent**: FORGE
