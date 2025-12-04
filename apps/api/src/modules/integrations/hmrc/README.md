# HMRC MTD (Making Tax Digital) Integration

Complete OAuth2 integration with HMRC's Making Tax Digital for VAT API.

## Overview

This module provides secure OAuth2 authentication and API integration with HMRC's Making Tax Digital (MTD) service for UK businesses. It implements all security requirements mandated by HMRC including fraud prevention headers, PKCE, and encrypted token storage.

## Features

- **OAuth2 with PKCE**: RFC 7636 compliant OAuth2 flow with Proof Key for Code Exchange
- **Fraud Prevention Headers**: Full implementation of HMRC's fraud prevention requirements
- **Encrypted Token Storage**: AES-256-GCM encryption for all OAuth tokens
- **Automatic Token Refresh**: Tokens are automatically refreshed before expiry
- **Comprehensive Audit Logging**: All API calls and authentication events are logged
- **Sandbox & Production Support**: Works with both HMRC test and live environments

## HMRC Requirements

HMRC has strict requirements for all MTD integrations:

1. **OAuth2 with PKCE**: All applications must use OAuth2 with PKCE (S256 method)
2. **Fraud Prevention Headers**: All API calls must include specific fraud prevention headers
3. **Token Security**: Access tokens must be stored securely (we use AES-256-GCM)
4. **Audit Logging**: All interactions must be logged for compliance

## Environment Variables

Add these to your `.env` file:

```bash
# HMRC MTD Configuration
HMRC_CLIENT_ID=your-client-id
HMRC_CLIENT_SECRET=your-client-secret
HMRC_REDIRECT_URI=http://localhost:3000/api/integrations/hmrc/callback
HMRC_SANDBOX=true  # Set to false for production
HMRC_ENCRYPTION_KEY=your-32-char-encryption-key
```

### Getting HMRC Credentials

1. Register for HMRC Developer Hub: https://developer.service.hmrc.gov.uk/
2. Create an application
3. Add redirect URIs
4. Note your Client ID and Client Secret
5. Request production credentials after testing in sandbox

## API Endpoints

### Authentication

#### Generate Authorization URL
```http
POST /api/integrations/hmrc/auth
Content-Type: application/json

{
  "orgId": "org-uuid"
}

Response:
{
  "authUrl": "https://test-api.service.hmrc.gov.uk/oauth/authorize?...",
  "state": "random-state"
}
```

#### OAuth Callback (handled automatically)
```http
GET /api/integrations/hmrc/callback?code=xxx&state=xxx&vrn=GB123456789
```

#### Get Connection Status
```http
GET /api/integrations/hmrc/connection?orgId=org-uuid

Response:
{
  "id": "connection-uuid",
  "orgId": "org-uuid",
  "vrn": "GB123456789",
  "status": "CONNECTED",
  "isConnected": true,
  "tokenExpiresAt": "2025-12-02T16:00:00Z",
  "refreshTokenExpiresAt": "2026-06-02T12:00:00Z",
  "environment": "sandbox",
  "connectedAt": "2025-12-02T12:00:00Z"
}
```

#### Refresh Tokens
```http
POST /api/integrations/hmrc/refresh?orgId=org-uuid

Response:
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "tokenExpiresAt": "2025-12-02T16:00:00Z",
  "refreshTokenExpiresAt": "2026-06-02T12:00:00Z"
}
```

#### Disconnect
```http
DELETE /api/integrations/hmrc/connection
Content-Type: application/json

{
  "orgId": "org-uuid"
}

Response:
{
  "success": true,
  "message": "HMRC connection disconnected successfully"
}
```

### Health Check
```http
GET /api/integrations/hmrc/health

Response:
{
  "status": "healthy",
  "service": "HMRC MTD Integration",
  "timestamp": "2025-12-02T12:00:00Z",
  "environment": "sandbox"
}
```

## OAuth Flow

### User-Initiated Flow

1. **Generate Auth URL**: Frontend calls `/hmrc/auth` endpoint
2. **Redirect User**: Frontend redirects user to HMRC authorization page
3. **User Grants Access**: User logs into HMRC and grants permissions
4. **HMRC Redirects**: HMRC redirects back to callback URL with authorization code
5. **Token Exchange**: Backend exchanges code for access/refresh tokens
6. **Store Tokens**: Tokens are encrypted and stored in database
7. **Success Redirect**: User is redirected to frontend success page

### Token Refresh Flow

Tokens are automatically refreshed when:
- Access token expires in less than 10 minutes
- Any API call is made with an expired token

Manual refresh can be triggered via the `/hmrc/refresh` endpoint.

## Fraud Prevention Headers

HMRC requires specific headers on all API calls to prevent fraud. Our implementation automatically generates these headers:

- `Gov-Client-Connection-Method`: Connection type (e.g., WEB_APP_VIA_SERVER)
- `Gov-Client-Device-ID`: Unique device identifier
- `Gov-Client-User-IDs`: User identifiers
- `Gov-Client-Timezone`: Client timezone
- `Gov-Client-Local-IPs`: Local IP addresses
- `Gov-Client-Screens`: Screen information
- `Gov-Client-Window-Size`: Window dimensions
- `Gov-Client-Browser-Plugins`: Browser plugins
- `Gov-Client-Browser-JS-User-Agent`: JavaScript user agent
- `Gov-Client-Browser-Do-Not-Track`: Do Not Track setting
- `Gov-Vendor-Version`: Software version
- `Gov-Vendor-Product-Name`: Product name

See `hmrc-fraud-prevention.util.ts` for implementation details.

## Security

### Token Encryption

All OAuth tokens are encrypted using AES-256-GCM before storage:

```typescript
// Encryption
const encrypted = HmrcEncryptionUtil.encrypt(token, masterKey);
// Returns: { encryptedData, iv, tag }

// Decryption
const token = HmrcEncryptionUtil.decrypt(
  encryptedData,
  iv,
  tag,
  masterKey
);
```

### PKCE Implementation

We use PKCE (Proof Key for Code Exchange) for enhanced security:

```typescript
const pkce = HmrcEncryptionUtil.generatePKCEChallenge();
// Returns: { codeVerifier, codeChallenge, state }
```

The code challenge uses SHA-256 (S256 method) as required by HMRC.

### State Parameter

A cryptographically secure state parameter is used for CSRF protection:
- Generated using `crypto.randomBytes(32)`
- Stored server-side with 15-minute expiry
- Validated on callback

## Testing

### Sandbox Environment

HMRC provides a sandbox environment for testing:

```bash
HMRC_SANDBOX=true
```

Test VRN: `999999999`

### Test Endpoints

HMRC sandbox includes test endpoints:
- Fraud prevention header validation: `/test/fraud-prevention-headers/validate`

## Error Handling

Common errors and their meanings:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `invalid_client` | Invalid Client ID/Secret | Check HMRC credentials |
| `invalid_grant` | Invalid authorization code | Code expired or already used |
| `invalid_request` | Malformed request | Check request parameters |
| `VRN_INVALID` | Invalid VAT number | Verify VRN format |
| `FRAUD_PREVENTION_HEADERS_MISSING` | Missing fraud headers | Check header implementation |

## Token Lifecycle

### Access Token
- **Lifetime**: 4 hours (14,400 seconds)
- **Auto-refresh**: 10 minutes before expiry
- **Usage**: All API calls

### Refresh Token
- **Lifetime**: 18 months (540 days)
- **Usage**: Refresh access tokens
- **Rotation**: New refresh token on each refresh

## Database Schema

### HmrcConnection

Stores HMRC OAuth connections:

```prisma
model HmrcConnection {
  id                    String
  orgId                 String
  vrn                   String
  accessToken           String  // Encrypted
  refreshToken          String  // Encrypted
  encryptionIv          Bytes
  encryptionTag         Bytes
  tokenExpiresAt        DateTime
  refreshTokenExpiresAt DateTime
  status                HmrcConnectionStatus
  isConnected           Boolean
  environment           String
  // ... audit fields
}
```

### HmrcAuditLog

Comprehensive audit trail:

```prisma
model HmrcAuditLog {
  id           String
  connectionId String
  action       String  // CONNECT, DISCONNECT, TOKEN_REFRESH, API_CALL
  endpoint     String?
  statusCode   Int?
  success      Boolean
  errorMessage String?
  metadata     Json
  // ... timestamps
}
```

## Rate Limiting

HMRC enforces rate limits:
- **General limit**: 3 requests per second per application
- **Burst allowance**: 10 requests

Our implementation respects these limits.

## Compliance

This integration complies with:
- HMRC Making Tax Digital requirements
- OAuth 2.0 RFC 6749
- PKCE RFC 7636
- HMRC fraud prevention specification
- UK GDPR for data protection

## Future Enhancements

Planned features:
- [ ] VAT return submission
- [ ] VAT obligations retrieval
- [ ] VAT liabilities query
- [ ] VAT payments query
- [ ] Webhook support for HMRC notifications
- [ ] Batch processing for multiple VRNs

## Resources

- [HMRC Developer Hub](https://developer.service.hmrc.gov.uk/)
- [MTD VAT API Documentation](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0)
- [Fraud Prevention Specification](https://developer.service.hmrc.gov.uk/guides/fraud-prevention/)
- [OAuth 2.0 Authorization](https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation)

## Support

For issues related to:
- **Integration code**: Contact the development team
- **HMRC API**: Contact HMRC via their developer hub
- **Credentials**: Check HMRC application settings

## License

Proprietary - Operate/CoachOS
