# CRA NetFile Integration

Canada Revenue Agency (CRA) e-filing integration for GST/HST returns via NetFile API.

## Overview

This module provides complete integration with CRA NetFile for electronic filing of GST/HST returns (GST34, GST62, GST106). It handles authentication, validation, submission, and status tracking with comprehensive security and audit logging.

## Features

- **GST/HST Return Filing**
  - GST34 - Regular GST/HST return
  - GST62 - Non-resident registrant return
  - GST106 - Selected listed financial institutions return
  - Schedule A support for adjustments

- **Security**
  - TLS 1.2+ encrypted communications
  - AES-256-GCM credential encryption
  - Web Access Code (WAC) authentication
  - EFILE certification number validation
  - Session management with auto-expiry

- **Validation**
  - Pre-submission validation
  - Business number format validation
  - Line calculation verification
  - Duplicate submission prevention

- **Audit & Compliance**
  - Comprehensive audit logging
  - Filing status tracking
  - Historical filing records
  - Error tracking and reporting

## Architecture

```
cra/
├── cra.module.ts              # Main module
├── cra.controller.ts          # REST API endpoints
├── cra.service.ts             # Orchestration service
├── cra-auth.service.ts        # Authentication & sessions
├── cra-netfile.client.ts      # HTTP client for NetFile API
├── services/
│   └── cra-efiler.service.ts  # E-filing operations
├── interfaces/
│   └── cra.interface.ts       # TypeScript interfaces
├── dto/
│   └── cra.dto.ts            # Request/response DTOs
├── utils/
│   └── cra-encryption.util.ts # Encryption utilities
└── __tests__/                 # Unit tests
```

## Configuration

Add these environment variables:

```bash
# CRA Configuration
CRA_EFILE_NUMBER=your_efile_number
CRA_WEB_ACCESS_CODE=your_web_access_code  # Optional if passed per request
CRA_SANDBOX=true                           # true for test, false for production
CRA_ENCRYPTION_KEY=your_32_char_key       # 32+ character encryption key

# Optional
CRA_API_TIMEOUT=30000                      # Request timeout in ms (default: 30000)
```

## Usage

### 1. Connect to CRA

```typescript
POST /integrations/cra/connect
{
  "organizationId": "org-123",
  "businessNumber": "123456789RT0001",
  "webAccessCode": "ACCESSCODE123"  // Optional if configured
}
```

### 2. Validate Return

```typescript
POST /integrations/cra/validate
{
  "organizationId": "org-123",
  "returnData": {
    "businessNumber": "123456789RT0001",
    "reportingPeriod": {
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "frequency": "quarterly",
      "dueDate": "2024-04-30"
    },
    "returnType": "GST34",
    "line101_salesRevenue": 100000,
    "line103_taxCollected": 5000,
    "line105_totalTaxToRemit": 5000,
    "line106_currentITCs": 2000,
    "line108_totalITCs": 2000,
    "line109_netTax": 3000,
    "certifierName": "John Doe",
    "certifierCapacity": "Owner",
    "declarationDate": "2024-04-15"
  }
}
```

### 3. Submit Return

```typescript
POST /integrations/cra/submit
{
  "organizationId": "org-123",
  "gstHstReturn": { /* Same as returnData above */ },
  "transmitterInfo": {
    "name": "Your Business Name",
    "efileNumber": "EFILE123456",
    "contactPhone": "+15551234567",
    "contactEmail": "contact@yourbusiness.com"
  }
}
```

Response:
```json
{
  "status": "SUBMITTED",
  "confirmationNumber": "CRA-CONF-12345",
  "filedAt": "2024-04-15T10:30:00Z"
}
```

### 4. Check Filing Status

```typescript
POST /integrations/cra/status
{
  "organizationId": "org-123",
  "confirmationNumber": "CRA-CONF-12345"
}
```

### 5. Get Filing History

```typescript
GET /integrations/cra/org-123/filings?startDate=2024-01-01&endDate=2024-12-31&limit=100
```

## Business Number Format

CRA Business Numbers follow this format:
- 9 digits (business registration)
- 2 letter program identifier (RT for GST/HST)
- 4 digit reference number

Example: `123456789RT0001`

## GST/HST Return Lines

### Revenue & Tax Collected
- **Line 101**: Total sales and other revenue
- **Line 103**: GST/HST collected or collectible
- **Line 104**: Adjustments (optional)
- **Line 105**: Total GST/HST to remit (103 + 104)

### Input Tax Credits
- **Line 106**: ITCs for current period
- **Line 107**: ITC adjustments (optional)
- **Line 108**: Total ITCs (106 + 107)

### Net Tax & Credits
- **Line 109**: Net tax (105 - 108)
- **Line 110**: Installment refund claimed (optional)
- **Line 111**: Other credits (optional)
- **Line 112**: Total credits (110 + 111)
- **Line 113A/B**: Amount owing or refund claimed
- **Line 114**: Rebate claimed (optional)

## Error Handling

The module uses structured error codes:

- **CRA-001 to CRA-004**: Authentication errors
- **CRA-101 to CRA-104**: Validation errors
- **CRA-201 to CRA-204**: Filing errors
- **CRA-301 to CRA-304**: Network/system errors
- **CRA-401 to CRA-403**: Business errors

Example error response:
```json
{
  "status": "ERROR",
  "errors": [
    {
      "code": "CRA-101",
      "message": "Invalid Business Number format",
      "field": "businessNumber"
    }
  ]
}
```

## Testing

Run unit tests:
```bash
npm test cra
```

Run integration tests (requires sandbox credentials):
```bash
CRA_SANDBOX=true npm test cra.integration
```

## Security Considerations

1. **TLS 1.2+**: All communications use TLS 1.2 or higher
2. **Credential Encryption**: Web Access Codes stored with AES-256-GCM
3. **Session Management**: 30-minute session timeout
4. **Audit Logging**: All operations logged for compliance
5. **Rate Limiting**: Built-in rate limiting (2 requests/second)

## Provincial Tax Rates (2024)

| Province | GST | PST/QST | HST | Total |
|----------|-----|---------|-----|-------|
| AB, YT, NT, NU | 5% | 0% | - | 5% |
| BC | 5% | 7% | - | 12% |
| MB | 5% | 7% | - | 12% |
| SK | 5% | 6% | - | 11% |
| QC | 5% | 9.975% | - | 14.975% |
| ON | - | - | 13% | 13% |
| NB, NL, NS, PE | - | - | 15% | 15% |

## Filing Frequencies

- **Monthly**: Annual GST/HST > $6M
- **Quarterly**: Annual revenue $1.5M - $6M
- **Annual**: Annual revenue < $1.5M

## Support

For CRA NetFile API documentation:
- Production: https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/business-account.html
- Developer Portal: https://developer.canada.ca/en/api-documentation

## License

Internal use only - Operate/CoachOS
