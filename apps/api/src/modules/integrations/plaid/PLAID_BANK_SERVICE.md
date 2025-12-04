# Plaid Bank Service - Implementation Documentation

## Overview

Extended Plaid integration with comprehensive bank account and transaction management for US market.

**Task:** W18-T2 - Create plaid-bank.service.ts
**Status:** ✅ Complete
**Effort:** 2d

## What Was Created

### 1. Prisma Database Schemas

**File:** `packages/database/prisma/schema.prisma`

#### PlaidBankAccount Model
Stores connected bank accounts from Plaid with real-time balance tracking.

**Key Features:**
- Plaid account identifiers (plaidAccountId, plaidItemId)
- Account type classification (DEPOSITORY, CREDIT, LOAN, INVESTMENT)
- Account subtype granularity (CHECKING, SAVINGS, CREDIT_CARD, etc.)
- Real-time balance tracking (current & available)
- Incremental sync cursor for transaction sync
- Institution metadata

**Fields:**
```typescript
{
  id: string (UUID)
  orgId: string
  plaidAccountId: string      // External account ID from Plaid
  plaidItemId: string          // Plaid item this account belongs to
  institutionId: string?
  institutionName: string?
  name: string
  officialName: string?
  mask: string?                // Last 4 digits
  accountType: PlaidAccountType
  accountSubtype: PlaidAccountSubtype?
  currentBalance: Decimal?
  availableBalance: Decimal?
  currency: string (default: "USD")
  lastBalanceUpdate: DateTime?
  balanceAsOf: DateTime?
  lastSyncAt: DateTime?
  syncCursor: string?          // For incremental sync
  initialSyncComplete: boolean
  isActive: boolean
  isPrimary: boolean
  metadata: Json?
}
```

#### PlaidTransaction Model
Stores all bank transactions with rich metadata and reconciliation support.

**Key Features:**
- Full Plaid transaction data capture
- Plaid's personal finance categorization
- Geolocation data for purchases
- Reconciliation matching (invoices/expenses)
- AI categorization support
- Duplicate detection
- Transfer identification
- Tax relevance flagging

**Fields:**
```typescript
{
  id: string (UUID)
  accountId: string
  orgId: string
  plaidTransactionId: string   // Unique from Plaid
  plaidAccountId: string
  plaidItemId: string?

  // Transaction details
  amount: Decimal
  isoCurrencyCode: string (default: "USD")
  date: DateTime
  authorizedDate: DateTime?
  postedDate: DateTime?
  name: string
  merchantName: string?
  originalDescription: string?

  // Status
  status: PlaidTransactionStatus (PENDING, POSTED, REMOVED)
  pending: boolean

  // Plaid categorization
  category: string[]
  categoryId: string?
  personalFinanceCategoryPrimary: string?
  personalFinanceCategoryDetailed: string?
  personalFinanceCategory: Json?

  // Payment metadata
  paymentChannel: string?
  paymentMeta: Json?

  // Location
  locationAddress: string?
  locationCity: string?
  locationRegion: string?
  locationPostalCode: string?
  locationCountry: string?
  locationLat: Decimal?
  locationLon: Decimal?

  // Check details
  checkNumber: string?

  // Counterparty
  counterpartyName: string?
  counterpartyType: string?
  counterpartyLogoUrl: string?
  counterpartyWebsite: string?

  // Reconciliation
  isReconciled: boolean
  matchedExpenseId: string?
  matchedInvoiceId: string?
  matchConfidence: Decimal?
  matchedAt: DateTime?
  matchedBy: string?

  // Internal categorization
  internalCategory: string?
  categoryConfidence: Decimal?

  // Flags
  isDuplicate: boolean
  isTransfer: boolean
  isIncome: boolean
  isTaxRelevant: boolean

  // Raw data & sync
  rawData: Json?
  syncedAt: DateTime
  updatedFromPlaid: DateTime
}
```

**Indexes:**
- Optimized for date-based queries
- Fast reconciliation status lookups
- Merchant name searches
- Organization + date composite indexes

---

### 2. PlaidBankService

**File:** `apps/api/src/modules/integrations/plaid/services/plaid-bank.service.ts`

Manages bank accounts and transactions via Plaid API.

#### Key Methods

##### Account Management
```typescript
// Get all connected bank accounts
async getBankAccounts(orgId: string, itemId?: string)

// Get specific account
async getBankAccount(orgId: string, accountId: string)

// Refresh balances in real-time
async refreshAccountBalances(orgId: string, userId: string, itemId: string)

// Sync all accounts from Plaid
async syncAccounts(orgId: string, userId: string, itemId: string)
```

##### Transaction Management
```typescript
// Get transaction history with pagination
async getTransactions(
  orgId: string,
  accountId: string,
  options?: {
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  }
)

// Incremental transaction sync (using cursor)
async syncTransactions(
  orgId: string,
  userId: string,
  accountId: string
): Promise<{
  added: number,
  modified: number,
  removed: number,
  hasMore: boolean
}>

// Handle transaction removals
async removeTransactions(orgId: string, transactionIds: string[])
```

#### Features
- ✅ Real-time balance refresh
- ✅ Incremental sync using Plaid's cursor API
- ✅ Automatic account type mapping
- ✅ Transaction upsert (added/modified tracking)
- ✅ Comprehensive audit logging
- ✅ Error handling with retry logic

---

### 3. PlaidTransactionMatcherService

**File:** `apps/api/src/modules/integrations/plaid/services/plaid-transaction-matcher.service.ts`

Intelligently matches bank transactions to invoices and expenses using confidence scoring.

#### Matching Strategies

**1. Invoice Matching (Income Transactions)**
- Amount matching (±5% tolerance)
- Date range matching (±7 days default)
- Customer name similarity (Levenshtein distance)
- Confidence-based auto-confirmation

**2. Expense Matching (Debit Transactions)**
- Amount matching (±5% tolerance)
- Date range matching (±7 days default)
- Vendor/merchant name similarity
- Description pattern matching

#### Confidence Scoring System

**Scoring Weights:**
- Amount match: 40%
  - Exact: 0.4
  - Within 5%: 0.3
  - Within 10%: 0.2
- Date proximity: 30%
  - Same day: 0.3
  - Within 3 days: 0.25
  - Within 7 days: 0.2
  - Within 14 days: 0.1
- Name similarity: 30%
  - >70% match: 0.3
  - >50% match: 0.15

**Confidence Levels:**
- **1.0**: Exact match (amount + date + merchant)
- **0.8-0.99**: High confidence (auto-confirm eligible)
- **0.6-0.79**: Medium confidence (manual review)
- **0.4-0.59**: Low confidence (suggestion only)
- **<0.4**: No match suggested

#### Key Methods

```typescript
// Match transaction to invoices
async matchToInvoices(
  orgId: string,
  transactionId: string,
  options?: {
    autoConfirm?: boolean,
    minConfidence?: number
  }
)

// Match transaction to expenses
async matchToExpenses(
  orgId: string,
  transactionId: string,
  options?: {
    autoConfirm?: boolean,
    minConfidence?: number
  }
)

// Get suggested matches for unreconciled transactions
async getSuggestedMatches(orgId: string, limit = 50)

// Confirm matches
async confirmInvoiceMatch(transactionId, invoiceId, confidence, userId)
async confirmExpenseMatch(transactionId, expenseId, confidence, userId)
```

#### Advanced Features
- ✅ Levenshtein distance string matching
- ✅ Configurable confidence thresholds
- ✅ Auto-confirmation for high-confidence matches
- ✅ Bulk suggestion retrieval
- ✅ Automatic invoice status updates (PAID)

---

### 4. Background Sync Jobs (BullMQ)

**File:** `apps/api/src/modules/integrations/plaid/jobs/plaid-sync.job.ts`

Four specialized job processors for asynchronous Plaid operations.

#### Job Processors

##### 1. PlaidDailySyncProcessor
**Queue:** `plaid-sync`

Syncs transactions for all active accounts daily.

```typescript
Job Data: {
  orgId: string,
  userId: string,
  accountIds?: string[]  // Optional: specific accounts only
}

Returns: {
  success: boolean,
  accountsProcessed: number,
  results: Array<{
    accountId: string,
    accountName: string,
    added: number,
    modified: number,
    removed: number,
    hasMore: boolean
  }>
}
```

**Features:**
- Progress tracking per account
- Continues on individual account failures
- Comprehensive result reporting

##### 2. PlaidBalanceRefreshProcessor
**Queue:** `plaid-balance`

Refreshes account balances in real-time.

```typescript
Job Data: {
  orgId: string,
  userId: string,
  itemId: string
}

Returns: {
  success: boolean,
  accountsRefreshed: number,
  timestamp: Date
}
```

**Use Cases:**
- Pre-transaction verification
- Dashboard balance updates
- Scheduled balance checks

##### 3. PlaidWebhookProcessor
**Queue:** `plaid-webhook`

Processes Plaid webhooks asynchronously.

```typescript
Job Data: {
  webhookType: string,
  webhookCode: string,
  itemId: string,
  data: any
}

Supported Webhooks:
- TRANSACTIONS.SYNC_UPDATES_AVAILABLE
- TRANSACTIONS.DEFAULT_UPDATE
- TRANSACTIONS.REMOVED
- ITEM.ERROR
- ITEM.PENDING_EXPIRATION
- ITEM.USER_PERMISSION_REVOKED
```

**Webhook Actions:**
- Queue sync jobs when updates available
- Mark transactions as removed
- Update connection status on errors
- Handle permission revocations

##### 4. PlaidAutoMatchProcessor
**Queue:** `plaid-auto-match`

Auto-matches transactions to invoices/expenses.

```typescript
Job Data: {
  orgId: string,
  limit?: number (default: 50),
  minConfidence?: number (default: 0.85)
}

Returns: {
  success: boolean,
  totalSuggestions: number,
  invoiceMatches: number,
  expenseMatches: number,
  totalMatched: number
}
```

**Features:**
- Configurable confidence threshold
- Progress tracking
- Automatic match confirmation
- Separate tracking for invoices vs expenses

---

### 5. Module Updates

**File:** `apps/api/src/modules/integrations/plaid/plaid.module.ts`

Updated PlaidModule with new services and BullMQ integration.

**Added Imports:**
```typescript
import { BullModule } from '@nestjs/bullmq';
import { PlaidBankService } from './services/plaid-bank.service';
import { PlaidTransactionMatcherService } from './services/plaid-transaction-matcher.service';
import {
  PlaidDailySyncProcessor,
  PlaidBalanceRefreshProcessor,
  PlaidWebhookProcessor,
  PlaidAutoMatchProcessor
} from './jobs/plaid-sync.job';
```

**BullMQ Queues:**
- `plaid-sync` - Daily transaction sync
- `plaid-balance` - Balance refresh
- `plaid-webhook` - Webhook processing
- `plaid-auto-match` - Transaction matching

**Exports:**
- PlaidService (existing)
- PlaidBankService (new)
- PlaidTransactionMatcherService (new)

---

## Usage Examples

### 1. Sync Bank Accounts

```typescript
import { PlaidBankService } from '@/modules/integrations/plaid';

// Sync all accounts for an organization
const accounts = await plaidBankService.syncAccounts(
  orgId,
  userId,
  itemId
);

console.log(`Synced ${accounts.length} accounts`);
```

### 2. Sync Transactions

```typescript
// Incremental transaction sync
const result = await plaidBankService.syncTransactions(
  orgId,
  userId,
  accountId
);

console.log(`
  Added: ${result.added}
  Modified: ${result.modified}
  Removed: ${result.removed}
  Has More: ${result.hasMore}
`);
```

### 3. Get Transaction History

```typescript
const { transactions, total } = await plaidBankService.getTransactions(
  orgId,
  accountId,
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    limit: 100,
    offset: 0
  }
);
```

### 4. Match Transactions

```typescript
import { PlaidTransactionMatcherService } from '@/modules/integrations/plaid';

// Auto-match with high confidence threshold
const matches = await matcherService.matchToExpenses(
  orgId,
  transactionId,
  {
    autoConfirm: true,
    minConfidence: 0.9
  }
);

// Get all suggested matches
const suggestions = await matcherService.getSuggestedMatches(orgId, 50);
```

### 5. Queue Background Jobs

```typescript
import { Queue } from 'bullmq';
import { PLAID_JOB_NAMES } from '@/modules/integrations/plaid';

// Queue daily sync
await plaidSyncQueue.add(
  PLAID_JOB_NAMES.DAILY_SYNC,
  {
    orgId,
    userId,
    accountIds: ['account-1', 'account-2']
  },
  {
    repeat: {
      pattern: '0 2 * * *' // 2 AM daily
    }
  }
);

// Queue balance refresh
await plaidBalanceQueue.add(
  PLAID_JOB_NAMES.BALANCE_REFRESH,
  { orgId, userId, itemId }
);

// Queue auto-matching
await plaidAutoMatchQueue.add(
  PLAID_JOB_NAMES.AUTO_MATCH,
  {
    orgId,
    limit: 100,
    minConfidence: 0.85
  },
  {
    repeat: {
      pattern: '0 */6 * * *' // Every 6 hours
    }
  }
);
```

---

## Database Migration

Before using these features, run Prisma migration:

```bash
cd packages/database
npx prisma migrate dev --name add_plaid_bank_models
npx prisma generate
```

---

## Environment Variables

Required Plaid configuration (already set in existing module):

```bash
# Plaid API Credentials
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox|development|production

# Encryption
PLAID_ENCRYPTION_KEY=your_32_byte_encryption_key
# OR fallback to:
JWT_SECRET=your_jwt_secret

# Webhooks
PLAID_WEBHOOK_URL=https://your-domain.com/api/plaid/webhook
PLAID_WEBHOOK_SECRET=your_webhook_secret

# OAuth
PLAID_REDIRECT_URI=https://your-domain.com/integrations/plaid/callback

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

---

## Security Considerations

### 1. Access Token Encryption
- All Plaid access tokens encrypted with AES-256-GCM before storage
- Encryption key required (`PLAID_ENCRYPTION_KEY` or `JWT_SECRET`)
- Decryption only happens in-memory during API calls

### 2. Webhook Verification
- All webhooks verified using HMAC signature
- Prevents unauthorized webhook injection
- Implemented in PlaidService.verifyWebhookSignature()

### 3. Audit Logging
- All operations logged to `plaid_audit_logs` table
- Includes user ID, action, metadata, and timestamps
- No sensitive data in logs (tokens, account numbers)

### 4. Data Isolation
- All queries scoped to `orgId`
- Multi-tenant isolation enforced
- No cross-organization data access

---

## API Endpoints

The existing PlaidController can be extended with these new methods:

```typescript
// Bank accounts
GET    /api/plaid/accounts              // List all accounts
GET    /api/plaid/accounts/:id          // Get specific account
POST   /api/plaid/accounts/sync         // Sync accounts
POST   /api/plaid/accounts/refresh      // Refresh balances

// Transactions
GET    /api/plaid/transactions          // List transactions
POST   /api/plaid/transactions/sync     // Sync transactions
GET    /api/plaid/transactions/:id      // Get transaction details

// Matching
GET    /api/plaid/matches/suggestions   // Get suggested matches
POST   /api/plaid/matches/confirm       // Confirm a match
POST   /api/plaid/matches/auto          // Run auto-matching
```

---

## Testing

### Unit Tests
```bash
npm test plaid-bank.service.spec.ts
npm test plaid-transaction-matcher.service.spec.ts
```

### Integration Tests
```bash
npm test plaid-sync.job.spec.ts
```

### Manual Testing (Sandbox Mode)
```bash
# Set PLAID_ENV=sandbox
# Use Plaid's test credentials
# Test institutions available: Chase, Bank of America, Wells Fargo, etc.
```

---

## Performance Optimization

### 1. Incremental Sync
- Uses Plaid's `transactions/sync` endpoint with cursor
- Only fetches new/modified transactions
- Reduces API calls and data transfer

### 2. Batch Processing
- Job processors handle multiple accounts in parallel
- Progress tracking for long-running jobs
- Configurable batch sizes

### 3. Database Indexes
- Optimized indexes for common queries
- Composite indexes for date ranges + org
- Merchant name index for fast matching

### 4. Caching Strategy
- Balance data cached with timestamp
- Transaction sync cursor persisted
- Reduces unnecessary Plaid API calls

---

## Monitoring & Observability

### 1. Job Monitoring
```typescript
// BullMQ dashboard available at:
// http://localhost:3000/admin/queues

// Monitor job status:
const jobs = await plaidSyncQueue.getJobs(['completed', 'failed']);
```

### 2. Audit Logs
```sql
-- View recent sync operations
SELECT * FROM plaid_audit_logs
WHERE action = 'TRANSACTIONS_SYNCED'
ORDER BY created_at DESC
LIMIT 100;

-- Check sync success rate
SELECT
  action,
  COUNT(*) as total,
  AVG((metadata->>'duration')::int) as avg_duration_ms
FROM plaid_audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY action;
```

### 3. Health Checks
- Monitor connection status in `plaid_connections` table
- Track last sync timestamps
- Alert on failed jobs (via BullMQ events)

---

## Future Enhancements

### Potential Improvements
1. **ML-Based Matching**: Train model on user corrections for better matching
2. **Rule Engine**: Allow users to create custom matching rules
3. **Bulk Import**: Historical transaction import for new connections
4. **Multi-Currency Support**: Extend beyond USD
5. **Receipt Matching**: OCR + transaction matching
6. **Duplicate Detection**: Improved algorithm with fuzzy matching
7. **Spending Analytics**: Category-based insights
8. **Budget Tracking**: Real-time budget monitoring vs transactions

---

## Files Created

1. **Prisma Schema**
   - `packages/database/prisma/schema.prisma` (updated)
   - Added PlaidBankAccount model
   - Added PlaidTransaction model
   - Added supporting enums

2. **Services**
   - `apps/api/src/modules/integrations/plaid/services/plaid-bank.service.ts`
   - `apps/api/src/modules/integrations/plaid/services/plaid-transaction-matcher.service.ts`

3. **Jobs**
   - `apps/api/src/modules/integrations/plaid/jobs/plaid-sync.job.ts`
   - Contains 4 job processors

4. **Module Updates**
   - `apps/api/src/modules/integrations/plaid/plaid.module.ts` (updated)
   - `apps/api/src/modules/integrations/plaid/index.ts` (updated)

5. **Documentation**
   - `apps/api/src/modules/integrations/plaid/PLAID_BANK_SERVICE.md` (this file)

---

## Summary

✅ **Task Completed Successfully**

**Deliverables:**
- ✅ Prisma schemas for PlaidBankAccount and PlaidTransaction
- ✅ PlaidBankService with comprehensive account/transaction management
- ✅ PlaidTransactionMatcherService with intelligent reconciliation
- ✅ 4 BullMQ background job processors
- ✅ Updated PlaidModule with all new services
- ✅ Full documentation

**Capabilities:**
- Real-time balance refresh
- Incremental transaction sync
- Intelligent invoice/expense matching
- Background job processing
- Webhook handling
- Comprehensive audit logging
- Multi-tenant data isolation
- Production-ready security

**Next Steps:**
1. Run database migration
2. Configure environment variables
3. Set up Redis for BullMQ
4. Deploy to staging
5. Test with Plaid sandbox
6. Monitor job execution
7. Fine-tune matching confidence thresholds
