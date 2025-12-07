# Secure Storage Implementation

## Overview

This implementation provides secure token storage for mobile apps using iOS Keychain and Android Keystore, with automatic fallback to localStorage for web browsers.

## Features

- **iOS Keychain**: Native secure storage on iOS devices
- **Android Keystore**: Hardware-backed secure storage on Android devices
- **Web Fallback**: Base64-encoded localStorage for web browsers
- **Platform Detection**: Automatic platform detection using Capacitor
- **Type-Safe**: Full TypeScript support with type definitions
- **React Hook**: Easy-to-use React hook for component integration

## Installation

The required dependencies are already installed:
- `@capacitor/core` (v7.4.4)
- `@capgo/capacitor-native-biometric` (v7.6.0)

## Usage

### Using the React Hook (Recommended)

```typescript
import { useSecureStorage } from '@/hooks/useSecureStorage';

function MyComponent() {
  const { storeToken, retrieveToken, removeToken, isNativeSecure, isLoading } = useSecureStorage();

  const handleLogin = async () => {
    const success = await storeToken('access_token', 'abc123xyz');
    if (success) {
      console.log('Token stored securely');
    }
  };

  const handleGetToken = async () => {
    const token = await retrieveToken('access_token');
    if (token) {
      console.log('Retrieved token:', token);
    }
  };

  const handleLogout = async () => {
    const success = await removeToken('access_token');
    if (success) {
      console.log('Token removed');
    }
  };

  return (
    <div>
      <p>Native Security: {isNativeSecure ? 'Enabled' : 'Fallback Mode'}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleGetToken}>Get Token</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Using the Service Directly

```typescript
import {
  setSecureToken,
  getSecureToken,
  deleteSecureToken,
  isSecureStorageAvailable,
} from '@/lib/security';

// Check if native secure storage is available
const isNative = isSecureStorageAvailable();
console.log('Native secure storage:', isNative);

// Store a token
const stored = await setSecureToken('refresh_token', 'xyz789');
if (stored) {
  console.log('Token stored successfully');
}

// Retrieve a token
const token = await getSecureToken('refresh_token');
if (token) {
  console.log('Token:', token);
}

// Delete a token
const deleted = await deleteSecureToken('refresh_token');
if (deleted) {
  console.log('Token deleted successfully');
}
```

### Advanced: Storing Credentials

```typescript
import {
  setSecureCredentials,
  getSecureCredentials,
  deleteSecureCredentials,
} from '@/lib/security';

// Store username and password
await setSecureCredentials('user@example.com', 'password123', {
  server: 'api.operate.guru',
});

// Retrieve credentials
const creds = await getSecureCredentials({ server: 'api.operate.guru' });
if (creds) {
  console.log('Username:', creds.username);
  console.log('Password:', creds.password);
}

// Delete credentials
await deleteSecureCredentials({ server: 'api.operate.guru' });
```

## API Reference

### `useSecureStorage()` Hook

Returns an object with the following properties:

- `isNativeSecure: boolean` - Whether native secure storage is available
- `isLoading: boolean` - Loading state for async operations
- `storeToken(key: string, token: string): Promise<boolean>` - Store a token
- `retrieveToken(key: string): Promise<string | null>` - Retrieve a token
- `removeToken(key: string): Promise<boolean>` - Remove a token

### Service Functions

#### `isSecureStorageAvailable(): boolean`
Check if native secure storage is available.

#### `setSecureToken(key: string, token: string): Promise<boolean>`
Store an auth token securely.

**Parameters:**
- `key` - Unique identifier for the token
- `token` - The token value to store

**Returns:** `true` if successful, `false` otherwise

#### `getSecureToken(key: string): Promise<string | null>`
Retrieve an auth token.

**Parameters:**
- `key` - Unique identifier for the token

**Returns:** The token value or `null` if not found

#### `deleteSecureToken(key: string): Promise<boolean>`
Delete an auth token.

**Parameters:**
- `key` - Unique identifier for the token

**Returns:** `true` if successful, `false` otherwise

#### `setSecureCredentials(username, password, options?): Promise<boolean>`
Store username and password credentials.

**Parameters:**
- `username` - The username
- `password` - The password
- `options.server` - Optional server identifier (default: 'operate.guru')

#### `getSecureCredentials(options?): Promise<{username, password} | null>`
Retrieve stored credentials.

**Parameters:**
- `options.server` - Optional server identifier (default: 'operate.guru')

#### `deleteSecureCredentials(options?): Promise<boolean>`
Delete stored credentials.

**Parameters:**
- `options.server` - Optional server identifier (default: 'operate.guru')

## Platform Behavior

### iOS / Android (Native Apps)
- Uses `@capgo/capacitor-native-biometric` plugin
- iOS: Stores data in iOS Keychain
- Android: Stores data in Android Keystore (hardware-backed if available)
- Data is encrypted and protected by the OS
- Survives app uninstalls (on some devices)

### Web Browser (Fallback)
- Uses `localStorage` with Base64 encoding
- Less secure than native storage
- Data persists until cleared by user or code
- Should be used for development/testing only

## Security Considerations

### On Mobile Apps
- Tokens are stored in secure, OS-level keystores
- Data is encrypted by the operating system
- Access is limited to your app only
- Survives app restarts and device reboots

### On Web
- Uses Base64 encoding (NOT encryption)
- Vulnerable to XSS attacks
- Should only store tokens with short expiration
- Consider using HttpOnly cookies for production web apps

### Best Practices
1. Always use HTTPS when transmitting tokens
2. Store only access/refresh tokens, not passwords
3. Implement token rotation and expiration
4. Clear tokens on logout
5. Never log token values in production
6. Use native apps for production (avoid web fallback)

## Testing

Run the test suite:

```bash
pnpm test secure-storage
pnpm test useSecureStorage
```

## Troubleshooting

### Plugin not found error
Make sure to run `npx cap sync` after installing the plugin:
```bash
cd apps/web
npx cap sync ios
npx cap sync android
```

### Tokens not persisting
- Check if the token key is consistent
- Verify the platform (native vs web)
- Check device storage permissions

### iOS Keychain errors
- Ensure proper code signing in Xcode
- Check keychain access entitlements
- Try cleaning and rebuilding the app

### Android Keystore errors
- Verify app signature
- Check device security settings
- Try clearing app data and reinstalling

## Migration Guide

### From Cookie-based Storage

```typescript
// Before
document.cookie = `token=${value}`;

// After
import { setSecureToken } from '@/lib/security';
await setSecureToken('token', value);
```

### From localStorage

```typescript
// Before
localStorage.setItem('access_token', token);
const token = localStorage.getItem('access_token');
localStorage.removeItem('access_token');

// After
import { setSecureToken, getSecureToken, deleteSecureToken } from '@/lib/security';
await setSecureToken('access_token', token);
const token = await getSecureToken('access_token');
await deleteSecureToken('access_token');
```

## Future Enhancements

- [ ] Add biometric authentication for token access
- [ ] Implement token encryption for web fallback
- [ ] Add token expiration metadata
- [ ] Support for multiple user accounts
- [ ] Automatic token refresh integration
- [ ] Secure storage analytics/monitoring
