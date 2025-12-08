# Authentication Security Features - Quick Reference

## Overview
The Operate API authentication system includes enterprise-grade security features to protect user accounts and prevent common attacks.

---

## 🔄 Refresh Token Rotation (SEC-005)

### What It Does
Automatically rotates refresh tokens on every use. Old tokens are immediately invalidated.

### How It Works
```typescript
// Client makes refresh request
POST /auth/refresh

// Server responds with NEW tokens
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",  // <-- NEW token, old one is invalidated
  "expiresIn": 900
}
```

### Token Reuse Detection
If a client tries to reuse an already-used refresh token:
1. Request is rejected with `401 Unauthorized`
2. ALL user sessions are invalidated (security measure)
3. Event is logged in `TokenRefreshHistory` for forensics

### Usage
```typescript
// In auth.service.ts
const result = await this.authService.refresh(
  refreshToken,
  ipAddress,    // For audit trail
  userAgent     // For audit trail
);
```

---

## 🔒 Session Limits (SEC-006)

### What It Does
Limits users to maximum 5 concurrent active sessions.

### How It Works
When a user logs in:
1. Count their active sessions (non-expired)
2. If count >= 5, delete oldest session
3. Create new session

### Configuration
```typescript
// auth.service.ts
private readonly MAX_SESSIONS_PER_USER = 5;
```

### Query Active Sessions
```sql
-- Check user's session count
SELECT COUNT(*) FROM "Session"
WHERE "userId" = '<user_id>'
AND "expiresAt" > NOW();
```

---

## 🔐 Password Policy (SEC-007)

### Requirements
Passwords MUST contain:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (@$!%*?&#^()_+=-[]{}|;:',.<>/\)

### Valid Examples
```
SecureP@ssw0rd
MyP@ssw0rd123!
Test#Pass123
Operate!2025
```

### Invalid Examples
```
Password123    ❌ Missing special character
password!      ❌ Missing uppercase and number
PASS!2025      ❌ Missing lowercase
Short1!        ❌ Less than 8 characters
```

### Implementation
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>\/\\])/, {
  message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
})
password: string;
```

---

## 🚦 Rate Limiting (SEC-008)

### Rate Limit Tiers

| Tier | Limit | Endpoints | Purpose |
|------|-------|-----------|---------|
| **auth** | 5/min | Login, Register, MFA | Prevent brute force |
| **sensitive** | 10/min | Password change, Set password | Protect account ops |
| **file-upload** | 20/min | File uploads | Prevent DoS |
| **default** | 100/min | General API | Overall protection |

### Usage in Controllers

#### Auth Endpoints
```typescript
@Post('login')
@Throttle({ auth: { limit: 5, ttl: 60000 } })
async login() { ... }
```

#### Sensitive Operations
```typescript
@Post('password/change')
@Throttle({ sensitive: { limit: 10, ttl: 60000 } })
async changePassword() { ... }
```

#### File Uploads
```typescript
@Post('upload')
@Throttle({ 'file-upload': { limit: 20, ttl: 60000 } })
async uploadFile() { ... }
```

### Response When Rate Limited
```json
{
  "statusCode": 429,
  "message": "Too Many Requests - Rate limit exceeded",
  "error": "Too Many Requests"
}
```

---

## 📊 Audit & Monitoring

### Token Refresh History
Query all token refreshes:
```sql
SELECT
  "userId",
  "ipAddress",
  "userAgent",
  "refreshedAt"
FROM "TokenRefreshHistory"
ORDER BY "refreshedAt" DESC
LIMIT 100;
```

### Session Management
Count sessions per user:
```sql
SELECT
  "userId",
  COUNT(*) as session_count
FROM "Session"
WHERE "expiresAt" > NOW()
GROUP BY "userId"
ORDER BY session_count DESC;
```

Find users at session limit:
```sql
SELECT
  "userId",
  COUNT(*) as session_count
FROM "Session"
WHERE "expiresAt" > NOW()
GROUP BY "userId"
HAVING COUNT(*) >= 5;
```

### Token Reuse Attempts
Monitor for security incidents:
```sql
-- Sessions marked as used
SELECT * FROM "Session"
WHERE "isUsed" = true
ORDER BY "createdAt" DESC;
```

---

## 🛡️ Security Best Practices

### For Frontend Developers

#### 1. Handle Token Rotation
```typescript
// OLD (before SEC-005)
// Refresh token never changed

// NEW (after SEC-005)
// Store NEW refresh token on every refresh
const { accessToken, refreshToken } = await api.post('/auth/refresh');
localStorage.setItem('refreshToken', refreshToken); // Update stored token
```

#### 2. Handle Rate Limiting
```typescript
try {
  await api.post('/auth/login', credentials);
} catch (error) {
  if (error.status === 429) {
    // Rate limited - wait before retrying
    showError('Too many attempts. Please wait a moment.');
  }
}
```

#### 3. Password Validation
```typescript
// Client-side validation (matches server policy)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>\/\\])/;

function validatePassword(password: string): boolean {
  return password.length >= 8 && passwordRegex.test(password);
}
```

### For Backend Developers

#### 1. Always Pass Context to refresh()
```typescript
// GOOD - includes audit information
const ipAddress = req.ip || req.socket.remoteAddress;
const userAgent = req.get('user-agent');
await authService.refresh(token, ipAddress, userAgent);

// BAD - no audit trail
await authService.refresh(token);
```

#### 2. Use Appropriate Rate Limits
```typescript
// Auth endpoints - strictest
@Throttle({ auth: { limit: 5, ttl: 60000 } })

// Sensitive operations - moderate
@Throttle({ sensitive: { limit: 10, ttl: 60000 } })

// File uploads - relaxed but protected
@Throttle({ 'file-upload': { limit: 20, ttl: 60000 } })

// Default - general protection
@Throttle({ default: { limit: 100, ttl: 60000 } })
```

#### 3. Monitor Security Events
```typescript
// Log token reuse attempts
if (session.isUsed) {
  this.logger.warn(
    `Token reuse detected for user ${userId} - invalidating all sessions`
  );
  await this.logoutAll(userId);
}
```

---

## 🔍 Troubleshooting

### "Refresh token already used"
**Cause:** Client tried to reuse an old refresh token
**Solution:** All sessions invalidated for security. User must re-login.
**Prevention:** Ensure frontend stores and uses NEW refresh token after each refresh

### "Too many requests"
**Cause:** Rate limit exceeded
**Solution:** Wait 1 minute before retrying
**Prevention:** Implement exponential backoff in frontend

### "Session limit reached"
**Cause:** User has 5+ active sessions
**Solution:** Oldest session is automatically deleted
**Note:** This is normal behavior, no action needed

### "Password does not meet requirements"
**Cause:** Password missing required character types
**Solution:** Ensure password has uppercase, lowercase, number, AND special character
**Example:** Change `Password123` to `Password123!`

---

## 📚 Related Documentation

- [SECURITY_HARDENING_P2.md](../../../SECURITY_HARDENING_P2.md) - Complete implementation report
- [Auth Service](./auth.service.ts) - Main authentication logic
- [Auth Controller](./auth.controller.ts) - Authentication endpoints
- [Password DTOs](./dto/) - Validation schemas

---

**Last Updated:** December 8, 2025
**Version:** 2.0 (P2 Security Hardening)
