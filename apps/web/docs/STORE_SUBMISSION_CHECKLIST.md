# App Store Submission Checklist - Operate App

## Overview

This is your **complete pre-submission checklist** for both iOS App Store and Google Play Store. Complete all items before submitting to avoid rejections.

**App Name**: Operate
**App ID**: guru.operate.app
**Category**: Finance / Business
**Last Updated**: 2025-12-07

---

## Quick Status

| Store | Status | Ready? |
|-------|--------|--------|
| iOS App Store | Documentation complete | ⏳ Pending build |
| Google Play Store | Documentation complete | ⏳ Pending build |

---

## Table of Contents

1. [iOS App Store Checklist](#ios-app-store-checklist)
2. [Google Play Store Checklist](#google-play-store-checklist)
3. [Shared Requirements](#shared-requirements-both-stores)
4. [Assets and Media](#assets-and-media)
5. [App Descriptions](#app-descriptions)
6. [Testing Requirements](#testing-requirements)
7. [Compliance and Legal](#compliance-and-legal)

---

# iOS App Store Checklist

## Technical Requirements

### Build and Configuration

- [ ] Xcode project builds without errors or warnings
- [ ] App runs on iOS 15.0+ (minimum deployment target)
- [ ] App tested on iPhone SE (smallest screen)
- [ ] App tested on iPhone 15 Pro Max (largest screen)
- [ ] App tested on iPad (if supporting iPad)
- [ ] App supports portrait and landscape orientations (or declared portrait-only)
- [ ] Launch screen configured correctly
- [ ] App icon includes all required sizes (20pt, 29pt, 40pt, 58pt, 60pt, 76pt, 80pt, 87pt, 120pt, 152pt, 167pt, 180pt, 1024pt)
- [ ] App icon does NOT include alpha channel
- [ ] Bundle ID matches: `guru.operate.app`
- [ ] Version number follows semantic versioning (e.g., 1.0.0)
- [ ] Build number increments with each upload
- [ ] Code signing certificate is valid (not expired)
- [ ] Provisioning profile is correct (App Store distribution)

### Privacy and Permissions

- [ ] Privacy manifest file exists: `ios/App/PrivacyInfo.xcprivacy`
- [ ] Privacy manifest is complete (see PRIVACY_MANIFEST.md)
- [ ] All privacy-sensitive APIs declared with reasons
- [ ] NSUserTrackingUsageDescription NOT present (we don't track)
- [ ] NSCameraUsageDescription present (if using camera for receipt scanning)
- [ ] NSPhotoLibraryUsageDescription present (if accessing photos)
- [ ] NSFaceIDUsageDescription present: "Unlock Operate with Face ID for quick and secure access"
- [ ] Biometric permissions requested at appropriate time (not on launch)
- [ ] Push notification permissions requested with clear explanation

### App Functionality

- [ ] App launches successfully on all supported devices
- [ ] No crashes on launch
- [ ] All main features are functional
- [ ] Google OAuth login works
- [ ] AI chat feature works (with consent)
- [ ] Bank connection works (Tink, TrueLayer)
- [ ] Document upload works
- [ ] Subscription payment works (Stripe test mode)
- [ ] Biometric authentication works (Face ID/Touch ID)
- [ ] Settings page accessible
- [ ] Account deletion works
- [ ] App handles poor network connectivity gracefully
- [ ] App handles no network connectivity gracefully
- [ ] Loading states are clear
- [ ] Error messages are user-friendly

### Performance

- [ ] App launches in < 3 seconds
- [ ] No memory leaks (tested with Instruments)
- [ ] Battery usage is reasonable
- [ ] Network requests are optimized
- [ ] Images are optimized for mobile
- [ ] No excessive data usage

### Content and Design

- [ ] App follows iOS Human Interface Guidelines
- [ ] App supports Dark Mode (or has valid reason not to)
- [ ] Text is readable on all screen sizes
- [ ] Touch targets are at least 44x44 points
- [ ] Navigation is intuitive
- [ ] No placeholder content (lorem ipsum, test data)
- [ ] All UI text is properly localized (English + German if applicable)

---

## App Store Connect Configuration

### App Information

- [ ] App name: "Operate" (available and trademarked if applicable)
- [ ] Subtitle (max 30 chars): "AI-Powered Bookkeeping"
- [ ] Bundle ID registered: `guru.operate.app`
- [ ] SKU: [Your internal tracking code]
- [ ] Primary language: English
- [ ] Secondary language: German (if localizing)
- [ ] Category: Finance
- [ ] Secondary category: Business (optional)

### Pricing and Availability

- [ ] Price tier selected (Free + In-App Purchases)
- [ ] Availability: All countries (or selected countries)
- [ ] Pre-order option configured (if applicable)

### Privacy

#### Privacy Policy
- [ ] Privacy policy URL: https://operate.guru/privacy
- [ ] Privacy policy is live and accessible
- [ ] Privacy policy covers all data collection
- [ ] Privacy policy URL matches what's in app

#### App Privacy Questions
- [ ] All privacy questions answered (see APP_STORE_PRIVACY.md)
- [ ] Privacy labels match privacy manifest exactly
- [ ] No tracking declared (correct for our app)
- [ ] Data collection types accurately declared
- [ ] Data sharing with third parties disclosed
- [ ] All purposes for data collection listed

### Age Rating

- [ ] Age rating questionnaire completed
- [ ] Recommended: 4+ (no objectionable content)
- [ ] Minimum age: 18+ (financial services requirement)
- [ ] Gambling: No
- [ ] Unrestricted web access: No
- [ ] Frequent/Intense content: All "None"

### App Review Information

- [ ] Contact information (first name, last name, phone, email)
- [ ] Demo account credentials for reviewers:
  - [ ] Username: [Create test account]
  - [ ] Password: [Create test password]
  - [ ] Include in notes: "Test banking uses sandbox mode"
- [ ] Notes for reviewer:
  ```
  Thank you for reviewing Operate. A few notes:

  1. AI Chat: Requires consent on first use. Test by clicking chat icon.
  2. Banking: Uses Tink/TrueLayer sandbox. No real bank required.
  3. Biometric: Optional feature, can test with Face ID/Touch ID if enabled.
  4. Subscriptions: Test mode enabled. No real charges.

  Test account: [username]/[password]

  Privacy: All declared data types are accurate. Privacy manifest included.
  ```
- [ ] Attachment: Demo video (if complex features)
- [ ] App uses encryption: YES (provide export compliance)

### Export Compliance

- [ ] App uses encryption: YES
- [ ] Encryption is limited to: HTTPS (standard encryption)
- [ ] No export compliance documentation required (standard HTTPS)
- [ ] Declaration completed in App Store Connect

---

## App Store Screenshots

### Required Sizes

All screenshots must be actual app screenshots (no mockups).

#### iPhone 6.9" Display (iPhone 15 Pro Max) - REQUIRED
- [ ] 1 screenshot minimum, 10 maximum
- [ ] Size: 1320 x 2868 pixels (portrait) or 2868 x 1320 (landscape)
- [ ] Screenshots show main features
- [ ] No device bezels in screenshot (just app UI)

#### iPhone 6.7" Display (iPhone 14 Pro Max) - Optional but recommended
- [ ] Size: 1290 x 2796 pixels (portrait) or 2796 x 1290 (landscape)

#### iPhone 5.5" Display (iPhone 8 Plus) - Optional
- [ ] Size: 1242 x 2208 pixels (portrait) or 2208 x 1242 (landscape)

#### iPad Pro (6th Gen) 12.9" - Required if iPad supported
- [ ] Size: 2048 x 2732 pixels (portrait) or 2732 x 2048 (landscape)

### Screenshot Content Recommendations

Screenshot 1: Home Dashboard
- [ ] Shows transaction overview
- [ ] Highlights AI chat button
- [ ] Professional, clean design

Screenshot 2: AI Chat in Action
- [ ] Shows conversation with AI
- [ ] Example financial question/answer
- [ ] Consent banner visible (if first time)

Screenshot 3: Bank Connection
- [ ] Shows connected bank accounts
- [ ] Transaction import feature
- [ ] Security badges visible

Screenshot 4: Document Upload
- [ ] Invoice/receipt upload
- [ ] OCR extraction results
- [ ] Categorization feature

Screenshot 5: Reports
- [ ] Financial dashboard
- [ ] Charts and graphs
- [ ] Tax preparation features

**Tips**:
- Use real data (anonymized)
- Consistent font sizes (readable)
- Status bar shows 9:41 AM, full battery, full signal
- Light mode + Dark mode versions (optional but nice)

---

## App Preview Video (Optional but Recommended)

- [ ] Duration: 15-30 seconds
- [ ] Format: .mov or .mp4
- [ ] Size: Same as screenshot dimensions
- [ ] Shows app in action (screen recording)
- [ ] No audio narration (text overlays only)
- [ ] Highlights key features: AI chat, bank sync, document scan

---

## App Description

### Short Description (Promotional Text)
Max 170 characters, editable without new version:

```
AI-powered bookkeeping for entrepreneurs. Connect banks, scan receipts, chat with AI. German tax filing included. Try free!
```

- [ ] Short description written
- [ ] Under 170 characters
- [ ] Highlights AI, banking, tax features

### Full Description
Max 4000 characters:

```
OPERATE - AI-POWERED BOOKKEEPING MADE EFFORTLESS

Stop wrestling with spreadsheets. Operate uses artificial intelligence to automate your bookkeeping, so you can focus on growing your business.

✨ KEY FEATURES

🤖 AI CHAT ASSISTANT
Ask questions, get instant answers. Our AI understands financial jargon and provides personalized advice.

🏦 AUTOMATIC BANK SYNC
Connect EU/UK/US banks via open banking. Transactions imported and categorized automatically.

📄 SMART DOCUMENT SCANNING
Snap a photo of receipts/invoices. AI extracts data instantly. No manual entry.

🇩🇪 GERMAN TAX FILING
ELSTER integration for seamless tax returns. Quarterly VAT, annual income tax—done in clicks.

💰 CASH FLOW INSIGHTS
Real-time financial dashboard. Know exactly where your money goes.

🔒 BANK-LEVEL SECURITY
AES-256 encryption, biometric unlock, SSL pinning. Your data is Fort Knox secure.

📊 CUSTOM REPORTS
Generate profit/loss, balance sheets, expense reports instantly.

---

WHO IS OPERATE FOR?

✓ Freelancers juggling multiple clients
✓ Small business owners tired of bookkeeping
✓ Entrepreneurs scaling their companies
✓ Anyone who wants financial clarity without the hassle

---

HOW IT WORKS

1. CONNECT YOUR BANK
   Link accounts via Tink or TrueLayer. Transactions sync automatically.

2. UPLOAD DOCUMENTS
   Scan receipts with your camera. AI categorizes everything.

3. CHAT WITH AI
   Ask "What's my profit this month?" Get instant answers.

4. FILE TAXES
   German users: One-click ELSTER submissions. No accountant needed.

---

PRIVACY & SECURITY

• No tracking, no ads, no data selling
• GDPR compliant
• End-to-end encryption
• Biometric authentication
• Your data stays yours

Full privacy policy: https://operate.guru/privacy

---

PRICING

FREE TIER
• Connect 1 bank account
• 50 transactions/month
• Basic AI chat
• Document storage

PRO TIER ($19/month)
• Unlimited bank accounts
• Unlimited transactions
• Advanced AI features
• Priority support
• German tax filing
• Cash flow predictions

---

SUPPORT

Questions? We're here to help.
Email: support@operate.guru
Web: https://operate.guru/support

---

Download Operate today and reclaim hours spent on bookkeeping. Your financial clarity starts now.
```

- [ ] Full description written
- [ ] Under 4000 characters
- [ ] Clear value proposition
- [ ] Highlights security and privacy
- [ ] Pricing information included
- [ ] Support contact included
- [ ] No competitor mentions
- [ ] No misleading claims

### Keywords (Max 100 characters)

```
bookkeeping,accounting,tax,invoices,receipts,AI,business,finance,ELSTER,banking
```

- [ ] Keywords selected (comma-separated)
- [ ] Under 100 characters total
- [ ] Relevant to app features
- [ ] High search volume keywords prioritized

### Support URL

- [ ] URL: https://operate.guru/support
- [ ] Page is live and functional
- [ ] Includes FAQs
- [ ] Contact form or email

### Marketing URL (Optional)

- [ ] URL: https://operate.guru
- [ ] Marketing page is live
- [ ] Shows app features
- [ ] Clear call-to-action

---

## In-App Purchases

If offering subscriptions via Stripe:

- [ ] In-App Purchase configured in App Store Connect (if using Apple IAP)
- [ ] Product ID matches code
- [ ] Pricing tiers selected
- [ ] Localized descriptions added
- [ ] Review information includes subscription details

**Note**: If using Stripe (web-based), ensure compliance with App Store guidelines on external payment processing.

---

## Final Pre-Submission Checklist (iOS)

- [ ] All technical requirements met
- [ ] Privacy manifest complete and accurate
- [ ] Screenshots uploaded (all required sizes)
- [ ] App description polished and accurate
- [ ] Privacy labels match manifest
- [ ] Age rating set correctly (4+, with 18+ restriction)
- [ ] Demo account credentials provided
- [ ] Export compliance declared
- [ ] Build uploaded via Xcode or Transporter
- [ ] Build processing complete (wait 30-60 minutes)
- [ ] Build selected for submission
- [ ] Final review before clicking "Submit for Review"

---

# Google Play Store Checklist

## Technical Requirements

### Build and Configuration

- [ ] Android Studio project builds without errors
- [ ] App runs on Android 7.0+ (API 24+)
- [ ] App tested on small screen (4.7")
- [ ] App tested on large screen (6.7"+)
- [ ] App tested on tablet (if supporting tablets)
- [ ] Adaptive icon provided (108 x 108 dp, 72dp safe zone)
- [ ] App icon includes all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Application ID matches: `guru.operate.app`
- [ ] Version name follows semantic versioning (e.g., 1.0.0)
- [ ] Version code increments with each upload (e.g., 1, 2, 3...)
- [ ] App is signed with release keystore (NOT debug keystore)
- [ ] Keystore backed up securely

### Privacy and Permissions

- [ ] Data safety form completed (see GOOGLE_PLAY_DATA_SAFETY.md)
- [ ] All permissions declared in manifest have valid use cases
- [ ] Runtime permissions requested with clear explanations
- [ ] No unnecessary permissions requested
- [ ] Permission usage matches data safety declarations

### App Functionality

- [ ] App launches successfully on all supported devices
- [ ] No crashes on launch
- [ ] All main features functional
- [ ] Google OAuth login works
- [ ] AI chat works
- [ ] Bank connection works
- [ ] Document upload works
- [ ] Subscription payment works
- [ ] Biometric authentication works (fingerprint)
- [ ] Settings page accessible
- [ ] Account deletion works
- [ ] App handles offline mode gracefully
- [ ] Back button works correctly throughout app
- [ ] Share functionality works (if applicable)

### Performance

- [ ] App launches in < 5 seconds
- [ ] No ANRs (Application Not Responding)
- [ ] Smooth scrolling (60 fps)
- [ ] Battery usage is reasonable
- [ ] App size is optimized (APK < 100MB ideal)

### Content and Design

- [ ] App follows Material Design guidelines (recommended)
- [ ] App supports dark theme (recommended)
- [ ] Text is readable on all screen sizes
- [ ] Touch targets are at least 48x48 dp
- [ ] Navigation is intuitive
- [ ] No placeholder content
- [ ] All text is localized (English + German if applicable)

---

## Google Play Console Configuration

### Store Listing

#### App Details

- [ ] App name: "Operate" (max 30 characters)
- [ ] Short description (max 80 characters):
  ```
  AI bookkeeping for entrepreneurs. Bank sync, receipt scan, tax filing.
  ```
- [ ] Full description (max 4000 characters): See iOS description, adapt if needed
- [ ] App icon: 512 x 512 pixels, PNG, no transparency
- [ ] Application ID: `guru.operate.app`
- [ ] Category: Business
- [ ] Tags: Accounting, Finance, Productivity (up to 5)

#### Contact Details

- [ ] Email: support@operate.guru
- [ ] Phone: [Your support phone number]
- [ ] Website: https://operate.guru
- [ ] Privacy policy URL: https://operate.guru/privacy

#### Graphics

**Feature Graphic** (Required)
- [ ] Size: 1024 x 500 pixels
- [ ] Format: PNG or JPEG
- [ ] No transparency
- [ ] Content: App branding, key features

**Screenshots** (Required)
- [ ] Minimum 2, maximum 8
- [ ] Min dimension: 320 pixels
- [ ] Max dimension: 3840 pixels
- [ ] Portrait: 16:9 or 9:16 aspect ratio
- [ ] Landscape: 16:9 or 9:16 aspect ratio

Screenshot recommendations:
1. Home dashboard with transactions
2. AI chat conversation
3. Bank connection screen
4. Document scanner in action
5. Financial reports
6. Settings and account management

**Promotional Video** (Optional)
- [ ] YouTube video URL
- [ ] Duration: 30 seconds - 2 minutes
- [ ] Shows app features

**Phone Screenshots** (Required)
- [ ] 2-8 screenshots
- [ ] JPEG or 24-bit PNG (no alpha)
- [ ] Minimum side: 320px
- [ ] Maximum side: 3840px

**7-inch Tablet Screenshots** (Optional but recommended)
- [ ] Same format as phone

**10-inch Tablet Screenshots** (Optional but recommended)
- [ ] Same format as phone

---

### Store Settings

- [ ] App category: Business
- [ ] Application type: Applications
- [ ] Free or paid: Free (with In-App Purchases)
- [ ] Pricing: Free
- [ ] Distributed countries: Select all or specific countries
- [ ] Designed for families: No (financial app)
- [ ] Contains ads: No

---

### Data Safety

Complete all sections accurately (see GOOGLE_PLAY_DATA_SAFETY.md):

- [ ] Data collection: YES
- [ ] Data sharing: YES (with third parties)
- [ ] Data encryption in transit: YES
- [ ] Data deletion option: YES
- [ ] All data types declared
- [ ] All purposes declared
- [ ] All third-party sharing disclosed

---

### Content Rating

- [ ] Content rating questionnaire completed
- [ ] Answers based on Operate's actual content:
  - Violence: None
  - Sexual content: None
  - Profanity: None
  - Controlled substances: None
  - Gambling: None
  - User interactions: Yes (chat with AI)
  - Shares user location: No
  - Shares personal info: No (privacy-protected)

Expected rating: Everyone (ESRB: E), PEGI 3, etc.

---

### App Content

#### Privacy Policy
- [ ] Privacy policy URL: https://operate.guru/privacy

#### App Access
- [ ] Special access required: YES
- [ ] Provide demo credentials:
  ```
  Username: demo@operate.guru
  Password: [test password]

  Notes:
  - Banking uses sandbox mode (no real bank needed)
  - AI chat requires consent on first use
  - Stripe subscriptions in test mode
  ```

#### Ads Declaration
- [ ] Contains ads: NO

#### Target Audience and Content
- [ ] Target age group: 18+
- [ ] Store listing content rating: General Audiences

#### News Apps
- [ ] Is this a news app: NO

#### COVID-19 Contact Tracing and Status Apps
- [ ] Is this a COVID app: NO

#### Data Safety
- [ ] Complete data safety form (see GOOGLE_PLAY_DATA_SAFETY.md)

#### Government Apps
- [ ] Is government app: NO

#### Financial Features
- [ ] Offers financial services: YES
- [ ] Type: Bookkeeping, accounting software
- [ ] Regulated: Depends on jurisdiction
- [ ] Provide: Privacy policy, terms of service, support contact

---

## App Signing

### Play App Signing

- [ ] Enroll in Play App Signing (recommended)
- [ ] Upload key uploaded to Google Play
- [ ] App signing key managed by Google
- [ ] Keystore backed up locally (for other platforms)

### Upload Certificate

- [ ] Release keystore created
- [ ] Upload certificate fingerprint added to Firebase (if using)
- [ ] Upload certificate fingerprint added to OAuth providers

---

## Release Management

### Testing

Before production release:

- [ ] Internal testing track created
- [ ] Internal testers added (your email)
- [ ] App uploaded to internal track
- [ ] Internal testers can install and test
- [ ] No critical bugs found in internal testing

Optional:
- [ ] Closed testing track (alpha)
- [ ] Open testing track (beta)
- [ ] Pre-launch report reviewed (automated testing by Google)

### Production Release

- [ ] Release name: "Launch" (or version number)
- [ ] Release notes (What's new):
  ```
  Initial release of Operate!

  • AI-powered bookkeeping assistant
  • Automatic bank transaction sync (EU/UK/US)
  • Smart receipt and invoice scanning
  • German tax filing (ELSTER integration)
  • Bank-level security with biometric unlock
  • Real-time financial insights

  Questions? support@operate.guru
  ```
- [ ] Rollout percentage: Start with 10%, increase gradually
- [ ] Countries: Select target countries
- [ ] Review release before publish

---

## Final Pre-Submission Checklist (Google Play)

- [ ] All technical requirements met
- [ ] Data safety form 100% complete
- [ ] Screenshots uploaded (phone + tablet)
- [ ] Feature graphic uploaded
- [ ] App description polished
- [ ] Privacy policy URL live
- [ ] Demo credentials provided
- [ ] Content rating completed
- [ ] App signed with release keystore
- [ ] AAB (Android App Bundle) uploaded
- [ ] Release notes written
- [ ] Final review before clicking "Send for Review"

---

# Shared Requirements (Both Stores)

## Legal Documents

### Privacy Policy
- [ ] URL: https://operate.guru/privacy
- [ ] Covers all data collection practices
- [ ] Lists all third-party services
- [ ] Explains user rights (GDPR, CCPA)
- [ ] Includes contact information
- [ ] Updated within last 12 months
- [ ] Matches app store privacy declarations
- [ ] Available in English (+ German if targeting)

### Terms of Service
- [ ] URL: https://operate.guru/terms
- [ ] Covers app usage rights
- [ ] Defines prohibited activities
- [ ] Explains account termination
- [ ] Includes dispute resolution
- [ ] Includes limitation of liability
- [ ] Reviewed by legal professional (recommended)

### Support Page
- [ ] URL: https://operate.guru/support
- [ ] Contact email: support@operate.guru
- [ ] FAQ section
- [ ] Response time commitment
- [ ] Links to documentation

---

## Branding and Assets

### App Icon
- [ ] Design is unique and memorable
- [ ] No text (or minimal, readable)
- [ ] Works at all sizes
- [ ] No transparency (Android)
- [ ] Consistent across platforms
- [ ] Trademark cleared (if applicable)

### Marketing Assets
- [ ] Logo (vector + PNG)
- [ ] Brand colors defined
- [ ] Screenshots consistent style
- [ ] Feature graphic eye-catching

---

## Testing and QA

### Functionality Testing
- [ ] All features tested end-to-end
- [ ] Edge cases tested (empty states, errors)
- [ ] Network conditions tested (slow, offline)
- [ ] Multiple account types tested
- [ ] Payment flow tested (test mode)
- [ ] Data deletion tested
- [ ] Data export tested

### Compatibility Testing
- [ ] iOS: Tested on iPhone SE, iPhone 15 Pro Max
- [ ] iOS: Tested on iOS 15, 16, 17, 18
- [ ] Android: Tested on small, medium, large screens
- [ ] Android: Tested on Android 7, 10, 13, 14
- [ ] Tablet support tested (if applicable)

### Security Testing
- [ ] HTTPS only (no HTTP)
- [ ] SSL pinning enabled
- [ ] Encryption verified
- [ ] Authentication flow secure
- [ ] No sensitive data in logs
- [ ] No hardcoded credentials

### Accessibility Testing
- [ ] VoiceOver (iOS) / TalkBack (Android) tested
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Text scales with system settings
- [ ] Touch targets meet minimum size

---

## Compliance

### Data Protection
- [ ] GDPR compliant (if targeting EU)
- [ ] CCPA compliant (if targeting California)
- [ ] German data protection laws (if targeting Germany)
- [ ] Data processing agreements with third parties

### Financial Regulations
- [ ] Not offering financial advice (disclaimer)
- [ ] Banking integrations use licensed providers (Tink, TrueLayer, Plaid)
- [ ] Payment processing via licensed provider (Stripe)
- [ ] Tax filing uses official channels (ELSTER)

### Age Restrictions
- [ ] Minimum age: 18+ (enforced in T&C)
- [ ] Age verification: Self-declaration
- [ ] COPPA compliance: Not applicable (18+)

---

## Post-Submission

### Monitoring

After submission:
- [ ] Check submission status daily
- [ ] Respond to reviewer questions within 24 hours
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Check analytics for install/uninstall rates

### Rejection Handling

If rejected:
- [ ] Read rejection reason carefully
- [ ] Fix issues cited by reviewers
- [ ] Re-test thoroughly
- [ ] Respond to reviewers (if option available)
- [ ] Re-submit with detailed resolution notes

### Launch Preparation

If approved:
- [ ] Monitor first 48 hours closely
- [ ] Respond to initial user reviews
- [ ] Fix critical bugs immediately
- [ ] Prepare update pipeline (bug fixes)

---

# Assets and Media

## Required Assets Summary

### iOS App Store

| Asset | Size | Format | Required? |
|-------|------|--------|-----------|
| App Icon | 1024x1024 | PNG, no alpha | Yes |
| 6.9" Screenshots | 1320x2868 | PNG/JPG | Yes (min 1) |
| 6.7" Screenshots | 1290x2796 | PNG/JPG | Recommended |
| App Preview Video | 1320x2868 | .mov/.mp4 | Optional |

### Google Play Store

| Asset | Size | Format | Required? |
|-------|------|--------|-----------|
| App Icon | 512x512 | PNG | Yes |
| Feature Graphic | 1024x500 | PNG/JPG | Yes |
| Phone Screenshots | 320-3840px | PNG/JPG | Yes (min 2) |
| Promo Video | YouTube URL | Video | Optional |

---

## Asset Creation Tips

### Screenshots
1. Use real data (anonymized)
2. Show key features clearly
3. Consistent status bar (9:41, full battery)
4. Light mode recommended (or both light/dark)
5. Add text overlays to explain features
6. Remove personal information

### Feature Graphic
1. Include app name and tagline
2. Visual representation of key feature (e.g., AI chat bubble, receipt scan)
3. Brand colors
4. No excessive text

### App Preview Video
1. 15-30 seconds ideal
2. Screen recording of actual app
3. Show 3-5 key features
4. Text overlays to explain
5. No audio narration needed
6. Professional, polished

---

# App Descriptions

## Copywriting Tips

### Do's
✅ Highlight unique value proposition (AI automation)
✅ Use bullet points for features
✅ Include pricing information
✅ Mention security and privacy
✅ Provide support contact
✅ Use action verbs (Connect, Scan, Chat)
✅ Focus on benefits, not just features
✅ Mention target audience (freelancers, small business)

### Don'ts
❌ Use "best," "most popular" without evidence
❌ Mention competitors by name
❌ Make unsubstantiated claims
❌ Include pricing that's not in the app
❌ Use excessive caps or exclamation marks
❌ Include contact info in description (use designated fields)
❌ Copy descriptions from other apps

---

# Testing Requirements

## Pre-Submission Testing Checklist

### Account Creation
- [ ] Google OAuth sign-in works
- [ ] Email verification (if applicable)
- [ ] Terms acceptance required
- [ ] Welcome flow clear

### Core Features
- [ ] Bank connection (Tink) works
- [ ] Bank connection (TrueLayer) works
- [ ] Transaction sync works
- [ ] Transaction categorization works
- [ ] Document upload works
- [ ] AI chat works (with consent)
- [ ] Receipt scanning works

### Payment
- [ ] Subscription options displayed
- [ ] Stripe payment flow works
- [ ] Subscription confirmed after payment
- [ ] Invoice generated
- [ ] Cancellation works

### Settings
- [ ] Change email/name
- [ ] Enable/disable biometric auth
- [ ] Enable/disable notifications
- [ ] Disconnect bank accounts
- [ ] Export data
- [ ] Delete account

### Error Handling
- [ ] Offline mode handled
- [ ] Network errors shown clearly
- [ ] Invalid inputs prevented
- [ ] Loading states clear
- [ ] Retry options available

---

# Compliance and Legal

## Required Legal Pages

### Privacy Policy
**URL**: https://operate.guru/privacy
**Must Include**:
- [ ] Data controller information
- [ ] Data collected
- [ ] How data is used
- [ ] Third-party sharing
- [ ] User rights
- [ ] Data retention
- [ ] Security measures
- [ ] Cookie policy (web)
- [ ] Contact information

### Terms of Service
**URL**: https://operate.guru/terms
**Must Include**:
- [ ] Acceptance of terms
- [ ] User obligations
- [ ] Prohibited uses
- [ ] Account termination
- [ ] Intellectual property
- [ ] Liability limitations
- [ ] Dispute resolution
- [ ] Governing law

### Support Page
**URL**: https://operate.guru/support
**Must Include**:
- [ ] Contact methods
- [ ] Response time
- [ ] FAQ
- [ ] Tutorial/documentation links

---

## Age Rating Guidance

### Content Guidelines

**iOS App Store**: 4+ (with 18+ restriction in metadata)
**Google Play**: PEGI 3 / ESRB E (Everyone)

**Why these ratings**:
- No violence, profanity, or mature themes
- Educational/productivity app
- Financial services nature requires 18+ user agreement

**Restrictions**:
- Terms of Service must state 18+ requirement
- No content targeting children
- Financial features inherently for adults

---

## Common Rejection Reasons

### iOS
1. **Privacy issues**: Missing manifest, inaccurate labels
2. **Crashes**: App crashes on reviewer's device
3. **Broken features**: Core functionality doesn't work
4. **Misleading description**: Description doesn't match app
5. **Design**: Doesn't follow HIG
6. **Demo account**: Invalid or missing credentials
7. **Incomplete info**: Missing privacy policy, support URL

### Android
1. **Data safety**: Incomplete or inaccurate declarations
2. **Permissions**: Unnecessary permissions requested
3. **Broken features**: App doesn't function as described
4. **Policy violations**: Financial services without disclosures
5. **Content rating**: Inappropriate rating for content
6. **Deceptive behavior**: Misleading screenshots/descriptions

---

## Review Timelines

### iOS App Store
- **Typical**: 24-48 hours
- **Peak times**: Up to 5 days (new iOS release)
- **Expedite**: Available for critical bug fixes

### Google Play Store
- **Typical**: 1-3 days
- **Updates**: Usually faster than initial submission
- **Pre-launch report**: Available ~24 hours after upload

---

## Post-Launch Checklist

### Week 1
- [ ] Monitor crash reports daily
- [ ] Respond to user reviews (all ratings)
- [ ] Track install/uninstall rates
- [ ] Monitor server load
- [ ] Fix critical bugs immediately
- [ ] Prepare update (if needed)

### Month 1
- [ ] Analyze user feedback themes
- [ ] Plan feature improvements
- [ ] Optimize onboarding (if drop-off detected)
- [ ] A/B test descriptions/screenshots (if needed)
- [ ] Build user community (social media, forum)

### Ongoing
- [ ] Monthly app updates (features + bug fixes)
- [ ] Quarterly privacy policy review
- [ ] Quarterly security audit
- [ ] Annual compliance review (GDPR, etc.)

---

## Success Metrics

Track these KPIs post-launch:

### Acquisition
- Installs per day
- Store page conversion rate
- Organic vs. paid installs

### Activation
- % users who complete onboarding
- % users who connect first bank account
- % users who enable AI chat

### Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session length
- Feature usage rates

### Retention
- Day 1, 7, 30 retention rates
- Churn rate
- Re-engagement success

### Revenue
- Free to paid conversion rate
- Monthly Recurring Revenue (MRR)
- Lifetime Value (LTV)
- Churn rate

### Quality
- Crash-free rate (target: >99%)
- Average app store rating (target: >4.5)
- Support ticket volume
- Response time

---

**Status**: Checklist complete and ready for use
**Last Updated**: 2025-12-07
**Agent**: FORGE

**Next Steps**:
1. Complete all checklist items
2. Upload builds to App Store Connect and Google Play Console
3. Fill in store metadata using this guide
4. Submit for review
5. Monitor and respond to feedback

Good luck with your submission!
