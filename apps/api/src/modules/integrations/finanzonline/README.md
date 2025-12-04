# FinanzOnline Integration Module

Austrian tax filing integration for the Operate/CoachOS platform. This module provides complete integration with the Austrian FinanzOnline WebService for submitting tax returns electronically.

## Features

- **Certificate-based Authentication**: Secure authentication using Austrian e-government certificates (PEM or P12 format)
- **VAT Return Submission**: Submit Umsatzsteuervoranmeldung (UVA) returns
- **Income Tax Submission**: Submit Einkommensteuererklärung returns
- **Session Management**: Automatic session handling with Redis caching
- **Encrypted Storage**: AES-256-GCM encryption for credential storage
- **Audit Logging**: Complete audit trail for all submissions
- **Sandbox Support**: Test mode for development and testing

## Installation

The module is already integrated into the main API. To enable it:

1. Add environment variables to `.env`:

```bash
# FinanzOnline Configuration
FON_ENVIRONMENT=sandbox              # 'production' or 'sandbox'
FON_TIMEOUT=30000                    # Request timeout in ms
FON_DEBUG=true                       # Enable debug logging
FON_MAX_RETRIES=3                    # Maximum retry attempts
FON_SESSION_TIMEOUT=120              # Session timeout in minutes
FON_ENCRYPTION_KEY=your-secure-key   # REQUIRED: Strong encryption key
```

2. Import the module in your app:

```typescript
import { FinanzOnlineModule } from '@modules/integrations/finanzonline';

@Module({
  imports: [
    // ... other modules
    FinanzOnlineModule,
  ],
})
export class AppModule {}
```

## Usage

### 1. Authentication

Before making any submissions, authenticate with FinanzOnline:

```typescript
POST /integrations/finanzonline/auth/login

{
  "taxId": "12-345/6789",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "certificateType": "PEM",
  "environment": "sandbox"
}

// Response:
{
  "sessionId": "sess_1234567890abcdef",
  "token": "tok_abcdef1234567890",
  "createdAt": "2025-11-29T10:00:00Z",
  "expiresAt": "2025-11-29T12:00:00Z",
  "taxId": "12-345/6789",
  "environment": "sandbox"
}
```

### 2. Submit VAT Return

Submit a monthly, quarterly, or annual VAT return:

```typescript
POST /integrations/finanzonline/vat-return

{
  "taxId": "12-345/6789",
  "vatId": "ATU12345678",
  "sessionId": "sess_1234567890abcdef",
  "period": {
    "year": 2025,
    "type": "MONTHLY",
    "period": 11,
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "lines": [
    { "code": "000", "amount": 50000, "description": "Taxable turnover" },
    { "code": "056", "amount": 10000, "description": "VAT at 20%" }
  ],
  "totalOutputVat": 10000,
  "totalInputVat": 5000,
  "netVat": 5000,
  "declarationDate": "2025-11-29"
}

// Response:
{
  "success": true,
  "timestamp": "2025-11-29T10:05:00Z",
  "referenceId": "VAT-2025-11-29-ABCD1234",
  "status": "ACCEPTED",
  "taxOfficeReference": "TO-2025-ABC123",
  "calculatedTaxAmount": 5000,
  "paymentDueDate": "2025-12-15"
}
```

### 3. Submit Income Tax Return

```typescript
POST /integrations/finanzonline/income-tax

{
  "taxId": "12-345/6789",
  "sessionId": "sess_1234567890abcdef",
  "taxYear": 2024,
  "personalInfo": {
    "firstName": "Max",
    "lastName": "Mustermann",
    "dateOfBirth": "1980-01-15",
    "address": {
      "street": "Hauptstraße 123",
      "postalCode": "1010",
      "city": "Wien",
      "country": "AT"
    }
  },
  "income": {
    "employment": 4500000,
    "totalGross": 4500000
  },
  "deductions": {
    "socialSecurity": 800000,
    "total": 800000
  },
  "declarationDate": "2025-11-29"
}
```

### 4. Check Submission Status

```typescript
GET /integrations/finanzonline/status/VAT-2025-11-29-ABCD1234?sessionId=sess_1234567890abcdef

// Response:
{
  "success": true,
  "timestamp": "2025-11-29T10:10:00Z",
  "status": "COMPLETED",
  "statusDescription": "Submission successfully processed",
  "lastUpdated": "2025-11-29T10:08:00Z"
}
```

### 5. Logout

```typescript
DELETE /integrations/finanzonline/auth/logout/sess_1234567890abcdef
```

## Austrian VAT Line Codes (Kennzahlen)

Common VAT line codes for Austrian tax returns:

| Code | Description |
|------|-------------|
| 000  | Total turnover |
| 022  | Taxable turnover at 20% |
| 029  | Taxable turnover at 10% |
| 006  | Taxable turnover at 13% |
| 011  | Export turnover |
| 017  | Intra-community supply |
| 056  | Output VAT at 20% |
| 057  | Output VAT at 10% |
| 007  | Output VAT at 13% |
| 060  | Input VAT - goods |
| 061  | Input VAT - other |
| 065  | Input VAT - IC acquisition |
| 090  | Previous period correction |

## Tax ID Format

Austrian tax IDs (Steuernummer) must follow the format: `XX-YYY/ZZZZ`

Examples:
- `12-345/6789` ✓
- `01-123/4567` ✓
- `12345/6789` ✗ (missing district)
- `12-345-6789` ✗ (wrong separator)

## VAT ID Format

Austrian VAT IDs (UID) must follow the format: `ATU12345678`

Examples:
- `ATU12345678` ✓
- `AT U12345678` ✗ (space)
- `ATU1234567` ✗ (too short)

## Security

### Certificate Requirements

- **Format**: PEM or P12 (PKCS#12)
- **Validity**: Must be valid and not expired
- **Issuer**: Must be issued by an Austrian certificate authority
- **Purpose**: Must be enabled for e-government authentication

### Credential Encryption

All credentials are encrypted using AES-256-GCM before storage:

- Certificate data is encrypted
- Certificate passwords are encrypted
- Session tokens are stored securely in Redis
- Automatic key rotation support

### Audit Logging

All submissions are logged with:

- Submission type (VAT, income tax)
- Tax ID
- Reference ID
- Timestamp
- Success/failure status
- Environment (production/sandbox)

Logs are stored for 1 year in Redis.

## Error Handling

Common error codes:

| Code | Description | Action |
|------|-------------|--------|
| AUTH_FAILED | Authentication failed | Check certificate validity |
| INVALID_CERTIFICATE | Invalid certificate format | Verify PEM/P12 format |
| CERTIFICATE_EXPIRED | Certificate has expired | Renew certificate |
| SESSION_EXPIRED | Session has expired | Re-authenticate |
| INVALID_TAX_ID | Invalid tax ID format | Check XX-YYY/ZZZZ format |
| INVALID_DATA | Invalid submission data | Validate required fields |
| SERVICE_UNAVAILABLE | FinanzOnline unavailable | Retry later |
| RATE_LIMIT_EXCEEDED | Too many requests | Wait before retrying |

## Testing

Run the test suite:

```bash
npm test finanzonline.service.spec.ts
```

### Test Coverage

- ✓ Authentication with valid credentials
- ✓ Invalid tax ID format handling
- ✓ Invalid certificate handling
- ✓ Session expiration
- ✓ VAT return submission
- ✓ Income tax submission
- ✓ Status queries
- ✓ Logout functionality

## Environment Modes

### Sandbox Mode (Development)

- Base URL: `https://finanzonline-test.bmf.gv.at`
- Use test certificates
- No real submissions
- Immediate responses

### Production Mode

- Base URL: `https://finanzonline.bmf.gv.at`
- Requires valid e-government certificates
- Real tax submissions
- Official processing

## Dependencies

- `@nestjs/common`: NestJS core
- `@nestjs/config`: Configuration management
- `xml2js`: XML parsing and building
- `axios`: HTTP client
- Redis: Session and credential storage

## API Documentation

Full API documentation is available via Swagger:

```
http://localhost:3000/api/docs#/FinanzOnline
```

## Support

For issues or questions:

1. Check the [Austrian FinanzOnline documentation](https://www.bmf.gv.at/services/finanzonline.html)
2. Review the test cases in `__tests__/finanzonline.service.spec.ts`
3. Enable debug logging with `FON_DEBUG=true`
4. Contact the development team

## License

Proprietary - Operate/CoachOS Platform
