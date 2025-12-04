# Persona KYC Integration

Complete Persona (withpersona.com) integration for KYC/KYB verification in Operate/CoachOS.

## Overview

This module provides comprehensive identity verification capabilities using Persona's platform, supporting:

- **Individual Verification (KYC)**: Government ID, selfie/liveness, document verification
- **Business Verification (KYB)**: Business registration, ownership verification
- **Multi-Level Verification**: Basic, Enhanced, Full, Business
- **Real-time Webhooks**: Automated status updates and verification results
- **Compliance**: PII encryption, audit logging, GDPR-compliant data handling

## Architecture

```
persona/
├── dto/                          # Data Transfer Objects
│   ├── create-inquiry.dto.ts    # Create inquiry request
│   ├── inquiry-response.dto.ts  # Inquiry creation response
│   ├── verification-result.dto.ts # Verification results
│   └── webhook-payload.dto.ts   # Webhook event payload
├── services/
│   ├── persona-inquiry.service.ts      # Inquiry management
│   └── persona-verification.service.ts # Verification processing
├── types/
│   └── persona.types.ts         # Type definitions
├── utils/
│   └── persona-encryption.util.ts # AES-256-GCM encryption
├── persona.service.ts           # Core Persona API client
├── persona.controller.ts        # REST API endpoints
├── persona-webhook.controller.ts # Webhook handler
├── persona.config.ts            # Configuration
└── persona.module.ts            # NestJS module
```

## Environment Variables

```bash
# Required
PERSONA_API_KEY=your_persona_api_key_here
PERSONA_WEBHOOK_SECRET=your_webhook_secret_here
PERSONA_ENCRYPTION_KEY=your_encryption_key_here

# Optional
PERSONA_ENVIRONMENT=sandbox  # or 'production'
PERSONA_API_BASE_URL=https://withpersona.com/api/v1
```

## Database Schema

Three tables are created:

1. **persona_inquiries**: Stores inquiry records
2. **persona_verifications**: Stores verification check results
3. **persona_webhook_logs**: Audit trail for webhook events

Run migration:
```bash
npx prisma migrate dev --name add-persona-integration
```

## API Endpoints

### Inquiries

- `POST /integrations/persona/inquiries` - Create new inquiry
- `GET /integrations/persona/inquiries/:id` - Get inquiry details
- `GET /integrations/persona/inquiries/user/:userId` - List user inquiries
- `GET /integrations/persona/inquiries/organization/:organizationId` - List org inquiries
- `POST /integrations/persona/inquiries/:id/resume` - Resume inquiry (new session token)
- `POST /integrations/persona/inquiries/:id/expire` - Expire inquiry

### Verifications

- `GET /integrations/persona/verifications/:inquiryId` - Get verification results
- `GET /integrations/persona/verifications/:inquiryId/history` - Get verification history
- `GET /integrations/persona/users/:userId/stats` - Get user verification stats
- `GET /integrations/persona/organizations/:organizationId/failure-analysis` - Analyze failures

### Templates

- `GET /integrations/persona/templates` - List available inquiry templates

### Webhooks

- `POST /integrations/persona/webhooks` - Webhook event handler

## Usage Examples

### Create an Inquiry

```typescript
import { PersonaInquiryService } from '@modules/integrations/persona';

// Inject the service
constructor(private readonly personaInquiry: PersonaInquiryService) {}

// Create inquiry
const inquiry = await this.personaInquiry.createInquiry(userId, {
  templateId: 'itmpl_XXXXXXXXXXXXXXXXXX',
  referenceId: 'user_12345_verification',
  verificationLevel: PersonaVerificationLevel.ENHANCED,
  fields: {
    name_first: 'John',
    name_last: 'Doe',
    email_address: 'john.doe@example.com',
  },
  redirectUrl: 'https://app.operate.coach/kyc/complete',
});

// Use inquiry.sessionToken on frontend
console.log(inquiry.sessionToken); // Pass to Persona embedded flow
```

### Check Verification Results

```typescript
import { PersonaVerificationService } from '@modules/integrations/persona';

constructor(private readonly personaVerification: PersonaVerificationService) {}

const results = await this.personaVerification.processVerificationResults(inquiryId);

if (results.isApproved) {
  // User passed verification
  console.log('Verification approved!');
} else {
  // User failed verification
  console.log('Failure reasons:', results.failureReasons);
}
```

## Security Features

### Encryption
- AES-256-GCM encryption for sensitive data
- Secure key derivation from environment secrets
- Random IV (Initialization Vector) for each encryption
- Authentication tags to prevent tampering

### Webhook Security
- HMAC-SHA256 signature verification
- Timestamp validation (prevents replay attacks)
- Timing-safe signature comparison
- Complete audit logging

### Data Protection
- PII data encrypted at rest
- Secure session token handling
- Comprehensive audit trail
- GDPR-compliant data management

## Webhook Events

The module handles these Persona webhook events:

- `inquiry.completed` - User completed verification flow
- `inquiry.approved` - Verification passed all checks
- `inquiry.declined` - Verification failed checks
- `inquiry.expired` - Inquiry expired without completion
- `inquiry.failed` - Technical failure during verification
- `inquiry.marked-for-review` - Requires manual review
- `verification.created` - New verification check created
- `verification.passed` - Individual check passed
- `verification.failed` - Individual check failed

## Integration Steps

1. **Register Module**: Import `PersonaModule` in your app module
2. **Set Environment Variables**: Configure API keys and secrets
3. **Run Migration**: Create database tables
4. **Configure Webhook**: Set webhook URL in Persona dashboard to `/integrations/persona/webhooks`
5. **Create Templates**: Set up inquiry templates in Persona dashboard
6. **Test**: Use sandbox mode for testing

## Testing

```bash
# Run Persona integration tests
npm test -- persona

# Test webhook locally (use ngrok or similar)
ngrok http 3000
# Set webhook URL in Persona dashboard: https://your-ngrok-url/integrations/persona/webhooks
```

## Troubleshooting

### Webhook Signature Verification Failed
- Ensure `PERSONA_WEBHOOK_SECRET` matches the secret in Persona dashboard
- Check that raw body parser is enabled for webhook endpoint
- Verify timestamp is within 5 minutes (prevents replay attacks)

### API Key Invalid
- Confirm `PERSONA_API_KEY` is correct for your environment (sandbox/production)
- Check API key has necessary permissions in Persona dashboard

### Encryption Failed
- Ensure `PERSONA_ENCRYPTION_KEY` is set and at least 32 characters
- Verify key is consistent across deployments

## References

- [Persona API Documentation](https://docs.withpersona.com)
- [Persona Webhooks](https://docs.withpersona.com/docs/webhooks)
- [Persona Embedded Flow](https://docs.withpersona.com/docs/embedded-flow)

## License

Part of Operate/CoachOS - Proprietary
