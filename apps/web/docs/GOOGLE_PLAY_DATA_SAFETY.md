# Google Play Data Safety Form - Operate App

## Overview

This document provides **exact answers** for Google Play's Data Safety questionnaire. Copy these responses directly into the Google Play Console during app submission.

**App ID**: `guru.operate.app`
**Last Updated**: 2025-12-07
**Review Status**: Ready for submission

---

## Quick Reference

| Category | Collected? | Shared? | Security |
|----------|------------|---------|----------|
| Location | NO | NO | N/A |
| Personal Info | YES | NO | Encrypted |
| Financial Info | YES | NO | Encrypted |
| Health/Fitness | NO | NO | N/A |
| Messages | YES (Chat) | YES (Claude AI) | Encrypted |
| Photos/Videos | NO | NO | N/A |
| Audio Files | NO | NO | N/A |
| Files/Docs | YES | NO | Encrypted |
| Calendar | NO | NO | N/A |
| Contacts | NO | NO | N/A |
| App Activity | YES | NO | Encrypted |
| Web Browsing | NO | NO | N/A |
| App Info/Performance | YES | NO | Encrypted |
| Device/IDs | YES | NO | Encrypted |

---

## Section 1: Data Collection and Security

### Does your app collect or share user data?
**Answer**: YES

### Is all of the user data collected by your app encrypted in transit?
**Answer**: YES
- All data transmitted using TLS 1.2+
- SSL certificate pinning implemented
- HTTPS only, no HTTP fallback

### Do you provide a way for users to request that their data is deleted?
**Answer**: YES
- In-app account deletion
- Email support: support@operate.guru
- GDPR-compliant data deletion within 30 days

---

## Section 2: Data Types Collected

### LOCATION (Not Collected)
- [ ] Approximate location
- [ ] Precise location

**Answer**: We do NOT collect location data

---

### PERSONAL INFO (Collected)

#### Name
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Required for account creation
- **Purpose**: App functionality, Account management
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES

#### Email address
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Required for account creation
- **Purpose**: App functionality, Account management, Communications
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES

#### User IDs
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Required (internal UUID)
- **Purpose**: App functionality, Account management
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES (anonymized upon account deletion)

#### Other personal info
- [ ] Address
- [ ] Phone number
- [ ] Race and ethnicity
- [ ] Political or religious beliefs
- [ ] Sexual orientation
- [ ] Other info

**Answer**: We do NOT collect address, phone, race, religion, sexual orientation, or other sensitive personal info

---

### FINANCIAL INFO (Collected)

#### User payment info
- [x] Collected
- [x] Shared with third parties
- **Shared with**: Stripe (payment processor)
- **Optional or Required**: Optional (only if user subscribes)
- **Purpose**: App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO (Stripe handles storage)
  - User can request deletion: YES
- **Note**: Credit card details handled directly by Stripe, never stored on our servers

#### Purchase history
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Optional (only if user makes purchases)
- **Purpose**: App functionality, Account management
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES

#### Credit score
- [ ] Collected

**Answer**: We do NOT collect credit scores

#### Other financial info
- [x] Collected
- [x] Shared with third parties
- **What**: Bank account balances, transaction history, invoices, receipts, tax documents
- **Shared with**:
  - Tink (EU/UK banking aggregation)
  - TrueLayer (EU/UK open banking)
  - Plaid (US banking - sandbox only)
  - Anthropic Claude AI (for invoice/receipt processing)
- **Optional or Required**: Optional (only if user connects bank or uploads documents)
- **Purpose**: App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES
- **Retention**: Tax documents retained for 10 years (legal requirement in Germany/EU)

---

### HEALTH AND FITNESS (Not Collected)
- [ ] Health info
- [ ] Fitness info

**Answer**: We do NOT collect health or fitness data

---

### MESSAGES (Collected)

#### Emails
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Optional (only if user enables email integration)
- **Purpose**: App functionality (extract invoices from emails)
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES
- **Note**: Email content processed locally, not shared with third parties

#### SMS or MMS
- [ ] Collected

**Answer**: We do NOT collect SMS/MMS

#### Other in-app messages
- [x] Collected
- [x] Shared with third parties
- **What**: Chat messages with AI assistant
- **Shared with**: Anthropic (Claude AI API)
- **Optional or Required**: Optional (only if user uses chat feature)
- **Purpose**: App functionality (AI-powered assistance)
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES (locally stored chat history)
  - Ephemeral (Claude API side): YES (not retained by Anthropic)
  - User can request deletion: YES
- **Note**: User consents to AI processing before using chat

---

### PHOTOS AND VIDEOS (Not Collected)
- [ ] Photos
- [ ] Videos

**Answer**: We do NOT collect photos or videos (documents only)

---

### AUDIO FILES (Not Collected)
- [ ] Voice or sound recordings
- [ ] Music files
- [ ] Other audio files

**Answer**: We do NOT collect audio files

---

### FILES AND DOCS (Collected)

#### Files and docs
- [x] Collected
- [x] Shared with third parties
- **What**: Invoices, receipts, contracts, financial documents (PDF, images)
- **Shared with**: Anthropic Claude AI (for OCR and data extraction)
- **Optional or Required**: Optional (only if user uploads documents)
- **Purpose**: App functionality (automated bookkeeping)
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES
- **Retention**: Tax-related documents retained for 10 years (legal requirement)

---

### CALENDAR (Not Collected)
- [ ] Calendar events

**Answer**: We do NOT collect calendar data

---

### CONTACTS (Not Collected)
- [ ] Contacts

**Answer**: We do NOT collect contacts

---

### APP ACTIVITY (Collected)

#### App interactions
- [x] Collected
- [ ] Shared with third parties
- **What**: Feature usage, button clicks, page views
- **Optional or Required**: Required (to improve app functionality)
- **Purpose**: Analytics, App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO (retained 90 days)
  - User can request deletion: YES
- **Note**: First-party analytics only, not shared with advertising networks

#### In-app search history
- [x] Collected
- [ ] Shared with third parties
- **What**: Document search queries (within user's own data)
- **Optional or Required**: Optional (only if user uses search)
- **Purpose**: App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES

#### Installed apps
- [ ] Collected

**Answer**: We do NOT collect list of installed apps

#### Other user-generated content
- [x] Collected
- [ ] Shared with third parties
- **What**: Custom categories, tags, notes, annotations
- **Optional or Required**: Optional
- **Purpose**: App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES

#### Other actions
- [ ] Collected

**Answer**: We do NOT collect other user actions beyond those listed

---

### WEB BROWSING (Not Collected)
- [ ] Web browsing history

**Answer**: We do NOT collect web browsing history

---

### APP INFO AND PERFORMANCE (Collected)

#### Crash logs
- [x] Collected
- [ ] Shared with third parties
- **Optional or Required**: Optional (can be disabled)
- **Purpose**: App functionality (bug fixes)
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO (retained 90 days)
  - User can request deletion: YES
- **Note**: Anonymized, no personally identifiable information included

#### Diagnostics
- [x] Collected
- [ ] Shared with third parties
- **What**: App performance metrics, API response times, memory usage
- **Optional or Required**: Required (to maintain app quality)
- **Purpose**: Analytics, App functionality
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO (retained 90 days)
  - User can request deletion: YES
- **Note**: Anonymized performance data

#### Other app performance data
- [ ] Collected

**Answer**: We do NOT collect other performance data beyond crash logs and diagnostics

---

### DEVICE OR OTHER IDs (Collected)

#### Device or other IDs
- [x] Collected
- [ ] Shared with third parties
- **What**: Device push notification token (for notifications only)
- **Optional or Required**: Optional (only if user enables notifications)
- **Purpose**: App functionality (push notifications)
- **Data handling**:
  - Encrypted in transit: YES
  - Encrypted at rest: YES
  - Ephemeral (not stored): NO
  - User can request deletion: YES
- **Note**: Only used for delivering notifications, not for tracking or advertising

---

## Section 3: Data Sharing

### Do you share any user data with third parties?
**Answer**: YES (see details below)

### Third-Party Data Sharing Details

#### 1. Anthropic (Claude AI)
- **Data shared**: Chat messages, uploaded documents (invoices, receipts)
- **Purpose**: AI-powered document processing and chat assistance
- **User consent**: Required before first use
- **Data retention by third party**: Not retained (per Anthropic's policy)
- **Link to third-party privacy policy**: https://www.anthropic.com/privacy

#### 2. Stripe
- **Data shared**: Payment information, subscription details
- **Purpose**: Payment processing
- **User consent**: Implicit when subscribing
- **Data retention by third party**: Per Stripe's retention policy
- **Link to third-party privacy policy**: https://stripe.com/privacy

#### 3. Tink (EU/UK Banking)
- **Data shared**: Bank connection credentials, transaction data
- **Purpose**: Open banking integration
- **User consent**: Required before bank connection
- **Data retention by third party**: Per Tink's retention policy
- **Link to third-party privacy policy**: https://tink.com/privacy-policy/

#### 4. TrueLayer (EU/UK Banking)
- **Data shared**: Bank connection credentials, transaction data
- **Purpose**: Open banking integration
- **User consent**: Required before bank connection
- **Data retention by third party**: Per TrueLayer's retention policy
- **Link to third-party privacy policy**: https://truelayer.com/privacy/

#### 5. Plaid (US Banking - Sandbox)
- **Data shared**: Bank connection credentials, transaction data
- **Purpose**: Banking integration (sandbox environment only)
- **User consent**: Required before bank connection
- **Data retention by third party**: Per Plaid's retention policy
- **Link to third-party privacy policy**: https://plaid.com/legal/

---

## Section 4: Security Practices

### Data Encryption
- **In transit**: YES - TLS 1.2+ with certificate pinning
- **At rest**: YES - AES-256 encryption for sensitive data

### Secure Authentication
- Google OAuth 2.0
- Biometric authentication (fingerprint, face unlock) - optional
- Secure storage using platform keychain

### Regular Security Updates
- Monthly dependency updates
- Quarterly security audits
- Immediate patching of critical vulnerabilities

### Compliance
- GDPR compliant
- PSD2 compliant (for EU banking)
- German tax law compliant (document retention)

---

## Section 5: Data Deletion

### How users can request deletion
1. **In-app**: Settings → Account → Delete Account
2. **Email**: support@operate.guru with subject "Delete My Data"
3. **Web**: https://operate.guru/account/delete

### Deletion timeline
- User data: Deleted within 30 days
- Tax documents: Retained for 10 years (legal requirement), then deleted
- Anonymized analytics: Deleted within 90 days
- Backups: Purged within 90 days

### What gets deleted
- Account credentials
- Personal information
- Financial data (except tax records)
- Uploaded documents
- Chat history
- Usage analytics

### What is NOT deleted (legal requirements)
- Tax-related documents (invoices, receipts) - retained 10 years
- Payment records required for accounting - retained 7 years
- Anonymized crash logs for app stability

---

## Section 6: Special Permissions

### Android Permissions Required

| Permission | Purpose | Optional? |
|------------|---------|-----------|
| INTERNET | Connect to API | Required |
| USE_BIOMETRIC | Face/fingerprint login | Optional |
| POST_NOTIFICATIONS | Push notifications | Optional |
| READ_EXTERNAL_STORAGE | Upload documents | Optional |
| CAMERA | Scan receipts | Optional |

**Note**: All permissions are requested at runtime with clear explanations

---

## Section 7: Privacy Policy

**Privacy Policy URL**: https://operate.guru/privacy

**Support/Contact URL**: https://operate.guru/support

**Email**: support@operate.guru

---

## Section 8: Target Audience

### Primary Audience
- Entrepreneurs and small business owners
- Freelancers
- Self-employed professionals

### Age Restriction
- **Minimum age**: 18+ (financial app)
- **COPPA compliant**: Not intended for children

---

## Submission Checklist

Before submitting to Google Play:

- [ ] All data types listed above are accurately declared
- [ ] Third-party sharing is disclosed
- [ ] Privacy policy URL is live and accurate
- [ ] Data deletion process is functional
- [ ] Encryption is verified (TLS + at-rest)
- [ ] Permissions match actual app behavior
- [ ] App tested on multiple Android versions
- [ ] Screenshots prepared (see STORE_SUBMISSION_CHECKLIST.md)
- [ ] App description mentions data privacy
- [ ] Contact information is correct

---

## Important Notes

### Google Play Review Tips
1. **Be accurate**: Google tests apps and rejects for false claims
2. **Be complete**: Missing declarations cause rejection
3. **Be transparent**: Users trust honest apps
4. **Match privacy policy**: Inconsistencies cause rejection

### Common Rejection Reasons
- Undeclared data collection
- Missing encryption claims
- Incorrect sharing declarations
- Privacy policy mismatch
- Missing deletion mechanism

### Post-Submission
- Monitor Google Play Console for review feedback
- Respond to user privacy concerns promptly
- Update data safety form if app features change
- Annual review recommended

---

**Status**: Ready for Google Play submission
**Last Reviewed**: 2025-12-07
**Next Review**: Before any major feature updates
