# freee Accounting Integration

Enterprise-grade integration with freee, Japan's largest cloud accounting software.

## Overview

This integration provides secure OAuth2-based connectivity to freee API with bidirectional data synchronization capabilities.

### Key Features

- **Secure OAuth2 with PKCE**: Enhanced security with Proof Key for Code Exchange
- **Encrypted Token Storage**: AES-256-GCM encryption for access and refresh tokens
- **Automatic Token Refresh**: Seamless token renewal before expiry
- **Multi-Company Support**: Connect multiple freee companies per organization
- **Bidirectional Sync**: Two-way data synchronization between Operate and freee
- **Rate Limiting**: Respects freee's API limits (600 req/10 min per company)
- **Japanese Fiscal Year**: Native support for April-March fiscal year
- **Comprehensive Audit Logging**: Track all API interactions

## Supported Entities

### 1. Partners (取引先) - Contacts
- Customers (顧客)
- Vendors (仕入先)
- Employees (従業員)
- Full address and bank account details
- Invoice registration numbers (インボイス番号)

### 2. Invoices (請求書)
- Sales invoices with line items
- Multiple VAT rates support
- Payment tracking
- Japanese address formatting

### 3. Deals (取引) - Transactions
- Income transactions (収入)
- Expense transactions (支出)
- Multi-line item support
- Payment settlements

### 4. Wallet Transactions (明細)
- Bank account transactions
- Credit card transactions
- Running balance calculations

## Setup

### 1. freee App Registration

1. Create a freee app at: https://app.secure.freee.co.jp/developers/applications
2. Set redirect URI to: `https://your-domain.com/api/integrations/freee/callback`
3. Request scopes: `read write`
4. Save Client ID and Client Secret

### 2. Environment Variables

```bash
# Required
FREEE_CLIENT_ID=your_client_id
FREEE_CLIENT_SECRET=your_client_secret
FREEE_REDIRECT_URI=https://your-domain.com/api/integrations/freee/callback
FREEE_ENCRYPTION_KEY=your_32_char_min_encryption_key_here

# Optional
FREEE_WEBHOOK_SECRET=your_webhook_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Schema

Add the following to your Prisma schema:

```prisma
model FreeeConnection {
  id                     String   @id @default(cuid())
  orgId                  String
  freeeCompanyId         Int
  freeeCompanyName       String?

  // Encrypted tokens
  accessToken            String
  accessTokenIv          Bytes
  accessTokenTag         Bytes
  refreshToken           String
  refreshTokenIv         Bytes
  refreshTokenTag        Bytes

  // Token expiry
  tokenExpiresAt         DateTime
  refreshTokenExpiresAt  DateTime

  // Status
  status                 String   @default("CONNECTED")
  lastSyncAt             DateTime?
  lastError              String?
  connectedAt            DateTime @default(now())

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([orgId, freeeCompanyId])
  @@index([orgId])
  @@index([status])
}

model FreeeAuditLog {
  id           String   @id @default(cuid())
  orgId        String
  action       String
  endpoint     String?
  statusCode   Int?
  success      Boolean
  errorMessage String?
  requestId    String?
  ipAddress    String?
  userAgent    String?
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([orgId])
  @@index([createdAt])
  @@index([action])
}
```

## Usage

### OAuth Flow

```typescript
import { FreeeOAuthService } from './integrations/freee';

// 1. Generate authorization URL
const { authUrl, state } = await freeeOAuthService.generateAuthUrl(orgId);
// Redirect user to authUrl

// 2. Handle callback (automatic in controller)
// User will be redirected back to your app with auth code

// 3. Check connection status
const status = await freeeOAuthService.getConnectionStatus(orgId);
console.log(status.isConnected); // true
```

### Syncing Data

```typescript
import { FreeeService } from './integrations/freee';

// Get all partners (contacts)
const partners = await freeeService.getPartners(orgId, freeeCompanyId);

// Get invoices for current fiscal year
const fy = freeeService.getCurrentFiscalYear();
const { startDate, endDate } = freeeService.getFiscalYearDates(fy);
const invoices = await freeeService.getInvoices(orgId, freeeCompanyId, {
  startIssueDate: startDate,
  endIssueDate: endDate,
});

// Create a new partner
const newPartner = await freeeService.createPartner(orgId, freeeCompanyId, {
  name: '株式会社テスト',
  email: 'test@example.com',
  phone: '03-1234-5678',
});

// Create an invoice
const newInvoice = await freeeService.createInvoice(orgId, freeeCompanyId, {
  partner_id: newPartner.id,
  issue_date: '2024-04-01',
  due_date: '2024-04-30',
  invoice_contents: [
    {
      order: 0,
      type: 'normal',
      qty: 1,
      unit_price: 10000,
      description: 'Consulting services',
    },
  ],
});
```

### Using Mappers

```typescript
import {
  FreeeContactMapper,
  FreeeInvoiceMapper
} from './integrations/freee';

// Map freee partner to Operate contact
const freeePartner = await freeeService.getPartner(orgId, companyId, partnerId);
const operateContact = contactMapper.mapToOperateContact(freeePartner);

// Map Operate invoice to freee invoice
const operateInvoice = {...}; // Your Operate invoice
const freeeInvoice = invoiceMapper.mapToFreeeInvoice(
  operateInvoice,
  freeeCompanyId,
  partnerId
);
```

## API Endpoints

### OAuth Endpoints

- `GET /api/integrations/freee/auth?orgId={orgId}`
  - Generate authorization URL

- `GET /api/integrations/freee/callback?code={code}&state={state}`
  - OAuth callback handler

- `GET /api/integrations/freee/status?orgId={orgId}&freeeCompanyId={companyId}`
  - Get connection status

- `POST /api/integrations/freee/refresh-token?orgId={orgId}`
  - Manually refresh access token

- `DELETE /api/integrations/freee/disconnect?orgId={orgId}`
  - Disconnect freee integration

## Rate Limiting

freee API enforces the following limits:
- **600 requests per 10 minutes per company**
- This integration implements:
  - Request counting per company
  - Automatic throttling (1 req/sec to avoid bursts)
  - Rate limit error handling
  - Automatic window reset

## Japanese Fiscal Year Support

freee follows the Japanese fiscal year (April 1 - March 31):

```typescript
// Get FY2024 dates (April 2024 - March 2025)
const dates = freeeService.getFiscalYearDates(2024);
// { startDate: '2024-04-01', endDate: '2025-03-31' }

// Get current fiscal year
const currentFY = freeeService.getCurrentFiscalYear();
// If today is Feb 2025, returns 2024 (FY2024 = Apr 2024 - Mar 2025)
// If today is May 2025, returns 2025 (FY2025 = Apr 2025 - Mar 2026)
```

## Error Handling

The integration handles various error scenarios:

- **401 Unauthorized**: Automatic token refresh attempted
- **429 Rate Limit**: Clear error with retry time
- **Network Errors**: Logged with request details
- **Invalid Credentials**: Clear error messages

All errors are logged to `FreeeAuditLog` for troubleshooting.

## Security

- **Encryption**: All tokens encrypted with AES-256-GCM
- **PKCE**: OAuth2 PKCE flow prevents authorization code interception
- **State Validation**: CSRF protection via state parameter
- **Token Rotation**: Automatic refresh before expiry
- **Audit Logging**: Complete audit trail of all operations

## Testing

```bash
# Run unit tests
npm test freee.service.spec.ts

# Run integration tests (requires freee sandbox)
npm run test:integration freee
```

## Troubleshooting

### Connection Issues

1. Verify environment variables are set correctly
2. Check freee app settings (redirect URI, scopes)
3. Review audit logs for detailed error messages

### Rate Limiting

If you hit rate limits frequently:
1. Implement batch operations
2. Use incremental sync instead of full sync
3. Schedule syncs during off-peak hours

### Token Expiry

- Access tokens expire after 24 hours
- Refresh tokens expire after 90 days
- Both are automatically refreshed by the service
- Manual refresh available via API endpoint

## Resources

- [freee API Documentation](https://developer.freee.co.jp/docs)
- [OAuth2 PKCE Specification](https://datatracker.ietf.org/doc/html/rfc7636)
- [Japanese Fiscal Year Information](https://www.jetro.go.jp/en/invest/setting_up/section3/page6.html)

## Support

For issues or questions:
1. Check audit logs: `FreeeAuditLog` table
2. Review error messages in connection status
3. Contact development team with request ID from logs
