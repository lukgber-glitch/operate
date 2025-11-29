# Multi-Factor Authentication (MFA) Implementation

## Overview

This implementation provides TOTP-based (Time-based One-Time Password) Multi-Factor Authentication for the Operate/CoachOS platform. It follows security best practices and provides a complete MFA lifecycle including setup, verification, backup codes, and recovery.

## Features

- **TOTP-based MFA** - Google Authenticator compatible
- **QR Code Generation** - Easy setup with any authenticator app
- **Backup Codes** - 10 one-time use codes for device recovery
- **Encrypted Storage** - TOTP secrets are stored securely
- **Hashed Backup Codes** - Backup codes are bcrypt-hashed before storage
- **MFA Guard** - Protect sensitive operations with `@RequireMfa()` decorator
- **Recovery Flow** - Lost device recovery using backup codes

## Architecture

### Components

1. **MfaService** (`mfa.service.ts`)
   - TOTP secret generation
   - QR code generation
   - Token verification
   - Backup code management
   - MFA enable/disable logic

2. **MfaController** (`mfa.controller.ts`)
   - REST API endpoints for MFA operations
   - JWT-authenticated endpoints
   - Swagger/OpenAPI documentation

3. **MfaGuard** (`guards/mfa.guard.ts`)
   - Route protection requiring MFA to be enabled
   - Works with `@RequireMfa()` decorator

4. **RequireMfa Decorator** (`decorators/require-mfa.decorator.ts`)
   - Marks routes as requiring MFA
   - Use with `MfaGuard` for enforcement

### Database Schema

The User model includes:
```prisma
model User {
  // ... other fields
  mfaEnabled  Boolean  @default(false)
  mfaSecret   String?                    // TOTP secret (base32)
  backupCodes String[] @default([])      // Hashed backup codes
}
```

## API Endpoints

All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`).

### 1. Setup MFA
**POST** `/api/v1/auth/mfa/setup`

Generates TOTP secret and QR code for MFA setup.

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "otpAuthUrl": "otpauth://totp/Operate:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Operate"
}
```

**Notes:**
- Can only be called when MFA is not already enabled
- Secret is stored temporarily until verification

### 2. Enable MFA
**POST** `/api/v1/auth/mfa/enable`

Verifies TOTP code and enables MFA.

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA enabled successfully. Save your backup codes securely.",
  "backupCodes": [
    "ABC12-DEF34",
    "GHI56-JKL78",
    // ... 8 more codes
  ]
}
```

**Notes:**
- TOTP code must be valid
- Returns backup codes (ONLY shown once)
- Backup codes are hashed before database storage

### 3. Verify MFA (Login Flow)
**POST** `/api/v1/auth/mfa/verify`

Verifies TOTP code or backup code during login.

**Request:**
```json
{
  "token": "123456"  // or backup code like "ABC12-DEF34"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA verified successfully"
}
```

**Notes:**
- Accepts 6-digit TOTP code OR backup code
- Backup codes are consumed on use

### 4. Disable MFA
**POST** `/api/v1/auth/mfa/disable`

Disables MFA for the user (requires current TOTP code).

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

**Notes:**
- Requires valid TOTP code for security
- Clears secret and backup codes from database

### 5. Regenerate Backup Codes
**POST** `/api/v1/auth/mfa/backup-codes`

Generates new backup codes (replaces all existing ones).

**Response:**
```json
{
  "backupCodes": [
    "ABC12-DEF34",
    "GHI56-JKL78",
    // ... 8 more codes
  ],
  "message": "Store these backup codes securely. They can only be used once and will not be shown again."
}
```

**Notes:**
- Requires MFA to be enabled
- Old backup codes are invalidated
- New codes are shown only once

### 6. Recover Account
**POST** `/api/v1/auth/mfa/recover`

Uses backup code to verify identity when MFA device is lost.

**Request:**
```json
{
  "backupCode": "ABC12-DEF34"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup code verified successfully. Access granted.",
  "remainingCodes": 9
}
```

**Notes:**
- Backup code is consumed on successful verification
- Returns count of remaining codes

## Login Flow with MFA

### 1. Initial Login (MFA Disabled)
```
POST /api/v1/auth/login
→ Returns accessToken, refreshToken
```

### 2. Initial Login (MFA Enabled)
```
POST /api/v1/auth/login
→ Returns: {
    requiresMfa: true,
    mfaToken: "temp-token-for-verification",
    message: "Please provide your MFA code to complete login"
  }

POST /api/v1/auth/mfa/complete
  Body: { mfaToken: "...", mfaCode: "123456" }
→ Returns accessToken, refreshToken
```

### 3. Complete MFA Login
**POST** `/api/v1/auth/mfa/complete`

Completes MFA verification and issues final tokens.

**Request:**
```json
{
  "mfaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mfaCode": "123456"  // or backup code
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "requiresMfa": false,
  "message": "Login successful"
}
```

## Usage Examples

### Protecting Routes with MFA Guard

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, MfaGuard, RequireMfa } from '../auth';

@Controller('api/v1/sensitive')
export class SensitiveController {

  // Both JWT auth AND MFA required
  @UseGuards(JwtAuthGuard, MfaGuard)
  @RequireMfa()
  @Post('delete-account')
  async deleteAccount() {
    // Only users with MFA enabled can access this
  }

  // JWT auth required, MFA optional
  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  async updateProfile() {
    // All authenticated users can access this
  }
}
```

### Client-Side Integration

```typescript
// 1. User logs in
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const data = await loginResponse.json();

if (data.requiresMfa) {
  // 2. Show MFA input form
  const mfaCode = prompt('Enter your MFA code:');

  // 3. Complete MFA verification
  const mfaResponse = await fetch('/api/v1/auth/mfa/complete', {
    method: 'POST',
    body: JSON.stringify({
      mfaToken: data.mfaToken,
      mfaCode: mfaCode,
    }),
  });

  const finalData = await mfaResponse.json();
  // Store finalData.accessToken and finalData.refreshToken
} else {
  // No MFA required, store tokens directly
  // Store data.accessToken and data.refreshToken
}
```

### Setting Up MFA

```typescript
// 1. Initiate MFA setup
const setupResponse = await fetch('/api/v1/auth/mfa/setup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const { secret, qrCode, otpAuthUrl } = await setupResponse.json();

// 2. Display QR code to user
// User scans with Google Authenticator, Authy, etc.

// 3. User enters code from app to verify
const code = '123456'; // From authenticator app

const enableResponse = await fetch('/api/v1/auth/mfa/enable', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ token: code }),
});

const { backupCodes } = await enableResponse.json();

// 4. Display backup codes to user
// CRITICAL: User must save these securely
console.log('Save these backup codes:', backupCodes);
```

## Security Considerations

### 1. Secret Storage
- TOTP secrets are stored in the database as-is (base32 encoded)
- **TODO:** Consider encrypting secrets at rest using application-level encryption
- Never log secrets in application logs

### 2. Backup Code Storage
- Backup codes are hashed using bcrypt (10 rounds) before storage
- Codes are verified by comparing against all stored hashes
- Used codes are immediately removed from database

### 3. MFA Token Security
- Temporary MFA tokens expire after 5 minutes
- Include `mfaVerification: true` flag to prevent misuse
- Cannot be used to access protected resources

### 4. Rate Limiting
- **TODO:** Implement rate limiting on MFA verification endpoints
- Prevent brute-force attacks on TOTP codes
- Consider account lockout after N failed attempts

### 5. Audit Logging
- All MFA operations are logged (setup, enable, disable, verification)
- **TODO:** Integrate with AuditLog system for compliance
- Log includes: userId, action, timestamp, IP address

### 6. Time Synchronization
- TOTP uses 30-second time windows
- Allows 1 step before/after for clock drift tolerance
- Total acceptance window: 90 seconds (3 windows)

### 7. No Logging of Sensitive Data
- Secrets are NEVER logged
- Backup codes are NEVER logged
- TOTP codes are NEVER logged
- Only metadata (user ID, success/failure) is logged

## Dependencies

```json
{
  "otplib": "^12.0.1",      // TOTP generation and verification
  "qrcode": "^1.5.3",       // QR code generation
  "bcryptjs": "^2.4.3"      // Backup code hashing (already in deps)
}
```

## Testing

### Manual Testing

1. **Setup MFA:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Verify with Google Authenticator:**
   - Scan QR code
   - Enter 6-digit code
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/mfa/enable \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"token":"123456"}'
   ```

3. **Test Login Flow:**
   ```bash
   # Login returns mfaToken
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'

   # Complete with MFA code
   curl -X POST http://localhost:3000/api/v1/auth/mfa/complete \
     -H "Content-Type: application/json" \
     -d '{"mfaToken":"...","mfaCode":"123456"}'
   ```

### Unit Tests
- **TODO:** Add unit tests for MfaService
- **TODO:** Add integration tests for MFA endpoints
- **TODO:** Test backup code generation and verification
- **TODO:** Test MFA guard behavior

## Future Enhancements

1. **SMS/Email Backup Options**
   - Allow SMS or email as MFA fallback
   - Requires phone number/email verification

2. **WebAuthn/FIDO2 Support**
   - Hardware security key support
   - Biometric authentication

3. **Trusted Devices**
   - Remember device for N days
   - Skip MFA on trusted devices

4. **MFA Enforcement Policies**
   - Organization-level MFA requirement
   - Role-based MFA requirements

5. **Recovery Email**
   - Send recovery code via email
   - Requires secondary email verification

6. **Account Lockout**
   - Lock account after N failed MFA attempts
   - Admin or time-based unlock

## Compliance

This implementation supports:
- **SOC 2 Type II** - Multi-factor authentication requirement
- **ISO 27001** - Access control best practices
- **GDPR** - Secure authentication and data protection
- **PCI DSS** - MFA for administrative access (if applicable)

## Support

For issues or questions:
- Security issues: security@operate.com (do NOT file public issues)
- Feature requests: GitHub Issues
- Documentation: See README.md and inline code comments
