# iOS Privacy Manifest Documentation

## Overview

The iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) is a **required file** for all App Store submissions since Spring 2024. This document explains every entry in the manifest and how it maps to the Operate app's features.

**File Location**: `apps/web/ios/App/PrivacyInfo.xcprivacy`

Apple will **reject** your app if the privacy manifest is incomplete, inaccurate, or missing required declarations.

---

## Table of Contents

1. [Tracking Disclosure](#tracking-disclosure)
2. [Data Collection](#data-collection)
3. [Privacy-Sensitive APIs](#privacy-sensitive-apis)
4. [Updating the Manifest](#updating-the-manifest)
5. [App Store Connect Setup](#app-store-connect-setup)
6. [Testing and Validation](#testing-and-validation)

---

## Tracking Disclosure

### NSPrivacyTracking: `false`

**What it means**: We do NOT track users across apps or websites for advertising or data broker purposes.

**Why we set it to false**:
- We don't use advertising SDKs
- We don't sell user data to third parties
- We don't connect user activity across different apps/websites
- We don't use tracking pixels or fingerprinting

**Important**: If you ever add analytics that track users across apps (e.g., Facebook SDK, Google Ads), you MUST set this to `true` and request App Tracking Transparency permission.

### NSPrivacyTrackingDomains: `[]` (empty)

**What it means**: We don't connect to any third-party tracking domains.

**Domains we DO connect to** (not tracking):
- `operate.guru` - Our own API (first-party)
- `anthropic.com` - Claude AI API (functional, not tracking)
- `googleapis.com` - Google OAuth (authentication only)
- `tink.com`, `truelayer.com`, `plaid.com` - Banking APIs (functional)
- `stripe.com` - Payment processing (functional)
- `sentry.io` - Error monitoring (optional, not tracking)

These domains are NOT listed because they're used for app functionality, not cross-app tracking.

---

## Data Collection

Each data type collected must be declared with:
1. **Type** - What kind of data
2. **Linked** - Is it tied to user identity?
3. **Tracking** - Is it used for tracking?
4. **Purpose** - Why we collect it

### Contact Information

#### Email Address
```xml
<string>NSPrivacyCollectedDataTypeEmailAddress</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: Account Management, App Functionality
- **Feature mapping**: Google OAuth login, account creation, email notifications
- **Data retention**: Stored until account deletion

#### Name
```xml
<string>NSPrivacyCollectedDataTypeName</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: Account Management, App Functionality
- **Feature mapping**: User profile, display name in app
- **Data retention**: Stored until account deletion

### Financial Information

#### Financial Info
```xml
<string>NSPrivacyCollectedDataTypeFinancialInfo</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: App Functionality
- **Feature mapping**:
  - Bank account connections (Tink, TrueLayer, Plaid)
  - Transaction history
  - Invoices and receipts
  - Payment information (Stripe)
  - Tax data (ELSTER integration)
- **Data retention**: Stored per legal requirements (tax records: 10 years in Germany)
- **Security**: Encrypted at rest and in transit, SSL pinning enabled

### User Content

#### User Content
```xml
<string>NSPrivacyCollectedDataTypeUserContent</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: App Functionality
- **Feature mapping**:
  - Uploaded documents (receipts, invoices, contracts)
  - Email attachments processed by app
  - Chat messages with AI assistant
  - Notes and annotations
  - Custom categories and tags
- **Data retention**: Stored until user deletes or account is closed
- **AI Processing**: Claude AI processes chat messages (not stored by Anthropic per their policy)

### Identifiers

#### User ID
```xml
<string>NSPrivacyCollectedDataTypeUserID</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: Account Management, App Functionality
- **Feature mapping**:
  - Internal user UUID
  - Session management
  - Data synchronization across devices
- **Data retention**: Permanent (anonymized if account deleted)

### Usage Data

#### Product Interaction
```xml
<string>NSPrivacyCollectedDataTypeProductInteraction</string>
```

- **Linked to user**: Yes
- **Used for tracking**: No
- **Purpose**: App Functionality, Analytics
- **Feature mapping**:
  - Feature usage statistics (which features are used most)
  - User flow tracking (to improve UX)
  - Chat interaction patterns (to improve AI responses)
  - Button clicks, page views (internal analytics only)
- **Data retention**: 90 days
- **Use**: Improve app functionality, not shared with third parties

### Diagnostics

#### Crash Data
```xml
<string>NSPrivacyCollectedDataTypeCrashData</string>
```

- **Linked to user**: No (anonymized)
- **Used for tracking**: No
- **Purpose**: App Functionality
- **Feature mapping**: Sentry error monitoring (optional, can be disabled)
- **Data retention**: 90 days
- **Privacy**: No personally identifiable information included

#### Performance Data
```xml
<string>NSPrivacyCollectedDataTypePerformanceData</string>
```

- **Linked to user**: No (anonymized)
- **Used for tracking**: No
- **Purpose**: App Functionality
- **Feature mapping**:
  - App launch time
  - API response times
  - Memory usage
  - Battery impact
- **Data retention**: 90 days
- **Use**: Optimize app performance

---

## Privacy-Sensitive APIs

Apple requires explicit "reasons" for using certain privacy-sensitive APIs.

### User Defaults API

**What it is**: `NSUserDefaults` / `UserDefaults` - Key-value storage for app settings

**APIs used**:
- `@capacitor/preferences` plugin
- `localStorage` (web)
- Direct `UserDefaults` access (iOS)

**Reason Code**: `CA92.1`
- **Meaning**: "Access app-specific settings"
- **What we store**:
  - Theme preference (light/dark mode)
  - Language selection (en/de)
  - Biometric authentication enabled/disabled
  - Notification preferences
  - Auto-categorization settings
  - Chat conversation history (local cache)

**What we DON'T store**:
- No cross-app data
- No fingerprinting data
- No tracking identifiers

### File Timestamp API

**What it is**: Accessing file creation/modification dates

**APIs used**:
- Checking when documents were uploaded
- Sorting files by date
- Cache invalidation based on file age

**Reason Code**: `0A2A.1`
- **Meaning**: "Access timestamps of files created by app"
- **Use cases**:
  - Display "Last modified" date to users
  - Sort documents by upload date
  - Determine if cached files need refresh
  - Show receipt upload date

**NOT used for**:
- Device fingerprinting
- User tracking
- Cross-app correlation

### Disk Space API

**What it is**: Checking available device storage

**APIs used**:
- `FileManager.default.availableCapacity`
- Capacitor Filesystem plugin

**Reason Code**: `7D9E.1`
- **Meaning**: "Check if sufficient space for app functionality"
- **Use cases**:
  - Before downloading large documents
  - Before caching transaction data
  - Warning user if storage is low
  - Deciding whether to cache images locally

**NOT used for**:
- Device fingerprinting
- User profiling
- Tracking

---

## Updating the Manifest

### When to Update

You MUST update the privacy manifest when:

1. **Adding new data collection**
   - New user fields in forms
   - New analytics tracking
   - New third-party SDKs that collect data

2. **Adding new APIs**
   - Using new iOS APIs on the "Required Reason" list
   - Integrating new Capacitor plugins
   - Adding new frameworks

3. **Changing data use**
   - Using existing data for new purposes
   - Sharing data with new third parties
   - Changing data retention periods

### How to Update

#### Adding a New Data Type

```xml
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataType[TYPE]</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>  <!-- or <false/> -->
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>  <!-- set to true only if used for tracking -->
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurpose[PURPOSE]</string>
  </array>
</dict>
```

**Available Data Types**:
- `NSPrivacyCollectedDataTypeEmailAddress`
- `NSPrivacyCollectedDataTypeName`
- `NSPrivacyCollectedDataTypePhoneNumber`
- `NSPrivacyCollectedDataTypePhysicalAddress`
- `NSPrivacyCollectedDataTypeFinancialInfo`
- `NSPrivacyCollectedDataTypeUserContent`
- `NSPrivacyCollectedDataTypeUserID`
- `NSPrivacyCollectedDataTypeDeviceID`
- `NSPrivacyCollectedDataTypeProductInteraction`
- `NSPrivacyCollectedDataTypeBrowsingHistory`
- `NSPrivacyCollectedDataTypeSearchHistory`
- `NSPrivacyCollectedDataTypePreciseLocation`
- `NSPrivacyCollectedDataTypeCoarseLocation`
- `NSPrivacyCollectedDataTypeHealthInfo`
- `NSPrivacyCollectedDataTypeFitnessInfo`
- `NSPrivacyCollectedDataTypeCrashData`
- `NSPrivacyCollectedDataTypePerformanceData`
- And more... (see Apple's documentation)

**Available Purposes**:
- `NSPrivacyCollectedDataTypePurposeAppFunctionality`
- `NSPrivacyCollectedDataTypePurposeAnalytics`
- `NSPrivacyCollectedDataTypePurposeAccountManagement`
- `NSPrivacyCollectedDataTypePurposeDeveloperAdvertising`
- `NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising`
- `NSPrivacyCollectedDataTypePurposeProductPersonalization`
- `NSPrivacyCollectedDataTypePurposeOther`

#### Adding a New API Reason

```xml
<dict>
  <key>NSPrivacyAccessedAPIType</key>
  <string>NSPrivacyAccessedAPICategory[CATEGORY]</string>
  <key>NSPrivacyAccessedAPITypeReasons</key>
  <array>
    <string>[REASON_CODE]</string>
  </array>
</dict>
```

**API Categories**:
- `NSPrivacyAccessedAPICategoryUserDefaults`
- `NSPrivacyAccessedAPICategoryFileTimestamp`
- `NSPrivacyAccessedAPICategorySystemBootTime`
- `NSPrivacyAccessedAPICategoryDiskSpace`
- `NSPrivacyAccessedAPICategoryActiveKeyboards`
- And more...

**Reason Codes**: See Apple's documentation for valid codes per category.

### Example: Adding Phone Number Collection

If you add a phone number field to user profiles:

```xml
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypePhoneNumber</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAccountManagement</string>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
```

Then update this document to explain:
- Why you collect it
- How it's used
- How long it's retained
- How it's protected

---

## App Store Connect Setup

### Privacy Nutrition Labels

In App Store Connect, you must also fill out the "Privacy" section:

1. Go to App Store Connect
2. Select your app
3. Go to "App Privacy"
4. Click "Get Started"

For each data type in the manifest, you'll be asked:
- **Do you collect this data?** → Yes
- **Is it linked to user identity?** → Match manifest setting
- **Is it used for tracking?** → Match manifest setting (should be No)
- **For what purposes?** → Match manifest purposes

### Important Notes

- **Manifest vs. Nutrition Labels**: Both must match! Apple will reject if inconsistent.
- **Third-party data**: If SDKs collect data, you must declare it even if you don't use it.
- **Update both**: Whenever you update the manifest, update App Store Connect too.

### Common Mistakes to Avoid

❌ **Wrong**: Declaring data in manifest but not in App Store Connect
✅ **Right**: Update both simultaneously

❌ **Wrong**: Saying "no data collected" when you clearly collect email
✅ **Right**: Be transparent and accurate

❌ **Wrong**: Marking all data as "not linked to user" to appear more privacy-friendly
✅ **Right**: Accurately reflect whether data can identify the user

---

## Testing and Validation

### Pre-Submission Checklist

Before submitting to App Store:

- [ ] Privacy manifest file exists at `ios/App/PrivacyInfo.xcprivacy`
- [ ] All data types collected are declared
- [ ] All required-reason APIs used are declared with valid reasons
- [ ] Tracking is set to `false` (unless you explicitly track)
- [ ] App Store Connect privacy nutrition labels match manifest
- [ ] No third-party SDKs collect undeclared data
- [ ] SSL certificate pinning is configured for production
- [ ] Biometric authentication permission is requested (if used)
- [ ] Push notification permission is requested (if used)

### Validation Tools

#### 1. Xcode Build Warnings

Xcode 15+ will warn about missing privacy manifest entries:

```bash
cd apps/web
pnpm build
pnpm cap:sync:ios
pnpm cap:open:ios

# In Xcode:
# Product → Analyze
# Check for privacy warnings
```

#### 2. App Store Connect Validation

When you upload your IPA:
- App Store Connect will validate the privacy manifest
- You'll see errors if required entries are missing
- Fix errors and re-upload

#### 3. Manual Review

Apple's human reviewers will:
- Check if manifest matches app behavior
- Test data collection claims
- Verify no hidden tracking
- **Reject if inconsistencies found**

### Testing Data Collection Claims

Test each feature to verify manifest accuracy:

```bash
# Test biometric authentication
- Enable biometric login
- Verify it uses native biometric API
- Check no data is sent to third parties

# Test banking integration
- Connect a bank account
- Verify financial data is encrypted
- Check data is only used for app functionality

# Test chat functionality
- Send messages to AI
- Verify messages are sent to Anthropic API
- Confirm no data is stored for tracking

# Test crash reporting
- Trigger a test crash (if Sentry enabled)
- Verify crash data is anonymized
- Check no PII is included
```

---

## Common Scenarios

### Scenario 1: Adding Google Analytics

If you add Google Analytics:

1. **Update manifest**:
   ```xml
   <key>NSPrivacyTracking</key>
   <true/>  <!-- Changed from false! -->

   <key>NSPrivacyTrackingDomains</key>
   <array>
     <string>google-analytics.com</string>
     <string>googletagmanager.com</string>
   </array>
   ```

2. **Request ATT permission**:
   Add to Info.plist:
   ```xml
   <key>NSUserTrackingUsageDescription</key>
   <string>We use analytics to improve the app experience</string>
   ```

3. **Update App Store Connect**: Declare analytics data collection

4. **Show ATT prompt**: Use `AppTrackingTransparency` framework

### Scenario 2: Adding Location Features

If you add location-based features:

1. **Update manifest**:
   ```xml
   <dict>
     <key>NSPrivacyCollectedDataType</key>
     <string>NSPrivacyCollectedDataTypePreciseLocation</string>
     <key>NSPrivacyCollectedDataTypeLinked</key>
     <true/>
     <key>NSPrivacyCollectedDataTypeTracking</key>
     <false/>
     <key>NSPrivacyCollectedDataTypePurposes</key>
     <array>
       <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
     </array>
   </dict>
   ```

2. **Add location permission**: Update Info.plist with location usage description

3. **Update this doc**: Explain why location is needed

### Scenario 3: Adding a New SDK

Before adding any third-party SDK:

1. **Check SDK's privacy manifest**: Does it have one?
2. **Review data collection**: What data does it collect?
3. **Update your manifest**: Add all data types the SDK collects
4. **Test**: Verify SDK doesn't track without your knowledge

Example SDKs to be careful with:
- Facebook SDK (tracks by default)
- Firebase Analytics (tracks)
- Mixpanel (tracks)
- Amplitude (tracks)

Safe SDKs (functional, not tracking):
- Sentry (crash reporting, anonymized)
- Stripe (payment processing, functional)
- Anthropic (AI, no data retention)

---

## Resources

### Official Apple Documentation

- [Privacy Manifest Files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Required Reason API](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api)
- [App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)

### Tools

- [Privacy Manifest Validator](https://developer.apple.com/documentation/xcode/validating-privacy-manifests)
- [App Store Connect](https://appstoreconnect.apple.com/)

### Support

For questions:
1. Check Apple's documentation first
2. Review this document
3. Search Apple Developer Forums
4. Contact Apple Developer Support

---

## Summary

### What We Collect

✅ Email and name (for account)
✅ Financial data (for bookkeeping)
✅ Documents (for processing)
✅ Usage data (to improve app)
✅ Crash data (to fix bugs)

### What We DON'T Do

❌ Track users across apps
❌ Sell data to third parties
❌ Use data for advertising
❌ Fingerprint devices
❌ Share data unnecessarily

### Key Points

- **Be transparent**: Declare everything you collect
- **Be accurate**: Don't hide data collection
- **Be minimal**: Only collect what's needed
- **Be secure**: Encrypt sensitive data
- **Be compliant**: Match manifest to behavior

### Status

✅ Privacy manifest created and comprehensive
✅ All current features declared
✅ All APIs declared with reasons
✅ Tracking disabled (accurate for current app)
✅ Ready for iOS platform addition
✅ Ready for App Store submission (once iOS build is created)

---

**Last Updated**: 2025-12-07
**Agent**: SENTINEL (Security Agent)
**Status**: Complete and App Store Ready
