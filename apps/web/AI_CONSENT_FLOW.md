# AI Consent Flow Documentation

## Overview

The AI Consent Flow implements GDPR and App Store compliant consent management for AI data processing in Operate. This ensures users provide explicit consent before their data is processed by Claude AI (Anthropic).

## Compliance

This implementation complies with:

- **GDPR** (General Data Protection Regulation)
  - Article 7: Conditions for consent
  - Article 13: Information to be provided
  - Right to withdraw consent
  - Right to data deletion

- **App Store Guidelines**
  - Apple App Store Review Guidelines 5.1.2 (Data Use and Sharing)
  - Google Play User Data Policy

- **Privacy Regulations**
  - CCPA (California Consumer Privacy Act)
  - Other regional privacy laws

## Architecture

### Components

#### 1. `useAIConsent` Hook (`/hooks/useAIConsent.ts`)

Custom React hook managing consent state and storage.

**Features:**
- Secure consent storage (Keychain/Keystore on native, localStorage on web)
- Consent versioning (allows re-consent when terms change)
- Timestamp tracking
- Easy API: `hasConsent`, `giveConsent`, `revokeConsent`

**API:**
```typescript
const {
  hasConsent,        // boolean - current consent status
  consentData,       // AIConsentData | null - full consent record
  isLoading,         // boolean - loading state
  needsConsent,      // boolean - true if consent needed
  isNativeSecure,    // boolean - using native secure storage
  giveConsent,       // () => Promise<boolean> - grant consent
  revokeConsent,     // () => Promise<boolean> - revoke consent
  refreshConsent,    // () => Promise<void> - reload consent
} = useAIConsent();
```

**Storage:**
- **Native (iOS/Android):** Stored in device Keychain/Keystore via `useSecureStorage`
- **Web:** Encrypted localStorage with base64 encoding
- **Key:** `ai_consent_data`
- **Version:** `1.0` (increment when terms change to trigger re-consent)

#### 2. `AIConsentDialog` Component (`/components/consent/AIConsentDialog.tsx`)

Modal dialog shown before first AI interaction.

**Features:**
- Clear explanation of AI usage
- Data processing transparency
- Security information
- User rights (opt-out, delete, access)
- Privacy policy links
- Accept/Decline buttons
- Acknowledgment checkbox (prevents accidental clicks)
- Mobile-responsive
- Accessible (ARIA labels, keyboard navigation)

**Props:**
```typescript
interface AIConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}
```

#### 3. `AISettings` Component (`/components/settings/AISettings.tsx`)

Settings panel for managing AI consent post-acceptance.

**Features:**
- Toggle AI processing on/off
- View consent status and timestamp
- Request AI data deletion
- Link to privacy policy
- Confirmation dialogs for destructive actions
- Native storage indicator

**Location:** Accessible at `/settings/ai`

## User Journey

### First-Time User

1. User opens chat page (`/chat`)
2. User attempts to send a message
3. System checks `needsConsent || !hasConsent`
4. `AIConsentDialog` appears
5. User reads information and checks "I have read..." checkbox
6. User clicks "Accept & Continue" or "Decline"
   - **Accept:** Consent stored, message sent, chat enabled
   - **Decline:** Dialog closes, chat remains disabled

### Returning User (Consented)

1. User opens chat page
2. System checks `hasConsent === true`
3. Chat input is enabled
4. User can send messages immediately

### Returning User (No Consent)

1. User opens chat page
2. Alert banner appears: "AI features are disabled"
3. User clicks "Enable AI" button in banner
4. `AIConsentDialog` appears
5. Follow first-time flow

### User Wants to Opt-Out

1. User navigates to Settings > AI (`/settings/ai`)
2. User toggles "Use AI Assistant" switch to OFF
3. Confirmation dialog appears explaining consequences
4. User confirms
5. Consent revoked, AI features disabled
6. User can re-enable anytime

### User Wants to Delete AI Data

1. User navigates to Settings > AI
2. User clicks "Delete My AI Data" button
3. Confirmation dialog appears (warning: cannot be undone)
4. User confirms
5. API call to `/api/v1/ai/data` (DELETE)
6. Success message shown
7. AI data deleted (chat history, insights, etc.)

## Re-Consent Scenarios

Users must re-consent when:

1. **Terms Change:** `CONSENT_VERSION` is incremented in code
2. **Consent Expired:** After certain period (if implemented)
3. **Account Migration:** User switches accounts
4. **Explicit Request:** User manually revokes and re-enables

## Consent Data Structure

```typescript
interface AIConsentData {
  hasConsent: boolean;    // Current consent status
  timestamp: string;      // ISO 8601 timestamp
  version: string;        // Consent version (e.g., "1.0")
  ip?: string;           // Optional: IP address for audit
}
```

**Example:**
```json
{
  "hasConsent": true,
  "timestamp": "2025-12-07T10:30:00.000Z",
  "version": "1.0"
}
```

## Storage Implementation

### Native Platforms (iOS/Android)

```typescript
// Uses Capacitor + NativeBiometric plugin
await NativeBiometric.setCredentials({
  username: 'ai_consent_data',
  password: JSON.stringify(consentData),
  server: 'token.ai_consent_data'
});
```

**Benefits:**
- Hardware-backed encryption
- Secure Enclave (iOS) / Keystore (Android)
- Cannot be accessed by other apps
- Survives app reinstall (if backed up)

### Web Platform

```typescript
// Uses encrypted localStorage
const encoded = btoa(JSON.stringify(consentData));
localStorage.setItem('ai_consent_data', encoded);
```

**Notes:**
- Base64 encoding (not full encryption)
- Can be cleared by user
- Shared across browser tabs
- Survives browser restart

## API Integration

### Chat API Check

Before processing chat messages, the API should verify consent:

```typescript
// apps/api/src/chat/chat.controller.ts
async sendMessage(userId: string, message: string) {
  // Check user's AI consent
  const hasConsent = await this.userService.hasAIConsent(userId);

  if (!hasConsent) {
    throw new ForbiddenException('AI consent required');
  }

  // Process with Claude AI
  return this.claudeService.chat(message);
}
```

### Data Deletion Endpoint

```typescript
// DELETE /api/v1/ai/data
async deleteAIData(userId: string) {
  // Delete chat history
  await this.chatService.deleteUserChats(userId);

  // Delete AI-generated insights
  await this.insightsService.deleteUserInsights(userId);

  // Delete cached responses
  await this.cacheService.deleteUserAICache(userId);

  return { success: true };
}
```

## Testing Checklist

### Functionality
- [ ] First-time user sees consent dialog on first message
- [ ] Accepting consent enables chat features
- [ ] Declining consent keeps chat disabled
- [ ] Alert banner shows when consent is declined
- [ ] "Enable AI" button in banner opens dialog
- [ ] Settings page shows correct consent status
- [ ] Toggle switch updates consent
- [ ] Revoke confirmation dialog works
- [ ] Delete data confirmation dialog works
- [ ] Consent persists across sessions
- [ ] Consent syncs between tabs (web)

### Compliance
- [ ] All required information is displayed
- [ ] Checkbox prevents accidental acceptance
- [ ] User can decline without penalty
- [ ] Privacy policy link works
- [ ] Anthropic privacy link works
- [ ] Data deletion request works
- [ ] Consent can be withdrawn anytime
- [ ] Re-consent works after version change

### Accessibility
- [ ] Dialog has proper ARIA labels
- [ ] Keyboard navigation works
- [ ] Screen reader announces all content
- [ ] Focus trap works in dialog
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are 44x44px minimum

### Performance
- [ ] Dialog loads quickly
- [ ] No flash of unconsented content
- [ ] Storage operations are async
- [ ] No blocking UI operations
- [ ] Works offline (local storage)

## Legal Considerations

### What to Include in Privacy Policy

Your privacy policy should include:

1. **AI Data Processing Section**
   - What data is sent to Anthropic
   - How AI processes the data
   - Data retention periods
   - User rights (access, delete, opt-out)

2. **Third-Party Provider Disclosure**
   - Anthropic as the AI provider
   - Link to Anthropic's privacy policy
   - Data transfer details (US-based processing)

3. **User Rights**
   - Right to withdraw consent
   - Right to request data deletion
   - Right to access processed data
   - How to exercise these rights

4. **Security Measures**
   - Encryption in transit (TLS)
   - Secure storage methods
   - Access controls

### GDPR Specific Requirements

- **Lawful Basis:** Consent (Article 6.1.a)
- **Freely Given:** Users can decline without penalty
- **Specific:** Consent is for AI processing only
- **Informed:** Full disclosure of data usage
- **Unambiguous:** Clear action required (checkbox + button)
- **Withdrawable:** Easy opt-out in Settings

### App Store Requirements

**Apple:**
- Purpose string in Info.plist (if using camera/mic for AI)
- Privacy manifest (PrivacyInfo.xcprivacy) listing AI usage
- Third-party SDK disclosure (Anthropic)

**Google:**
- Data safety form declaration
- Prominent disclosure before data collection
- Easy opt-out mechanism

## Troubleshooting

### Consent Not Persisting

**Symptom:** User must re-consent every session

**Causes:**
1. Browser clearing localStorage
2. Private/Incognito mode
3. Secure storage failure

**Solutions:**
- Check browser settings (don't clear on exit)
- Test in normal browsing mode
- Check console for storage errors
- Verify `useSecureStorage` is working

### Dialog Not Showing

**Symptom:** Chat works without consent

**Causes:**
1. Consent already given
2. Check logic skipped
3. State not updated

**Solutions:**
- Clear localStorage/keychain
- Check `needsConsent` logic
- Verify `hasConsent` state
- Test with new user account

### Cannot Revoke Consent

**Symptom:** Toggle switch doesn't work

**Causes:**
1. API error
2. Storage permission denied
3. State update failure

**Solutions:**
- Check network tab for errors
- Verify storage permissions
- Test `revokeConsent` function
- Check console logs

## Future Enhancements

1. **Audit Trail**
   - Log all consent changes
   - Include IP address and user agent
   - Store in database for compliance

2. **Granular Consent**
   - Separate consent for different AI features
   - "Essential" vs "Optional" AI processing
   - Feature-specific opt-in

3. **Consent Expiry**
   - Re-consent after X months
   - Remind users before expiry
   - Auto-disable if not renewed

4. **Data Portability**
   - Export AI-processed data
   - JSON/CSV download
   - Include all AI interactions

5. **Regional Variations**
   - EU-specific consent flow
   - US-specific disclosures
   - Localized privacy policies

## Related Files

```
apps/web/
├── src/
│   ├── hooks/
│   │   ├── useAIConsent.ts           # Consent management hook
│   │   └── useSecureStorage.ts       # Secure storage abstraction
│   ├── components/
│   │   ├── consent/
│   │   │   └── AIConsentDialog.tsx   # Consent dialog component
│   │   └── settings/
│   │       └── AISettings.tsx        # AI settings panel
│   ├── app/
│   │   └── (dashboard)/
│   │       ├── chat/
│   │       │   └── page.tsx          # Chat with consent check
│   │       └── settings/
│   │           └── ai/
│   │               └── page.tsx      # AI settings page
│   └── lib/
│       └── security/
│           └── secure-storage.service.ts  # Storage implementation
└── AI_CONSENT_FLOW.md                # This file
```

## Support

For questions or issues:
1. Check console logs for errors
2. Verify consent data in storage (DevTools > Application > Local Storage)
3. Test with new user account
4. Review compliance requirements
5. Contact legal team for policy questions

## Changelog

### Version 1.0 (2025-12-07)
- Initial implementation
- `useAIConsent` hook
- `AIConsentDialog` component
- `AISettings` component
- Chat page integration
- Settings page
- Documentation
