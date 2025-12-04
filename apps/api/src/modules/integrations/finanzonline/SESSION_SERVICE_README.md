# FinanzOnline Session Service

## Overview

The `FinanzOnlineSessionService` provides comprehensive session management for FinanzOnline integrations. It handles authentication, session lifecycle, credential storage, and automatic session refresh with multi-tenant support.

## Features

- **Session Authentication**: Login/logout with FinanzOnline SOAP API
- **Session Lifecycle Management**: Create, validate, keep alive, and destroy sessions
- **Secure Credential Storage**: AES-256-GCM encrypted credential storage in Redis
- **Auto-Refresh**: Automatic session renewal before expiry
- **Multi-Tenant Support**: Organization-scoped session management
- **Session Caching**: Redis-based session persistence
- **Audit Logging**: Comprehensive logging for security compliance
- **Error Handling**: Robust error handling with proper exceptions

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          FinanzOnlineSessionService                 │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐             │
│  │   Session    │    │  Credential  │             │
│  │  Management  │    │  Management  │             │
│  └──────┬───────┘    └──────┬───────┘             │
│         │                   │                      │
│         └───────┬───────────┘                      │
│                 │                                  │
│  ┌──────────────▼───────────────┐                 │
│  │    Redis Cache Storage        │                 │
│  │  - Sessions (encrypted)       │                 │
│  │  - Credentials (encrypted)    │                 │
│  └──────────────┬───────────────┘                 │
│                 │                                  │
│  ┌──────────────▼───────────────┐                 │
│  │   FinanzOnlineClient (SOAP)   │                 │
│  │  - Login/Logout               │                 │
│  │  - Ping (Keep-Alive)          │                 │
│  └───────────────────────────────┘                 │
└─────────────────────────────────────────────────────┘
```

## Usage

### Installation

The service is automatically registered in `FinanzOnlineModule`:

```typescript
import { FinanzOnlineModule } from '@/modules/integrations/finanzonline';

@Module({
  imports: [FinanzOnlineModule],
})
export class YourModule {}
```

### Basic Example

```typescript
import { FinanzOnlineSessionService, LoginCredentials } from '@/modules/integrations/finanzonline';

@Injectable()
export class YourService {
  constructor(
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  async authenticateOrganization(organizationId: string) {
    // Login credentials
    const credentials: LoginCredentials = {
      teilnehmerId: 'T123456789',
      benId: 'U987654321',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId,
      environment: FinanzOnlineEnvironment.TEST,
      autoRefresh: true, // Auto-refresh before expiry
    };

    // Login and create session
    const sessionInfo = await this.sessionService.login(credentials);

    console.log(`Session created: ${sessionInfo.sessionId}`);
    console.log(`Expires at: ${sessionInfo.expiresAt}`);
    console.log(`Remaining time: ${sessionInfo.remainingTime}s`);

    return sessionInfo;
  }

  async checkSession(sessionId: string) {
    // Get session information
    const info = await this.sessionService.getSessionInfo(sessionId);

    if (!info.isValid) {
      throw new Error('Session expired');
    }

    return info;
  }

  async refreshSession(sessionId: string) {
    // Keep session alive
    const info = await this.sessionService.keepAlive(sessionId);
    console.log(`Session refreshed, new expiry: ${info.expiresAt}`);
  }

  async endSession(sessionId: string) {
    // Logout and cleanup
    await this.sessionService.logout(sessionId);
    console.log('Session ended');
  }
}
```

### Multi-Tenant Usage

```typescript
// Each organization has its own session
const org1Session = await sessionService.login({
  ...credentials,
  organizationId: 'org_1',
});

const org2Session = await sessionService.login({
  ...credentials,
  organizationId: 'org_2',
});

// Find active session for organization
const activeSession = await sessionService.findActiveSessionByOrganization('org_1');

// Validate session belongs to organization
const isValid = await sessionService.validateSession(
  sessionId,
  'org_1'
);
```

### Auto-Refresh Sessions

Sessions with `autoRefresh: true` are automatically renewed 5 minutes before expiry:

```typescript
const sessionInfo = await sessionService.login({
  ...credentials,
  autoRefresh: true, // Enable auto-refresh
});

// Session will automatically refresh before expiry
// No manual intervention needed
```

### Cleanup Expired Sessions

```typescript
// Manually cleanup expired sessions
const cleanedCount = await sessionService.cleanupExpiredSessions();
console.log(`Cleaned up ${cleanedCount} expired sessions`);
```

## API Reference

### `login(credentials: LoginCredentials): Promise<SessionInfo>`

Authenticate with FinanzOnline and create a new session.

**Parameters:**
- `credentials.teilnehmerId` - Participant ID (Teilnehmer-ID)
- `credentials.benId` - User ID (Benutzer-ID)
- `credentials.pin` - PIN for authentication (required for USER_PIN auth)
- `credentials.authType` - Authentication type (USER_PIN, CERTIFICATE, etc.)
- `credentials.organizationId` - Organization identifier (tenant ID)
- `credentials.environment` - FinanzOnline environment (TEST or PRODUCTION)
- `credentials.autoRefresh` - Enable automatic session refresh (default: true)
- `credentials.herstellerId` - Software/manufacturer ID (optional)

**Returns:** `SessionInfo` containing session details

**Throws:**
- `UnauthorizedException` - Invalid credentials or locked account
- `InternalServerErrorException` - Login failed

---

### `logout(sessionId: string): Promise<void>`

Logout and invalidate a session.

**Parameters:**
- `sessionId` - The session ID to terminate

**Throws:**
- Error if logout fails

---

### `keepAlive(sessionId: string): Promise<SessionInfo>`

Ping the session to keep it alive and get updated expiration time.

**Parameters:**
- `sessionId` - The session ID to refresh

**Returns:** Updated `SessionInfo`

**Throws:**
- `UnauthorizedException` - Session not found or expired

---

### `getSessionInfo(sessionId: string): Promise<SessionInfo>`

Get current session information.

**Parameters:**
- `sessionId` - The session ID to query

**Returns:** `SessionInfo` with current session state

**Throws:**
- `UnauthorizedException` - Session not found

---

### `findActiveSessionByOrganization(organizationId: string): Promise<ExtendedSession | null>`

Find active session for a specific organization.

**Parameters:**
- `organizationId` - Organization identifier

**Returns:** Active session or `null` if not found

---

### `validateSession(sessionId: string, organizationId: string): Promise<boolean>`

Validate that a session exists, is valid, and belongs to the specified organization.

**Parameters:**
- `sessionId` - Session ID to validate
- `organizationId` - Organization to validate against

**Returns:** `true` if session is valid, `false` otherwise

---

### `cleanupExpiredSessions(): Promise<number>`

Remove all expired sessions from cache.

**Returns:** Number of sessions cleaned up

## Types

### `SessionInfo`

```typescript
interface SessionInfo {
  sessionId: string;           // Unique session identifier
  teilnehmerId: string;        // Participant ID
  organizationId: string;      // Organization ID (tenant)
  createdAt: Date;             // Session creation time
  expiresAt: Date;             // Session expiration time
  isValid: boolean;            // Whether session is currently valid
  remainingTime: number;       // Remaining time in seconds
  environment: FinanzOnlineEnvironment;
  participantInfo?: ParticipantInfo;
}
```

### `LoginCredentials`

```typescript
interface LoginCredentials {
  teilnehmerId: string;
  benId: string;
  pin?: string;
  authType: FinanzOnlineAuthType;
  herstellerId?: string;
  organizationId: string;
  environment?: FinanzOnlineEnvironment;
  autoRefresh?: boolean;
}
```

## Security

### Credential Encryption

All credentials (especially PINs) are encrypted using AES-256-GCM before storage:

```typescript
// Encryption happens automatically
const encrypted = encrypt(pin, encryptionKey);

// Stored format:
{
  encrypted: "base64-encrypted-data",
  iv: "base64-initialization-vector",
  authTag: "base64-auth-tag"
}
```

### Environment Variables

**Required:**
- `FON_ENCRYPTION_KEY` - Encryption key for credentials (min 32 characters in production)

**Optional:**
- `FON_ENVIRONMENT` - Default environment (TEST or PRODUCTION)
- `FON_DEBUG` - Enable debug logging (default: false)
- `FON_SESSION_TIMEOUT` - Session timeout in minutes (default: 120)

### Best Practices

1. **Always use strong encryption keys in production**
2. **Enable auto-refresh for long-running sessions**
3. **Validate sessions before using them**
4. **Logout sessions when no longer needed**
5. **Use organization-scoped sessions for multi-tenancy**
6. **Monitor session expiration times**
7. **Implement session cleanup cron jobs**

## Redis Storage

Sessions and credentials are stored in Redis with the following keys:

```
fon:session:{sessionId}              - Session data (TTL: session expiry)
fon:session:{sessionId}:credentials  - Encrypted credentials (TTL: 2 hours)
```

## Error Handling

The service throws appropriate NestJS exceptions:

```typescript
try {
  await sessionService.login(credentials);
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Handle invalid credentials or expired session
  } else if (error instanceof InternalServerErrorException) {
    // Handle service errors
  }
}
```

## Logging

All operations are logged with appropriate levels:

- **INFO**: Login success, logout, session refresh
- **DEBUG**: Keep-alive pings, auto-refresh triggers
- **WARN**: Session not found, encryption key warnings
- **ERROR**: Login failures, SOAP errors, decryption failures

## Testing

Example test:

```typescript
describe('FinanzOnlineSessionService', () => {
  let service: FinanzOnlineSessionService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FinanzOnlineSessionService,
        // Mock dependencies
      ],
    }).compile();

    service = module.get(FinanzOnlineSessionService);
  });

  it('should create a session on login', async () => {
    const credentials: LoginCredentials = {
      teilnehmerId: 'T123',
      benId: 'U456',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
      organizationId: 'org_1',
    };

    const sessionInfo = await service.login(credentials);

    expect(sessionInfo.sessionId).toBeDefined();
    expect(sessionInfo.isValid).toBe(true);
  });
});
```

## Related Files

- `finanzonline-session.service.ts` - Main service implementation
- `finanzonline.client.ts` - SOAP client wrapper
- `dto/session.dto.ts` - Session DTOs
- `utils/fon-auth.util.ts` - Encryption utilities

## Support

For issues or questions:
1. Check the SOAP client documentation
2. Review error logs for details
3. Verify FinanzOnline credentials
4. Ensure Redis is running and accessible

## License

Internal use only - Operate/CoachOS
