# FinanzOnline SOAP Client - Quick Start Guide

## Installation
The SOAP client is ready to use - no additional packages needed!
- `soap` package: Already installed (^1.0.0)
- `@types/soap`: Already installed (^0.21.0)

## Basic Usage

### 1. Import the Client
```typescript
import { createFinanzOnlineClient, FinanzOnlineEnvironment, FinanzOnlineAuthType } from '@/modules/integrations/finanzonline';
```

### 2. Create Client
```typescript
const client = await createFinanzOnlineClient({
  environment: FinanzOnlineEnvironment.TEST, // or PRODUCTION
  debug: true, // Enable for development
});
```

### 3. Login
```typescript
const session = await client.login({
  teilnehmerId: '123456789',  // Participant ID
  benId: 'username',           // User ID
  pin: '1234',                 // PIN
  authType: FinanzOnlineAuthType.USER_PIN,
});

console.log('Session ID:', session.sessionId);
console.log('Expires:', session.sessionExpires);
```

### 4. Use Session
```typescript
// Keep session alive
await client.ping({ sessionId: session.sessionId });

// Get participant info
const info = await client.getParticipantInfo({
  teilnehmerId: '123456789',
  sessionId: session.sessionId,
});
```

### 5. Logout
```typescript
await client.logout({ sessionId: session.sessionId });
```

## Environment Variables

```bash
# Required
FON_ENVIRONMENT=test

# Optional
FON_TIMEOUT=30000
FON_DEBUG=true
FON_MAX_RETRIES=3
```

## Error Handling

```typescript
try {
  await client.login(credentials);
} catch (error) {
  switch (error.code) {
    case 'E001': // Invalid credentials
    case 'E002': // Session expired
    case 'E004': // Service unavailable
    default:     // Unknown error
  }
}
```

## Key Features

- ✅ Native SOAP 1.1 protocol
- ✅ TLS 1.3 enforced
- ✅ Automatic retry on failures
- ✅ Session management
- ✅ Debug logging
- ✅ Type-safe API

## Documentation

- Full Guide: `SOAP_CLIENT_README.md`
- Examples: `examples/soap-client-example.ts`
- Implementation: `W14-T1_IMPLEMENTATION_SUMMARY.md`

## Support

- BMF Documentation: [Session-Webservice PDF](https://www.bmf.gv.at/dam/jcr:95d0e370-4efb-4ac9-9132-165189ac30ba/BMF_Session_Webservice_Englisch.pdf)
- Test Environment: https://finanzonline-test.bmf.gv.at
- Production: https://finanzonline.bmf.gv.at

## File Locations

```
apps/api/src/modules/integrations/finanzonline/
├── finanzonline.client.ts      ← SOAP Client
├── finanzonline.types.ts       ← Type Definitions
├── finanzonline.constants.ts   ← Constants
├── SOAP_CLIENT_README.md       ← Full Documentation
├── QUICKSTART_SOAP.md          ← This File
└── examples/
    └── soap-client-example.ts  ← Usage Examples
```
