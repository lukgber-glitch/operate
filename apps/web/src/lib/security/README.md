# Security Module - SSL Certificate Pinning

## Overview

This module implements SSL certificate pinning for the Operate mobile apps (iOS/Android). Certificate pinning prevents Man-in-the-Middle (MITM) attacks by validating that the server's SSL certificate matches a known, trusted certificate pin.

## How It Works

### Web vs. Mobile

- **Web browsers**: Use standard HTTPS validation (built into the browser)
- **Mobile apps** (iOS/Android): Use certificate pinning via Capacitor HTTP plugin

### Pinning Process

1. App makes API request to `https://operate.guru/api/v1`
2. System checks if running on mobile (Capacitor detected)
3. If mobile + pinning enabled:
   - Uses Capacitor HTTP plugin with certificate pins
   - Server certificate is validated against stored pins
   - Request fails if certificate doesn't match (MITM protection)
4. If web or pinning disabled:
   - Falls back to standard fetch/HTTPS

## Files

```
apps/web/src/lib/security/
├── ssl-pinning.ts       # Core pinning logic and configuration
├── pinned-fetch.ts      # Fetch wrapper with pinning support
├── index.ts             # Module exports
└── README.md            # This file
```

## Configuration

### Environment Variables

```bash
# Disable pinning (for testing/development)
NEXT_PUBLIC_DISABLE_SSL_PINNING=true

# Pinning is automatically enabled in production builds
NODE_ENV=production
```

### Certificate Pins

Located in `ssl-pinning.ts`:

```typescript
export const CERTIFICATE_PINS = {
  'operate.guru': [
    'PRIMARY_CERTIFICATE_PIN_HERE',
    'BACKUP_CERTIFICATE_PIN_HERE',
  ],
};
```

## Generating Certificate Pins

### Step 1: Get the Certificate

```bash
openssl s_client -connect operate.guru:443 -servername operate.guru < /dev/null | openssl x509 -outform PEM > operate.pem
```

### Step 2: Extract and Hash the Public Key

```bash
openssl x509 -in operate.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

This outputs a base64-encoded SHA-256 hash like:
```
Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=
```

### Step 3: Update Configuration

Replace placeholder pins in `ssl-pinning.ts`:

```typescript
export const CERTIFICATE_PINS = {
  'operate.guru': [
    'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=', // Current cert
    'YnBvF9wQIMnRDKksNLrQiOCnQDwi4q1yrQLgO6lTjRF=', // Backup cert
  ],
};
```

## Certificate Rotation

### Why We Need Backup Pins

SSL certificates expire and need to be renewed. To prevent app breakage during rotation, we maintain 2 pins:
- **Primary pin**: Current active certificate
- **Backup pin**: Next certificate (for rotation)

### Rotation Process

#### Before Certificate Renewal

1. Generate pin for the new certificate (Step 2 above)
2. Add new pin to backup position in `CERTIFICATE_PINS`
3. Deploy app update with both pins
4. Wait for users to update (monitor app versions)

#### After Certificate Renewal

1. Server now uses new certificate
2. App validates against backup pin (success!)
3. Users on old app version continue working

#### Cleanup

1. Remove old pin from configuration
2. Add new backup pin (for next rotation)
3. Deploy update

### Example Timeline

```
Week 0:  Old cert (pin A) active, backup (pin B) configured
         Users update app → have both pins

Week 1:  Certificate renewed → new cert (pin B) active
         Updated users → validate with pin B ✓
         Old users → validate with pin A ✗ (broken)

Week 2:  Deploy update → remove pin A, add pin C
         All users on pin B + pin C
```

## Installation

### Prerequisites

```bash
# Install Capacitor HTTP plugin
npm install @capacitor/http

# Sync with native projects
npx cap sync
```

### iOS Configuration

Add to `apps/mobile/ios/App/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
```

### Android Configuration

No additional configuration needed. Capacitor HTTP handles pinning automatically.

## Usage

### Automatic (Recommended)

The API client automatically uses pinned fetch:

```typescript
import { api } from '@/lib/api/client';

// Automatically uses pinned fetch on mobile
const response = await api.get('/users');
```

### Manual

```typescript
import { pinnedFetch } from '@/lib/security';

// Direct usage
const response = await pinnedFetch('https://operate.guru/api/v1/users', {
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
});

const data = await response.json();
```

### Check Pinning Status

```typescript
import { getPinnedFetchStatus, initializeSSLPinning } from '@/lib/security';

// Initialize during app startup
initializeSSLPinning();

// Check status
const status = getPinnedFetchStatus();
console.log(status);
// {
//   available: true,
//   reason: 'Ready to use pinned fetch',
//   platform: 'ios',
//   capacitorAvailable: true
// }
```

## Security Considerations

### Threat Model

**Protects Against:**
- MITM attacks on public WiFi
- Compromised Certificate Authorities
- DNS hijacking attacks
- Rogue access points

**Does NOT Protect Against:**
- Server compromise (pins verify server identity, not integrity)
- Client-side malware
- Physical device access

### Best Practices

1. **Always maintain 2+ pins** for rotation
2. **Monitor certificate expiry** (set reminders 30 days before)
3. **Test rotation process** in staging environment
4. **Log pinning failures** for security monitoring
5. **Plan for emergency rotation** (compromised cert)

### Emergency Certificate Rotation

If a certificate is compromised:

1. Deploy new certificate to server immediately
2. Generate pin for new certificate
3. Release emergency app update with new pin
4. Force update or disable old app versions
5. Monitor for MITM attempts (pinning failures)

## Debugging

### Development Mode

Pinning logs are enabled in development:

```javascript
[SSL Pinning] Initializing...
  enabled: true
  isMobile: true
  platform: 'ios'

[Pinned Fetch] Using certificate pinning
  hostname: 'operate.guru'
  pinCount: 2
```

### Disable for Testing

```bash
# .env.local
NEXT_PUBLIC_DISABLE_SSL_PINNING=true
```

### Validate Configuration

```typescript
import { validatePins } from '@/lib/security';

const errors = validatePins();
if (errors.length > 0) {
  console.error('Pin validation failed:', errors);
}
```

### Common Issues

#### Issue: "Network request failed"

**Cause**: Certificate pin mismatch (MITM attempt or wrong pin)

**Solution**:
1. Verify certificate on server hasn't changed
2. Regenerate pins and update configuration
3. Check for proxy/VPN interference

#### Issue: "Capacitor HTTP plugin not installed"

**Cause**: Missing dependency

**Solution**:
```bash
npm install @capacitor/http
npx cap sync
```

#### Issue: Pinning works on iOS but not Android

**Cause**: Different certificate validation behavior

**Solution**:
- Ensure both platforms use same Capacitor version
- Test pins on both platforms
- Check Android logs for SSL errors

## Testing

### Test Checklist

- [ ] Web version works without pinning
- [ ] iOS app validates certificate correctly
- [ ] Android app validates certificate correctly
- [ ] Pin validation fails with wrong certificate
- [ ] Backup pins work during rotation
- [ ] Development mode logging works
- [ ] Production mode disables logs
- [ ] Pin format validation works

### Test Scenarios

```typescript
// Test 1: Normal request (should succeed)
const response = await api.get('/users');

// Test 2: Disable pinning (should succeed)
process.env.NEXT_PUBLIC_DISABLE_SSL_PINNING = 'true';
const response2 = await api.get('/users');

// Test 3: Invalid pin (should fail)
// Manually edit CERTIFICATE_PINS with wrong value
const response3 = await api.get('/users'); // Network error

// Test 4: Platform detection
import { isMobileApp, getPlatform } from '@/lib/security';
console.log(isMobileApp()); // true on mobile
console.log(getPlatform()); // 'ios' or 'android' or 'web'
```

## Performance Impact

- **Web**: No impact (uses standard fetch)
- **Mobile**: Minimal impact (<10ms per request for pin validation)
- **First request**: Slightly slower (certificate chain validation)
- **Subsequent requests**: Cached validation (faster)

## Compliance

### Regulations Supported

- **GDPR**: Protects user data in transit
- **PCI DSS**: Requirement 4.1 (secure transmission)
- **HIPAA**: Encryption in transit (if handling health data)
- **SOC 2**: Transport security controls

### Audit Trail

All pinning failures should be logged for security monitoring:

```typescript
// Add to error handler
if (error.message.includes('certificate')) {
  logger.security('SSL pinning failure', {
    url: request.url,
    error: error.message,
    timestamp: new Date(),
  });
}
```

## Resources

- [OWASP Certificate Pinning Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html)
- [Capacitor HTTP Plugin Docs](https://capacitorjs.com/docs/apis/http)
- [SSL Certificate Validation RFC](https://tools.ietf.org/html/rfc5280)

## Support

For questions or issues:
1. Check logs in development mode
2. Validate pin configuration
3. Test on actual devices (not simulators)
4. Review Capacitor HTTP plugin documentation
