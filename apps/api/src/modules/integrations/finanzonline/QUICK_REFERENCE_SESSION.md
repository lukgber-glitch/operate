# FinanzOnline Session Service - Quick Reference

## Quick Start

```typescript
import { FinanzOnlineSessionService } from './finanzonline-session.service';

// Inject service
constructor(private sessionService: FinanzOnlineSessionService) {}

// Login
const session = await this.sessionService.login({
  teilnehmerId: 'T123456789',
  benId: 'U987654321',
  pin: '1234',
  authType: FinanzOnlineAuthType.USER_PIN,
  organizationId: 'org_123',
  autoRefresh: true,
});

// Use session
console.log(session.sessionId, session.remainingTime);

// Logout
await this.sessionService.logout(session.sessionId);
```

## Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `login(credentials)` | Create new session | `SessionInfo` |
| `logout(sessionId)` | End session | `void` |
| `keepAlive(sessionId)` | Refresh session | `SessionInfo` |
| `getSessionInfo(sessionId)` | Get session details | `SessionInfo` |
| `findActiveSessionByOrganization(orgId)` | Find org session | `ExtendedSession \| null` |
| `validateSession(sessionId, orgId)` | Validate session | `boolean` |
| `cleanupExpiredSessions()` | Cleanup expired | `number` |

## Environment Variables

```bash
FON_ENCRYPTION_KEY=<strong-key>      # Required in production
FON_ENVIRONMENT=test|production      # Default: test
FON_DEBUG=true|false                 # Default: false
FON_SESSION_TIMEOUT=120              # Minutes, default: 120
```

## Common Patterns

### Get or Create Session
```typescript
let session = await this.sessionService
  .findActiveSessionByOrganization(orgId);

if (!session) {
  session = await this.sessionService.login(credentials);
}
```

### Validate Before Use
```typescript
const isValid = await this.sessionService
  .validateSession(sessionId, organizationId);

if (!isValid) {
  throw new UnauthorizedException('Invalid session');
}
```

### Auto-Refresh (Recommended)
```typescript
await this.sessionService.login({
  ...credentials,
  autoRefresh: true, // Refreshes 5 min before expiry
});
```

## Error Handling

```typescript
try {
  await this.sessionService.login(credentials);
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Invalid credentials or expired session
  } else if (error instanceof InternalServerErrorException) {
    // Service error
  }
}
```

## SessionInfo Structure

```typescript
interface SessionInfo {
  sessionId: string;        // Unique session ID
  teilnehmerId: string;     // Participant ID
  organizationId: string;   // Organization ID
  createdAt: Date;          // Created timestamp
  expiresAt: Date;          // Expiry timestamp
  isValid: boolean;         // Current validity
  remainingTime: number;    // Seconds remaining
  environment: FinanzOnlineEnvironment;
  participantInfo?: ParticipantInfo;
}
```

## Redis Keys

```
fon:session:{sessionId}              - Session data
fon:session:{sessionId}:credentials  - Encrypted credentials
```

## Security Notes

- All credentials encrypted with AES-256-GCM
- Sessions scoped to organizations
- Auto-expiry via Redis TTL
- Audit logging on all operations

## Files

- `finanzonline-session.service.ts` - Main service (702 lines)
- `dto/session.dto.ts` - DTOs (221 lines)
- `SESSION_SERVICE_README.md` - Full documentation
- `examples/session-service-examples.ts` - Usage examples (438 lines)

## See Also

- W14-T1: FinanzOnline SOAP Client
- W14-T2: Implementation Summary
- Session Service README (comprehensive guide)
