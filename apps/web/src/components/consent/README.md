# AI Consent Components

This directory contains components for managing AI consent in compliance with GDPR and App Store requirements.

## Components

### AIConsentDialog

Modal dialog shown before first AI interaction to obtain user consent.

**Usage:**
```tsx
import { AIConsentDialog } from '@/components/consent/AIConsentDialog';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  const handleAccept = async () => {
    // Store consent
    await giveConsent();
    setShowDialog(false);
  };

  const handleDecline = () => {
    setShowDialog(false);
  };

  return (
    <AIConsentDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      onAccept={handleAccept}
      onDecline={handleDecline}
      isLoading={false}
    />
  );
}
```

**Props:**
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Called when dialog should open/close
- `onAccept: () => void` - Called when user accepts consent
- `onDecline: () => void` - Called when user declines consent
- `isLoading?: boolean` - Shows loading state on accept button

**Features:**
- Comprehensive consent information
- Acknowledgment checkbox (prevents accidental clicks)
- Links to privacy policies
- Mobile-responsive layout
- Accessible (ARIA labels, keyboard navigation)
- Scrollable content area

**Compliance:**
- GDPR Article 7 (Conditions for consent)
- GDPR Article 13 (Information to be provided)
- Apple App Store Review Guidelines 5.1.2
- Google Play User Data Policy

## Related Files

- `/hooks/useAIConsent.ts` - Hook for managing consent state
- `/components/settings/AISettings.tsx` - Settings panel for AI preferences
- `/app/(dashboard)/settings/ai/page.tsx` - AI settings page
- `/AI_CONSENT_FLOW.md` - Complete documentation

## Testing

To test the consent flow:

1. Clear consent data:
   ```js
   // In browser console
   localStorage.removeItem('ai_consent_data');
   ```

2. Navigate to `/chat`
3. Try to send a message
4. Consent dialog should appear
5. Read and accept/decline
6. Verify behavior matches choice

## Legal Considerations

Before deploying, ensure:

1. Privacy policy includes AI data processing section
2. Terms of service mention third-party AI provider (Anthropic)
3. Data retention policy covers AI-processed data
4. User rights documentation (access, delete, opt-out)

## Support

For questions about implementation:
- See `/AI_CONSENT_FLOW.md` for complete documentation
- Check console for error messages
- Verify `useSecureStorage` is working correctly
- Test on both web and native platforms
