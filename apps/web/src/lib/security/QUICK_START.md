# SSL Certificate Pinning - Quick Start Guide

## For Developers

### What is SSL Pinning?

SSL certificate pinning validates that the server's certificate matches a known, trusted certificate. This prevents Man-in-the-Middle (MITM) attacks where an attacker intercepts communications.

### When Does It Apply?

- **Mobile Apps** (iOS/Android): SSL pinning is ACTIVE
- **Web Browsers**: Standard HTTPS validation (pinning not needed)

### Current Status

```bash
# Check pinning status
cd apps/web/src/lib/security
npm test -- ssl-pinning.test.ts
```

---

## Quick Tasks

### 1. Check Configuration

```typescript
import { runDevelopmentChecks } from '@/lib/security';

// Run during app initialization (development only)
runDevelopmentChecks();
```

Output shows:
- Current platform (web/ios/android)
- Pin validation status
- Certificate rotation recommendations

### 2. Generate New Pins

When SSL certificate is renewed:

```bash
# Run from project root
./scripts/generate-ssl-pins.sh operate.guru

# Output will show:
# - Certificate info
# - SHA-256 pin (base64)
# - TypeScript config to copy/paste
```

### 3. Update Pins

Edit `apps/web/src/lib/security/ssl-pinning.ts`:

```typescript
export const CERTIFICATE_PINS: Record<string, string[]> = {
  'operate.guru': [
    'NEW_PIN_FROM_SCRIPT_HERE',  // Current certificate
    'BACKUP_PIN_FOR_ROTATION',   // Next certificate
  ],
};
```

### 4. Test Changes

```bash
# Run tests
npm test -- ssl-pinning.test.ts

# Check in browser console (development)
# Should see: [SSL Pinning] Initializing...
```

---

## Certificate Rotation Workflow

### Timeline

```
Day 0:   Certificate expires in 30 days
         ↓
Day 1:   Generate pin for new certificate
         Add as backup pin
         Deploy app update
         ↓
Day 7:   Most users updated (monitor metrics)
         ↓
Day 14:  Renew certificate on server
         App validates with backup pin ✓
         ↓
Day 21:  Deploy update: remove old pin, add new backup
```

### Steps

#### 1. Before Renewal (30 days before expiry)

```bash
# Generate pin for NEW certificate (get from certificate provider)
./scripts/generate-ssl-pins.sh operate.guru

# Update config with both pins
export const CERTIFICATE_PINS = {
  'operate.guru': [
    'OLD_PIN_CURRENT_CERT',  // Current cert (still active)
    'NEW_PIN_NEXT_CERT',     // New cert (for rotation)
  ],
};

# Deploy app update
git add apps/web/src/lib/security/ssl-pinning.ts
git commit -m "feat: add backup SSL certificate pin for rotation"
git push

# Wait 1-2 weeks for users to update
```

#### 2. Certificate Renewal Day

```bash
# Renew certificate on server
# App now validates with NEW_PIN_NEXT_CERT ✓

# Monitor for pinning failures
# Users on old app version may experience issues
```

#### 3. After Renewal (1-2 weeks later)

```bash
# Generate pin for NEXT certificate
./scripts/generate-ssl-pins.sh operate.guru

# Update config: remove old, add new backup
export const CERTIFICATE_PINS = {
  'operate.guru': [
    'NEW_PIN_NEXT_CERT',        // Current cert
    'BACKUP_PIN_FUTURE_CERT',   // Next rotation
  ],
};

# Deploy cleanup update
git add apps/web/src/lib/security/ssl-pinning.ts
git commit -m "chore: update SSL certificate pins after rotation"
git push
```

---

## Common Issues

### Issue 1: "Certificate pin mismatch"

**Symptoms**: Network requests fail on mobile, work on web

**Cause**: Server certificate changed, pins not updated

**Fix**:
```bash
# Generate new pins
./scripts/generate-ssl-pins.sh operate.guru

# Update ssl-pinning.ts with new pin
# Deploy app update
```

### Issue 2: "Pinning disabled in development"

**Symptoms**: Pinning logs show "DISABLED"

**Expected**: This is normal! Pinning only runs in production.

**To test in development**:
```bash
# Temporarily enable
export NODE_ENV=production

# Or disable the feature flag
export NEXT_PUBLIC_DISABLE_SSL_PINNING=true
```

### Issue 3: "Placeholder pins detected"

**Symptoms**: Validation warnings about placeholder pins

**Cause**: Real certificate pins not yet generated

**Fix**:
```bash
./scripts/generate-ssl-pins.sh operate.guru
# Copy output to ssl-pinning.ts
```

### Issue 4: "Capacitor HTTP plugin not installed"

**Symptoms**: Mobile app doesn't use pinning

**Cause**: Missing dependency

**Fix**:
```bash
npm install @capacitor/http
npx cap sync
```

---

## Testing

### Unit Tests

```bash
# Run SSL pinning tests
npm test -- ssl-pinning.test.ts

# Watch mode
npm test -- ssl-pinning.test.ts --watch
```

### Manual Testing

#### Test on iOS

```bash
# Build and deploy to iOS simulator
npm run build
npx cap copy ios
npx cap open ios

# Check Xcode console for:
# [SSL Pinning] Initializing...
# [Pinned Fetch] Using certificate pinning
```

#### Test on Android

```bash
# Build and deploy to Android
npm run build
npx cap copy android
npx cap open android

# Check Logcat for SSL pinning messages
```

#### Test Pin Validation

```typescript
import { simulatePinValidation } from '@/lib/security';

// Test valid pin
const result = simulatePinValidation(
  'VALID_PIN_FROM_CONFIG',
  'operate.guru'
);
console.log(result); // { valid: true, reason: '...' }

// Test invalid pin (MITM simulation)
const result2 = simulatePinValidation(
  'FAKE_PIN_FROM_ATTACKER',
  'operate.guru'
);
console.log(result2); // { valid: false, reason: '...' }
```

---

## Emergency Procedures

### Certificate Compromised

If SSL certificate is compromised:

1. **Immediate**: Revoke certificate with provider
2. **Issue new certificate** on server
3. **Generate new pins**:
   ```bash
   ./scripts/generate-ssl-pins.sh operate.guru
   ```
4. **Force app update**:
   - Update pins in code
   - Deploy emergency release
   - Use in-app update prompts
   - Consider disabling old versions via API

5. **Monitor**:
   - Check for pinning failures (indicates MITM attempts)
   - Review security logs
   - Alert users if needed

### Pin Misconfiguration

If app breaks due to wrong pins:

1. **Disable pinning** temporarily:
   ```typescript
   // In ssl-pinning.ts
   export const PINNING_ENABLED = false;
   ```

2. **Deploy hotfix immediately**

3. **Fix pins offline**:
   ```bash
   ./scripts/generate-ssl-pins.sh operate.guru
   ```

4. **Re-enable pinning**:
   ```typescript
   export const PINNING_ENABLED =
     process.env.NODE_ENV === 'production';
   ```

5. **Deploy corrected version**

---

## Best Practices

### DO ✅

- Always maintain 2+ pins (current + backup)
- Generate backup pin BEFORE certificate renewal
- Test pinning on actual devices (not just simulators)
- Monitor pinning failures in production
- Document certificate expiry dates
- Set calendar reminders 30 days before expiry
- Test pin rotation in staging environment first

### DON'T ❌

- Don't pin leaf certificates only (use backup pins)
- Don't deploy app with placeholder pins
- Don't forget to update pins after renewal
- Don't test pinning only in web browsers
- Don't skip validation tests
- Don't hard-code certificate expiry dates
- Don't remove old pin immediately after renewal

---

## Resources

- [Full Documentation](./README.md)
- [OWASP Pinning Guide](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [Capacitor HTTP Plugin](https://capacitorjs.com/docs/apis/http)

## Support

Questions? Check:
1. This guide
2. [README.md](./README.md) for detailed docs
3. Test files for examples
4. Run `runDevelopmentChecks()` for diagnostics
