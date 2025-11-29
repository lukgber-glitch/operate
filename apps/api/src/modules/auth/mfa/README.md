# Multi-Factor Authentication (MFA) Module

## Overview

Complete TOTP-based Multi-Factor Authentication implementation for Operate/CoachOS.

**Status:** ✅ Implementation Complete
**Task:** OP-008
**Agent:** SENTINEL (Security Agent)

---

## Features

- ✅ TOTP setup flow (Google Authenticator compatible)
- ✅ QR code generation for easy setup
- ✅ 10 backup codes (one-time use, bcrypt hashed)
- ✅ MFA requirement enforcement via `@RequireMfa()` decorator
- ✅ Recovery flow for lost devices
- ✅ Integration with login flow
- ✅ Comprehensive security logging (no sensitive data)

---

## Quick Start

### 1. Install Dependencies

Already added to `package.json`:
```bash
pnpm install
```

Dependencies:
- `otplib@^12.0.1` - TOTP generation/verification
- `qrcode@^1.5.3` - QR code generation
- `bcryptjs@^2.4.3` - Backup code hashing (already installed)

### 2. Enable MFA for a User

```typescript
// User initiates MFA setup
POST /api/v1/auth/mfa/setup
Authorization: Bearer <access_token>

// Response includes QR code
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "otpAuthUrl": "otpauth://totp/..."
}

// User scans QR code with Google Authenticator

// User verifies and enables MFA
POST /api/v1/auth/mfa/enable
Authorization: Bearer <access_token>
{
  "token": "123456"
}

// Response includes backup codes (ONLY shown once!)
{
  "success": true,
  "message": "MFA enabled successfully",
  "backupCodes": ["ABC12-DEF34", ...]
}
```

### 3. Login with MFA

```typescript
// Step 1: Initial login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// If MFA enabled, response:
{
  "requiresMfa": true,
  "mfaToken": "temp-token...",
  "message": "Please provide your MFA code to complete login"
}

// Step 2: Complete MFA verification
POST /api/v1/auth/mfa/complete
{
  "mfaToken": "temp-token...",
  "mfaCode": "123456"  // or backup code
}

// Final response with tokens:
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### 4. Protect Routes with MFA

```typescript
import { Controller, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, MfaGuard, RequireMfa } from '../auth';

@Controller('api/v1/account')
export class AccountController {

  @UseGuards(JwtAuthGuard, MfaGuard)
  @RequireMfa()
  @Delete()
  async deleteAccount() {
    // Only users with MFA enabled can access this
  }
}
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/mfa/setup` | Generate TOTP secret & QR code | JWT |
| POST | `/api/v1/auth/mfa/enable` | Verify TOTP & enable MFA | JWT |
| POST | `/api/v1/auth/mfa/verify` | Verify MFA during login | JWT |
| POST | `/api/v1/auth/mfa/disable` | Disable MFA (requires TOTP) | JWT |
| POST | `/api/v1/auth/mfa/backup-codes` | Regenerate backup codes | JWT |
| POST | `/api/v1/auth/mfa/recover` | Recover account with backup code | JWT |
| POST | `/api/v1/auth/mfa/complete` | Complete MFA login flow | None |

---

## File Structure

```
apps/api/src/modules/auth/
├── mfa/
│   ├── mfa.service.ts                 # Core MFA logic
│   ├── mfa.controller.ts              # REST API endpoints
│   ├── mfa.module.ts                  # NestJS module
│   ├── index.ts                       # Exports
│   ├── dto/
│   │   ├── setup-mfa.dto.ts          # Setup response DTO
│   │   ├── verify-mfa.dto.ts         # Verify request/response DTOs
│   │   └── backup-codes.dto.ts       # Backup code DTOs
│   ├── MFA_IMPLEMENTATION.md         # Implementation guide
│   ├── SECURITY_NOTES.md             # Security documentation
│   └── README.md                     # This file
├── guards/
│   └── mfa.guard.ts                  # MFA enforcement guard
├── decorators/
│   └── require-mfa.decorator.ts      # @RequireMfa() decorator
└── dto/
    └── complete-mfa-login.dto.ts     # Complete MFA login DTO
```

---

## Security Features

### 1. TOTP Secret Security
- Generated using cryptographically secure random
- Base32 encoded for authenticator app compatibility
- Stored in database (recommend encryption at rest)
- Never logged

### 2. Backup Code Security
- 10 codes generated per user
- Format: `ABC12-DEF34` (easy to read/type)
- **Hashed with bcrypt** before database storage
- Consumed on use (one-time only)
- Never logged

### 3. MFA Token Security
- Short-lived (5 minutes)
- Contains `mfaVerification: true` flag
- Cannot access protected resources
- Single-use (new session on completion)

### 4. No Sensitive Logging
```typescript
// ✅ SAFE - Only metadata
this.logger.log(`MFA enabled for user: ${userId}`);

// ❌ NEVER LOGGED
// - TOTP secrets
// - Backup codes
// - TOTP verification codes
// - MFA tokens
```

### 5. Time Synchronization
- 30-second TOTP windows
- ±1 window tolerance (90 seconds total)
- Prevents issues with clock drift

---

## Configuration

Uses existing NestJS configuration:
```typescript
// config/app.config.ts
{
  app: {
    name: 'Operate', // Used in QR code "issuer" field
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    // MFA tokens use same secret with 5min expiry
  }
}
```

---

## Testing

### Manual Testing

```bash
# 1. Setup MFA
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer $TOKEN"

# 2. Enable MFA (after scanning QR code)
curl -X POST http://localhost:3000/api/v1/auth/mfa/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"123456"}'

# 3. Test login flow
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 4. Complete MFA
curl -X POST http://localhost:3000/api/v1/auth/mfa/complete \
  -H "Content-Type: application/json" \
  -d '{"mfaToken":"...","mfaCode":"123456"}'
```

### Unit Tests (TODO)
```bash
# Run tests
pnpm test auth/mfa

# Coverage
pnpm test:cov auth/mfa
```

---

## Integration

### With Existing Auth System
- MFA check integrated into `AuthService.login()`
- If `user.mfaEnabled = true`, returns MFA challenge
- Otherwise, proceeds with normal login flow

### With Audit Logging
```typescript
// TODO: Connect to AuditLog service
await this.auditLog.create({
  action: 'MFA_ENABLED',
  userId: user.id,
  // ... metadata
});
```

---

## Database Schema

Already implemented in Prisma schema:

```prisma
model User {
  // ... other fields
  mfaEnabled  Boolean  @default(false)
  mfaSecret   String?                    // TOTP secret
  backupCodes String[] @default([])      // Hashed backup codes
}
```

**No migration needed** - schema already includes MFA fields.

---

## Compliance

This implementation supports:
- **SOC 2 Type II** - Multi-factor authentication
- **ISO 27001** - Access control (A.9.2)
- **NIST SP 800-63B** - Level 2 authenticator
- **GDPR** - Security of processing (Art. 32)

---

## Known Limitations

### High Priority TODOs
1. **Rate Limiting** - Prevent brute-force attacks
   - Use `@nestjs/throttler`
   - Limit: 5 attempts per 15 minutes

2. **Application-Level Encryption** - Encrypt `mfaSecret` field
   - Use AES-256-GCM
   - Key rotation policy

3. **Audit Logging Integration** - Connect to AuditLog system
   - Log all MFA operations
   - Include IP, timestamp, success/failure

### Medium Priority
4. **Unit & Integration Tests**
5. **Account Lockout** - After N failed attempts
6. **WebAuthn Support** - Hardware keys

---

## Troubleshooting

### "Invalid TOTP code" error
- Check user's device time is synchronized
- We allow ±30 second window (90s total)
- Ensure user scanned correct QR code

### "MFA is already enabled" on setup
- User must disable MFA first
- Use `/mfa/disable` endpoint with current TOTP

### QR code not scanning
- Ensure QR code is displayed at sufficient size
- Try manual entry using `secret` field
- Check authenticator app compatibility

### User lost device
1. Use backup code to login
2. Disable MFA
3. Setup MFA with new device

### User lost backup codes
1. Login with TOTP from device
2. Regenerate backup codes at `/mfa/backup-codes`

---

## Support

**Security Issues:** Do NOT file public GitHub issues
- Email: security@operate.com

**Feature Requests:** GitHub Issues

**Documentation:**
- `MFA_IMPLEMENTATION.md` - Detailed implementation guide
- `SECURITY_NOTES.md` - Security considerations & threat model
- `README.md` - This quick start guide

---

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
Copyright © 2024 Operate
