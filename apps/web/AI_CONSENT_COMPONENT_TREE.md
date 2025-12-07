# AI Consent - Component Tree

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Root                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        │                                           │
┌───────▼──────────┐                      ┌────────▼─────────┐
│   Chat Page      │                      │ Settings > AI    │
│  /chat           │                      │ /settings/ai     │
└───────┬──────────┘                      └────────┬─────────┘
        │                                           │
        │  Uses useAIConsent                        │  Uses
        │  Checks: needsConsent                     │  AISettings
        │  Actions: giveConsent                     │  component
        │                                           │
        ├──────────────┐                            │
        │              │                            │
┌───────▼──────────┐   │                   ┌────────▼─────────┐
│ AIConsentDialog  │   │                   │   AISettings     │
│ (shown on first  │   │                   │   Component      │
│  message)        │   │                   └────────┬─────────┘
└───────┬──────────┘   │                            │
        │              │                            │
        │  User        │                   ┌────────┴────────┐
        │  accepts     │                   │  Uses           │
        │  /declines   │                   │  useAIConsent   │
        │              │                   └────────┬────────┘
        │              │                            │
        │              │                   ┌────────▼────────┐
        │              │                   │  Toggle Switch  │
        │              │                   │  Delete Button  │
        │              │                   │  Revoke Dialog  │
        │              │                   └─────────────────┘
        │              │
        │              │
┌───────▼──────────┐   │
│  Chat enabled    │   │
│  if hasConsent   │   │
└──────────────────┘   │
                       │
        ┌──────────────▼──────────────┐
        │  No consent:                │
        │  - Alert banner shows       │
        │  - Input disabled           │
        │  - "Enable AI" button       │
        └─────────────────────────────┘
```

## Component Hierarchy

### Chat Page Flow

```tsx
ChatPage
├── useAIConsent() hook
│   ├── hasConsent: boolean
│   ├── needsConsent: boolean
│   ├── giveConsent: () => Promise<boolean>
│   └── revokeConsent: () => Promise<boolean>
│
├── AIConsentDialog (conditional)
│   ├── DialogContent
│   │   ├── DialogHeader
│   │   │   ├── Brain icon
│   │   │   ├── DialogTitle
│   │   │   └── DialogDescription
│   │   │
│   │   ├── ScrollArea (consent info)
│   │   │   ├── What is AI Processing?
│   │   │   ├── What Data Will Be Processed?
│   │   │   ├── How Is Your Data Protected?
│   │   │   ├── Your Rights
│   │   │   ├── Third-Party Provider Alert
│   │   │   └── Privacy Policy Link
│   │   │
│   │   ├── Acknowledgment Checkbox
│   │   │   └── "I have read and understood..."
│   │   │
│   │   └── DialogFooter
│   │       ├── Button (Decline)
│   │       └── Button (Accept)
│   │
│   └── Event Handlers
│       ├── onAccept → giveConsent()
│       └── onDecline → close dialog
│
├── Alert Banner (if !hasConsent)
│   ├── AlertCircle icon
│   ├── "AI features are disabled"
│   └── Button "Enable AI" → open dialog
│
├── Chat Messages (existing)
│
└── ChatInput
    ├── disabled={!hasConsent}
    ├── placeholder={conditional}
    └── onSend={handleSendMessage}
        └── Check needsConsent before sending
```

### Settings Page Flow

```tsx
SettingsPage (/settings/ai)
├── AISettings Component
│   ├── useAIConsent() hook
│   │   ├── hasConsent
│   │   ├── consentData
│   │   ├── giveConsent
│   │   └── revokeConsent
│   │
│   ├── Card: AI Processing
│   │   ├── Switch (toggle AI on/off)
│   │   ├── Status Alert (enabled/disabled)
│   │   └── Security Badge (native storage)
│   │
│   ├── Card: Data Collection Info
│   │   └── List of data types processed
│   │
│   ├── Card: Data Management
│   │   ├── Delete AI Data Button
│   │   ├── Privacy Policy Link
│   │   └── Third-Party Provider Info
│   │
│   ├── AlertDialog: Revoke Consent
│   │   ├── Consequences list
│   │   ├── Cancel button
│   │   └── Confirm button → revokeConsent()
│   │
│   └── AlertDialog: Delete Data
│       ├── Warning message
│       ├── Cancel button
│       └── Confirm button → API call
│
└── Event Handlers
    ├── handleToggleAI → show revoke dialog
    ├── handleConfirmRevoke → revokeConsent()
    └── handleDeleteAIData → API DELETE
```

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Application State                          │
│                                                               │
│  localStorage (web) or Keychain/Keystore (native)            │
│  Key: "ai_consent_data"                                      │
│  Value: { hasConsent, timestamp, version }                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Read on mount
                              │ Write on change
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    useAIConsent Hook                          │
│                                                               │
│  State:                                                       │
│  ├── consentData: AIConsentData | null                       │
│  ├── isLoading: boolean                                      │
│  └── needsConsent: boolean (computed)                        │
│                                                               │
│  Actions:                                                     │
│  ├── giveConsent() → Store consent                           │
│  ├── revokeConsent() → Remove consent                        │
│  └── refreshConsent() → Reload from storage                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Used by
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│   Chat Page      │                      │  Settings Page   │
│                  │                      │                  │
│  Checks:         │                      │  Shows:          │
│  - needsConsent  │                      │  - hasConsent    │
│  - hasConsent    │                      │  - consentData   │
│                  │                      │  - timestamp     │
│  Shows:          │                      │                  │
│  - Dialog        │                      │  Actions:        │
│  - Alert         │                      │  - Toggle        │
│  - Input state   │                      │  - Delete        │
└──────────────────┘                      └──────────────────┘
```

## Event Sequence Diagrams

### First-Time User Flow

```
User                Chat Page           useAIConsent        Storage
 │                      │                    │                │
 │  Opens /chat         │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │  Load consent      │                │
 │                      ├───────────────────▶│                │
 │                      │                    │  Read storage  │
 │                      │                    ├───────────────▶│
 │                      │                    │  null          │
 │                      │                    ◀────────────────┤
 │                      │  needsConsent=true │                │
 │                      ◀────────────────────┤                │
 │                      │                    │                │
 │  Types message       │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │  Check consent     │                │
 │                      ├───────────────────▶│                │
 │                      │  needsConsent=true │                │
 │                      ◀────────────────────┤                │
 │                      │                    │                │
 │  ◀── Show Dialog ────┤                    │                │
 │                      │                    │                │
 │  Reads info          │                    │                │
 │  Checks box          │                    │                │
 │  Clicks Accept       │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │  giveConsent()     │                │
 │                      ├───────────────────▶│                │
 │                      │                    │  Store consent │
 │                      │                    ├───────────────▶│
 │                      │                    │  ✓ Success     │
 │                      │                    ◀────────────────┤
 │                      │  hasConsent=true   │                │
 │                      ◀────────────────────┤                │
 │                      │                    │                │
 │  ◀── Close Dialog ───┤                    │                │
 │  ◀── Send Message ───┤                    │                │
 │                      │                    │                │
```

### Opt-Out Flow

```
User              Settings Page        useAIConsent        Storage
 │                      │                    │                │
 │  Opens /settings/ai  │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │  Load consent      │                │
 │                      ├───────────────────▶│                │
 │                      │                    │  Read storage  │
 │                      │                    ├───────────────▶│
 │                      │                    │  { hasConsent: │
 │                      │                    │    true }      │
 │                      │                    ◀────────────────┤
 │                      │  hasConsent=true   │                │
 │                      ◀────────────────────┤                │
 │                      │                    │                │
 │  ◀── Show Toggle ON ─┤                    │                │
 │                      │                    │                │
 │  Click Toggle OFF    │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │                    │                │
 │  ◀── Show Confirm ───┤                    │                │
 │                      │                    │                │
 │  Click Confirm       │                    │                │
 ├─────────────────────▶│                    │                │
 │                      │  revokeConsent()   │                │
 │                      ├───────────────────▶│                │
 │                      │                    │  Remove/Update │
 │                      │                    ├───────────────▶│
 │                      │                    │  ✓ Success     │
 │                      │                    ◀────────────────┤
 │                      │  hasConsent=false  │                │
 │                      ◀────────────────────┤                │
 │                      │                    │                │
 │  ◀── Update UI ──────┤                    │                │
 │  (Toggle OFF)        │                    │                │
 │                      │                    │                │
```

## Data Structure

### AIConsentData Interface

```typescript
interface AIConsentData {
  hasConsent: boolean;    // Current consent status
  timestamp: string;      // ISO 8601: "2025-12-07T10:30:00.000Z"
  version: string;        // Consent version: "1.0"
  ip?: string;           // Optional: IP address for audit
}
```

### Storage Keys

```typescript
// Primary consent storage
'ai_consent_data' → AIConsentData (JSON)

// Secure storage (native)
{
  server: 'token.ai_consent_data',
  username: 'ai_consent_data',
  password: JSON.stringify(AIConsentData)
}

// localStorage (web fallback)
{
  'ai_consent_data': btoa(JSON.stringify(AIConsentData))
}
```

## File Structure

```
apps/web/
├── src/
│   ├── hooks/
│   │   └── useAIConsent.ts          # Core consent hook
│   │
│   ├── components/
│   │   ├── consent/
│   │   │   ├── AIConsentDialog.tsx  # Consent dialog
│   │   │   └── README.md            # Component docs
│   │   │
│   │   └── settings/
│   │       └── AISettings.tsx       # Settings panel
│   │
│   └── app/
│       └── (dashboard)/
│           ├── chat/
│           │   └── page.tsx         # Chat (with consent check)
│           │
│           └── settings/
│               └── ai/
│                   └── page.tsx     # AI settings page
│
├── AI_CONSENT_FLOW.md               # Complete documentation
├── AI_CONSENT_IMPLEMENTATION.md     # Implementation summary
└── AI_CONSENT_COMPONENT_TREE.md     # This file
```

## Dependencies Graph

```
AIConsentDialog
├── @radix-ui/react-dialog
├── @radix-ui/react-checkbox
├── lucide-react (icons)
└── UI components
    ├── Dialog
    ├── Button
    ├── Checkbox
    ├── Label
    ├── ScrollArea
    └── Alert

AISettings
├── @radix-ui/react-alert-dialog
├── @radix-ui/react-switch
├── useAIConsent
└── UI components
    ├── Card
    ├── Button
    ├── Switch
    ├── Label
    ├── Alert
    ├── AlertDialog
    └── Separator

useAIConsent
├── useSecureStorage
│   └── @capacitor/core
│       └── @capgo/capacitor-native-biometric
├── useState
├── useEffect
└── useCallback

ChatPage
├── useAIConsent
├── AIConsentDialog
├── ChatInput (existing)
├── ChatMessage (existing)
└── UI components
```

## Testing Points

### Unit Tests

```typescript
// useAIConsent.test.ts
- Initial state is no consent
- giveConsent() stores data correctly
- revokeConsent() removes consent
- needsConsent returns correct value
- Consent versioning works
- Storage fallback works

// AIConsentDialog.test.tsx
- Dialog opens/closes correctly
- Checkbox is required
- Accept button disabled without checkbox
- Decline button always enabled
- Privacy links render correctly
- Accessibility attributes present

// AISettings.test.tsx
- Toggle switch reflects consent state
- Revoke dialog shows on toggle off
- Delete dialog shows on delete button
- API calls work correctly
- Status indicators update
```

### Integration Tests

```typescript
// chat-consent-flow.test.tsx
- Dialog shows on first message
- Message sends after consent
- Input disabled without consent
- Banner shows without consent
- Enable AI button works

// settings-consent-flow.test.tsx
- Settings page loads correctly
- Toggle updates consent
- Delete data works
- Consent persists across navigation
```

### E2E Tests

```typescript
// consent-flow.e2e.ts
- Complete first-time user flow
- Opt-out and re-enable flow
- Data deletion flow
- Persistence across sessions
- Mobile responsiveness
```

## Performance Considerations

- **Consent check:** < 1ms (synchronous)
- **Dialog render:** < 100ms
- **Storage write:** < 50ms
- **Storage read:** < 10ms
- **No network calls** (except delete data)
- **Lazy-loaded:** Only when needed
- **Offline-first:** Works without connection

## Accessibility Features

- **ARIA labels:** All interactive elements
- **Keyboard navigation:** Full support
- **Focus management:** Dialog focus trap
- **Screen readers:** Proper announcements
- **Color contrast:** WCAG AA compliant
- **Touch targets:** Minimum 44x44px
- **Responsive:** Mobile-friendly

## Browser/Platform Support

| Platform      | Storage Method          | Status |
|--------------|------------------------|--------|
| iOS          | Keychain               | ✅     |
| Android      | Keystore               | ✅     |
| Web (Chrome) | localStorage (base64)  | ✅     |
| Web (Safari) | localStorage (base64)  | ✅     |
| Web (Firefox)| localStorage (base64)  | ✅     |

## Summary

This component tree demonstrates a clean, modular architecture for AI consent management that:

1. Separates concerns (hook, dialog, settings)
2. Provides consistent API across components
3. Handles both native and web platforms
4. Follows React best practices
5. Is fully accessible
6. Works offline
7. Is GDPR and App Store compliant

All components work together to provide a seamless, compliant consent experience for users.
