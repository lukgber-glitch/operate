# FinanzOnline SOAP Client

Native SOAP client implementation for the Austrian FinanzOnline Session-Webservice using the `soap` npm package.

## Overview

This SOAP client provides direct integration with FinanzOnline (Austria's official tax portal) without middleware. It implements the BMF Session-Webservice specification for secure, certificate-based authentication and tax data submission.

## Documentation

- **Official Documentation**: [BMF Session-Webservice English](https://www.bmf.gv.at/dam/jcr:95d0e370-4efb-4ac9-9132-165189ac30ba/BMF_Session_Webservice_Englisch.pdf)
- **Service Provider**: BMF (Bundesministerium für Finanzen) - Austrian Federal Ministry of Finance
- **Protocol**: SOAP 1.1
- **Security**: TLS 1.3, Certificate-based authentication

## Architecture

### Files Created

1. **finanzonline.constants.ts**
   - WSDL URLs for production and test environments
   - Service endpoints
   - SOAP namespaces
   - Error codes
   - TLS configuration
   - Cache keys and TTL values

2. **finanzonline.types.ts**
   - TypeScript type definitions for all SOAP requests and responses
   - Session management types
   - Participant information structures
   - Error handling types
   - SOAP envelope and fault types

3. **finanzonline.client.ts**
   - Main SOAP client implementation
   - Automatic retry logic
   - Request/response logging
   - Session management
   - Error handling and conversion
   - TLS 1.3 configuration

## Features

### Security

- **TLS 1.3**: Enforced for all connections
- **Certificate Authentication**: Support for ELGA cards, mobile signatures, and certificate files
- **Secure Session Management**: Token-based authentication with automatic expiration
- **Credential Encryption**: Sensitive data sanitized in logs
- **Reject Unauthorized**: Strict certificate validation in production

### Reliability

- **Automatic Retry**: Configurable retry logic for transient failures
- **Timeout Handling**: Request timeouts with configurable values
- **Session Keep-Alive**: Ping operation to maintain active sessions
- **Error Recovery**: Graceful handling of SOAP faults and network errors

### Observability

- **Request/Response Logging**: Optional debug mode for SOAP messages
- **Performance Metrics**: Operation duration tracking
- **Error Tracking**: Detailed error information with codes and timestamps
- **Session Tracking**: Full session lifecycle logging

## Usage

### Initialize the Client

```typescript
import {
  createFinanzOnlineClient,
  FinanzOnlineEnvironment,
  FinanzOnlineAuthType,
} from './finanzonline';

// Create client for test environment
const client = await createFinanzOnlineClient({
  environment: FinanzOnlineEnvironment.TEST,
  debug: true,
  timeout: 30000,
});
```

### Login

```typescript
// Login with Participant ID and User ID
const loginResponse = await client.login({
  teilnehmerId: '123456789', // Participant ID (Teilnehmer-ID)
  benId: 'user123',          // User ID (Benutzer-ID)
  pin: '1234',               // PIN (for USER_PIN auth type)
  authType: FinanzOnlineAuthType.USER_PIN,
  herstellerId: 'OPERATE',   // Optional: Software/manufacturer ID
});

console.log('Session ID:', loginResponse.sessionId);
console.log('Session Token:', loginResponse.sessionToken);
console.log('Expires:', loginResponse.sessionExpires);
```

### Session Keep-Alive

```typescript
// Ping to keep session alive
const pingResponse = await client.ping({
  sessionId: loginResponse.sessionId,
});

console.log('Session valid:', pingResponse.sessionValid);
console.log('New expiration:', pingResponse.sessionExpires);
```

### Get Participant Information

```typescript
// Get detailed participant info
const participantInfo = await client.getParticipantInfo({
  teilnehmerId: '123456789',
  sessionId: loginResponse.sessionId, // Optional
});

console.log('Company:', participantInfo.participantInfo.companyName);
console.log('Tax Number:', participantInfo.participantInfo.taxNumber);
console.log('VAT ID:', participantInfo.participantInfo.vatId);
```

### Logout

```typescript
// Logout and invalidate session
await client.logout({
  sessionId: loginResponse.sessionId,
});

console.log('Logged out successfully');
```

### Check Session Status

```typescript
// Check if current session is valid
const isValid = client.isSessionValid();
console.log('Session valid:', isValid);

// Get current session details
const session = client.getSession();
if (session) {
  console.log('Session ID:', session.sessionId);
  console.log('Expires at:', session.expiresAt);
  console.log('Participant ID:', session.teilnehmerId);
}
```

## Configuration

### Environment Variables

```bash
# Environment (production or test)
FON_ENVIRONMENT=test

# Request timeout in milliseconds
FON_TIMEOUT=30000

# Enable debug logging
FON_DEBUG=true

# Maximum retry attempts
FON_MAX_RETRIES=3

# Session timeout in minutes
FON_SESSION_TIMEOUT=120

# Encryption key for credential storage
FON_ENCRYPTION_KEY=your-secure-key-here
```

### Client Configuration

```typescript
const client = await createFinanzOnlineClient({
  // Environment
  environment: FinanzOnlineEnvironment.PRODUCTION,

  // Optional: Custom WSDL URL
  wsdlUrl: 'https://custom-url/sessionService.wsdl',

  // Optional: Custom endpoint
  endpoint: 'https://custom-url/sessionService',

  // Request timeout (milliseconds)
  timeout: 30000,

  // Enable debug logging
  debug: true,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // TLS configuration
  tls: {
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    rejectUnauthorized: true,
  },

  // SOAP configuration
  soap: {
    forceSoap11: true,
  },
});
```

## Environments

### Production (FinanzOnline)

- **WSDL**: `https://finanzonline.bmf.gv.at/fonws/ws/sessionService.wsdl`
- **Endpoint**: `https://finanzonline.bmf.gv.at/fonws/ws/sessionService`
- **Use for**: Live tax submissions
- **Certificate Validation**: Strict

### Test (FonTest)

- **WSDL**: `https://finanzonline-test.bmf.gv.at/fonws/ws/sessionService.wsdl`
- **Endpoint**: `https://finanzonline-test.bmf.gv.at/fonws/ws/sessionService`
- **Use for**: Development and testing
- **Certificate Validation**: Relaxed

## Authentication Types

### USER_PIN
Standard authentication using Participant ID, User ID, and PIN.

```typescript
{
  authType: FinanzOnlineAuthType.USER_PIN,
  teilnehmerId: '123456789',
  benId: 'user123',
  pin: '1234',
}
```

### CERTIFICATE
Certificate-based authentication (X.509 certificates).

```typescript
{
  authType: FinanzOnlineAuthType.CERTIFICATE,
  teilnehmerId: '123456789',
  benId: 'user123',
  // Certificate data handled separately
}
```

### ELGA
ELGA card authentication (Austrian e-card).

```typescript
{
  authType: FinanzOnlineAuthType.ELGA,
  teilnehmerId: '123456789',
  benId: 'user123',
}
```

### MOBILE_SIGNATURE
Mobile signature authentication (Handy-Signatur).

```typescript
{
  authType: FinanzOnlineAuthType.MOBILE_SIGNATURE,
  teilnehmerId: '123456789',
  benId: 'user123',
}
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| E001 | Invalid credentials |
| E002 | Session expired |
| E003 | Invalid participant ID |
| E004 | Service unavailable |
| E005 | Invalid certificate |
| E006 | Account locked |
| E007 | Invalid session ID |
| E008 | Timeout |
| E009 | Rate limit exceeded |
| E999 | Internal server error |

### Error Handling Example

```typescript
try {
  const response = await client.login(loginRequest);
  // Handle success
} catch (error) {
  if (error.code === 'E001') {
    console.error('Invalid credentials');
  } else if (error.code === 'E002') {
    console.error('Session expired - please login again');
  } else if (error.code === 'E004') {
    console.error('Service unavailable - retrying...');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Session Management

### Session Lifecycle

1. **Login**: Create session with `login()`
2. **Keep-Alive**: Maintain session with `ping()`
3. **Use**: Perform operations with session ID
4. **Logout**: End session with `logout()`

### Session Timeout

- Default: 2 hours (configurable)
- Automatic expiration checking
- Ping operation extends session

### Session Storage

Sessions are stored in memory within the client instance. For persistent storage:

```typescript
// Get session data
const session = client.getSession();

// Store in Redis/Database
await redis.set(`fon:session:${session.sessionId}`, JSON.stringify(session));

// Restore later (create new client and manually set session)
const storedSession = await redis.get(`fon:session:${sessionId}`);
// Note: Client doesn't support setting existing sessions - must login again
```

## Performance

### Caching

The client supports WSDL caching to improve performance:

```typescript
// WSDL is cached for 1 week by default
// Subsequent client creations use cached WSDL
```

### Connection Pooling

```typescript
// HTTPS agent uses connection pooling
// Keep-alive enabled with 30s timeout
```

### Retry Logic

```typescript
// Automatic retry on:
// - Network errors (ECONNREFUSED, ETIMEDOUT)
// - Service unavailable (ENOTFOUND)
//
// No retry on:
// - Authentication errors
// - Invalid data errors
```

## Testing

### Unit Tests

```typescript
import { createFinanzOnlineClient, FinanzOnlineEnvironment } from './finanzonline';

describe('FinanzOnlineClient', () => {
  let client;

  beforeAll(async () => {
    client = await createFinanzOnlineClient({
      environment: FinanzOnlineEnvironment.TEST,
      debug: false,
    });
  });

  afterAll(() => {
    client.destroy();
  });

  it('should login successfully', async () => {
    const response = await client.login({
      teilnehmerId: 'test123',
      benId: 'user123',
      pin: '1234',
      authType: FinanzOnlineAuthType.USER_PIN,
    });

    expect(response.sessionId).toBeDefined();
    expect(response.sessionToken).toBeDefined();
  });
});
```

## Integration with NestJS

### Service Integration

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createFinanzOnlineClient, FinanzOnlineClient } from './finanzonline';

@Injectable()
export class FinanzOnlineService implements OnModuleInit, OnModuleDestroy {
  private client: FinanzOnlineClient;

  async onModuleInit() {
    this.client = await createFinanzOnlineClient({
      environment: FinanzOnlineEnvironment.TEST,
      debug: true,
    });
  }

  async onModuleDestroy() {
    this.client.destroy();
  }

  async login(credentials) {
    return this.client.login(credentials);
  }
}
```

## Troubleshooting

### Common Issues

**WSDL Loading Fails**
- Check network connectivity
- Verify WSDL URL is accessible
- Check firewall/proxy settings

**Authentication Fails**
- Verify Participant ID and User ID
- Check PIN is correct
- Ensure account is not locked
- Verify environment (production vs test)

**Session Expired**
- Check session timeout configuration
- Implement ping keep-alive
- Handle E002 error and re-login

**TLS Errors**
- Ensure TLS 1.3 support
- Check certificate validity
- Verify system time is correct

### Debug Mode

Enable debug logging to see SOAP requests/responses:

```typescript
const client = await createFinanzOnlineClient({
  environment: FinanzOnlineEnvironment.TEST,
  debug: true, // Enable debug logging
});
```

Sensitive data (PINs, passwords, certificates) is automatically sanitized in logs.

## Security Considerations

### Best Practices

1. **Never log sensitive data**: PINs, passwords, certificates are sanitized
2. **Use environment variables**: Store credentials securely
3. **Enable TLS 1.3**: Enforced by default
4. **Validate certificates**: Strict validation in production
5. **Encrypt stored credentials**: Use FON_ENCRYPTION_KEY
6. **Limit session lifetime**: Use reasonable timeout values
7. **Implement logout**: Always logout when done
8. **Handle errors gracefully**: Don't expose internal details

### Production Checklist

- [ ] Set FON_ENVIRONMENT=production
- [ ] Configure secure FON_ENCRYPTION_KEY
- [ ] Enable certificate validation
- [ ] Set appropriate session timeout
- [ ] Implement error monitoring
- [ ] Enable audit logging
- [ ] Test failover scenarios
- [ ] Document disaster recovery

## Future Enhancements

- Support for additional FinanzOnline operations (VAT returns, income tax, etc.)
- WSDL operation discovery
- Dynamic SOAP method generation
- Connection pool management
- Circuit breaker pattern
- Metrics and monitoring integration
- Support for batch operations

## Support

For issues or questions:
- Review the [BMF Session-Webservice documentation](https://www.bmf.gv.at/dam/jcr:95d0e370-4efb-4ac9-9132-165189ac30ba/BMF_Session_Webservice_Englisch.pdf)
- Check FinanzOnline support resources
- Contact BMF technical support for API issues

## License

Internal use only - Operate/CoachOS Enterprise SaaS Platform
