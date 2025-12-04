# Gusto Embedded Payroll Integration

Complete integration with Gusto Embedded Payroll API for US payroll processing.

## Overview

This module provides a full-featured integration with Gusto's Embedded Payroll platform, enabling Operate/CoachOS to offer US payroll services including:

- 🏢 **Company Provisioning** - Onboard new companies to Gusto
- 👥 **Employee Management** - Create, update, and sync employees
- 💰 **Payroll Processing** - Run payroll, manage payments
- 🔔 **Real-time Updates** - Webhook events for instant synchronization
- 🔐 **Secure Authentication** - OAuth2 with PKCE flow
- 🔄 **Automatic Token Refresh** - Seamless authentication maintenance

## Features

### Authentication
- OAuth2 authorization code flow with PKCE
- Automatic token refresh before expiration
- Encrypted token storage (AES-256-GCM)
- Multi-company support per organization

### Company Management
- Company provisioning (create company + get token)
- Company information retrieval
- Location management
- Company status tracking

### Employee Operations
- Employee creation and updates
- Bulk employee sync from Gusto
- Job and compensation management
- Termination handling
- Employee onboarding status

### Payroll
- Payroll creation and updates
- Payroll processing
- Payment tracking
- Tax calculations

### Webhooks
- Real-time event notifications
- Signature verification (HMAC-SHA256)
- Automatic event processing
- Comprehensive audit logging

## Installation

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Gusto API Credentials
GUSTO_CLIENT_ID=your_client_id_here
GUSTO_CLIENT_SECRET=your_client_secret_here
GUSTO_REDIRECT_URI=http://localhost:3000/api/integrations/gusto/callback
GUSTO_WEBHOOK_SECRET=your_webhook_secret_here

# Encryption key for token storage (generate with: openssl rand -base64 32)
GUSTO_ENCRYPTION_KEY=your_encryption_key_here

# Environment (sandbox or production)
GUSTO_ENVIRONMENT=sandbox
```

### 2. Database Setup

Add the Prisma models from `prisma-schema.prisma` to your main schema:

```bash
# Copy models to packages/database/prisma/schema.prisma
cat apps/api/src/modules/integrations/gusto/prisma-schema.prisma

# Run migration
pnpm prisma migrate dev --name add-gusto-integration
```

### 3. Import Module

```typescript
import { GustoModule } from './modules/integrations/gusto';

@Module({
  imports: [
    // ... other modules
    GustoModule,
  ],
})
export class AppModule {}
```

## Usage

### OAuth Flow

#### Step 1: Initiate OAuth

```typescript
POST /api/integrations/gusto/oauth/initiate
Content-Type: application/json

{
  "organisationId": "org_123"
}

Response:
{
  "authorizationUrl": "https://api.gusto-demo.com/oauth/authorize?...",
  "state": "random_state_123"
}
```

Redirect user to `authorizationUrl` to authorize the connection.

#### Step 2: Handle Callback

Gusto redirects back to your `GUSTO_REDIRECT_URI`:

```
GET /api/integrations/gusto/oauth/callback?code=auth_code_123&state=random_state_123
```

The callback endpoint automatically:
- Exchanges code for access token
- Retrieves company information
- Stores encrypted tokens in database
- Returns connection status

### Company Provisioning

Create a new company in Gusto:

```typescript
POST /api/integrations/gusto/provision
Content-Type: application/json

{
  "user": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@acme.com",
    "phone": "+1-555-123-4567"
  },
  "company": {
    "name": "Acme Corp",
    "trade_name": "Acme",
    "ein": "12-3456789",
    "entity_type": "LLC",
    "locations": [
      {
        "street_1": "123 Main St",
        "street_2": "Suite 100",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94105",
        "country": "US"
      }
    ]
  }
}

Response:
{
  "companyUuid": "comp_abc123",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "ACTIVE",
  "expiresAt": "2024-12-03T10:00:00Z"
}
```

### Employee Management

#### Create Employee

```typescript
POST /api/integrations/gusto/company/{companyUuid}/employees
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@acme.com",
  "date_of_birth": "1990-01-15",
  "ssn": "123-45-6789",
  "home_address": {
    "street_1": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105"
  },
  "jobs": [
    {
      "location_uuid": "loc_xyz789",
      "hire_date": "2024-01-01",
      "title": "Software Engineer",
      "rate": "120000",
      "payment_unit": "Year"
    }
  ]
}
```

#### List Employees

```typescript
GET /api/integrations/gusto/company/{companyUuid}/employees

Response:
[
  {
    "uuid": "emp_123",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@acme.com",
    "onboarded": true,
    "terminated": false,
    "jobs": [...]
  }
]
```

#### Sync Employees

Bulk sync all employees from Gusto:

```typescript
POST /api/integrations/gusto/company/{companyUuid}/employees/sync

Response:
{
  "success": true,
  "employeesCreated": 5,
  "employeesUpdated": 3,
  "employeesSkipped": 0,
  "errors": []
}
```

### Company Information

```typescript
GET /api/integrations/gusto/company/{companyUuid}

Response:
{
  "uuid": "comp_abc123",
  "name": "Acme Corp",
  "ein": "12-3456789",
  "company_status": "approved",
  "locations": [...]
}
```

### Webhooks

#### Setup Webhook Endpoint

Configure webhook URL in Gusto dashboard:
```
https://your-domain.com/api/integrations/gusto/webhooks
```

#### Webhook Events

The system automatically processes these events:

- `company.created` - New company created
- `company.updated` - Company details changed
- `employee.created` - New employee added
- `employee.updated` - Employee details changed
- `employee.terminated` - Employee terminated
- `payroll.created` - New payroll created
- `payroll.updated` - Payroll modified
- `payroll.processed` - Payroll completed
- `payroll.cancelled` - Payroll cancelled
- `payment.initiated` - Payment started
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed

#### Webhook Payload Example

```json
{
  "event_type": "employee.created",
  "entity_type": "employee",
  "entity_uuid": "emp_123",
  "company_uuid": "comp_abc123",
  "timestamp": "2024-12-02T10:00:00Z",
  "resource": {
    "uuid": "emp_123",
    "first_name": "Jane",
    "last_name": "Smith",
    ...
  }
}
```

## Security

### Token Encryption

All OAuth tokens are encrypted using AES-256-GCM before storage:

```typescript
// Automatic encryption/decryption
const encrypted = encryption.encrypt(accessToken);
const decrypted = encryption.decrypt(encrypted);
```

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA256:

```typescript
// Automatic verification in webhook controller
const isValid = encryption.verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### Rate Limiting

The service tracks rate limits from Gusto API:

```typescript
const rateLimitInfo = gustoService.getRateLimitInfo();
// { limit: 100, remaining: 95, reset: Date }
```

## Error Handling

All API errors are properly handled and logged:

```typescript
try {
  const employee = await gustoService.getEmployee(token, employeeUuid);
} catch (error) {
  // Automatically throws appropriate HTTP exception
  // - 401: Authentication failed
  // - 403: Insufficient permissions
  // - 404: Resource not found
  // - 429: Rate limit exceeded
}
```

## Testing

### Sandbox Mode

The integration defaults to sandbox mode. Test credentials:
- Base URL: `https://api.gusto-demo.com`
- Use test EINs and SSNs from Gusto documentation

### Production Mode

Set environment variable:
```bash
GUSTO_ENVIRONMENT=production
```

## API Reference

### GustoService

Core API client for Gusto operations.

```typescript
class GustoService {
  getCompany(accessToken: string, companyUuid: string): Promise<GustoCompany>
  listEmployees(accessToken: string, companyUuid: string): Promise<GustoEmployee[]>
  getEmployee(accessToken: string, employeeUuid: string): Promise<GustoEmployee>
  createEmployee(accessToken: string, companyUuid: string, data: Partial<GustoEmployee>): Promise<GustoEmployee>
  updateEmployee(accessToken: string, employeeUuid: string, data: Partial<GustoEmployee>): Promise<GustoEmployee>
  listPayrolls(accessToken: string, companyUuid: string, options?: {...}): Promise<GustoPayroll[]>
  getPayroll(accessToken: string, payrollUuid: string): Promise<GustoPayroll>
}
```

### GustoOAuthService

OAuth flow management.

```typescript
class GustoOAuthService {
  generateAuthorizationUrl(organisationId: string, userId: string): { url: string; state: string }
  exchangeCodeForToken(code: string, state: string): Promise<{ tokens: GustoTokens; organisationId: string; userId: string }>
  refreshAccessToken(refreshToken: string): Promise<GustoTokens>
  isTokenExpired(expiresAt: Date): boolean
}
```

### GustoCompanyService

Company provisioning and management.

```typescript
class GustoCompanyService {
  provisionCompany(request: GustoProvisionRequest): Promise<{ tokens: GustoTokens; companyUuid: string }>
  getCompany(accessToken: string, companyUuid: string): Promise<GustoCompany>
  getCompanyLocations(accessToken: string, companyUuid: string): Promise<GustoLocation[]>
  validateCompanyData(request: GustoProvisionRequest): void
}
```

### GustoEmployeeService

Employee synchronization and management.

```typescript
class GustoEmployeeService {
  syncEmployees(accessToken: string, companyUuid: string, organisationId: string): Promise<GustoEmployeeSyncResult>
  getEmployee(accessToken: string, employeeUuid: string): Promise<GustoEmployee>
  listEmployees(accessToken: string, companyUuid: string): Promise<GustoEmployee[]>
  createEmployee(accessToken: string, companyUuid: string, data: {...}): Promise<GustoEmployee>
  updateEmployee(accessToken: string, employeeUuid: string, updates: Partial<GustoEmployee>): Promise<GustoEmployee>
  validateEmployeeData(data: any): string[]
}
```

## Troubleshooting

### Common Issues

1. **Token Expired Error**
   - Tokens are automatically refreshed 5 minutes before expiration
   - Check `GustoConnection.expiresAt` in database
   - Manually trigger refresh if needed

2. **Webhook Signature Verification Failed**
   - Verify `GUSTO_WEBHOOK_SECRET` matches Gusto dashboard
   - Check webhook payload is not modified
   - Ensure raw body is used for verification

3. **Company Provisioning Failed**
   - Validate all required fields (name, locations)
   - Check EIN format (XX-XXXXXXX)
   - Verify email addresses are valid

4. **Rate Limit Exceeded**
   - Check rate limit info: `gustoService.getRateLimitInfo()`
   - Implement exponential backoff
   - Consider caching frequently accessed data

## Resources

- [Gusto API Documentation](https://docs.gusto.com/embedded-payroll/docs/introduction)
- [OAuth2 with PKCE](https://oauth.net/2/pkce/)
- [Gusto Developer Portal](https://dev.gusto.com/)

## Support

For issues or questions:
1. Check Gusto API documentation
2. Review application logs
3. Check database connection status
4. Verify webhook signature secrets

## License

Internal use only - Operate/CoachOS
