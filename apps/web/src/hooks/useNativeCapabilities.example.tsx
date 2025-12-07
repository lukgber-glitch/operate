/**
 * Example usage of useNativeCapabilities hook
 *
 * This file demonstrates how to use native capabilities in components
 */

import { useNativeCapabilities } from './useNativeCapabilities';
import { useNative } from '@/providers/NativeProvider';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';

export function ExampleComponent() {
  const {
    isNative,
    isPWA,
    isBrowser,
    platform,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    isOnline,
    networkStatus,
    keyboardVisible,
    keyboardHeight,
    isAppActive,
  } = useNativeCapabilities();

  const { isNativeReady, pushToken, registerPushNotifications } = useNative();

  // Example: Haptic feedback on button click
  const handleButtonClick = async () => {
    await hapticImpact(ImpactStyle.Medium);
    // Do your action...
  };

  // Example: Success notification with haptic
  const handleSuccess = async () => {
    await hapticNotification(NotificationType.Success);
    // Show success message...
  };

  // Example: Selection feedback for list items
  const handleItemSelect = async () => {
    await hapticSelection();
    // Handle selection...
  };

  // Example: Check network status before API call
  const handleApiCall = async () => {
    if (!isOnline) {
      console.warn('No internet connection');
      return;
    }

    // Make API call...
  };

  // Example: Register for push notifications
  const handleEnableNotifications = async () => {
    await registerPushNotifications();
  };

  return (
    <div>
      {/* Platform info */}
      <div>
        <p>Platform: {platform}</p>
        <p>Native: {isNative ? 'Yes' : 'No'}</p>
        <p>PWA: {isPWA ? 'Yes' : 'No'}</p>
        <p>Browser: {isBrowser ? 'Yes' : 'No'}</p>
      </div>

      {/* Network status */}
      <div>
        <p>Online: {isOnline ? 'Yes' : 'No'}</p>
        {networkStatus && (
          <p>Connection Type: {networkStatus.connectionType}</p>
        )}
      </div>

      {/* Keyboard status (native only) */}
      {keyboardVisible && (
        <div>
          <p>Keyboard visible</p>
          <p>Height: {keyboardHeight}px</p>
        </div>
      )}

      {/* App state */}
      <div>
        <p>App Active: {isAppActive ? 'Yes' : 'No'}</p>
      </div>

      {/* Push notifications (native only) */}
      {isNative && (
        <div>
          <button onClick={handleEnableNotifications}>
            Enable Push Notifications
          </button>
          {pushToken && <p>Push Token: {pushToken}</p>}
        </div>
      )}

      {/* Examples */}
      <button onClick={handleButtonClick}>
        Button with Haptic Feedback
      </button>
      <button onClick={handleSuccess}>
        Success Action
      </button>
      <button onClick={handleItemSelect}>
        Select Item
      </button>
      <button onClick={handleApiCall}>
        Make API Call (checks network)
      </button>
    </div>
  );
}

/**
 * More examples:
 *
 * 1. Use haptic feedback on form validation errors:
 *    await hapticNotification(NotificationType.Error);
 *
 * 2. Use haptic feedback on swipe actions:
 *    await hapticImpact(ImpactStyle.Light);
 *
 * 3. Adjust UI based on keyboard visibility:
 *    style={{ paddingBottom: keyboardVisible ? keyboardHeight : 0 }}
 *
 * 4. Handle offline mode:
 *    if (!isOnline) {
 *      // Show cached data
 *      // Queue actions for later
 *    }
 *
 * 5. Deep linking:
 *    // Deep links are automatically handled by NativeProvider
 *    // Just make sure your routes exist in Next.js
 *
 * 6. Back button handling:
 *    // Automatically handled by NativeProvider on Android
 *    // Uses window.history.back() or exits app
 */
