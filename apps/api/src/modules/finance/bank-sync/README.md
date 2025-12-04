# Bank Sync Service

The Bank Sync Service orchestrates synchronization of bank data across multiple providers (Tink, Plaid, TrueLayer, etc.) with support for PSD2 consent management, automatic token refresh, and comprehensive error handling.

## Features

- **Multi-Provider Support**: Currently supports Tink Open Banking, easily extensible for Plaid, TrueLayer, etc.
- **Automatic Token Refresh**: Handles OAuth token expiration seamlessly
- **PSD2 Consent Management**: 90-day consent tracking and renewal notifications
- **Encrypted Storage**: All tokens stored with AES-256-GCM encryption
- **Audit Logging**: Comprehensive logging of all sync operations
- **Error Handling**: Retry logic for transient failures, clear error reporting
- **Batch Operations**: Sync multiple connections concurrently with controlled concurrency
- **Health Monitoring**: Real-time connection health status

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   BankSyncService                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Connection Management                            │  │
│  │  - Create, Sync, Disconnect                       │  │
│  │  - Health Monitoring                              │  │
│  │  - Consent Refresh                                │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────┬────────┴─────────┬────────────────┐  │
│  │              │                   │                 │  │
│  │   Tink      │    Plaid         │   TrueLayer    │  │
│  │  Service    │   Service        │    Service     │  │
│  │             │  (future)        │   (future)     │  │
│  └──────────────┴──────────────────┴────────────────┘  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
                  ┌────────┴─────────┐
                  │                  │
           ┌──────▼──────┐   ┌──────▼──────┐
           │  Database   │   │  Provider   │
           │  (Prisma)   │   │   APIs      │
           └─────────────┘   └─────────────┘
```

## API Endpoints

### Create Connection
```http
POST /organisations/:orgId/bank-connections
```
**Request Body:**
```json
{
  "provider": "TINK",
  "authCode": "auth_code_from_oauth",
  "state": "state_from_oauth",
  "institutionId": "se-swedish-bank",
  "institutionName": "Swedish Bank"
}
```

### Trigger Sync
```http
POST /organisations/:orgId/bank-connections/:id/sync
```
**Request Body (optional):**
```json
{
  "forceFullSync": false,
  "accountIds": ["acc_123"],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### Batch Sync All Connections
```http
POST /organisations/:orgId/bank-connections/sync-all
```
**Request Body (optional):**
```json
{
  "connectionIds": ["conn_1", "conn_2"],
  "concurrency": 3,
  "continueOnError": true
}
```

### Get Connection Status
```http
GET /organisations/:orgId/bank-connections/:id/status
```

### Disconnect Bank
```http
DELETE /organisations/:orgId/bank-connections/:id
```

### Refresh Expired Consents
```http
POST /organisations/:orgId/bank-connections/refresh-consents
```

## Service Methods

### `createConnection(params: CreateConnectionParams)`
Creates a new bank connection after OAuth authorization.

**Parameters:**
- `orgId`: Organization ID
- `provider`: Bank provider (TINK, PLAID, etc.)
- `authCode`: OAuth authorization code
- `state`: OAuth state parameter
- `institutionId`: Bank institution identifier
- `institutionName`: Bank name

**Returns:** `{ connectionId: string }`

**Example:**
```typescript
const result = await bankSyncService.createConnection({
  orgId: 'org_123',
  provider: BankProvider.TINK,
  authCode: 'code_abc',
  state: 'state_xyz',
  institutionId: 'se-nordea',
  institutionName: 'Nordea Bank'
});
```

### `syncConnection(params: SyncConnectionParams)`
Synchronizes accounts and transactions for a connection.

**Parameters:**
- `connectionId`: Bank connection ID
- `forceFullSync`: Ignore last sync date (default: false)
- `accountIds`: Sync specific accounts only
- `startDate`: Transaction start date
- `endDate`: Transaction end date

**Returns:** `SyncResult`

**Example:**
```typescript
const result = await bankSyncService.syncConnection({
  connectionId: 'conn_123',
  forceFullSync: false,
  startDate: new Date('2024-01-01')
});
```

### `syncAllConnections(params: BatchSyncParams)`
Syncs all active connections for an organization.

**Parameters:**
- `orgId`: Organization ID
- `connectionIds`: Specific connections (optional)
- `concurrency`: Max concurrent syncs (default: 3)
- `continueOnError`: Continue if sync fails (default: true)

**Returns:** `BatchSyncResult`

### `refreshExpiredConsents(params: RefreshExpiredConsentsParams)`
Checks and refreshes PSD2 consents that are expiring soon.

**Parameters:**
- `daysBeforeExpiry`: Days before expiry to trigger refresh (default: 7)
- `batchSize`: Max connections to process (default: 10)

**Returns:** `RefreshExpiredConsentsResult`

### `disconnectBank(connectionId: string)`
Revokes access and marks connection as disconnected.

### `getConnectionStatus(connectionId: string)`
Gets current connection health and status.

**Returns:** `ConnectionHealth`

## Data Flow

### 1. Connection Creation
```
User OAuth → Provider Authorization → Auth Code
                                         ↓
                                   Exchange for Tokens
                                         ↓
                                   Encrypt & Store
                                         ↓
                                   Create BankConnection
                                         ↓
                                   Trigger Initial Sync
```

### 2. Account Sync
```
Fetch Accounts from Provider API
         ↓
Check if Account Exists in DB
         ↓
Create or Update BankAccountNew
         ↓
Update Balances & Metadata
```

### 3. Transaction Sync
```
For Each Account:
  ├─ Fetch Transactions (with date range)
  ├─ Check for Duplicates (by transactionId)
  ├─ Create BankTransactionNew
  └─ Mark as UNMATCHED (reconciliationStatus)
```

## Error Handling

### Error Types
- **AUTHENTICATION**: Token expired, consent revoked
- **RATE_LIMIT**: Provider API rate limiting
- **NETWORK**: Connection timeout, network issues
- **ACCOUNT**: Account-specific errors
- **TRANSACTION**: Transaction sync errors
- **UNKNOWN**: Unexpected errors

### Retry Strategy
- **Transient Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Mark connection as REQUIRES_REAUTH
- **Rate Limit**: Pause and resume after reset time
- **Fatal Errors**: Log and notify user

### Status Management
```
PENDING → ACTIVE ⇄ ERROR
            ↓
      REQUIRES_REAUTH
            ↓
      DISCONNECTED
```

## Reconciliation

All synced transactions are initially marked as `UNMATCHED`:

```typescript
reconciliationStatus: ReconciliationStatus.UNMATCHED
```

The reconciliation engine (separate module) will:
1. Match transactions to expenses
2. Auto-categorize based on merchant
3. Apply reconciliation rules
4. Update status to MATCHED or IGNORED

## Security

### Token Storage
- All access/refresh tokens encrypted with AES-256-GCM
- Encryption key from environment (`TINK_ENCRYPTION_KEY`)
- Tokens never logged or exposed in responses

### PSD2 Compliance
- 90-day consent window enforced
- Automatic consent expiry tracking
- User re-authorization required for renewal

### Audit Trail
- All sync operations logged
- Includes metrics, errors, duration
- Queryable for compliance reporting

## Monitoring

### Health Checks
```typescript
const health = await bankSyncService.getConnectionStatus(connectionId);

{
  connectionId: "conn_123",
  status: "ACTIVE",
  isHealthy: true,
  consentDaysRemaining: 45,
  requiresReauth: false,
  errors: [],
  warnings: ["Last sync was 36 hours ago"]
}
```

### Metrics
- Accounts synced
- Transactions created/updated
- API calls count
- Average response time
- Error rate

## Cron Jobs

### Daily Sync (Recommended)
```typescript
@Cron('0 2 * * *') // 2 AM daily
async dailySync() {
  const orgs = await getActiveOrgs();

  for (const org of orgs) {
    await bankSyncService.syncAllConnections({
      orgId: org.id,
      concurrency: 5,
      continueOnError: true
    });
  }
}
```

### Consent Refresh (Weekly)
```typescript
@Cron('0 0 * * 0') // Sunday midnight
async weeklyConsentRefresh() {
  await bankSyncService.refreshExpiredConsents({
    daysBeforeExpiry: 7,
    batchSize: 50
  });
}
```

## Testing

### Unit Tests
```bash
npm test bank-sync.service.spec.ts
```

### Integration Tests
```bash
npm test bank-sync.integration.spec.ts
```

### Mock Mode
For development without real bank connections:
```env
TINK_MOCK_MODE=true
```

## Environment Variables

```env
# Tink Configuration
TINK_CLIENT_ID=your_client_id
TINK_CLIENT_SECRET=your_client_secret
TINK_ENCRYPTION_KEY=your_32_byte_encryption_key
TINK_API_URL=https://api.tink.com
TINK_LINK_URL=https://link.tink.com/1.0
TINK_REDIRECT_URI=https://yourapp.com/integrations/tink/callback
TINK_ENVIRONMENT=sandbox # or production
TINK_MOCK_MODE=false
```

## Future Enhancements

- [ ] Plaid integration (US banks)
- [ ] TrueLayer integration (UK banks)
- [ ] FinAPI integration (German banks)
- [ ] Webhook support for real-time updates
- [ ] Transaction categorization ML
- [ ] Duplicate detection improvements
- [ ] Smart sync scheduling based on account activity
- [ ] Multi-currency support
- [ ] Transaction enrichment (merchant logos, categories)

## Related Modules

- **Tink Service**: Provider integration (`/integrations/tink`)
- **Reconciliation**: Transaction matching (`/finance/reconciliation`)
- **Expenses**: Expense management (`/finance/expenses`)
- **Invoices**: Invoice management (`/finance/invoices`)

## Support

For issues or questions:
- GitHub Issues: [Operate/CoachOS Issues]
- Slack: #finance-integrations
- Email: support@operate.com
