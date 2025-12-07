# Biometric Authentication Components

## Quick Start

### Add to Login Page

```tsx
import { BiometricLoginButton } from '@/components/auth';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Your existing login form */}
      <form onSubmit={handlePasswordLogin}>
        {/* ... */}
      </form>

      {/* Biometric login option - only shows on supported devices */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <BiometricLoginButton
        onSuccess={async () => {
          // User authenticated with biometric
          // Implement auto-login here
          router.push('/dashboard');
        }}
        onError={(error) => {
          toast.error('Biometric authentication failed', {
            description: error,
          });
        }}
      />
    </div>
  );
}
```

### Use Prompt for Sensitive Actions

```tsx
import { BiometricPrompt } from '@/components/auth';
import { useState } from 'react';
import { toast } from 'sonner';

export function DangerousActionButton() {
  const [showPrompt, setShowPrompt] = useState(false);

  const handleDelete = async () => {
    // Show biometric verification first
    setShowPrompt(true);
  };

  const performDeletion = async () => {
    // Actually delete after verification
    await deleteAccount();
    toast.success('Account deleted');
  };

  return (
    <>
      <button onClick={handleDelete} className="btn-danger">
        Delete Account
      </button>

      <BiometricPrompt
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        onSuccess={() => {
          performDeletion();
          setShowPrompt(false);
        }}
        message="Verify your identity to delete your account"
        title="Confirm Deletion"
        allowSkip={false}
      />
    </>
  );
}
```

### Custom Implementation with Hook

```tsx
import { useBiometric } from '@/hooks/useBiometric';
import { useEffect } from 'react';

export function BiometricSettings() {
  const {
    isAvailable,
    biometricType,
    biometricLabel,
    isAuthenticating,
    authenticate,
  } = useBiometric();

  if (!isAvailable) {
    return (
      <div className="text-muted-foreground">
        Biometric authentication is not available on this device
      </div>
    );
  }

  const enableBiometric = async () => {
    const result = await authenticate('Enable biometric login');

    if (result.success) {
      // Save preference
      await updateSettings({ biometricEnabled: true });
      toast.success(`${biometricLabel} enabled successfully`);
    } else {
      toast.error('Failed to enable biometric', {
        description: result.error,
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Security</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Enable {biometricLabel}</p>
          <p className="text-sm text-muted-foreground">
            Quick login with {biometricType === 'face' ? 'Face ID' : 'fingerprint'}
          </p>
        </div>

        <button
          onClick={enableBiometric}
          disabled={isAuthenticating}
          className="btn-primary"
        >
          {isAuthenticating ? 'Authenticating...' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
```

## Components

### BiometricLoginButton

A pre-built button for biometric login.

**Features:**
- Only renders on supported devices
- Shows loading state
- Includes fingerprint icon
- Handles errors gracefully

**Props:**
```typescript
interface BiometricLoginButtonProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}
```

### BiometricPrompt

A modal dialog for biometric authentication.

**Features:**
- Auto-triggers on open
- Shows error messages
- Optional skip button
- Customizable text

**Props:**
```typescript
interface BiometricPromptProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (error: string) => void;
  message?: string;
  title?: string;
  allowSkip?: boolean;
}
```

## Hooks

### useBiometric

The main hook for biometric functionality.

**Returns:**
```typescript
{
  isAvailable: boolean;
  biometricType: 'face' | 'fingerprint' | 'iris' | 'none';
  biometricLabel: string; // e.g., "Face ID"
  isAuthenticating: boolean;
  authenticate: (reason?: string) => Promise<BiometricResult>;
  checkAvailability: () => Promise<void>;
}
```

## Best Practices

1. **Always provide fallback** - Never make biometric required
2. **User control** - Let users disable biometric anytime
3. **Clear messaging** - Explain what biometric auth does
4. **Handle errors** - Show user-friendly error messages
5. **Test on device** - Biometric won't work in browser/emulator

## Platform Support

- **iOS**: Face ID, Touch ID (iOS 11+)
- **Android**: Fingerprint, Face Unlock (Android 6+)
- **Web**: Not supported (components won't render)

## Security Notes

- Credentials should be stored in device secure storage (not localStorage)
- Never transmit biometric data over network
- Always have password fallback available
- Let users opt-out of biometric at any time

## Troubleshooting

**Button doesn't show:**
- Check if running on native platform (not web)
- Verify device has biometric hardware
- Ensure user has enrolled biometric credentials

**Authentication fails:**
- Check user has granted permissions
- Verify biometric is enrolled on device
- Check for sensor hardware issues

**Build errors:**
- Run `pnpm run cap:sync` after installing
- Check Capacitor config is correct
- Verify native dependencies are installed
